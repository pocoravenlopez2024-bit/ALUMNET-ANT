import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  QueryConstraint
} from 'firebase/firestore';
import {
  db,
  auth,
  FIRESTORE_COLLECTIONS,
  OperationType,
  handleFirestoreError
} from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../data/initialData';

/**
 * Defensive payload sanitizer and validator conforming to firebase-blueprint.json limits
 */
export function sanitizeAlumniProfile(data: Partial<UserProfile>): Partial<UserProfile> {
  const sanitized: Partial<UserProfile> = { ...data };

  if (sanitized.name) {
    sanitized.name = String(sanitized.name).trim().slice(0, 100);
  }
  if (sanitized.email) {
    sanitized.email = String(sanitized.email).trim().toLowerCase().slice(0, 120);
  }
  if (sanitized.batch) {
    sanitized.batch = String(sanitized.batch).trim().slice(0, 10);
  }
  if (sanitized.course) {
    sanitized.course = String(sanitized.course).trim().slice(0, 100);
  }
  if (sanitized.location) {
    sanitized.location = String(sanitized.location).trim().slice(0, 100);
  }
  if (sanitized.headline) {
    sanitized.headline = String(sanitized.headline).trim().slice(0, 160);
  }
  if (sanitized.about) {
    sanitized.about = String(sanitized.about).trim().slice(0, 2000);
  }
  if (sanitized.phone) {
    sanitized.phone = String(sanitized.phone).trim().slice(0, 30);
  }

  // CRITICAL SECURITY: Never persist passwords or auth credentials in public alumni directory documents
  delete (sanitized as any).password;

  // Sanitize undefined fields to avoid Firestore serialization errors
  return JSON.parse(JSON.stringify(sanitized));
}

/**
 * Alumni Directory Firestore Service
 * Handles CRUD operations and real-time synchronization for the Alumni Directory
 */
export const alumniService = {
  /**
   * CREATE: Add a new alumnus / user to the Firestore directory
   */
  async createAlumni(profile: UserProfile): Promise<UserProfile> {
    const docPath = `${FIRESTORE_COLLECTIONS.USERS}/${profile.uid}`;
    try {
      const sanitized = sanitizeAlumniProfile(profile) as UserProfile;
      const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, profile.uid);
      await setDoc(userRef, sanitized);
      return sanitized;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  },

  /**
   * READ: Fetch single alumnus profile by UID from Firestore
   */
  async getAlumniById(uid: string): Promise<UserProfile | null> {
    const docPath = `${FIRESTORE_COLLECTIONS.USERS}/${uid}`;
    try {
      const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  },

  /**
   * READ: Fetch all alumni directory members from Firestore
   */
  async getAllAlumni(): Promise<UserProfile[]> {
    const colPath = FIRESTORE_COLLECTIONS.USERS;
    try {
      const colRef = collection(db, colPath);
      const snapshot = await getDocs(colRef);
      const results: UserProfile[] = [];
      snapshot.forEach((d) => {
        results.push(d.data() as UserProfile);
      });
      return results;
    } catch (error) {
      console.warn('Failed to fetch alumni directory from Firestore:', error);
      return [];
    }
  },

  /**
   * READ with Real-time Subscription: Listen for directory updates in real-time
   */
  subscribeToAlumniDirectory(
    onUpdate: (alumni: UserProfile[]) => void,
    onError?: (error: unknown) => void
  ): () => void {
    const colPath = FIRESTORE_COLLECTIONS.USERS;
    const colRef = collection(db, colPath);

    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as UserProfile);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Alumni Directory Firestore subscription error:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  },

  /**
   * READ with Query Filters: Query alumni by batch, course, or role
   */
  async queryAlumni(filters: {
    batch?: string;
    course?: string;
    role?: UserRole | 'all';
    search?: string;
  }): Promise<UserProfile[]> {
    const colPath = FIRESTORE_COLLECTIONS.USERS;
    try {
      const constraints: QueryConstraint[] = [];

      if (filters.role && filters.role !== 'all') {
        constraints.push(where('role', '==', filters.role));
      }
      if (filters.batch && filters.batch !== 'all') {
        constraints.push(where('batch', '==', filters.batch));
      }

      const q = constraints.length > 0
        ? query(collection(db, colPath), ...constraints)
        : collection(db, colPath);

      const snapshot = await getDocs(q);
      let list: UserProfile[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as UserProfile);
      });

      // Filter in-memory for course or text search if specified
      if (filters.course && filters.course !== 'all') {
        list = list.filter((u) => u.course?.toLowerCase().includes(filters.course!.toLowerCase()));
      }
      if (filters.search) {
        const term = filters.search.toLowerCase().trim();
        list = list.filter(
          (u) =>
            (u.name || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term) ||
            u.course?.toLowerCase().includes(term) ||
            u.batch?.includes(term) ||
            u.headline?.toLowerCase().includes(term) ||
            u.location?.toLowerCase().includes(term)
        );
      }

      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  },

  /**
   * UPDATE: Modify an existing alumnus profile in Firestore
   */
  async updateAlumni(
    uid: string,
    updates: Partial<UserProfile>,
    fullProfileFallback?: UserProfile
  ): Promise<Partial<UserProfile>> {
    const docPath = `${FIRESTORE_COLLECTIONS.USERS}/${uid}`;
    const sanitized = sanitizeAlumniProfile(updates);

    // If payload has no updatable fields after sanitization (e.g. only password was passed), return early
    if (Object.keys(sanitized).length === 0) {
      return sanitized;
    }

    try {
      const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
      await updateDoc(userRef, sanitized);
      return sanitized;
    } catch (error) {
      // If document doesn't exist yet, attempt merge with setDoc using fallback profile if provided or from seed
      try {
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
        const seedProfile = INITIAL_USERS.find((u) => u.uid === uid);
        const baseFallback = fullProfileFallback || seedProfile;
        const payload = baseFallback
          ? sanitizeAlumniProfile({ ...baseFallback, ...sanitized })
          : sanitized;
        await setDoc(userRef, payload, { merge: true });
        return sanitized;
      } catch (fallbackErr) {
        handleFirestoreError(fallbackErr, OperationType.UPDATE, docPath);
      }
    }
  },

  /**
   * DELETE: Delete an alumnus profile from Firestore
   */
  async deleteAlumni(uid: string): Promise<void> {
    const docPath = `${FIRESTORE_COLLECTIONS.USERS}/${uid}`;
    try {
      const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
      await deleteDoc(userRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  /**
   * BOOTSTRAP / SEEDING:
   * Do not seed mock/fake users to Firestore - only genuine user accounts are persisted.
   */
  async seedDirectoryIfEmpty(_seedList?: UserProfile[]): Promise<{ seeded: boolean; count: number }> {
    return { seeded: false, count: 0 };
  }
};
