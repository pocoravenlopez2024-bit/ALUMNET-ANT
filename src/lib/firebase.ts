import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserProfile,
  FriendRequest,
  ChatThread,
  ChatMessage,
  AppNotification,
  AlumniEvent,
  Announcement,
  Opportunity,
  StudentVerificationRecord,
  InstitutionalFeedPost,
  EventReservation
} from '../types';

// The designated Firestore Database ID
export const FIRESTORE_DATABASE_ID =
  firebaseConfig.firestoreDatabaseId || 'ai-studio-shingshing-4084cdb5-32c6-492d-b45d-f9c8acf9c698';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Attempt anonymous sign-in so that Firestore operations have an active auth context if available
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch((err) => {
        console.info('Firebase anonymous auth notice:', err?.message);
      });
    }
  });
}

// Initialize Firestore strictly with the target database ID and long polling for iFrame reliability
let firestoreDbInstance: any;
try {
  firestoreDbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, FIRESTORE_DATABASE_ID);
} catch {
  firestoreDbInstance = getFirestore(app, FIRESTORE_DATABASE_ID);
}
export const db = firestoreDbInstance;

/**
 * Validate Connection to Firestore on boot
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || error.message.includes('unavailable')) {
        console.info('Firestore client initialized; will sync with Cloud backend once connection is ready.');
      } else {
        console.warn('Firestore connection check notice:', error.message);
      }
    }
  }
}
testConnection();

// Error handling types and helper as specified in the Firebase integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google with automatic fallback if popup is blocked
 */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; isNewUser?: boolean }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (error: any) {
    // If popup was blocked or iframe restriction triggered, attempt redirect
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('Popup blocked or cancelled, attempting redirect fallback...', error);
      try {
        await signInWithRedirect(auth, googleProvider);
        // Will reload/redirect
        throw error;
      } catch (redirectErr) {
        throw redirectErr;
      }
    }
    throw error;
  }
}

/**
 * Handle redirect result upon reload
 */
export async function checkRedirectResult(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (err) {
    console.warn('Redirect auth check notice:', err);
    return null;
  }
}

/**
 * Firebase Sign Out
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// =========================================================================
// FIRESTORE SYNC & REPOSITORY METHODS
// =========================================================================

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  FRIEND_REQUESTS: 'friend_requests',
  CONNECTIONS: 'connections',
  CONVERSATIONS: 'conversations',
  CHATS: 'chats',
  NOTIFICATIONS: 'notifications',
  EVENTS: 'events',
  ANNOUNCEMENTS: 'announcements',
  OPPORTUNITIES: 'opportunities',
  REGISTRY_RECORDS: 'registry_records',
  FEED_POSTS: 'feed_posts',
  EVENT_RESERVATIONS: 'event_reservations'
};

export interface FirestoreConnectionDoc {
  id: string;
  userId: string;
  connectedUserId: string;
  participants: string[];
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreConversationDoc {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: Record<string, number>;
  createdAt?: string;
}

export interface FirestoreConversationMessageDoc {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

/**
 * Sync user profile to Firestore
 */
export async function saveUserToFirestore(user: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
    // Sanitize undefined fields and strip sensitive credentials
    const sanitized = JSON.parse(JSON.stringify(user));
    delete sanitized.password;
    await setDoc(userRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Failed to save user to Firestore:', err);
  }
}

/**
 * Fetch a single user profile from Firestore
 */
export async function getUserFromFirestore(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Failed to get user from Firestore:', err);
    return null;
  }
}

/**
 * Fetch all users from Firestore
 */
export async function getAllUsersFromFirestore(): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
    const snap = await getDocs(colRef);
    const list: UserProfile[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as UserProfile);
    });
    return list;
  } catch (err) {
    console.warn('Failed to fetch users from Firestore:', err);
    return [];
  }
}

/**
 * Subscribe to real-time users collection
 */
export function subscribeToUsers(onUpdate: (users: UserProfile[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      onUpdate(list);
    },
    (err) => console.warn('Firestore Users subscription notice:', err)
  );
}

/**
 * Save connection / friend request to Firestore
 */
export async function saveFriendRequestToFirestore(req: FriendRequest): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.FRIEND_REQUESTS, req.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(req)), { merge: true });
  } catch (err) {
    console.warn('Failed to save friend request to Firestore:', err);
  }
}

/**
 * Delete friend request from Firestore
 */
export async function deleteFriendRequestFromFirestore(reqId: string): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.FRIEND_REQUESTS, reqId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete friend request from Firestore:', err);
  }
}

/**
 * Subscribe to real-time friend requests
 */
export function subscribeToFriendRequests(onUpdate: (requests: FriendRequest[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.FRIEND_REQUESTS);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: FriendRequest[] = [];
      snap.forEach((d) => list.push(d.data() as FriendRequest));
      onUpdate(list);
    },
    (err) => console.warn('Firestore Requests subscription notice:', err)
  );
}

/**
 * Save connection record to 'connections' collection
 */
export async function saveConnectionToFirestore(conn: FirestoreConnectionDoc): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.CONNECTIONS, conn.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(conn)), { merge: true });
  } catch (err) {
    console.warn('Failed to save connection to Firestore:', err);
  }
}

/**
 * Delete connection record from 'connections' collection
 */
export async function deleteConnectionFromFirestore(connId: string): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.CONNECTIONS, connId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete connection from Firestore:', err);
  }
}

/**
 * Get direct connection record between two users
 */
export async function getConnectionFromFirestore(userA: string, userB: string): Promise<FirestoreConnectionDoc | null> {
  try {
    const sortedKey = [userA, userB].sort().join('_');
    const docRef = doc(db, FIRESTORE_COLLECTIONS.CONNECTIONS, sortedKey);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as FirestoreConnectionDoc;
    }
    const directRef = doc(db, FIRESTORE_COLLECTIONS.CONNECTIONS, `${userA}_${userB}`);
    const directSnap = await getDoc(directRef);
    if (directSnap.exists()) {
      return directSnap.data() as FirestoreConnectionDoc;
    }
    return null;
  } catch (err) {
    console.warn('Failed to read connection from Firestore:', err);
    return null;
  }
}

/**
 * Subscribe to user connections in 'connections' collection
 */
export function subscribeToUserConnections(userId: string, onUpdate: (connections: FirestoreConnectionDoc[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.CONNECTIONS);
  const q = query(colRef, where('participants', 'array-contains', userId));
  return onSnapshot(
    q,
    (snap) => {
      const list: FirestoreConnectionDoc[] = [];
      snap.forEach((d) => list.push(d.data() as FirestoreConnectionDoc));
      onUpdate(list);
    },
    (err) => console.warn('Firestore Connections subscription notice:', err)
  );
}

/**
 * Save conversation thread to 'conversations' collection (Strict participant isolation)
 */
export async function saveConversationToFirestore(conv: FirestoreConversationDoc): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.CONVERSATIONS, conv.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(conv)), { merge: true });
  } catch (err) {
    console.warn('Failed to save conversation to Firestore:', err);
  }
}

/**
 * Save message inside conversation subcollection
 */
export async function saveConversationMessageToFirestore(convId: string, msg: FirestoreConversationMessageDoc): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.CONVERSATIONS, convId, 'messages', msg.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(msg)), { merge: true });
  } catch (err) {
    console.warn('Failed to save conversation message to Firestore:', err);
  }
}

/**
 * Subscribe to user conversations
 */
export function subscribeToUserConversations(userId: string, onUpdate: (conversations: FirestoreConversationDoc[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.CONVERSATIONS);
  const q = query(colRef, where('participants', 'array-contains', userId));
  return onSnapshot(
    q,
    (snap) => {
      const list: FirestoreConversationDoc[] = [];
      snap.forEach((d) => list.push(d.data() as FirestoreConversationDoc));
      list.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
      onUpdate(list);
    },
    (err) => console.warn('Firestore Conversations subscription notice:', err)
  );
}

/**
 * Save event to Firestore
 */
export async function saveEventToFirestore(event: AlumniEvent): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, event.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(event)), { merge: true });
  } catch (err) {
    console.warn('Failed to save event to Firestore:', err);
  }
}

/**
 * Delete event from Firestore
 */
export async function deleteEventFromFirestore(eventId: string): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, eventId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete event from Firestore:', err);
  }
}

/**
 * Subscribe to real-time events
 */
export function subscribeToEvents(onUpdate: (events: AlumniEvent[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: AlumniEvent[] = [];
      snap.forEach((d) => list.push(d.data() as AlumniEvent));
      onUpdate(list);
    },
    (err) => console.warn('Firestore Events subscription notice:', err)
  );
}

/**
 * Fetch all events once from Firestore
 */
export async function getEventsFromFirestore(): Promise<AlumniEvent[]> {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
    const snap = await getDocs(colRef);
    const list: AlumniEvent[] = [];
    snap.forEach((d) => list.push(d.data() as AlumniEvent));
    return list;
  } catch (err) {
    console.warn('Failed to fetch events from Firestore:', err);
    return [];
  }
}

/**
 * Save event reservation to Firestore
 */
export async function saveReservationToFirestore(reservation: EventReservation): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.EVENT_RESERVATIONS, reservation.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(reservation)), { merge: true });
  } catch (err) {
    console.warn('Failed to save reservation to Firestore:', err);
  }
}

/**
 * Delete event reservation from Firestore
 */
export async function deleteReservationFromFirestore(reservationId: string): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.EVENT_RESERVATIONS, reservationId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete reservation from Firestore:', err);
  }
}

/**
 * Subscribe to real-time event reservations
 */
export function subscribeToReservations(onUpdate: (reservations: EventReservation[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.EVENT_RESERVATIONS);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: EventReservation[] = [];
      snap.forEach((d) => list.push(d.data() as EventReservation));
      onUpdate(list);
    },
    (err) => console.warn('Firestore Event Reservations subscription notice:', err)
  );
}

/**
 * Fetch all reservations once from Firestore
 */
export async function getReservationsFromFirestore(): Promise<EventReservation[]> {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTIONS.EVENT_RESERVATIONS);
    const snap = await getDocs(colRef);
    const list: EventReservation[] = [];
    snap.forEach((d) => list.push(d.data() as EventReservation));
    return list;
  } catch (err) {
    console.warn('Failed to fetch reservations from Firestore:', err);
    return [];
  }
}

/**
 * Save opportunity to Firestore
 */
export async function saveOpportunityToFirestore(opp: Opportunity): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.OPPORTUNITIES, opp.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(opp)), { merge: true });
  } catch (err) {
    console.warn('Failed to save opportunity to Firestore:', err);
  }
}

/**
 * Delete opportunity from Firestore
 */
export async function deleteOpportunityFromFirestore(oppId: string): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.OPPORTUNITIES, oppId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete opportunity from Firestore:', err);
  }
}

/**
 * Subscribe to real-time opportunities
 */
export function subscribeToOpportunities(onUpdate: (opps: Opportunity[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.OPPORTUNITIES);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Opportunity[] = [];
      snap.forEach((d) => list.push(d.data() as Opportunity));
      onUpdate(list);
    },
    (err) => console.warn('Firestore Opportunities subscription notice:', err)
  );
}

/**
 * Fetch all opportunities once from Firestore
 */
export async function getOpportunitiesFromFirestore(): Promise<Opportunity[]> {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTIONS.OPPORTUNITIES);
    const snap = await getDocs(colRef);
    const list: Opportunity[] = [];
    snap.forEach((d) => list.push(d.data() as Opportunity));
    return list;
  } catch (err) {
    console.warn('Failed to fetch opportunities from Firestore:', err);
    return [];
  }
}

/**
 * Save announcement to Firestore
 */
export async function saveAnnouncementToFirestore(announcement: Announcement): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.ANNOUNCEMENTS, announcement.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(announcement)), { merge: true });
  } catch (err) {
    console.warn('Failed to save announcement to Firestore:', err);
  }
}

/**
 * Delete announcement from Firestore
 */
export async function deleteAnnouncementFromFirestore(announcementId: string): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.ANNOUNCEMENTS, announcementId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete announcement from Firestore:', err);
  }
}

/**
 * Subscribe to real-time announcements
 */
export function subscribeToAnnouncements(onUpdate: (announcements: Announcement[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.ANNOUNCEMENTS);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Announcement[] = [];
      snap.forEach((d) => list.push(d.data() as Announcement));
      onUpdate(list);
    },
    (err) => console.warn('Firestore Announcements subscription notice:', err)
  );
}

/**
 * Fetch all announcements once from Firestore
 */
export async function getAnnouncementsFromFirestore(): Promise<Announcement[]> {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTIONS.ANNOUNCEMENTS);
    const snap = await getDocs(colRef);
    const list: Announcement[] = [];
    snap.forEach((d) => list.push(d.data() as Announcement));
    return list;
  } catch (err) {
    console.warn('Failed to fetch announcements from Firestore:', err);
    return [];
  }
}

/**
 * Save social feed post to Firestore
 */
export async function saveFeedPostToFirestore(post: InstitutionalFeedPost): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.FEED_POSTS, post.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(post)), { merge: true });
  } catch (err) {
    console.warn('Failed to save feed post to Firestore:', err);
  }
}

/**
 * Delete social feed post from Firestore
 */
export async function deleteFeedPostFromFirestore(postId: string): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.FEED_POSTS, postId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete feed post from Firestore:', err);
  }
}

/**
 * Subscribe to real-time social feed posts
 */
export function subscribeToFeedPosts(onUpdate: (posts: InstitutionalFeedPost[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.FEED_POSTS);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: InstitutionalFeedPost[] = [];
      snap.forEach((d) => list.push(d.data() as InstitutionalFeedPost));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    (err) => console.warn('Firestore Feed Posts subscription notice:', err)
  );
}

/**
 * Get social feed posts from Firestore once
 */
export async function getFeedPostsFromFirestore(): Promise<InstitutionalFeedPost[]> {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTIONS.FEED_POSTS);
    const snap = await getDocs(colRef);
    const list: InstitutionalFeedPost[] = [];
    snap.forEach((d) => list.push(d.data() as InstitutionalFeedPost));
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (err) {
    console.warn('Failed to get feed posts from Firestore:', err);
    return [];
  }
}

/**
 * Save chat thread document to Firestore with sender participant validation
 */
export async function saveChatToFirestore(chat: ChatThread): Promise<void> {
  if (!chat || !chat.id || typeof chat.id !== 'string' || !chat.id.trim()) {
    console.error('[Firestore Messaging] Missing document reference: chat.id is undefined or empty when saving chat thread.');
    return;
  }

  const docPath = `${FIRESTORE_COLLECTIONS.CHATS}/${chat.id}`;

  // Ensure participants array is explicitly populated and includes all memberIds
  const participants = Array.from(new Set([
    ...(chat.participants || []),
    ...(chat.memberIds || [])
  ]));

  const payload: ChatThread = {
    ...chat,
    participants,
    memberIds: Array.from(new Set([...(chat.memberIds || []), ...participants]))
  };

  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.CHATS, chat.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(payload)), { merge: true });
    console.log(`[Firestore Messaging] Chat thread document persisted to '${docPath}' with participants:`, payload.participants);
  } catch (err: any) {
    const isPermissionDenied =
      err?.code === 'permission-denied' ||
      err?.message?.toLowerCase().includes('permission');
    if (isPermissionDenied) {
      console.error(`[Firestore Messaging ERROR: PERMISSION_DENIED] Write to chat document '${docPath}' was rejected:`, {
        code: err?.code,
        message: err?.message,
        docPath,
        chatId: chat.id,
        participants: payload.participants,
        authUid: auth.currentUser?.uid
      });
    } else {
      console.warn(`[Firestore Messaging Notice] Failed to update chat document '${docPath}':`, err?.message || err);
    }
  }
}

/**
 * Save chat message to subcollection document reference with diagnostic error logging
 */
export async function saveChatMessageToFirestore(chatId: string, msg: ChatMessage): Promise<void> {
  // 1. Verify document reference validity
  if (!chatId || typeof chatId !== 'string' || !chatId.trim()) {
    const errorMsg = `[Firestore Messaging ERROR: MISSING_DOC_REFERENCE] Target 'chatId' is null, empty, or undefined. Cannot resolve document reference for message '${msg?.id}'.`;
    console.error(errorMsg, { chatId, msg });
    throw new Error(errorMsg);
  }
  if (!msg || !msg.id || typeof msg.id !== 'string' || !msg.id.trim()) {
    const errorMsg = `[Firestore Messaging ERROR: MISSING_DOC_REFERENCE] Message payload is missing 'id'. Cannot resolve subcollection document path in chat '${chatId}'.`;
    console.error(errorMsg, { chatId, msg });
    throw new Error(errorMsg);
  }

  const docPath = `${FIRESTORE_COLLECTIONS.CHATS}/${chatId}/messages/${msg.id}`;

  try {
    // 2. Ensure parent chat document reference exists with participants containing the sender
    const parentDocRef = doc(db, FIRESTORE_COLLECTIONS.CHATS, chatId);
    const parentSnap = await getDoc(parentDocRef).catch(() => null);
    if (!parentSnap || !parentSnap.exists()) {
      const fallbackParticipants = [msg.senderId];
      if (chatId.startsWith('chat_')) {
        const parts = chatId.replace(/^chat_/, '').split('_');
        parts.forEach((p) => {
          if (p && !fallbackParticipants.includes(p)) fallbackParticipants.push(p);
        });
      }
      await setDoc(parentDocRef, {
        id: chatId,
        memberIds: fallbackParticipants,
        participants: fallbackParticipants,
        lastMessage: msg.text,
        lastMessageAt: msg.createdAt,
        unreadCount: {}
      }, { merge: true }).catch((pErr) => {
        console.warn(`[Firestore Messaging Notice] Parent chat auto-creation notice for '${chatId}':`, pErr?.message || pErr);
      });
    }

    console.log(`[Firestore Messaging] Writing message to document reference: ${docPath}`, {
      chatId,
      messageId: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderName,
      authUid: auth.currentUser?.uid
    });
    const msgRef = doc(db, FIRESTORE_COLLECTIONS.CHATS, chatId, 'messages', msg.id);
    await setDoc(msgRef, JSON.parse(JSON.stringify(msg)), { merge: true });
    console.log(`[Firestore Messaging SUCCESS] Message '${msg.id}' written to document reference: ${docPath}`);
  } catch (err: any) {
    const isPermissionDenied =
      err?.code === 'permission-denied' ||
      err?.message?.toLowerCase().includes('permission') ||
      err?.message?.toLowerCase().includes('insufficient permissions');
    const isMissingDoc =
      err?.code === 'not-found' ||
      err?.message?.toLowerCase().includes('not found') ||
      err?.message?.toLowerCase().includes('missing document');

    if (isPermissionDenied) {
      console.error(`[Firestore Messaging ERROR: PERMISSION_DENIED] Failed to write message to '${docPath}': User lacks write permission to this chat subcollection.`, {
        code: err?.code,
        message: err?.message,
        docPath,
        chatId,
        senderId: msg.senderId,
        authUid: auth.currentUser?.uid
      });
    } else if (isMissingDoc) {
      console.error(`[Firestore Messaging ERROR: MISSING_DOC_REFERENCE] Target collection path or document reference was not found: '${docPath}'.`, {
        code: err?.code,
        message: err?.message,
        docPath,
        chatId
      });
    } else {
      console.error(`[Firestore Messaging ERROR] Write to '${docPath}' failed:`, {
        code: err?.code,
        message: err?.message,
        docPath
      });
    }
    throw err;
  }
}

/**
 * Detailed Diagnostic Authentication & Session Status for Messaging
 */
export interface MessageAuthDiagnosticReport {
  hasActiveFirebaseAuth: boolean;
  firebaseAuthUid: string | null;
  firebaseAuthEmail: string | null;
  isAnonymousAuth: boolean;
  idTokenStatus: 'valid' | 'expired' | 'unretrieved' | 'error';
  tokenExpirationTime?: string | null;
  tokenIssuedAtTime?: string | null;
  tokenClaims?: Record<string, any>;
  appSessionTokenPresent: boolean;
  currentAppUserId: string | null;
  exactChatDocPath: string;
  exactMessageDocPath: string;
}

/**
 * Retrieve current authentication status & token validity
 */
export async function getAuthDiagnosticStatus(appUserId?: string, chatId?: string, messageId?: string): Promise<MessageAuthDiagnosticReport> {
  const currentFbUser = auth.currentUser;
  let idTokenStatus: 'valid' | 'expired' | 'unretrieved' | 'error' = 'unretrieved';
  let tokenExpirationTime: string | null = null;
  let tokenIssuedAtTime: string | null = null;
  let tokenClaims: Record<string, any> | undefined;

  if (currentFbUser) {
    try {
      const idTokenResult = await currentFbUser.getIdTokenResult();
      tokenExpirationTime = idTokenResult.expirationTime;
      tokenIssuedAtTime = idTokenResult.issuedAtTime;
      tokenClaims = idTokenResult.claims;
      const isExpired = new Date(idTokenResult.expirationTime).getTime() <= Date.now();
      idTokenStatus = isExpired ? 'expired' : 'valid';
    } catch {
      idTokenStatus = 'error';
    }
  }

  const appSessionToken = typeof localStorage !== 'undefined'
    ? localStorage.getItem('alumni_auth_token') || localStorage.getItem('alumni_server_auth_token')
    : null;

  return {
    hasActiveFirebaseAuth: !!currentFbUser,
    firebaseAuthUid: currentFbUser?.uid || null,
    firebaseAuthEmail: currentFbUser?.email || null,
    isAnonymousAuth: !!currentFbUser?.isAnonymous,
    idTokenStatus,
    tokenExpirationTime,
    tokenIssuedAtTime,
    tokenClaims,
    appSessionTokenPresent: !!appSessionToken,
    currentAppUserId: appUserId || null,
    exactChatDocPath: chatId ? `${FIRESTORE_COLLECTIONS.CHATS}/${chatId}` : 'chats/{unresolved_chat_id}',
    exactMessageDocPath: chatId && messageId ? `${FIRESTORE_COLLECTIONS.CHATS}/${chatId}/messages/${messageId}` : 'chats/{unresolved}/messages/{unresolved}'
  };
}

/**
 * Diagnostic log function invoked on message send attempt, success, or failure
 * Reports exact chat document reference, current user ID, and auth token status.
 */
export async function logMessageSendingDiagnostics(params: {
  phase: 'attempt' | 'success' | 'failure';
  chatId: string;
  messageId: string;
  senderId: string;
  error?: any;
}): Promise<MessageAuthDiagnosticReport> {
  const report = await getAuthDiagnosticStatus(params.senderId, params.chatId, params.messageId);

  const phaseTag = params.phase.toUpperCase();
  const headerStyle =
    params.phase === 'failure'
      ? 'background: #7F1D1D; color: #FECACA; padding: 2px 6px; border-radius: 4px; font-weight: bold;'
      : params.phase === 'success'
      ? 'background: #14532D; color: #BBF7D0; padding: 2px 6px; border-radius: 4px; font-weight: bold;'
      : 'background: #1E3A8A; color: #BFDBFE; padding: 2px 6px; border-radius: 4px; font-weight: bold;';

  console.groupCollapsed(
    `%c[MESSAGING DIAGNOSTICS: ${phaseTag}]%c Chat: ${report.exactChatDocPath} | Sender: ${params.senderId}`,
    headerStyle,
    'color: inherit; font-weight: normal; margin-left: 6px;'
  );

  console.log('📄 Exact Firestore Document References:', {
    chatDocumentReference: report.exactChatDocPath,
    messageDocumentReference: report.exactMessageDocPath,
    chatId: params.chatId,
    messageId: params.messageId
  });

  console.log('👤 Current User ID & Identity Alignment:', {
    currentAppUserId: params.senderId,
    firebaseAuthUid: report.firebaseAuthUid,
    isUidAligned: params.senderId === report.firebaseAuthUid,
    firebaseAuthEmail: report.firebaseAuthEmail,
    isAnonymousAuth: report.isAnonymousAuth
  });

  console.log('🔐 Auth Token Status & Session Validity:', {
    idTokenStatus: report.idTokenStatus,
    tokenExpiresAt: report.tokenExpirationTime,
    tokenIssuedAt: report.tokenIssuedAtTime,
    appSessionTokenPresent: report.appSessionTokenPresent,
    tokenClaims: report.tokenClaims
  });

  if (params.error) {
    const isPermissionDenied =
      params.error?.code === 'permission-denied' ||
      params.error?.message?.toLowerCase().includes('permission');
    const isMissingDoc =
      params.error?.code === 'not-found' ||
      params.error?.message?.toLowerCase().includes('not found') ||
      !params.chatId;

    console.error('🚨 Failure Root Cause Analysis:', {
      identifiedFailureCategory: isPermissionDenied
        ? 'PERMISSION_DENIAL (Firestore rules rejected request)'
        : isMissingDoc
        ? 'MISSING_DOCUMENT_REFERENCE (Invalid document path or parent missing)'
        : 'NETWORK_OR_CLIENT_ERROR',
      errorCode: params.error?.code,
      errorMessage: params.error?.message,
      errorDetails: params.error
    });
  }

  console.groupEnd();
  return report;
}

/**
 * Subscribe to current user's peer-to-peer chats in real time
 */
export function subscribeToUserChats(userId: string, onUpdate: (chats: ChatThread[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.CHATS);
  const q = query(colRef, where('memberIds', 'array-contains', userId));
  return onSnapshot(
    q,
    (snap) => {
      const list: ChatThread[] = [];
      snap.forEach((d) => list.push(d.data() as ChatThread));
      list.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
      onUpdate(list);
    },
    (err) => console.warn('Firestore Chats subscription notice:', err)
  );
}

/**
 * Subscribe to messages for a specific chat in real time
 */
export function subscribeToChatMessages(chatId: string, onUpdate: (messages: ChatMessage[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.CHATS, chatId, 'messages');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: ChatMessage[] = [];
      snap.forEach((d) => list.push(d.data() as ChatMessage));
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onUpdate(list);
    },
    (err) => console.warn('Firestore Chat Messages subscription notice:', err)
  );
}

/**
 * Save notification to Firestore
 */
export async function saveNotificationToFirestore(notif: AppNotification): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, notif.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(notif)), { merge: true });
  } catch (err) {
    console.warn('Failed to save notification to Firestore:', err);
  }
}

/**
 * Mark notification as read in Firestore
 */
export async function markNotificationReadInFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, id);
    await updateDoc(docRef, { read: true });
  } catch (err) {
    console.warn('Failed to mark notification read in Firestore:', err);
  }
}

/**
 * Real-time subscription to user-scoped and broadcast notifications
 */
export function subscribeToUserNotifications(userId: string, onUpdate: (notifications: AppNotification[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: AppNotification[] = [];
      snap.forEach((d) => {
        const data = d.data() as AppNotification;
        if (!data.toUid || data.toUid === 'all' || data.toUid === userId) {
          list.push(data);
        }
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    (err) => console.warn('Firestore Notifications subscription notice:', err)
  );
}

/**
 * Fetch all notifications for a user once from Firestore
 */
export async function getNotificationsFromFirestore(userId?: string): Promise<AppNotification[]> {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS);
    const snap = await getDocs(colRef);
    const list: AppNotification[] = [];
    snap.forEach((d) => {
      const data = d.data() as AppNotification;
      if (!userId || !data.toUid || data.toUid === 'all' || data.toUid === userId) {
        list.push(data);
      }
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (err) {
    console.warn('Failed to fetch notifications from Firestore:', err);
    return [];
  }
}

/**
 * Save single registry record to Firestore
 */
export async function saveRegistryRecordToFirestore(record: StudentVerificationRecord): Promise<void> {
  try {
    const docId = record.studentId.replace(/[\/\s]/g, '_');
    const docRef = doc(db, FIRESTORE_COLLECTIONS.REGISTRY_RECORDS, docId);
    const sanitized = JSON.parse(JSON.stringify(record));
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Failed to save registry record to Firestore:', err);
  }
}

/**
 * Save multiple registry records in batch to Firestore using writeBatch
 */
export async function saveRegistryRecordsBatchToFirestore(
  records: StudentVerificationRecord[],
  onProgress?: (processed: number, total: number) => void
): Promise<{ added: number; updated: number }> {
  let count = 0;
  if (!records || records.length === 0) return { added: 0, updated: 0 };

  const CHUNK_SIZE = 400; // Under Firestore 500 writes limit per batch

  try {
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const record of chunk) {
        const docId = record.studentId.replace(/[\/\s]/g, '_').toUpperCase();
        const docRef = doc(db, FIRESTORE_COLLECTIONS.REGISTRY_RECORDS, docId);
        const sanitized = JSON.parse(JSON.stringify(record));
        batch.set(docRef, sanitized, { merge: true });
      }

      await batch.commit();
      count += chunk.length;
      if (onProgress) {
        onProgress(Math.min(count, records.length), records.length);
      }
    }
    return { added: count, updated: 0 };
  } catch (err) {
    console.warn('Batch commit failed, falling back to sequential setDoc:', err);
    // Fallback in case of batch failure
    for (const record of records) {
      try {
        const docId = record.studentId.replace(/[\/\s]/g, '_').toUpperCase();
        const docRef = doc(db, FIRESTORE_COLLECTIONS.REGISTRY_RECORDS, docId);
        const sanitized = JSON.parse(JSON.stringify(record));
        await setDoc(docRef, sanitized, { merge: true });
        count++;
        if (onProgress) {
          onProgress(count, records.length);
        }
      } catch (innerErr) {
        console.warn(`Failed to save record ${record.studentId} individually:`, innerErr);
      }
    }
    return { added: count, updated: 0 };
  }
}

/**
 * Fetch all registry records from Firestore
 */
export async function getRegistryRecordsFromFirestore(): Promise<StudentVerificationRecord[]> {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTIONS.REGISTRY_RECORDS);
    const snap = await getDocs(colRef);
    const list: StudentVerificationRecord[] = [];
    snap.forEach((d) => {
      list.push(d.data() as StudentVerificationRecord);
    });
    return list;
  } catch (err) {
    console.warn('Failed to fetch registry records from Firestore:', err);
    return [];
  }
}

/**
 * Delete a registry record from Firestore
 */
export async function deleteRegistryRecordFromFirestore(studentId: string): Promise<void> {
  try {
    const docId = studentId.replace(/[\/\s]/g, '_');
    const docRef = doc(db, FIRESTORE_COLLECTIONS.REGISTRY_RECORDS, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete registry record from Firestore:', err);
  }
}

/**
 * Mark a registry record as registered in Firestore
 */
export async function markRegistryRecordRegisteredInFirestore(
  studentId: string,
  matchedUid: string
): Promise<void> {
  try {
    const docId = studentId.replace(/[\/\s]/g, '_');
    const docRef = doc(db, FIRESTORE_COLLECTIONS.REGISTRY_RECORDS, docId);
    await updateDoc(docRef, {
      isRegistered: true,
      matchedUid,
      registeredAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to update registry registration status in Firestore:', err);
  }
}

/**
 * Real-time subscription to registry records
 */
export function subscribeToRegistryRecords(onUpdate: (records: StudentVerificationRecord[]) => void) {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.REGISTRY_RECORDS);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: StudentVerificationRecord[] = [];
      snap.forEach((d) => list.push(d.data() as StudentVerificationRecord));
      onUpdate(list);
    },
    (err) => console.warn('Firestore Registry subscription notice:', err)
  );
}

/**
 * Save audit log to Firestore
 */
export async function saveAuditLogToFirestore(log: any): Promise<void> {
  try {
    const docRef = doc(db, 'audit_logs', log.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(log)), { merge: true });
  } catch (err) {
    console.warn('Failed to save audit log to Firestore:', err);
  }
}

/**
 * Save gallery item to Firestore
 */
export async function saveGalleryItemToFirestore(item: any): Promise<void> {
  try {
    const docRef = doc(db, 'gallery', item.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(item)), { merge: true });
  } catch (err) {
    console.warn('Failed to save gallery item to Firestore:', err);
  }
}

/**
 * Delete gallery item from Firestore
 */
export async function deleteGalleryItemFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'gallery', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete gallery item from Firestore:', err);
  }
}

/**
 * Comprehensive Batch Sync of all datasets directly to Firestore Database
 */
export async function syncAllCollectionsToFirestore(payload: {
  users?: UserProfile[];
  events?: AlumniEvent[];
  opportunities?: Opportunity[];
  announcements?: Announcement[];
  registryRecords?: StudentVerificationRecord[];
  auditLogs?: any[];
  onProgress?: (step: string, percent: number) => void;
}): Promise<{ success: boolean; syncedCounts: Record<string, number>; errors: string[] }> {
  const errors: string[] = [];
  const syncedCounts: Record<string, number> = {
    users: 0,
    events: 0,
    opportunities: 0,
    announcements: 0,
    registry_records: 0
  };

  try {
    // 1. Users
    if (payload.users && payload.users.length > 0) {
      payload.onProgress?.('Uploading alumni and accounts to Firestore...', 20);
      for (const user of payload.users) {
        try {
          const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
          const sanitizedUser = JSON.parse(JSON.stringify(user));
          delete sanitizedUser.password;
          await setDoc(userRef, sanitizedUser, { merge: true });
          syncedCounts.users++;
        } catch (e: any) {
          errors.push(`User ${user.name}: ${e?.message || e}`);
        }
      }
    }

    // 2. Events
    if (payload.events && payload.events.length > 0) {
      payload.onProgress?.('Uploading campus events & RSVPs to Firestore...', 40);
      for (const ev of payload.events) {
        try {
          const docRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, ev.id);
          await setDoc(docRef, JSON.parse(JSON.stringify(ev)), { merge: true });
          syncedCounts.events++;
        } catch (e: any) {
          errors.push(`Event ${ev.title}: ${e?.message || e}`);
        }
      }
    }

    // 3. Opportunities
    if (payload.opportunities && payload.opportunities.length > 0) {
      payload.onProgress?.('Uploading career opportunities to Firestore...', 60);
      for (const opp of payload.opportunities) {
        try {
          const docRef = doc(db, FIRESTORE_COLLECTIONS.OPPORTUNITIES, opp.id);
          await setDoc(docRef, JSON.parse(JSON.stringify(opp)), { merge: true });
          syncedCounts.opportunities++;
        } catch (e: any) {
          errors.push(`Opportunity ${opp.title}: ${e?.message || e}`);
        }
      }
    }

    // 4. Announcements
    if (payload.announcements && payload.announcements.length > 0) {
      payload.onProgress?.('Uploading institutional announcements to Firestore...', 80);
      for (const ann of payload.announcements) {
        try {
          const docRef = doc(db, FIRESTORE_COLLECTIONS.ANNOUNCEMENTS, ann.id);
          await setDoc(docRef, JSON.parse(JSON.stringify(ann)), { merge: true });
          syncedCounts.announcements++;
        } catch (e: any) {
          errors.push(`Announcement ${ann.title}: ${e?.message || e}`);
        }
      }
    }

    // 5. Registry Records
    if (payload.registryRecords && payload.registryRecords.length > 0) {
      payload.onProgress?.('Uploading student registry masterlist to Firestore...', 95);
      const res = await saveRegistryRecordsBatchToFirestore(payload.registryRecords);
      syncedCounts.registry_records = res.added;
    }

    payload.onProgress?.('All records successfully synchronized with Firestore Database!', 100);
    return { success: errors.length === 0, syncedCounts, errors };
  } catch (err: any) {
    errors.push(`Batch sync error: ${err?.message || err}`);
    return { success: false, syncedCounts, errors };
  }
}

/**
 * Purges all sample documents from cloud Firestore database for clean testing
 */
export async function purgeAllFirestoreSampleData(): Promise<{ success: boolean; deletedCount: number }> {
  let deletedCount = 0;
  const collectionsToPurge = [
    FIRESTORE_COLLECTIONS.EVENTS,
    FIRESTORE_COLLECTIONS.ANNOUNCEMENTS,
    FIRESTORE_COLLECTIONS.OPPORTUNITIES,
    FIRESTORE_COLLECTIONS.EVENT_RESERVATIONS,
    FIRESTORE_COLLECTIONS.FEED_POSTS,
    FIRESTORE_COLLECTIONS.REGISTRY_RECORDS,
    FIRESTORE_COLLECTIONS.FRIEND_REQUESTS
  ];

  for (const colName of collectionsToPurge) {
    try {
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
        deletedCount++;
      }
    } catch (err) {
      console.warn(`Notice purging Firestore collection ${colName}:`, err);
    }
  }

  return { success: true, deletedCount };
}

/**
 * Test connectivity & write operation to ensure user additions display on Firestore
 */
export async function testFirestoreWriteSync(): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const testDocRef = doc(db, 'system_health', 'sync_check');
    await setDoc(testDocRef, {
      lastCheckedAt: new Date().toISOString(),
      status: 'operational',
      databaseId: FIRESTORE_DATABASE_ID
    }, { merge: true });
    const latencyMs = Date.now() - start;
    return { success: true, latencyMs };
  } catch (err: any) {
    return { success: false, latencyMs: Date.now() - start, error: err?.message || String(err) };
  }
}

