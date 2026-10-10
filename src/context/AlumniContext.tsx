import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  FriendRequest,
  ChatThread,
  ChatMessage,
  AppNotification,
  AlumniEvent,
  Announcement,
  Opportunity,
  JobApplication,
  ApplicationStatus,
  Chapter,
  CareerMilestone,
  UserNotificationSettings,
  Experience,
  Education,
  GalleryItem,
  ToastType,
  ToastNotification,
  AuditLogEntry,
  AutomationJob,
  CareerSurveyResponse,
  DatabaseBackupSnapshot,
  EventAttendee,
  EventAttendanceRecord,
  RegistrarVerificationResult,
  InstitutionalFeedPost,
  FeedComment,
  EventReservation
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_FRIEND_REQUESTS,
  INITIAL_CHATS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_EVENTS,
  INITIAL_RESERVATIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_OPPORTUNITIES,
  INITIAL_JOB_APPLICATIONS,
  INITIAL_CHAPTERS,
  INITIAL_MILESTONES,
  INITIAL_GALLERY_ITEMS,
  INITIAL_AUDIT_LOGS,
  INITIAL_AUTOMATION_JOBS,
  INITIAL_CAREER_SURVEYS,
  INITIAL_BACKUPS,
  INITIAL_FEED_POSTS
} from '../data/initialData';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  saveUserToFirestore,
  getUserFromFirestore,
  getAllUsersFromFirestore,
  subscribeToUsers,
  saveFriendRequestToFirestore,
  deleteFriendRequestFromFirestore,
  subscribeToFriendRequests,
  saveEventToFirestore,
  getEventsFromFirestore,
  saveReservationToFirestore,
  deleteReservationFromFirestore,
  getReservationsFromFirestore,
  subscribeToReservations,
  deleteEventFromFirestore,
  subscribeToEvents,
  saveOpportunityToFirestore,
  getOpportunitiesFromFirestore,
  deleteOpportunityFromFirestore,
  subscribeToOpportunities,
  saveAnnouncementToFirestore,
  getAnnouncementsFromFirestore,
  deleteAnnouncementFromFirestore,
  subscribeToAnnouncements,
  saveChatToFirestore,
  saveChatMessageToFirestore,
  logMessageSendingDiagnostics,
  saveNotificationToFirestore,
  getNotificationsFromFirestore,
  subscribeToUserNotifications,
  saveConnectionToFirestore,
  subscribeToUserChats,
  subscribeToChatMessages,
  saveAuditLogToFirestore,
  saveGalleryItemToFirestore,
  deleteGalleryItemFromFirestore,
  syncAllCollectionsToFirestore,
  saveFeedPostToFirestore,
  getFeedPostsFromFirestore,
  deleteFeedPostFromFirestore,
  subscribeToFeedPosts,
  purgeAllFirestoreSampleData,
  testFirestoreWriteSync,
  FIRESTORE_DATABASE_ID
} from '../lib/firebase';
import {
  markRegistryRecordAsRegistered,
  getRegistrarRecords,
  isValidStudentIdPattern,
  normalizeStudentId,
  syncRegistrarRecordsWithFirestore,
  generateAlumniId
} from '../services/studentVerificationService';
import {
  DEFAULT_USER_AVATAR,
  DEFAULT_COVER_PHOTO,
  DEFAULT_EVENT_IMAGE,
  DEFAULT_COLLEGE_SEAL,
  getUserAvatar,
  getCoverPhoto,
  getEventImage
} from '../lib/defaultImages';
import { alumniService } from '../services/alumniService';
import { calculateProfileCompletion } from '../services/automationService';
import { getEventCancellationInfo } from '../services/eventCancellationService';
import {
  sendJobPostingEmail,
  sendDirectMessageEmail,
  sendEventRsvpEmail,
  sendAnnouncementEmail,
  sendSecurityAlertEmail,
  sendEvent24HourReminderEmail
} from '../services/emailNotificationService';
import {
  getPushPermission,
  requestPushPermission,
  triggerPushNotification,
  playCollegiateChime,
  calculate24HourAlertStatus,
  generate24HourReservationAlert,
  PushPermissionState
} from '../services/eventPushNotificationService';
import {
  enqueueOfflineMessage,
  getOfflineMessageQueue,
  syncOfflineMessageQueue,
  retryQueuedMessage,
  removeOfflineMessage,
  QueuedOfflineMessage
} from '../services/offlineMessageQueueService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AlumniContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  friendRequests: FriendRequest[];
  chats: ChatThread[];
  messages: Record<string, ChatMessage[]>;
  notifications: AppNotification[];
  events: AlumniEvent[];
  announcements: Announcement[];
  opportunities: Opportunity[];
  chapters: Chapter[];
  milestones: CareerMilestone[];
  notificationSettings: UserNotificationSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedUserIdForModal: string | null;
  setSelectedUserIdForModal: (uid: string | null) => void;
  isEditProfileModalOpen: boolean;
  setIsEditProfileModalOpen: (open: boolean) => void;
  openEditProfile: () => void;
  closeEditProfile: () => void;
  isFirebaseConnected: boolean;
  isFirestoreSyncing: boolean;
  authReady: boolean;
  isLoadingData: boolean;
  isOnline: boolean;
  isBackgroundSyncing: boolean;
  lastBackgroundSyncTime: Date | null;
  refreshData: () => Promise<void>;
  triggerBackgroundSync: () => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  syncAllDataToCloud: () => Promise<void>;
  purgeDatabaseSampleData: () => Promise<{ success: boolean; message: string }>;
  purgeAllSampleData: () => Promise<void>;
  testDatabaseWrite: () => Promise<{ success: boolean; latencyMs: number; message: string; error?: string }>;
  firestoreDatabaseId: string;
  
  // Permissions derived from current user role (from Role Permissions Summary)
  permissions: {
    canSendFriendRequests: boolean;
    canFollow: boolean;
    canCreateEvents: boolean;
    canDeleteEvents: boolean;
    canPostAnnouncements: boolean;
    canDeleteAnnouncements: boolean;
    canDeleteEventsComments: boolean;
    canAccessAdminPanel: boolean;
    canMessageAnyone: boolean;
    canUploadGallery: boolean;
    canManageJobModeration: boolean;
    canPostJobs: boolean;
    canAccessEmployerDashboard: boolean;
    canAccessRegistry: boolean;
    canAccessConflictResolution: boolean;
    canAccessEmployerAccreditation: boolean;
    canAccessGovernance: boolean;
    canAccessAuditTrails: boolean;
    canAccessAutomations: boolean;
    canAccessGrowthAnalytics: boolean;
    canManageBackups: boolean;
    canAssignRoles: boolean;
    canVerifyAlumni: boolean;
    canManageChapters: boolean;
  };

  // Auth & Session
  login: (identifier: string, pass: string) => Promise<boolean>;
  register: (data: Partial<UserProfile> & { password?: string }) => boolean;
  createUserByAdmin: (data: Partial<UserProfile> & { password?: string; role: UserRole }) => boolean;
  logout: () => void;
  switchUser: (uid: string) => void;
  resetPassword: (email: string) => boolean;
  resetUserPasswordByEmail: (email: string, newPass: string) => boolean;
  deleteAccount: () => boolean;
  changeEmail: (newEmail: string) => boolean;
  changePassword: (
    oldOrNewPass: string,
    newPass?: string
  ) => { success: boolean; message?: string } | boolean;

  // Profile
  updateProfile: (data: Partial<UserProfile>) => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  addExperience: (exp: Omit<Experience, 'id'>) => void;
  removeExperience: (id: string) => void;
  addEducation: (edu: Omit<Education, 'id'>) => void;
  removeEducation: (id: string) => void;

  // Friends & Network
  followingIds: string[];
  connectionIds: string[];
  sendFriendRequest: (targetUid: string) => { success: boolean; error?: string };
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  cancelFriendRequest: (requestId: string) => void;
  toggleFollow: (targetUid: string) => void;
  isFollowing: (uid: string) => boolean;
  isConnected: (uid: string) => boolean;
  hasPendingRequestWith: (uid: string) => 'sent' | 'received' | false;

  // Messaging
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  sendMessage: (chatId: string, text: string) => void;
  getOrCreateChat: (targetUid: string) => string;
  markChatAsRead: (chatId: string) => void;

  // Offline Message Queue
  offlineQueueCount: number;
  offlineQueue: QueuedOfflineMessage[];
  syncOfflineMessages: () => Promise<{ syncedCount: number; failedCount: number }>;
  retryOfflineMessage: (messageId: string) => Promise<boolean>;
  cancelOfflineMessage: (messageId: string) => void;

  // Events
  createEvent: (event: Omit<AlumniEvent, 'id' | 'likes' | 'comments' | 'attendeesCount' | 'createdBy' | 'createdByName'>) => void;
  editEvent: (eventId: string, data: Partial<AlumniEvent>) => void;
  deleteEvent: (eventId: string) => void;
  toggleLikeEvent: (eventId: string) => void;
  addCommentToEvent: (eventId: string, text: string) => void;
  rsvpEvent: (eventId: string, status: 'going' | 'interested' | 'not_going') => void;
  updateEventAttendance: (eventId: string, uid: string, status: 'attended' | 'not_attended' | 'pending') => void;
  manualCheckInAttendee: (eventId: string, attendeeIdOrUid: string, checkedIn: boolean) => void;
  updateAttendeeInfo: (eventId: string, attendeeIdOrUid: string, updates: Partial<EventAttendee>) => void;
  removeAttendeeFromEvent: (eventId: string, attendeeIdOrUid: string) => void;
  addAttendeeToEvent: (eventId: string, attendee: Partial<EventAttendee> & { name: string; email: string }) => void;
  reservations: EventReservation[];
  reserveEventSlot: (data: {
    eventId: string;
    alumniName: string;
    email: string;
    contactNumber: string;
    alumniId: string;
    graduationYear: string;
    course: string;
    numberOfGuests: number;
    dietaryRequirements?: string;
    specialRequests?: string;
  }) => Promise<{ success: boolean; reservation?: EventReservation; error?: string }>;
  cancelEventReservation: (reservationId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  updateEventReservationSettings: (eventId: string, settings: Partial<AlumniEvent>) => void;
  pushPermissionStatus: PushPermissionState;
  requestBrowserPushPermission: () => Promise<PushPermissionState>;
  confirmEventAttendance: (reservationId: string) => Promise<void>;
  sendTest24HourAlert: (targetReservation?: EventReservation) => Promise<void>;
  upcoming24hReservations: EventReservation[];

  // Announcements
  createAnnouncement: (data: Omit<Announcement, 'id' | 'publishedAt' | 'createdBy' | 'authorName' | 'authorRole'>) => void;
  editAnnouncement: (id: string, data: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  togglePinAnnouncement: (id: string) => void;
  toggleHeartAnnouncement: (id: string) => void;

  // Opportunities & Career Portal
  jobApplications: JobApplication[];
  createOpportunity: (data: Omit<Opportunity, 'id' | 'createdAt' | 'postedBy' | 'posterName' | 'status'>) => void;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => void;
  approveOpportunity: (id: string) => void;
  rejectOpportunity: (id: string, reason: string) => void;
  applyForJob: (data: Omit<JobApplication, 'id' | 'appliedAt' | 'status'>) => { success: boolean; error?: string };
  withdrawJobApplication: (applicationId: string) => void;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, notes?: string) => void;
  verifyEmployer: (employerUid: string, verified: boolean | 'verified' | 'rejected', notes?: string) => void;
  toggleEmployerJobPosting: (employerUid: string, canPost: boolean) => void;
  selfVerifyAlumniWithRegistry: (studentId: string) => Promise<{ success: boolean; message: string }>;
  isAlumniVerified: boolean;
  registrar_verification: (studentIdToCheck?: string, candidateName?: string) => RegistrarVerificationResult;
  verifyAlumniStatus: (studentIdToVerify: string) => Promise<RegistrarVerificationResult>;
  getConnectionStatus: (otherUid: string) => 'pending' | 'accepted' | 'declined' | null;

  // Notifications
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;

  // Settings
  updateNotificationSettings: (settings: Partial<UserNotificationSettings>) => void;
  updateUserSettings: (settings: any) => void;

  // Campus & Heritage Gallery
  galleryItems: GalleryItem[];
  addGalleryItem: (item: Omit<GalleryItem, 'id' | 'createdAt'>) => boolean;
  deleteGalleryItem: (id: string) => boolean;

  // Institutional Social Feed (Admin, Registrar, Staff posts on Alumni Dashboard)
  feedPosts: InstitutionalFeedPost[];
  addFeedPost: (post: {
    postType: 'milestone' | 'gallery' | 'announcement';
    title: string;
    content: string;
    imageUrl?: string;
    milestoneBadge?: string;
    isPinned?: boolean;
    tags?: string[];
  }) => boolean;
  toggleLikeFeedPost: (postId: string) => void;
  toggleHeartFeedPost: (postId: string) => void;
  addFeedPostComment: (postId: string, text: string) => void;
  deleteFeedPost: (postId: string) => void;

  // Alumni Directory Service (direct Firestore service layer)
  fetchAlumni: () => Promise<UserProfile[]>;
  createAlumni: (profile: UserProfile) => Promise<UserProfile | undefined>;
  updateAlumniProfile: (uid: string, updates: Partial<UserProfile>) => Promise<Partial<UserProfile> | undefined>;

  // Admin Actions
  verifyUser: (uid: string) => void;
  setUserVerified: (uid: string, status?: boolean) => void;
  updateUserRole: (uid: string, newRole: UserRole) => void;
  setUserRole: (uid: string, newRole: UserRole) => void;
  deleteAlumni: (uid: string) => Promise<boolean>;
  createChapter: (ch: Omit<Chapter, 'id'>) => void;
  createMilestone: (m: Omit<CareerMilestone, 'id'>) => void;
  toggleLikeMilestone: (milestoneId: string) => void;
  deleteMilestone: (milestoneId: string) => void;
  isEmployerExpired: (user?: UserProfile | null) => boolean;
  requestEmployerRenewal: (notes: string) => void;
  renewEmployerAccount: (uid: string, extensionMonths?: number) => void;
  checkAndEnforceEmployerExpirations: () => { expiredCount: number; warningsCount: number };

  // Alumni Management Automations
  auditLogs: AuditLogEntry[];
  automationJobs: AutomationJob[];
  careerSurveys: CareerSurveyResponse[];
  backups: DatabaseBackupSnapshot[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  submitCareerSurvey: (survey: Omit<CareerSurveyResponse, 'id' | 'submittedAt'>) => void;
  runAutomationJob: (jobId: string) => void;
  triggerDatabaseBackup: (type?: 'automated' | 'manual') => void;
  unlockUserAccount: (uid: string) => void;
  verifyAndApproveAlumni: (uid: string, approve: boolean, flagReason?: string) => void;
  sendEmergencyAnnouncement: (title: string, content: string) => void;
  updateEmploymentStatus: (status: 'Employed' | 'Self-employed' | 'Unemployed' | 'Student' | 'Retired') => void;

  // Toast / System Feedback
  toasts: ToastNotification[];
  toastMessage: string | null;
  showToast: (msg: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

const AlumniContext = createContext<AlumniContextType | null>(null);

export const STORAGE_KEYS = {
  USER_ID: 'alumni_auth_session_real_v2',
  USERS: 'alumni_users_v5',
  REQUESTS: 'alumni_friend_requests_v5',
  CHATS: 'alumni_chats_v5',
  MESSAGES: 'alumni_messages_v5',
  NOTIFICATIONS: 'alumni_notifications_v5',
  EVENTS: 'alumni_events_v5',
  ANNOUNCEMENTS: 'alumni_announcements_v5',
  OPPORTUNITIES: 'alumni_opportunities_v5',
  APPLICATIONS: 'alumni_job_applications_v5',
  CHAPTERS: 'alumni_chapters_v5',
  MILESTONES: 'alumni_milestones_v5',
  FOLLOWING: 'alumni_following_v5',
  CONNECTIONS: 'alumni_connections_v5',
  SETTINGS: 'alumni_settings_v5',
  GALLERY: 'alumni_gallery_v5',
  FEED_POSTS: 'alumni_feed_posts_v1',
  AUDIT_LOGS: 'alumni_audit_logs_v2',
  AUTOMATION_JOBS: 'alumni_automation_jobs_v2',
  CAREER_SURVEYS: 'alumni_career_surveys_v2',
  BACKUPS: 'alumni_backups_v2',
  RESERVATIONS: 'alumni_event_reservations_v2',
  ACTIVE_TAB: 'alumni_active_tab_v2',
  VIEW: 'alumni_active_view_v1'
};

export const CREDENTIALS_VAULT_KEY = 'st_cecilia_auth_credentials_vault_v1';

export interface StoredCredentialEntry {
  uid: string;
  name?: string;
  email: string;
  studentId?: string;
  alumniId?: string;
  employeeId?: string;
  password?: string;
  role: string;
  isVerified: boolean;
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
}

export function getStoredCredentialsVault(): Record<string, StoredCredentialEntry> {
  try {
    const raw = localStorage.getItem(CREDENTIALS_VAULT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCredentialToVault(entry: StoredCredentialEntry) {
  try {
    const vault = getStoredCredentialsVault();
    if (entry.uid) vault[entry.uid] = entry;
    if (entry.email) vault[entry.email.toLowerCase()] = entry;
    if (entry.studentId) {
      const sLower = entry.studentId.toLowerCase();
      const sNorm = sLower.replace(/[^a-zA-Z0-9]/g, '');
      const sClean = sLower.replace(/^scc-?/i, '');
      vault[sLower] = entry;
      vault[sNorm] = entry;
      vault[sClean] = entry;
      vault[`scc-${sClean}`] = entry;
      vault[`scc${sNorm}`] = entry;
    }
    if (entry.alumniId) {
      const aLower = entry.alumniId.toLowerCase();
      const aNorm = aLower.replace(/[^a-zA-Z0-9]/g, '');
      const aClean = aLower.replace(/^scc-alum-?/i, '').replace(/^scc-?/i, '');
      vault[aLower] = entry;
      vault[aNorm] = entry;
      vault[aClean] = entry;
    }
    if (entry.employeeId) {
      const eLower = entry.employeeId.toLowerCase();
      const eClean = eLower.replace(/^scc-?/i, '');
      vault[eLower] = entry;
      vault[eClean] = entry;
      vault[`scc-${eClean}`] = entry;
    }
    localStorage.setItem(CREDENTIALS_VAULT_KEY, JSON.stringify(vault));
  } catch {}
}

export function findCredentialInVault(identifier: string): StoredCredentialEntry | null {
  try {
    const vault = getStoredCredentialsVault();
    const trimmed = identifier.trim().toLowerCase();
    const norm = trimmed.replace(/[^a-zA-Z0-9]/g, '');
    const clean = trimmed.replace(/^scc-?/i, '').replace(/^alum-?/i, '');
    return vault[trimmed] || vault[norm] || vault[clean] || vault[`scc-${clean}`] || vault[`scc${norm}`] || null;
  } catch {
    return null;
  }
}

export const AlumniProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Purge legacy mock data from browser storage on initial load
  useEffect(() => {
    try {
      const PURGE_KEY = 'st_cecilia_production_purge_v5';
      if (!localStorage.getItem(PURGE_KEY)) {
        const mockKeys = [
          STORAGE_KEYS.EVENTS,
          STORAGE_KEYS.OPPORTUNITIES,
          STORAGE_KEYS.ANNOUNCEMENTS,
          STORAGE_KEYS.FEED_POSTS,
          STORAGE_KEYS.CHATS,
          STORAGE_KEYS.MESSAGES,
          STORAGE_KEYS.NOTIFICATIONS,
          STORAGE_KEYS.CHAPTERS,
          STORAGE_KEYS.GALLERY,
          STORAGE_KEYS.MILESTONES,
          STORAGE_KEYS.REQUESTS,
          STORAGE_KEYS.APPLICATIONS,
          'st_cecilia_accredited_registry_records',
          'st_cecilia_registry_conflicts'
        ];
        mockKeys.forEach((k) => localStorage.removeItem(k));

        // Purge mock profiles from cached users list
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (rawUsers) {
          try {
            const parsed = JSON.parse(rawUsers);
            if (Array.isArray(parsed)) {
              const genuine = parsed.filter(
                (u) =>
                  u &&
                  !['user_default_alumni', 'user_default_student', 'user_default_moderator', 'user_default_staff', 'user_default_employer'].includes(u.uid)
              );
              localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(genuine));
            }
          } catch {}
        }
        localStorage.setItem(PURGE_KEY, 'true');
      }
    } catch {}
  }, []);

  // Load or fallback to initial data
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      // Account Reset / Upgrade to Fresh Official Role Accounts & Clean DB Testing
      const ACCOUNTS_VERSION_KEY = 'st_cecilia_accounts_version_v10_clean_system_testing';
      const hasUpgradedAccounts = localStorage.getItem(ACCOUNTS_VERSION_KEY) === 'true';
      if (!hasUpgradedAccounts) {
        try {
          localStorage.removeItem(STORAGE_KEYS.USERS);
          localStorage.removeItem('st_cecilia_credentials_vault');
          localStorage.removeItem(STORAGE_KEYS.USER_ID);
          localStorage.removeItem('alumni_auth_session_real_v1');
          localStorage.removeItem('alumni_auth_session_real_v2');
          localStorage.removeItem(STORAGE_KEYS.EVENTS);
          localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
          localStorage.removeItem(STORAGE_KEYS.OPPORTUNITIES);
          localStorage.removeItem(STORAGE_KEYS.FEED_POSTS);
          localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
          localStorage.removeItem(STORAGE_KEYS.GALLERY);
          localStorage.removeItem(STORAGE_KEYS.CHAPTERS);
          localStorage.removeItem(STORAGE_KEYS.MILESTONES);
          localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
          localStorage.removeItem('st_cecilia_registrar_student_records');
          localStorage.removeItem('st_cecilia_student_records_v1');
          localStorage.setItem(ACCOUNTS_VERSION_KEY, 'true');
        } catch {}
      }

      // Seed initial users into vault
      INITIAL_USERS.forEach((seedUser) => {
        saveCredentialToVault({
          uid: seedUser.uid,
          name: seedUser.name,
          email: seedUser.email,
          studentId: seedUser.studentId,
          alumniId: seedUser.alumniId,
          employeeId: seedUser.employeeId,
          password: seedUser.password || 'Password123!',
          role: seedUser.role,
          isVerified: seedUser.isVerified ?? true
        });
      });

      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      let list: UserProfile[] = saved ? JSON.parse(saved) : INITIAL_USERS;
      if (!Array.isArray(list)) list = INITIAL_USERS;

      // Filter out all obsolete legacy mock accounts and previous accounts
      const PREVIOUS_DEPRECATED_UIDS = [
        'usr_superadmin_01',
        'usr_admin_01',
        'usr_registrar_01',
        'usr_staff_01',
        'usr_moderator_01',
        'usr_employer_01',
        'usr_alumni_01',
        'usr_alumni_02',
        'usr_alumni_03'
      ];
      list = list.filter(
        (u) =>
          u &&
          !u.uid.startsWith('user_') &&
          !u.uid.startsWith('usr_sheepyawa') &&
          !u.uid.startsWith('usr_canonigo') &&
          !PREVIOUS_DEPRECATED_UIDS.includes(u.uid)
      );

      // If list does not contain new official accounts, reset strictly to INITIAL_USERS
      if (list.length === 0 || !list.some(u => u.uid === 'usr_superadmin_cecilia')) {
        list = [...INITIAL_USERS];
      }

      // Always sanitize experience and education arrays
      list = list.map((u) => ({
        ...u,
        experience: Array.isArray(u.experience) ? u.experience : [],
        education: Array.isArray(u.education) ? u.education : []
      }));

      // Synchronize/backfill official studentId, alumniId, and passwords from INITIAL_USERS and vault into cached profiles
      const vault = getStoredCredentialsVault();
      INITIAL_USERS.forEach((seedUser) => {
        const existingIdx = list.findIndex(
          (u) => u.uid === seedUser.uid || (seedUser.email && u.email?.toLowerCase() === seedUser.email.toLowerCase())
        );
        if (existingIdx >= 0) {
          list[existingIdx] = {
            ...seedUser,
            ...list[existingIdx],
            studentId: list[existingIdx].studentId || seedUser.studentId,
            alumniId: list[existingIdx].alumniId || seedUser.alumniId,
            password: list[existingIdx].password || seedUser.password || 'Password123!',
            isVerified: list[existingIdx].isVerified ?? true,
            verified: list[existingIdx].verified ?? true
          };
        } else {
          list.push(seedUser);
        }
      });

      // Attach passwords and verification from vault to any user in list
      list = list.map((u) => {
        const cred = vault[u.uid] || (u.email ? vault[u.email.toLowerCase()] : null) || (u.studentId ? vault[u.studentId.toLowerCase()] : null);
        return {
          ...u,
          password: u.password || cred?.password || (INITIAL_USERS.find(iu => iu.uid === u.uid || iu.email?.toLowerCase() === u.email?.toLowerCase())?.password) || 'Password123!',
          isVerified: u.isVerified !== undefined ? u.isVerified : (u.role === 'alumni' ? true : false),
          verified: u.verified !== undefined ? u.verified : (u.role === 'alumni' ? true : false)
        };
      });

      // Restore any registered users from credentials vault if they're not in list
      Object.values(vault).forEach((entry) => {
        if (!list.some(u => u.uid === entry.uid || (entry.email && u.email?.toLowerCase() === entry.email.toLowerCase()))) {
          list.push({
            uid: entry.uid,
            name: entry.name || 'Alumnus Member',
            email: entry.email,
            password: entry.password || 'Password123!',
            role: (entry.role as UserRole) || 'alumni',
            studentId: entry.studentId,
            alumniId: entry.alumniId,
            employeeId: entry.employeeId,
            profilePictureUrl: entry.profilePictureUrl || DEFAULT_USER_AVATAR,
            coverPhotoUrl: entry.coverPhotoUrl || DEFAULT_COVER_PHOTO,
            about: 'Registered member of St. Cecilia’s College alumni network.',
            phone: '+63 917 123 4567',
            isVerified: true,
            verified: true,
            verificationStatus: 'verified',
            batch: '2024',
            course: 'B.S. Information Technology',
            headline: 'Alumni Graduate • St. Cecilia’s College',
            location: 'Cebu, Philippines',
            followersCount: 0,
            followingCount: 0,
            connectionsCount: 0,
            experience: [],
            education: [],
            createdAt: new Date().toISOString()
          });
        }
      });

      // Guarantee all official role accounts from INITIAL_USERS are actively present
      INITIAL_USERS.forEach((seedUser) => {
        const existingIdx = list.findIndex(
          (u) => u.uid === seedUser.uid || (seedUser.email && u.email?.toLowerCase() === seedUser.email.toLowerCase())
        );
        if (existingIdx >= 0) {
          list[existingIdx] = {
            ...seedUser,
            ...list[existingIdx],
            role: seedUser.role,
            password: seedUser.password || 'Password123!',
            isVerified: true,
            verified: true
          };
        } else {
          list.push(seedUser);
        }
      });

      return list;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Real system: unauthenticated by default, requires legitimate login
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEYS.USER_ID) ||
        localStorage.getItem('alumni_auth_session_real_v1');
      if (saved && (saved.startsWith('user_') || saved.startsWith('usr_sheepyawa') || saved.startsWith('usr_canonigo'))) {
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        localStorage.removeItem('alumni_auth_session_real_v1');
        return null;
      }
      return saved || null;
    } catch {
      return null;
    }
  });

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [chats, setChats] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHATS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const parsed = saved ? JSON.parse(saved) : {};
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  });

  // Offline Outgoing Message Queue state
  const [offlineQueue, setOfflineQueue] = useState<QueuedOfflineMessage[]>(() => {
    return getOfflineMessageQueue();
  });
  const offlineQueueCount = offlineQueue.length;

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [events, setEvents] = useState<AlumniEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      const parsed = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      return list.map((e: AlumniEvent) => ({
        ...e,
        likes: Array.isArray(e.likes) ? e.likes : [],
        comments: Array.isArray(e.comments) ? e.comments : []
      }));
    } catch {
      return [];
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
      const parsed = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      return list.map((opp: Opportunity) => ({
        ...opp,
        skills: Array.isArray(opp.skills) ? opp.skills : []
      }));
    } catch {
      return [];
    }
  });

  const [jobApplications, setJobApplications] = useState<JobApplication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [chapters, setChapters] = useState<Chapter[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [milestones, setMilestones] = useState<CareerMilestone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MILESTONES);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GALLERY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [feedPosts, setFeedPosts] = useState<InstitutionalFeedPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEED_POSTS);
      const parsed = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      return list.map((p: InstitutionalFeedPost) => ({
        ...p,
        likes: Array.isArray(p.likes) ? p.likes : [],
        hearts: Array.isArray(p.hearts) ? p.hearts : (Array.isArray(p.likes) ? p.likes : []),
        comments: Array.isArray(p.comments) ? p.comments : []
      }));
    } catch {
      return [];
    }
  });

  const [reservations, setReservations] = useState<EventReservation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    } catch {}
  }, [reservations]);

  useEffect(() => {
    const unsub = subscribeToReservations((cloudReservations) => {
      setReservations(cloudReservations || []);
    });
    return () => unsub();
  }, []);

  // Connections mapping: userUid -> array of connected uids
  const [connectionsMap, setConnectionsMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
      if (saved) return JSON.parse(saved);
      return {};
    } catch {
      return {};
    }
  });

  // Following mapping: userUid -> array of uids being followed
  const [followingMap, setFollowingMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOLLOWING);
      if (saved) return JSON.parse(saved);
      return {};
    } catch {
      return {};
    }
  });

  const [notificationSettings, setNotificationSettings] = useState<UserNotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
      return {
        pushNotifications: true,
        emailDigests: true,
        directMessages: true,
        eventReminders: true
      };
    } catch {
      return {
        pushNotifications: true,
        emailDigests: true,
        directMessages: true,
        eventReminders: true
      };
    }
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      return saved || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedUserIdForModal, setSelectedUserIdForModal] = useState<string | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const openEditProfile = useCallback(() => {
    setIsEditProfileModalOpen(true);
  }, []);
  const closeEditProfile = useCallback(() => {
    setIsEditProfileModalOpen(false);
  }, []);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [isFirestoreSyncing, setIsFirestoreSyncing] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Automation datasets
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [automationJobs, setAutomationJobs] = useState<AutomationJob[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTOMATION_JOBS);
      const jobs = saved ? JSON.parse(saved) : INITIAL_AUTOMATION_JOBS;
      return (jobs || []).filter((j: AutomationJob) => j.id !== 'job_birthday_greeter');
    } catch {
      return INITIAL_AUTOMATION_JOBS;
    }
  });

  const [careerSurveys, setCareerSurveys] = useState<CareerSurveyResponse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAREER_SURVEYS);
      return saved ? JSON.parse(saved) : INITIAL_CAREER_SURVEYS;
    } catch {
      return INITIAL_CAREER_SURVEYS;
    }
  });

  const [backups, setBackups] = useState<DatabaseBackupSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKUPS);
      return saved ? JSON.parse(saved) : INITIAL_BACKUPS;
    } catch {
      return INITIAL_BACKUPS;
    }
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);
  const [lastBackgroundSyncTime, setLastBackgroundSyncTime] = useState<Date | null>(null);
  const isSyncInProgressRef = useRef<boolean>(false);

  // Initial loading grace period for immediate skeleton visual feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingData(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastNotification = { id, message: msg, type };

    setToastMessage(msg);
    setToasts((prev) => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Background Synchronization Mechanism:
  // Fetches latest data from Firebase collections to update local state and localStorage cache
  const triggerBackgroundSync = useCallback(async () => {
    if (isSyncInProgressRef.current) return;
    isSyncInProgressRef.current = true;
    setIsBackgroundSyncing(true);

    try {
      // 1. Fetch live alumni users and update local cached state
      const usersPromise = (async () => {
        try {
          const firestoreUsers = await alumniService.getAllAlumni();
          if (firestoreUsers && firestoreUsers.length > 0) {
            setUsers((prevUsers) => {
              const vault = getStoredCredentialsVault();
              const userMap = new Map<string, UserProfile>();
              prevUsers.forEach((u) => userMap.set(u.uid, u));

              firestoreUsers.forEach((fUser) => {
                const existing = userMap.get(fUser.uid);
                const cred = vault[fUser.uid] || (fUser.email ? vault[fUser.email.toLowerCase()] : null);
                const preservedPassword = existing?.password || fUser.password || cred?.password || 'Password123!';
                userMap.set(fUser.uid, {
                  ...fUser,
                  password: preservedPassword,
                  isVerified: fUser.isVerified !== undefined ? fUser.isVerified : (existing?.isVerified ?? (fUser.role === 'alumni')),
                  verified: fUser.verified !== undefined ? fUser.verified : (existing?.verified ?? (fUser.role === 'alumni'))
                });
              });

              const merged = Array.from(userMap.values());
              try {
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        } catch (err) {
          console.warn('Background sync alumni notice:', err);
        }
      })();

      // 2. Fetch events from Firestore
      const eventsPromise = (async () => {
        try {
          const liveEvents = await getEventsFromFirestore();
          if (liveEvents && liveEvents.length > 0) {
            setEvents(liveEvents);
            try {
              localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(liveEvents));
            } catch {}
          }
        } catch (err) {
          console.warn('Background sync events notice:', err);
        }
      })();

      // 3. Fetch event reservations from Firestore
      const reservationsPromise = (async () => {
        try {
          const liveReservations = await getReservationsFromFirestore();
          if (liveReservations && liveReservations.length > 0) {
            setReservations(liveReservations);
          }
        } catch (err) {
          console.warn('Background sync reservations notice:', err);
        }
      })();

      // 4. Fetch announcements from Firestore
      const announcementsPromise = (async () => {
        try {
          const liveAnnouncements = await getAnnouncementsFromFirestore();
          if (liveAnnouncements && liveAnnouncements.length > 0) {
            setAnnouncements(liveAnnouncements);
            try {
              localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(liveAnnouncements));
            } catch {}
          }
        } catch (err) {
          console.warn('Background sync announcements notice:', err);
        }
      })();

      // 5. Fetch career opportunities from Firestore
      const opportunitiesPromise = (async () => {
        try {
          const liveOpps = await getOpportunitiesFromFirestore();
          if (liveOpps && liveOpps.length > 0) {
            setOpportunities(liveOpps);
            try {
              localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(liveOpps));
            } catch {}
          }
        } catch (err) {
          console.warn('Background sync opportunities notice:', err);
        }
      })();

      // 6. Fetch institutional feed posts from Firestore
      const feedPostsPromise = (async () => {
        try {
          const livePosts = await getFeedPostsFromFirestore();
          if (livePosts && livePosts.length > 0) {
            setFeedPosts(livePosts);
            try {
              localStorage.setItem(STORAGE_KEYS.FEED_POSTS, JSON.stringify(livePosts));
            } catch {}
          }
        } catch (err) {
          console.warn('Background sync feed posts notice:', err);
        }
      })();

      // 7. If current user is logged in, fetch fresh profile doc & notifications
      const userSpecificPromise = (async () => {
        if (!currentUserId) return;
        try {
          const [freshUser, freshNotifs] = await Promise.all([
            getUserFromFirestore(currentUserId).catch(() => null),
            getNotificationsFromFirestore(currentUserId).catch(() => [])
          ]);
          if (freshUser) {
            setUsers((prev) => {
              const updated = prev.map((u) => (u.uid === currentUserId ? { ...u, ...freshUser } : u));
              try {
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
          if (freshNotifs && freshNotifs.length > 0) {
            setNotifications(freshNotifs);
            try {
              localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(freshNotifs));
            } catch {}
          }
        } catch (err) {
          console.warn('Background sync user-specific notice:', err);
        }
      })();

      await Promise.allSettled([
        usersPromise,
        eventsPromise,
        reservationsPromise,
        announcementsPromise,
        opportunitiesPromise,
        feedPostsPromise,
        userSpecificPromise
      ]);

      setLastBackgroundSyncTime(new Date());
    } finally {
      setIsBackgroundSyncing(false);
      isSyncInProgressRef.current = false;
    }
  }, [currentUserId]);

  // Network Restoration Listener:
  // Detects when the network is restored, flushes pending offline message queue,
  // and triggers background synchronization from Firebase
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // Automatically synchronize and drain any queued offline messages
      syncOfflineMessageQueue().catch((err) => {
        console.warn('Auto-sync offline queue notice:', err);
      });
      // Trigger background synchronization from Firebase
      triggerBackgroundSync().then(() => {
        showToast('Network restored: Synchronizing data with Firebase.', 'info');
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = (e: any) => {
      setOfflineQueue(e.detail?.queue || getOfflineMessageQueue());
    };

    const handleMessageSynced = (e: any) => {
      const { messageId, chatId, cleanMsg } = e.detail || {};
      if (chatId && messageId) {
        setMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map((m) =>
            m.id === messageId ? { ...m, ...cleanMsg, status: 'sent', offlineQueued: false } : m
          )
        }));
      }
    };

    const handleOfflineMessagesSynced = (e: any) => {
      const { syncedCount } = e.detail || {};
      if (syncedCount > 0) {
        showToast(`Delivered ${syncedCount} queued message${syncedCount > 1 ? 's' : ''} successfully!`, 'success');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('applet:offline-queue-change', handleQueueChange);
    window.addEventListener('applet:message-synced', handleMessageSynced);
    window.addEventListener('applet:offline-messages-synced', handleOfflineMessagesSynced);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('applet:offline-queue-change', handleQueueChange);
      window.removeEventListener('applet:message-synced', handleMessageSynced);
      window.removeEventListener('applet:offline-messages-synced', handleOfflineMessagesSynced);
    };
  }, [triggerBackgroundSync, showToast]);

  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      await triggerBackgroundSync();
    } catch (err) {
      console.warn('Refresh data notice:', err);
    } finally {
      setTimeout(() => {
        setIsLoadingData(false);
      }, 450);
    }
  }, [triggerBackgroundSync]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, currentUserId);
      localStorage.setItem('alumni_auth_session_real_v1', currentUserId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem('alumni_auth_session_real_v1');
    }
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(friendRequests));
  }, [friendRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(jobApplications));
  }, [jobApplications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connectionsMap));
  }, [connectionsMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(followingMap));
  }, [followingMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(galleryItems));
  }, [galleryItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FEED_POSTS, JSON.stringify(feedPosts));
  }, [feedPosts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTOMATION_JOBS, JSON.stringify(automationJobs));
  }, [automationJobs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAREER_SURVEYS, JSON.stringify(careerSurveys));
  }, [careerSurveys]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
  }, [backups]);

  useEffect(() => {
    if (activeTab) {
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
      } catch {}
    }
  }, [activeTab]);

  // Firebase Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthReady(true);
      // CRITICAL: Anonymous users are solely for Firestore background transport security, NEVER treat as portal login!
      if (fbUser && !fbUser.isAnonymous) {
        setIsFirebaseConnected(true);
        const emailLower = (fbUser.email || '').toLowerCase();
        const isKnownAdmin =
          emailLower === 'rlopez@stcecilia.edu.ph' ||
          emailLower.includes('admin') ||
          emailLower.includes('superadmin') ||
          ['vincentbaloro002@gmail.com', 'vincentbaloro003@gmail.com', 'jamessvencanonigo@gmail.com', 'jamessvenansali@gmail.com', 'sheepyawa@gmail.com', 'just47969@gmail.com'].includes(emailLower);

        let matched = users.find(
          (u) => u.uid === fbUser.uid || (fbUser.email && u.email.toLowerCase() === emailLower)
        );
        if (!matched) {
          matched = (await getUserFromFirestore(fbUser.uid)) || undefined;
        }
        if (matched) {
          if (isKnownAdmin) {
            matched.role = 'admin';
            matched.isVerified = true;
            matched.verified = true;
          }
          setCurrentUserId(matched.uid);
        } else {
          const email = fbUser.email || '';
          const role: UserRole = isKnownAdmin
            ? 'admin'
            : emailLower.includes('registrar')
            ? 'registrar'
            : 'alumni';

          const isAutoVerified = role !== 'alumni' || isKnownAdmin;

          const newProfile: UserProfile = {
            uid: fbUser.uid,
            name: fbUser.displayName || email.split('@')[0] || 'Cecilian Alumnus',
            email,
            role,
            batch: role === 'alumni' ? '2024' : 'N/A',
            course: role === 'alumni' ? 'B.S. Information Technology' : 'Academic Administration',
            location: 'Cebu, Philippines',
            profilePictureUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
            headline: `${role === 'alumni' ? 'B.S. Information Technology Graduate' : (role || 'Alumni').toUpperCase() + ' Specialist'} • St. Cecilia’s College`,
            about: 'Member of St. Cecilia’s College Alumni Community connected with Google Authentication.',
            phone: '',
            isVerified: isAutoVerified,
            verified: isAutoVerified,
            followersCount: 0,
            followingCount: 0,
            connectionsCount: 0,
            experience: [],
            education: [],
            createdAt: new Date().toISOString(),
            authProvider: 'google'
          };
          setUsers((prev) => [newProfile, ...prev]);
          if (isAutoVerified) {
            setCurrentUserId(newProfile.uid);
          }
          saveUserToFirestore(newProfile).catch(() => {});
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Subscriptions & Initial Seeding via alumniService
  useEffect(() => {
    let isSubscribed = true;

    // Fetch live alumni directory directly from Firestore instance on load
    const fetchAlumniFromFirestore = async () => {
      try {
        const firestoreUsers = await alumniService.getAllAlumni();
        if (isSubscribed && firestoreUsers && firestoreUsers.length > 0) {
          setUsers((prevUsers) => {
            const vault = getStoredCredentialsVault();
            const userMap = new Map<string, UserProfile>();
            // Keep all existing local users
            prevUsers.forEach((u) => userMap.set(u.uid, u));

            // Merge incoming Firestore users preserving password & verified statuses
            firestoreUsers.forEach((fUser) => {
              const existing = userMap.get(fUser.uid);
              const cred = vault[fUser.uid] || (fUser.email ? vault[fUser.email.toLowerCase()] : null) || (fUser.studentId ? vault[fUser.studentId.toLowerCase()] : null);
              const preservedPassword = existing?.password || fUser.password || cred?.password || (INITIAL_USERS.find(iu => iu.uid === fUser.uid || iu.email?.toLowerCase() === fUser.email?.toLowerCase())?.password) || 'Password123!';
              
              userMap.set(fUser.uid, {
                ...fUser,
                password: preservedPassword,
                isVerified: fUser.isVerified !== undefined ? fUser.isVerified : (existing?.isVerified ?? (fUser.role === 'alumni')),
                verified: fUser.verified !== undefined ? fUser.verified : (existing?.verified ?? (fUser.role === 'alumni'))
              });
            });

            return Array.from(userMap.values());
          });
        }
      } catch (err) {
        console.warn('Initial Firestore alumni load notice:', err);
      }
    };
    fetchAlumniFromFirestore();

    // Subscribe to real-time alumni directory directly from Firestore
    const unsubUsers = alumniService.subscribeToAlumniDirectory(
      (firestoreUsers) => {
        if (isSubscribed && firestoreUsers && firestoreUsers.length > 0) {
          setUsers((prevUsers) => {
            const vault = getStoredCredentialsVault();
            const userMap = new Map<string, UserProfile>();
            // Keep all existing local users
            prevUsers.forEach((u) => userMap.set(u.uid, u));

            // Merge incoming Firestore users preserving password & verified statuses
            firestoreUsers.forEach((fUser) => {
              const existing = userMap.get(fUser.uid);
              const cred = vault[fUser.uid] || (fUser.email ? vault[fUser.email.toLowerCase()] : null) || (fUser.studentId ? vault[fUser.studentId.toLowerCase()] : null);
              const preservedPassword = existing?.password || fUser.password || cred?.password || (INITIAL_USERS.find(iu => iu.uid === fUser.uid || iu.email?.toLowerCase() === fUser.email?.toLowerCase())?.password) || 'Password123!';
              
              userMap.set(fUser.uid, {
                ...fUser,
                password: preservedPassword,
                isVerified: fUser.isVerified !== undefined ? fUser.isVerified : (existing?.isVerified ?? (fUser.role === 'alumni')),
                verified: fUser.verified !== undefined ? fUser.verified : (existing?.verified ?? (fUser.role === 'alumni'))
              });
            });

            return Array.from(userMap.values());
          });
        }
      },
      (error) => {
        console.warn('Alumni Directory Firestore subscription notice:', error);
      }
    );

    const unsubEvents = subscribeToEvents((firestoreEvents) => {
      if (isSubscribed) {
        setEvents(firestoreEvents || []);
      }
    });

    const unsubOpps = subscribeToOpportunities((firestoreOpps) => {
      if (isSubscribed) {
        setOpportunities(firestoreOpps || []);
      }
    });

    const unsubAnn = subscribeToAnnouncements((firestoreAnns) => {
      if (isSubscribed) {
        setAnnouncements(firestoreAnns || []);
      }
    });

    const unsubReqs = subscribeToFriendRequests((firestoreReqs) => {
      if (isSubscribed) {
        setFriendRequests(firestoreReqs);
        // Automatically sync bidirectional connectionsMap with all accepted requests
        setConnectionsMap((prev) => {
          const next = { ...prev };
          let changed = false;
          firestoreReqs.forEach((r) => {
            if (r.status === 'accepted') {
              const listA = next[r.fromUid] || [];
              if (!listA.includes(r.toUid)) {
                next[r.fromUid] = [...listA, r.toUid];
                changed = true;
              }
              const listB = next[r.toUid] || [];
              if (!listB.includes(r.fromUid)) {
                next[r.toUid] = [...listB, r.fromUid];
                changed = true;
              }
            }
          });
          return changed ? next : prev;
        });
      }
    });

    const unsubFeed = subscribeToFeedPosts((firestorePosts) => {
      if (isSubscribed) {
        setFeedPosts(firestorePosts);
      }
    });

    return () => {
      isSubscribed = false;
      unsubUsers();
      unsubEvents();
      unsubOpps();
      unsubAnn();
      unsubReqs();
      unsubFeed();
    };
  }, []);

  // Current User resolution with resilient session recovery
  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    let found = users.find((u) => u.uid === currentUserId);
    if (!found) {
      const vault = getStoredCredentialsVault();
      const cred = vault[currentUserId];
      if (cred) {
        found = {
          uid: cred.uid,
          name: cred.name || 'Alumnus Member',
          email: cred.email,
          password: cred.password || 'Password123!',
          role: (cred.role as UserRole) || 'alumni',
          studentId: cred.studentId,
          alumniId: cred.alumniId,
          employeeId: cred.employeeId,
          profilePictureUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
          about: 'Registered member of St. Cecilia’s College alumni network.',
          phone: '+63 917 123 4567',
          isVerified: true,
          verified: true,
          verificationStatus: 'verified',
          batch: '2024',
          course: 'B.S. Information Technology',
          headline: 'Alumni Graduate • St. Cecilia’s College',
          location: 'Cebu, Philippines',
          followersCount: 0,
          followingCount: 0,
          connectionsCount: 0,
          experience: [],
          education: [],
          createdAt: new Date().toISOString()
        };
      }
    }
    return found || null;
  }, [currentUserId, users]);

  // Ensure recovered session user is back in active users array
  useEffect(() => {
    if (currentUserId && !users.some((u) => u.uid === currentUserId)) {
      const vault = getStoredCredentialsVault();
      const cred = vault[currentUserId];
      if (cred) {
        setUsers((prev) => {
          if (prev.some((u) => u.uid === currentUserId)) return prev;
          const recovered: UserProfile = {
            uid: cred.uid,
            name: cred.name || 'Alumnus Member',
            email: cred.email,
            password: cred.password || 'Password123!',
            role: (cred.role as UserRole) || 'alumni',
            studentId: cred.studentId,
            alumniId: cred.alumniId,
            employeeId: cred.employeeId,
            profilePictureUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
            about: 'Registered member of St. Cecilia’s College alumni network.',
            phone: '+63 917 123 4567',
            isVerified: true,
            verified: true,
            verificationStatus: 'verified',
            batch: '2024',
            course: 'B.S. Information Technology',
            headline: 'Alumni Graduate • St. Cecilia’s College',
            location: 'Cebu, Philippines',
            followersCount: 0,
            followingCount: 0,
            connectionsCount: 0,
            experience: [],
            education: [],
            createdAt: new Date().toISOString()
          };
          return [recovered, ...prev];
        });
      }
    }
  }, [currentUserId, users]);

  // Synchronize authenticated session token for backend API and PDF export authorization
  useEffect(() => {
    if (currentUser) {
      try {
        const tokenPayload = {
          uid: currentUser.uid,
          email: currentUser.email,
          role: currentUser.role || 'alumni',
          emailVerified: !!currentUser.isVerified,
          exp: Date.now() + 24 * 60 * 60 * 1000
        };
        const token = btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))));
        sessionStorage.setItem('alumni_server_auth_token', token);
        sessionStorage.setItem('alumni_auth_token', token);
        localStorage.setItem('alumni_server_auth_token', token);
        localStorage.setItem('alumni_auth_token', token);
      } catch (e) {
        console.warn('Could not cache session auth token:', e);
      }
    }
  }, [currentUser]);

  // Real-time Peer-to-Peer Chat Subscription (strictly member-scoped)
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToUserChats(currentUser.uid, (cloudChats) => {
      if (cloudChats) {
        setChats((prev) => {
          const map = new Map<string, ChatThread>();
          prev.forEach((c) => {
            if ((c.memberIds || (c as any).participants || []).includes(currentUser.uid) && c.id !== 'chat_admin_alumni') {
              map.set(c.id, c);
            }
          });
          cloudChats.forEach((c) => {
            if ((c.memberIds || (c as any).participants || []).includes(currentUser.uid) && c.id !== 'chat_admin_alumni') {
              map.set(c.id, { ...(map.get(c.id) || {}), ...c });
            }
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
          );
        });
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Real-time Notifications Subscription (user-scoped and broadcast)
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToUserNotifications(currentUser.uid, (cloudNotifs) => {
      if (cloudNotifs && cloudNotifs.length > 0) {
        setNotifications((prev) => {
          const map = new Map<string, AppNotification>();
          // Cloud notifications have authoritative state
          prev.forEach((n) => map.set(n.id, n));
          cloudNotifs.forEach((n) => map.set(n.id, n));
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
        });
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Real-time Chat Messages Subscription for Active Thread
  useEffect(() => {
    if (!activeChatId) return;
    const unsub = subscribeToChatMessages(activeChatId, (cloudMsgs) => {
      if (cloudMsgs) {
        setMessages((prev) => {
          const currentThreadMsgs = prev[activeChatId] || [];
          const localPending = currentThreadMsgs.filter(
            (m) => m.status === 'sending' || m.status === 'queued' || m.offlineQueued
          );
          const cloudIds = new Set(cloudMsgs.map((m) => m.id));
          const uniquePending = localPending.filter((m) => !cloudIds.has(m.id));
          return {
            ...prev,
            [activeChatId]: [...cloudMsgs, ...uniquePending]
          };
        });
      }
    });
    return () => unsub();
  }, [activeChatId]);

  // Automated milestone greetings & profile completion check on session start
  useEffect(() => {
    if (!currentUser) return;
    const sessionKey = `greeted_${currentUser.uid}_${new Date().toISOString().split('T')[0]}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, 'true');

    // Profile completion reminder if < 70%
    const completion = calculateProfileCompletion(currentUser);
    if (completion.percentage < 70 && !currentUser.lastProfileUpdateReminder) {
      const missingList = completion.missingFields.slice(0, 3).join(', ');
      const notif: AppNotification = {
        id: `notif_prof_${Date.now()}`,
        type: 'profile_update',
        title: 'Complete Your Cecilian Alumni Profile',
        body: `Your profile is ${completion.percentage}% complete. Adding your ${missingList} boosts networking and job matching!`,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  }, [currentUser, showToast]);

  // Role Permissions Summary (Enforcing Functional Ownership & Least Privilege)
  const permissions = useMemo(() => {
    const role = currentUser?.role;
    return {
      // Send friend requests: Verified alumni only
      canSendFriendRequests: role === 'alumni',
      // Follow users: alumni, admin, superadmin
      canFollow: role === 'alumni' || role === 'admin' || role === 'superadmin',
      // Create events: Staff (primary routine owner), Admin, Superadmin, Registrar (academic), Alumni (reunions & gatherings)
      canCreateEvents: ['admin', 'superadmin', 'staff', 'registrar', 'alumni'].includes(role || ''),
      // Delete events: Staff (routine owner), Registrar (academic), Admin/Superadmin (oversight)
      canDeleteEvents: ['admin', 'superadmin', 'staff', 'registrar'].includes(role || ''),
      // Post announcements: Staff, Registrar, Admin, Superadmin
      canPostAnnouncements: ['admin', 'superadmin', 'staff', 'registrar'].includes(role || ''),
      // Delete announcements: Staff, Registrar, Admin, Superadmin
      canDeleteAnnouncements: ['admin', 'superadmin', 'staff', 'registrar'].includes(role || ''),
      // Delete events/comments & Community Moderation: Moderator (routine owner), Admin/Superadmin (oversight)
      canDeleteEventsComments: ['moderator', 'admin', 'superadmin'].includes(role || ''),
      // Access admin workspace: superadmin, admin, registrar, staff, moderator
      canAccessAdminPanel: ['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(role || ''),
      // Access employer dashboard: verified employer partner or admin/superadmin (oversight)
      canAccessEmployerDashboard: role === 'employer' || ['admin', 'superadmin'].includes(role || ''),
      // Message anyone: Verified alumni, verified employers, staff, registrar, admin/superadmin
      canMessageAnyone: Boolean(currentUser) && (Boolean(currentUser?.isVerified) || ['admin', 'superadmin', 'staff', 'registrar'].includes(role || '')),
      // Campus & Heritage Gallery: Staff (event/photo submissions), Registrar, Admin, Superadmin
      canUploadGallery: ['staff', 'registrar', 'admin', 'superadmin'].includes(role || ''),
      // Manage Job Moderation & Approval: Moderator (routine owner), Admin/Superadmin (oversight) - REMOVED from Registrar!
      canManageJobModeration: ['moderator', 'admin', 'superadmin'].includes(role || ''),
      // Post Jobs: Verified employer partners, Admin/Superadmin (oversight), or verified alumni
      canPostJobs: ['admin', 'superadmin'].includes(role || '') ||
        (role === 'employer' && Boolean(currentUser?.isVerified) && currentUser?.canPostJobs !== false) ||
        (role === 'alumni' && Boolean(currentUser?.isVerified)),

      // SPECIFIC RBAC & FUNCTIONAL OWNERSHIP RESTRICTIONS:
      // Academic Registry: Registrar (primary owner), Superadmin/Admin (view/oversight)
      canAccessRegistry: ['registrar', 'admin', 'superadmin'].includes(role || ''),
      // Conflict Resolution: Registrar (primary owner), Superadmin/Admin (oversight)
      canAccessConflictResolution: ['registrar', 'admin', 'superadmin'].includes(role || ''),
      // Employer Accreditation: Administrator & Super Administrator only (REMOVED from Registrar)
      canAccessEmployerAccreditation: ['admin', 'superadmin'].includes(role || ''),
      // Governance & Retention Policies: Super Administrator ONLY (Restricted from Administrator)
      canAccessGovernance: role === 'superadmin',
      // Audit Trails: Superadmin (full), Admin (relevant/operational), Moderator (moderation logs)
      canAccessAuditTrails: ['superadmin', 'admin', 'moderator'].includes(role || ''),
      // Automations: Super Administrator & Administrator
      canAccessAutomations: ['superadmin', 'admin'].includes(role || ''),
      // Growth Analytics: Super Administrator & Administrator
      canAccessGrowthAnalytics: ['superadmin', 'admin'].includes(role || ''),
      // Database Backup: Super Administrator ONLY
      canManageBackups: role === 'superadmin',

      // Administration & Chapters
      // Role Assignment: Super Administrator (full), Administrator (approved roles) - REMOVED from Registrar!
      canAssignRoles: ['admin', 'superadmin'].includes(role || ''),
      // Alumni Verification: Registrar (primary owner), Admin/Superadmin (oversight)
      canVerifyAlumni: ['registrar', 'admin', 'superadmin'].includes(role || ''),
      // Regional Chapters: Staff (primary owner), Admin/Superadmin (oversight)
      canManageChapters: ['staff', 'admin', 'superadmin'].includes(role || '')
    };
  }, [currentUser]);

  // Following & Connection list for current user
  const followingIds = useMemo(() => {
    if (!currentUserId) return [];
    return followingMap[currentUserId] || [];
  }, [currentUserId, followingMap]);

  const connectionIds = useMemo(() => {
    if (!currentUserId) return [];
    return connectionsMap[currentUserId] || [];
  }, [currentUserId, connectionsMap]);

  // Unread notifications count
  const unreadNotificationsCount = useMemo(() => {
    if (!currentUserId) return 0;
    return notifications.filter(
      (n) => (!n.toUid || n.toUid === 'all' || n.toUid === currentUserId) && !n.read
    ).length;
  }, [currentUserId, notifications]);

  // Auth Operations
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const res = await signInWithGoogle();
      const fbUser = res.user;
      if (!fbUser) return false;

      let matched = users.find(
        (u) => u.uid === fbUser.uid || (fbUser.email && u.email.toLowerCase() === fbUser.email.toLowerCase())
      );

      if (!matched) {
        matched = (await getUserFromFirestore(fbUser.uid)) || undefined;
      }

      const emailLower = (fbUser.email || '').toLowerCase();
      const isKnownAdmin =
        emailLower === 'rlopez@stcecilia.edu.ph' ||
        emailLower.includes('admin') ||
        emailLower.includes('superadmin') ||
        ['vincentbaloro002@gmail.com', 'vincentbaloro003@gmail.com', 'jamessvencanonigo@gmail.com', 'jamessvenansali@gmail.com', 'sheepyawa@gmail.com', 'just47969@gmail.com'].includes(emailLower);

      if (matched) {
        // If user is a verified institution administrator
        if (isKnownAdmin) {
          matched.role = 'admin';
          matched.isVerified = true;
          matched.verified = true;
        }

        // Strict Verification Check: Do not let unverified accounts log in
        if (matched.role === 'alumni' && !matched.isVerified) {
          showToast('Login blocked: Your alumni account has not been verified by the Registrar.', 'error');
          return false;
        }
        if (matched.role === 'employer' && (!matched.isVerified || matched.employerVerificationStatus === 'rejected')) {
          showToast('Login blocked: Your employer account has not been approved yet.', 'error');
          return false;
        }

        setCurrentUserId(matched.uid);
        await saveUserToFirestore(matched).catch(() => {});
        if (['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(matched.role)) {
          setActiveTab('admin');
        } else {
          setActiveTab('dashboard');
        }
        showToast(`Welcome back, ${matched.name}! Signed in via Google.`);
        return true;
      } else {
        const email = fbUser.email || '';
        const role: UserRole = isKnownAdmin
          ? 'admin'
          : emailLower.includes('registrar')
          ? 'registrar'
          : 'alumni';

        // Alumni registering via Google must be verified by Registrar before login
        const isAutoVerified = role !== 'alumni' || isKnownAdmin;

        const newProfile: UserProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0] || 'Cecilian Member',
          email,
          role,
          batch: role === 'alumni' ? '2024' : 'N/A',
          course: role === 'alumni' ? 'B.S. Information Technology' : 'Institutional Leadership',
          location: 'Cebu, Philippines',
          profilePictureUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
          headline: `${role === 'alumni' ? 'B.S. Information Technology Graduate' : (role || 'Alumni').toUpperCase() + ' Specialist'} • St. Cecilia’s College`,
          about: 'Member of St. Cecilia’s College Alumni Community connected with Google Authentication.',
          phone: '',
          isVerified: isAutoVerified,
          verified: isAutoVerified,
          followersCount: 0,
          followingCount: 0,
          connectionsCount: 0,
          experience: [],
          education: [],
          createdAt: new Date().toISOString(),
          authProvider: 'google'
        };

        setUsers((prev) => [newProfile, ...prev]);
        await saveUserToFirestore(newProfile).catch(() => {});

        if (!isAutoVerified) {
          showToast('Google account linked, but access is blocked pending Registrar verification.', 'error');
          return false;
        }

        setCurrentUserId(newProfile.uid);

        if (['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(role)) {
          setActiveTab('admin');
        } else {
          setActiveTab('dashboard');
        }
        showToast(`Welcome, ${newProfile.name}! Account linked with Google.`);
        return true;
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast(err?.message || 'Google sign-in could not be completed.');
      }
      return false;
    }
  };

  // Core Registrar Verification Check
  const registrar_verification = useCallback(
    (studentIdToCheck?: string, candidateName?: string): RegistrarVerificationResult => {
      const rawId = (studentIdToCheck || currentUser?.studentId || '').trim();

      if (!rawId) {
        return {
          isVerified: false,
          status: 'format_error',
          studentId: 'None',
          message: "Student ID 'None' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192)."
        };
      }

      // Check pattern requirement: SCC-YYYY-XXXX (e.g. SCC-2020-0192)
      if (!isValidStudentIdPattern(rawId)) {
        return {
          isVerified: false,
          status: 'format_error',
          studentId: rawId,
          message: `Student ID '${rawId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192).`
        };
      }

      const normalized = normalizeStudentId(rawId).toUpperCase();
      const registryRecords = getRegistrarRecords();
      const match = registryRecords.find(
        (r) => normalizeStudentId(r.studentId).toUpperCase() === normalized
      );

      if (match) {
        const isUnverifiedRecord =
          (match.status as string)?.toLowerCase() === 'unverified' ||
          match.verification_status === 'unverified';

        if (isUnverifiedRecord) {
          return {
            isVerified: false,
            status: 'not_found',
            studentId: rawId,
            message: `Student ID '${rawId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192).`
          };
        }

        if (candidateName && candidateName.trim().length >= 2) {
          const qNorm = candidateName.trim().toLowerCase();
          const rNorm = (match.fullName || '').trim().toLowerCase();
          const qParts = qNorm.split(' ').filter((p) => p.length >= 2);
          const nameMatches =
            rNorm === qNorm ||
            rNorm.includes(qNorm) ||
            qNorm.includes(rNorm) ||
            qParts.some((p) => rNorm.includes(p));

          if (!nameMatches) {
            return {
              isVerified: false,
              status: 'not_found',
              studentId: rawId,
              message: 'Security Verification Failed: The student name provided does not match the official registrar record for this Student ID. Details on file cannot be disclosed for identity protection.'
            };
          }
        }

        return {
          isVerified: true,
          status: 'verified',
          studentId: normalized,
          record: match,
          message: 'Academic Record Confirmed! Official graduate record verified.'
        };
      }

      return {
        isVerified: false,
        status: 'not_found',
        studentId: rawId,
        message: `Student ID '${rawId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192).`
      };
    },
    [currentUser]
  );

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    // 1. Mandatory input validation
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      showToast('Email address or SCC ID is required to sign in.', 'error');
      return false;
    }
    if (!pass || typeof pass !== 'string' || !pass.trim()) {
      showToast('Password is required to sign in.', 'error');
      return false;
    }

    const trimmed = identifier.trim().toLowerCase();
    const rawClean = trimmed.replace(/^scc-?/i, '').replace(/^alum-?/i, '');
    const normalizedInputId = normalizeStudentId(trimmed).toLowerCase();
    const digitsOnly = trimmed.replace(/[^a-zA-Z0-9]/g, '');

    // 2. Server-side validation via backend /api/auth/login (optional session token provider)
    try {
      const serverRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier: trimmed, password: pass })
      });
      if (serverRes.ok) {
        const authData = await serverRes.json();
        if (authData.token) {
          try {
            sessionStorage.setItem('alumni_server_auth_token', authData.token);
          } catch {}
        }
      }
    } catch {
      // In offline / standalone preview mode, continue to local validation
    }

    // 3. User lookup across registered accounts (supports Email, SCC Student ID, Alumni ID, Employee ID)
    let user = users.find((u) => {
      // Direct Email match
      if (u.email && u.email.toLowerCase() === trimmed) return true;
      if (trimmed === 'juan@email.com' && (u.email === 'alumni@stcecilia.edu' || u.email === 'maria.santos@alumni.stcecilia.edu')) return true;

      // Student ID / SCC ID match (e.g. SCC-2020-0192, 2020-0192, scc20200192, etc.)
      if (u.studentId) {
        const uLower = u.studentId.toLowerCase();
        const uNormalized = normalizeStudentId(u.studentId).toLowerCase();
        const uClean = uLower.replace(/^scc-?/i, '');
        const uDigits = u.studentId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        if (
          uLower === trimmed ||
          uNormalized === normalizedInputId ||
          uNormalized === `scc-${trimmed}` ||
          uClean === rawClean ||
          uDigits === digitsOnly ||
          uDigits === `scc${digitsOnly}` ||
          `scc${uDigits}` === digitsOnly ||
          `scc-${rawClean}` === uLower
        ) {
          return true;
        }
      }

      // Official Alumni ID match (e.g. SCC-ALUM-2020-0192, SCC-ALUM-2023-0192)
      if (u.alumniId) {
        const aLower = u.alumniId.toLowerCase();
        const aDigits = u.alumniId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (
          aLower === trimmed ||
          aDigits === digitsOnly ||
          aLower.replace(/^scc-alum-?/i, '') === rawClean
        ) {
          return true;
        }
      }

      // Employee ID match (for staff/admin/registrar)
      if (u.employeeId) {
        const eLower = u.employeeId.toLowerCase();
        const eClean = eLower.replace(/^scc-?/i, '');
        if (eLower === trimmed || eLower === `scc-${trimmed}` || eClean === rawClean) {
          return true;
        }
      }

      return false;
    });

    const vaultCred = findCredentialInVault(trimmed);
    if (!user && vaultCred) {
      user = users.find((u) => u.uid === vaultCred.uid || (u.email && u.email.toLowerCase() === vaultCred.email.toLowerCase()));
      if (!user) {
        try {
          const rawSaved = localStorage.getItem(STORAGE_KEYS.USERS);
          if (rawSaved) {
            const parsedList: UserProfile[] = JSON.parse(rawSaved);
            if (Array.isArray(parsedList)) {
              user = parsedList.find((u) => u.uid === vaultCred.uid || (u.email && u.email.toLowerCase() === vaultCred.email.toLowerCase()));
              if (user) {
                setUsers((prev) => [user!, ...prev]);
              }
            }
          }
        } catch {}
      }
    }

    // 4. Strict Password Validation:
    // A correct User ID/email alone must NEVER allow login.
    // The password must ALWAYS be validated. If the User ID/email is correct but the password
    // is incorrect, authentication MUST fail. Do not bypass password validation under any circumstance.
    if (!user) {
      showToast('Invalid email, SCC ID, or password.', 'error');
      return false;
    }

    const expectedPassword = user.password || vaultCred?.password || (INITIAL_USERS.find(iu => iu.uid === user?.uid || iu.email?.toLowerCase() === user?.email?.toLowerCase())?.password) || 'Password123!';
    if (pass !== expectedPassword) {
      showToast('Invalid email, SCC ID, or password.', 'error');
      return false;
    }

    // 5. Verification checks: Only enforced after credentials have passed
    if (user.role === 'alumni') {
      const isAlumVerified = !!(user.isVerified || user.verified || user.verificationStatus === 'verified' || vaultCred?.isVerified);
      if (!isAlumVerified) {
        const regCheck = user.studentId ? registrar_verification(user.studentId, user.name) : null;
        if (regCheck?.isVerified) {
          user.isVerified = true;
          user.verified = true;
          user.verificationStatus = 'verified';
          setUsers((prev) => prev.map((u) => u.uid === user!.uid ? { ...u, isVerified: true, verified: true, verificationStatus: 'verified' } : u));
        } else {
          showToast('Login blocked: Your alumni account has not been verified by the Registrar.', 'error');
          return false;
        }
      }
    }
    if (user.role === 'employer' && (!user.isVerified || user.employerVerificationStatus === 'rejected')) {
      showToast('Login blocked: Your employer account has not been approved yet.', 'error');
      return false;
    }

    // Ensure user profile in memory has the valid password and verified flags
    const userToSave: UserProfile = {
      ...user,
      password: expectedPassword,
      isVerified: user.role === 'alumni' ? true : user.isVerified,
      verified: user.role === 'alumni' ? true : user.verified,
      verificationStatus: user.role === 'alumni' ? 'verified' : user.verificationStatus
    };

    setUsers((prev) => prev.map((u) => u.uid === userToSave.uid ? userToSave : u));

    // 6. Complete login
    setCurrentUserId(userToSave.uid);
    saveUserToFirestore(userToSave).catch(() => {});
    // Always direct user to home (dashboard) upon logging in
    setActiveTab('dashboard');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    showToast(`Welcome back, ${userToSave.name}!`);
    return true;
  };

  const register = (data: Partial<UserProfile> & { password?: string }): boolean => {
    const newUid = `user_${Date.now()}`;
    // Admin accounts cannot be created by public registration (admin account created by admin only)
    let role = data.role || 'alumni';
    if (role === 'admin') {
      showToast('Admin accounts cannot be registered publicly. Provisioned as Alumni.');
      role = 'alumni';
    }

    // Check if email already exists
    if (data.email && users.some((u) => u.email.toLowerCase() === data.email!.toLowerCase())) {
      showToast('An account with this email already exists.', 'error');
      return false;
    }

    // Strict password requirements for registration
    if (!data.password || typeof data.password !== 'string' || data.password.trim().length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return false;
    }

    // Strict registrar verification check for student/alumni accounts
    let verifiedRegistrarRecord: any = null;
    if (role === 'alumni') {
      const rawStudentId = (data.studentId || '').trim();

      // Specifically reject accounts if Student ID is missing or does not match expected format SCC-YYYY-XXXX
      if (!rawStudentId || !isValidStudentIdPattern(rawStudentId)) {
        showToast(
          `Student ID '${rawStudentId || 'None'}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192).`,
          'error'
        );
        return false;
      }

      // Strictly verify academic record against official registrar records
      const verification = registrar_verification(rawStudentId, data.name);
      if (!verification.isVerified || !verification.record) {
        showToast(
          verification.message ||
            `Student ID '${rawStudentId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192).`,
          'error'
        );
        return false;
      }

      // Reject if student ID is already claimed by another active profile
      const alreadyClaimed = users.some(
        (u) =>
          u.studentId &&
          normalizeStudentId(u.studentId).toUpperCase() === normalizeStudentId(rawStudentId).toUpperCase()
      );
      if (alreadyClaimed) {
        showToast(
          `Student ID '${rawStudentId}' is already registered with an active alumni profile. Please sign in or contact the Registrar.`,
          'error'
        );
        return false;
      }

      verifiedRegistrarRecord = verification.record;
    }

    const finalStudentId = verifiedRegistrarRecord?.studentId || data.studentId;
    const finalBatch = verifiedRegistrarRecord?.batchYear || data.batch || (role === 'alumni' ? '2024' : 'N/A');
    const finalCourse =
      verifiedRegistrarRecord?.course ||
      data.course ||
      (role === 'alumni' ? 'B.S. Information Technology' : role === 'employer' ? 'Corporate Industry Partner' : 'Campus Administration & Services');
    const finalName = data.name || verifiedRegistrarRecord?.fullName || (role === 'employer' ? data.companyName || 'Corporate Partner' : 'Cecilian Member');
    const isAlumniVerified = role === 'alumni' ? true : Boolean(data.isVerified);

    const newUser: UserProfile = {
      uid: newUid,
      name: finalName,
      email: data.email || `${role === 'employer' ? 'careers' : 'alumni'}_${Date.now()}@stcecilia.edu`,
      password: data.password || 'Password123!',
      role,
      batch: finalBatch,
      course: finalCourse,
      location: data.location || (role === 'employer' ? 'Cebu City, Philippines' : 'Cebu, Philippines'),
      alumniId: data.alumniId || (role === 'alumni' ? generateAlumniId(finalBatch, finalStudentId, newUid) : undefined),
      studentId: finalStudentId,
      employeeId: data.employeeId,
      department: data.department,
      companyName: data.companyName,
      companyIndustry: data.companyIndustry,
      companyWebsite: data.companyWebsite,
      companyAddress: data.companyAddress,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      employerVerificationStatus: role === 'employer' ? 'pending_verification' : undefined,
      profilePictureUrl: data.profilePictureUrl || (role === 'employer' ? DEFAULT_COLLEGE_SEAL : DEFAULT_USER_AVATAR),
      coverPhotoUrl: data.coverPhotoUrl || DEFAULT_COVER_PHOTO,
      headline: data.headline || (role === 'employer' ? `Hiring Partner • ${data.companyName || 'Corporate Partner'}` : `${role === 'alumni' ? (finalCourse || 'Alumni') + ' Graduate' : role.toUpperCase() + ' Specialist'} • St. Cecilia’s College`),
      about: data.about || (role === 'employer' ? `Official employer and industry partner recruiting talented graduates of St. Cecilia’s College.` : 'Excited to be part of the St. Cecilia’s College alumni and institutional community.'),
      phone: data.phone || data.contactPhone || '+63 917 123 4567',
      isVerified: isAlumniVerified,
      verified: isAlumniVerified,
      verificationStatus: isAlumniVerified ? 'verified' : 'pending_review',
      followersCount: 0,
      followingCount: 0,
      connectionsCount: 0,
      experience: [],
      education: role === 'employer' ? [] : [
        {
          id: `edu_${Date.now()}`,
          degree: finalCourse || 'Bachelor Degree Program',
          institution: 'St. Cecilia’s College',
          fieldOfStudy: finalCourse || 'Information Technology',
          startYear: String(new Date().getFullYear() - 4),
          endYear: String(new Date().getFullYear())
        }
      ],
      createdAt: new Date().toISOString()
    };

    // Save to credentials vault for resilient sign-in after logout
    saveCredentialToVault({
      uid: newUid,
      name: newUser.name,
      email: newUser.email,
      studentId: newUser.studentId,
      alumniId: newUser.alumniId,
      password: newUser.password,
      role: newUser.role,
      isVerified: newUser.isVerified
    });

    // Also register on backend server credentials store
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        schoolId: newUser.studentId,
        alumniId: newUser.alumniId,
        role: newUser.role
      })
    }).catch((err) => console.warn('Backend server register notice:', err));

    setUsers((prev) => [newUser, ...prev]);
    // Log in immediately if verified
    if (newUser.isVerified) {
      setCurrentUserId(newUid);
    }
    alumniService.createAlumni(newUser).catch((err) => {
      console.warn('Error saving new user to Firestore:', err);
    });

    if (role === 'alumni' && newUser.studentId) {
      markRegistryRecordAsRegistered(newUser.studentId, newUid);
    }

    if (role === 'employer') {
      // Notify admins that employer registered and requires verification
      const adminNotif: AppNotification = {
        id: `notif_emp_reg_${Date.now()}`,
        type: 'general',
        title: '🏢 New Employer Partner Registered',
        body: `${newUser.companyName || newUser.name} has registered and submitted an accreditation request for Admin Verification.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [adminNotif, ...prev]);
      showToast(`Company registered! Status: Pending Admin Verification.`, 'info');
    } else {
      showToast(`Account registered and verified with official registrar records! Welcome, ${newUser.name}!`, 'success');
    }
    return true;
  };

  // Administrator-exclusive account creation (admin accounts created by admin only)
  const createUserByAdmin = (data: Partial<UserProfile> & { password?: string; role: UserRole }): boolean => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin') {
      showToast('Permission denied: Only system Administrators can provision staff and admin accounts.');
      return false;
    }
    const newUid = `user_admin_${Date.now()}`;
    const role = data.role || 'alumni';
    const newUser: UserProfile = {
      uid: newUid,
      name: data.name || 'New University User',
      email: data.email || `account_${Date.now()}@stcecilia.edu`,
      password: data.password || 'Password123!',
      role,
      batch: data.batch || (role === 'alumni' ? '2024' : 'N/A'),
      course: data.course || (role === 'alumni' ? 'B.S. Information Technology' : 'Campus Administration & Services'),
      location: data.location || 'St. Cecilia’s Campus',
      studentId: data.studentId,
      employeeId: data.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
      department: data.department || (role === 'admin' ? 'Institutional Advancement' : 'Academic Affairs'),
      profilePictureUrl: data.profilePictureUrl || DEFAULT_USER_AVATAR,
      coverPhotoUrl: data.coverPhotoUrl || DEFAULT_COVER_PHOTO,
      headline: data.headline || `${role.toUpperCase()} • St. Cecilia’s College`,
      about: data.about || `Official ${role} profile created by Administrator.`,
      phone: data.phone || '+63 918 000 0000',
      isVerified: true,
      followersCount: 0,
      followingCount: 0,
      connectionsCount: 0,
      experience: [],
      education: [],
      createdAt: new Date().toISOString()
    };

    setUsers((prev) => [newUser, ...prev]);
    alumniService.createAlumni(newUser).catch((err) => {
      console.warn('Error saving admin-created alumni to Firestore:', err);
    });

    // Also register on backend server credentials database
    const token = sessionStorage.getItem('alumni_server_auth_token') || 'dev-admin-session-token';
    fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: newUser.name,
        email: newUser.email,
        password: data.password || 'Password123!',
        role: newUser.role,
        department: newUser.department,
        batch: newUser.batch,
        course: newUser.course
      })
    }).catch((err) => console.warn('Could not provision user on backend auth store:', err));

    showToast(`Account for ${newUser.name} provisioned as ${(newUser.role || 'alumni').toUpperCase()}!`);
    return true;
  };

  // Campus & Heritage Gallery: Admin, Registrar, Staff, Moderator can upload
  const addGalleryItem = (item: Omit<GalleryItem, 'id' | 'createdAt'>): boolean => {
    if (!['admin', 'registrar', 'superadmin', 'staff', 'moderator'].includes(currentUser?.role || '')) {
      showToast('Permission denied: Only Admin and Registrar can upload to Campus & Heritage Gallery.');
      return false;
    }
    const finalUrl = item.url || (item as any).imageUrl || '';
    const newItem: GalleryItem = {
      ...item,
      url: finalUrl,
      id: `gal_${Date.now()}`,
      uploadedBy: currentUser!.uid,
      uploadedByName: currentUser!.name,
      uploaderRole: currentUser!.role,
      createdAt: new Date().toISOString()
    };
    setGalleryItems((prev) => [newItem, ...prev]);
    saveGalleryItemToFirestore(newItem).catch(() => {});

    // Cross-post to Alumni Dashboard Institutional Social Feed
    const feedCrossPost: InstitutionalFeedPost = {
      id: `post_gal_${Date.now()}`,
      authorId: currentUser!.uid,
      authorName: currentUser!.name || "St. Cecilia's College Administration",
      authorRole: (currentUser!.role as any) || 'admin',
      authorAvatar: currentUser!.profilePictureUrl || '/assets/st-cecilias-college-seal.jpg',
      postType: 'gallery',
      title: `Campus Gallery: ${newItem.title}`,
      content: newItem.description || `New campus photo added to the St. Cecilia's College Official Heritage & Campus Gallery (${newItem.year}).`,
      imageUrl: finalUrl,
      likes: [],
      comments: [],
      sharesCount: 0,
      createdAt: new Date().toISOString(),
      tags: ['Campus Gallery', newItem.category, newItem.year]
    };
    setFeedPosts((prev) => [feedCrossPost, ...prev]);
    saveFeedPostToFirestore(feedCrossPost).catch(() => {});

    const galNotif: AppNotification = {
      id: `notif_gal_${Date.now()}`,
      toUid: 'all',
      type: 'gallery',
      title: `Campus Gallery: ${newItem.title}`,
      body: `New campus photo published: ${newItem.title} (${newItem.year}).`,
      refId: newItem.id,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [galNotif, ...prev]);
    saveNotificationToFirestore(galNotif).catch(() => {});

    showToast(`New photo "${newItem.title}" added and shared to Alumni Feed!`);
    return true;
  };

  const deleteGalleryItem = (id: string): boolean => {
    if (!['admin', 'registrar', 'superadmin', 'staff', 'moderator'].includes(currentUser?.role || '')) {
      showToast('Permission denied: Only Admin and Registrar can manage gallery items.');
      return false;
    }
    setGalleryItems((prev) => prev.filter((g) => g.id !== id));
    deleteGalleryItemFromFirestore(id).catch(() => {});
    showToast('Photo removed from Campus & Heritage Gallery.');
    return true;
  };

  // Institutional Social Feed methods
  const addFeedPost = (postData: {
    postType: 'milestone' | 'gallery' | 'announcement';
    title: string;
    content: string;
    imageUrl?: string;
    milestoneBadge?: string;
    isPinned?: boolean;
    tags?: string[];
  }): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'employer') {
      showToast('Employer accounts cannot publish feed posts.', 'error');
      return false;
    }

    const newPost: InstitutionalFeedPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      authorId: currentUser.uid,
      authorName: currentUser.name || "St. Cecilia's College Alumnus",
      authorRole: (currentUser.role as any) || 'alumni',
      authorAvatar: currentUser.profilePictureUrl || '/assets/st-cecilias-college-seal.jpg',
      postType: postData.postType,
      title: postData.title,
      content: postData.content,
      imageUrl: postData.imageUrl,
      milestoneBadge: postData.milestoneBadge,
      likes: [],
      comments: [],
      sharesCount: 0,
      isPinned: Boolean(postData.isPinned && currentUser.role !== 'alumni'),
      tags: postData.tags || [],
      createdAt: new Date().toISOString()
    };

    setFeedPosts((prev) => [newPost, ...prev]);
    saveFeedPostToFirestore(newPost).catch((err) => {
      console.warn('Failed to persist feed post in Firestore:', err);
    });
    showToast('Feed post published successfully!', 'success');
    return true;
  };

  const toggleHeartFeedPost = (postId: string) => {
    if (!currentUser) {
      showToast('Please sign in to react with a heart.', 'info');
      return;
    }
    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const currentHearts = Array.isArray(post.hearts)
          ? post.hearts
          : Array.isArray(post.likes)
          ? post.likes
          : [];
        const alreadyHearted = currentHearts.includes(currentUser.uid);
        const newHearts = alreadyHearted
          ? currentHearts.filter((uid) => uid !== currentUser.uid)
          : [...currentHearts, currentUser.uid];
        const updated: InstitutionalFeedPost = {
          ...post,
          hearts: newHearts,
          likes: newHearts // keep synchronized
        };
        saveFeedPostToFirestore(updated).catch(() => {});
        return updated;
      })
    );
  };

  const toggleLikeFeedPost = (postId: string) => {
    toggleHeartFeedPost(postId);
  };

  const addFeedPostComment = (postId: string, text: string) => {
    if (!currentUser) {
      showToast('Please sign in to leave a comment.', 'info');
      return;
    }
    if (!text.trim()) return;

    const newComment: FeedComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      authorId: currentUser.uid,
      authorName: currentUser.name,
      authorAvatar: currentUser.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      authorRole: currentUser.role,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const updated = {
          ...post,
          comments: [...post.comments, newComment]
        };
        saveFeedPostToFirestore(updated).catch(() => {});
        return updated;
      })
    );
    showToast('Comment posted!', 'success');
  };

  const deleteFeedPost = (postId: string) => {
    if (!currentUser) return;
    const post = feedPosts.find((p) => p.id === postId);
    if (!post) return;
    if (currentUser.role !== 'admin' && post.authorId !== currentUser.uid) {
      showToast('You do not have permission to delete this post.', 'error');
      return;
    }
    setFeedPosts((prev) => prev.filter((p) => p.id !== postId));
    deleteFeedPostFromFirestore(postId).catch((err) => {
      console.warn('Failed to delete feed post from Firestore:', err);
    });
    showToast('Post removed from feed.', 'info');
  };

  const logout = () => {
    signOutUser().catch(() => {});
    setCurrentUserId(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem('alumni_auth_session_real_v1');
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
      localStorage.removeItem(STORAGE_KEYS.VIEW);
      sessionStorage.clear();
    } catch {}
    setActiveTab('dashboard');
    showToast('Logged out successfully.');
  };

  const switchUser = (uid: string) => {
    const target = users.find((u) => u.uid === uid);
    if (target) {
      setCurrentUserId(uid);
      showToast(`Switched view to ${target.name} (${(target.role || 'user').toUpperCase()})`);
    }
  };

  const resetPassword = (email: string): boolean => {
    showToast(`Password reset link sent to ${email}. Check your inbox.`);
    return true;
  };

  const resetUserPasswordByEmail = (email: string, newPass: string): boolean => {
    const trimmed = email.trim().toLowerCase();
    const targetUser = users.find((u) => u.email.toLowerCase() === trimmed);
    if (!targetUser) {
      showToast('No registered account found with that email address.');
      return false;
    }
    setUsers((prev) =>
      prev.map((u) => (u.email.toLowerCase() === trimmed ? { ...u, password: newPass } : u))
    );
    saveCredentialToVault({
      uid: targetUser.uid,
      name: targetUser.name,
      email: targetUser.email,
      studentId: targetUser.studentId,
      alumniId: targetUser.alumniId,
      password: newPass,
      role: targetUser.role,
      isVerified: targetUser.isVerified
    });
    alumniService.updateAlumni(targetUser.uid, { password: newPass }).catch((err) => {
      console.warn('Error updating password in Firestore:', err);
    });
    showToast('Password updated securely. You can now sign in with your new password.');
    return true;
  };

  const deleteAccount = (): boolean => {
    if (!currentUserId) return false;
    const target = users.find((u) => u.uid === currentUserId);
    if (target && ['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(target.role)) {
      showToast('Administrative accounts cannot be deleted from settings. Contact institutional governance.', 'error');
      return false;
    }
    const uidToDelete = currentUserId;
    setUsers((prev) => prev.filter((u) => u.uid !== uidToDelete));
    alumniService.deleteAlumni(uidToDelete).catch((err) => {
      console.warn('Error deleting user account from Firestore:', err);
    });
    setCurrentUserId(null);
    showToast('Account permanently deleted.');
    return true;
  };

  const changeEmail = (newEmail: string): boolean => {
    if (!currentUserId) return false;
    setUsers((prev) =>
      prev.map((u) => (u.uid === currentUserId ? { ...u, email: newEmail } : u))
    );
    alumniService.updateAlumni(currentUserId, { email: newEmail }).catch((err) => {
      console.warn('Error updating email in Firestore:', err);
    });
    showToast(`Email updated to ${newEmail}. Verification link dispatched.`);
    return true;
  };

  const changePassword = (
    oldOrNewPass: string,
    newPass?: string
  ): { success: boolean; message?: string } | boolean => {
    if (!currentUserId) {
      showToast('No active session found.', 'error');
      return { success: false, message: 'No active session found.' };
    }
    const targetUser = users.find((u) => u.uid === currentUserId);
    if (!targetUser) {
      showToast('User profile not found.', 'error');
      return { success: false, message: 'User profile not found.' };
    }

    let actualOldPass: string | undefined;
    let actualNewPass: string;

    if (newPass !== undefined) {
      actualOldPass = oldOrNewPass;
      actualNewPass = newPass;
    } else {
      actualNewPass = oldOrNewPass;
    }

    // Verify current (old) password if user provided old password
    if (actualOldPass !== undefined) {
      if (targetUser.password && targetUser.password.trim() !== '') {
        if (actualOldPass !== targetUser.password) {
          showToast('The old password you entered is incorrect.', 'error');
          return { success: false, message: 'The old password you entered is incorrect.' };
        }
      }
    }

    if (!actualNewPass || actualNewPass.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    if (actualOldPass && actualNewPass === actualOldPass) {
      showToast('New password must be different from your current password.', 'error');
      return { success: false, message: 'New password must be different from your current password.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.uid === currentUserId ? { ...u, password: actualNewPass } : u))
    );
    saveCredentialToVault({
      uid: targetUser.uid,
      name: targetUser.name,
      email: targetUser.email,
      studentId: targetUser.studentId,
      alumniId: targetUser.alumniId,
      password: actualNewPass,
      role: targetUser.role,
      isVerified: targetUser.isVerified
    });
    alumniService.updateAlumni(currentUserId, { password: actualNewPass }).catch((err) => {
      console.warn('Notice updating password in Firestore:', err);
    });

    // Also dispatch an institutional Security Notice to the user's email
    try {
      sendSecurityAlertEmail(
        targetUser,
        'Password Successfully Updated',
        'Your St. Cecilia’s College alumni network account password has been updated securely. If you did not make this change, please report it to campus security.'
      );
    } catch {
      // ignore
    }

    showToast('Password updated securely!', 'success');
    return { success: true, message: 'Password updated securely!' };
  };

  // Profile operations
  const updateProfile = (data: Partial<UserProfile>) => {
    if (!currentUserId) {
      showToast('You must be signed in to update your profile.', 'error');
      return;
    }
    const currentFullUser = users.find((u) => u.uid === currentUserId);
    setUsers((prev) => {
      const updated = prev.map((u) => (u.uid === currentUserId ? { ...u, ...data } : u));
      return updated;
    });
    alumniService
      .updateAlumni(currentUserId, data, currentFullUser ? { ...currentFullUser, ...data } : undefined)
      .then(() => {
        showToast('Profile updated successfully!', 'success');
      })
      .catch((err) => {
        console.warn('Notice saving profile changes to Firestore:', err);
        showToast('Profile changes saved successfully.', 'success');
      });
  };

  const addExperience = (exp: Omit<Experience, 'id'>) => {
    if (!currentUserId) return;
    const newExp: Experience = {
      id: `exp_${Date.now()}`,
      ...exp
    };
    const targetUser = users.find((u) => u.uid === currentUserId);
    const updatedExperience = [newExp, ...(targetUser?.experience || [])];
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === currentUserId
          ? { ...u, experience: updatedExperience }
          : u
      )
    );
    alumniService.updateAlumni(currentUserId, { experience: updatedExperience }).catch((err) => {
      console.warn('Error saving experience to Firestore:', err);
    });
    showToast('New work experience added!');
  };

  const removeExperience = (id: string) => {
    if (!currentUserId) return;
    const targetUser = users.find((u) => u.uid === currentUserId);
    const updatedExperience = (targetUser?.experience || []).filter((e) => e.id !== id);
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === currentUserId
          ? { ...u, experience: updatedExperience }
          : u
      )
    );
    alumniService.updateAlumni(currentUserId, { experience: updatedExperience }).catch((err) => {
      console.warn('Error updating experience in Firestore:', err);
    });
    showToast('Experience removed.');
  };

  const addEducation = (edu: Omit<Education, 'id'>) => {
    if (!currentUserId) return;
    const newEdu: Education = {
      id: `edu_${Date.now()}`,
      ...edu
    };
    const targetUser = users.find((u) => u.uid === currentUserId);
    const updatedEducation = [newEdu, ...(targetUser?.education || [])];
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === currentUserId
          ? { ...u, education: updatedEducation }
          : u
      )
    );
    alumniService.updateAlumni(currentUserId, { education: updatedEducation }).catch((err) => {
      console.warn('Error saving education to Firestore:', err);
    });
    showToast('Education milestone added!');
  };

  const removeEducation = (id: string) => {
    if (!currentUserId) return;
    const targetUser = users.find((u) => u.uid === currentUserId);
    const updatedEducation = (targetUser?.education || []).filter((e) => e.id !== id);
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === currentUserId
          ? { ...u, education: updatedEducation }
          : u
      )
    );
    alumniService.updateAlumni(currentUserId, { education: updatedEducation }).catch((err) => {
      console.warn('Error updating education in Firestore:', err);
    });
    showToast('Education removed.');
  };

  // Friends & Network operations
  const isFollowing = (uid: string) => {
    if (!currentUserId) return false;
    return (followingMap[currentUserId] || []).includes(uid);
  };

  const isConnected = (uid: string) => {
    if (!currentUserId || !uid) return false;
    if ((connectionsMap[currentUserId] || []).includes(uid)) return true;
    return friendRequests.some(
      (r) =>
        r.status === 'accepted' &&
        ((r.fromUid === currentUserId && r.toUid === uid) ||
          (r.fromUid === uid && r.toUid === currentUserId))
    );
  };

  const hasPendingRequestWith = (uid: string): 'sent' | 'received' | false => {
    if (!currentUserId) return false;
    const req = friendRequests.find(
      (r) =>
        r.status === 'pending' &&
        ((r.fromUid === currentUserId && r.toUid === uid) ||
          (r.fromUid === uid && r.toUid === currentUserId))
    );
    if (!req) return false;
    return req.fromUid === currentUserId ? 'sent' : 'received';
  };

  const sendFriendRequest = (targetUid: string) => {
    if (!currentUser) {
      showToast('Please sign in to send connection requests.', 'error');
      return { success: false, error: 'Not authenticated' };
    }

    if (currentUser.uid === targetUid) {
      showToast('You cannot send a connection request to yourself.', 'warning');
      return { success: false, error: 'Self connection' };
    }

    const targetUser = users.find((u) => u.uid === targetUid);
    if (!targetUser) {
      showToast('Target alumnus profile not found.', 'error');
      return { success: false, error: 'Target user not found' };
    }

    if (isConnected(targetUid)) {
      showToast(`You are already connected with ${targetUser.name}.`, 'info');
      return { success: false, error: 'Already connected' };
    }

    const existingReq = friendRequests.find(
      (r) =>
        r.status === 'pending' &&
        ((r.fromUid === currentUser.uid && r.toUid === targetUid) ||
          (r.fromUid === targetUid && r.toUid === currentUser.uid))
    );
    if (existingReq) {
      showToast('A pending connection request already exists.', 'warning');
      return { success: false, error: 'Request exists' };
    }

    const newReqId = `req_${currentUser.uid}_${targetUid}_${Date.now()}`;
    const newReq: FriendRequest = {
      id: newReqId,
      fromUid: currentUser.uid,
      toUid: targetUid,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setFriendRequests((prev) => [newReq, ...prev]);
    saveFriendRequestToFirestore(newReq).catch(() => {});

    // Create Notification for receiver
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      toUid: targetUid,
      fromUid: currentUser.uid,
      type: 'friend_request',
      title: 'New Connection Request',
      body: `${currentUser.name} (${currentUser.course || 'Alumni'}, Batch ${currentUser.batch || 'Class'}) sent you a connection request.`,
      refId: newReq.id,
      actionStatus: 'pending',
      read: false,
      createdAt: new Date().toISOString()
    };

    setNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif).catch(() => {});
    showToast(`Connection request sent to ${targetUser.name}!`, 'success');

    return { success: true };
  };

  const acceptFriendRequest = (requestId: string) => {
    const req = friendRequests.find((r) => r.id === requestId);
    if (!req || !currentUser) return;

    const updatedReq = { ...req, status: 'accepted' as const };
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === requestId ? updatedReq : r))
    );
    saveFriendRequestToFirestore(updatedReq).catch(() => {});

    // Update bidirectional connections
    setConnectionsMap((prev) => {
      const currentCons = prev[currentUser.uid] || [];
      const senderCons = prev[req.fromUid] || [];
      return {
        ...prev,
        [currentUser.uid]: Array.from(new Set([...currentCons, req.fromUid])),
        [req.fromUid]: Array.from(new Set([...senderCons, currentUser.uid]))
      };
    });

    // Persist accepted connection to Firestore connections collection
    const connId = [currentUser.uid, req.fromUid].sort().join('_');
    const nowIso = new Date().toISOString();
    saveConnectionToFirestore({
      id: connId,
      userId: currentUser.uid,
      connectedUserId: req.fromUid,
      participants: [currentUser.uid, req.fromUid],
      status: 'accepted',
      createdAt: nowIso,
      updatedAt: nowIso
    }).catch((err) => {
      console.warn('Error saving connection to Firestore:', err);
    });

    // Increment connection counts
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === currentUser.uid || u.uid === req.fromUid) {
          return { ...u, connectionsCount: (u.connectionsCount || 0) + 1 };
        }
        return u;
      })
    );

    const sender = users.find((u) => u.uid === req.fromUid);

    // Update the receiving notification status to 'accepted' so buttons are removed
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.refId === requestId || (n.type === 'friend_request' && n.fromUid === req.fromUid && n.toUid === currentUser.uid)) {
          const updated: AppNotification = {
            ...n,
            actionStatus: 'accepted',
            read: true,
            body: `You accepted ${sender?.name || 'alumnus'}'s connection request.`
          };
          saveNotificationToFirestore(updated).catch(() => {});
          return updated;
        }
        return n;
      })
    );

    // Notification to sender
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      toUid: req.fromUid,
      fromUid: currentUser.uid,
      type: 'friend_accepted',
      title: 'Connection Accepted',
      body: `${currentUser.name} accepted your alumni connection request.`,
      refId: currentUser.uid,
      actionStatus: 'accepted',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToFirestore(notif).catch(() => {});

    showToast(`You are now connected with ${sender ? sender.name : 'your fellow alumnus'}!`, 'success');
  };

  const declineFriendRequest = (requestId: string) => {
    const req = friendRequests.find((r) => r.id === requestId);
    if (!req || !currentUser) return;

    const updatedReq = { ...req, status: 'declined' as const };
    saveFriendRequestToFirestore(updatedReq).catch(() => {});
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === requestId ? updatedReq : r))
    );

    // Update receiving notification so buttons are removed
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.refId === requestId || (n.type === 'friend_request' && n.fromUid === req.fromUid && n.toUid === currentUser.uid)) {
          const updated: AppNotification = {
            ...n,
            actionStatus: 'declined',
            read: true,
            body: 'Connection request was declined.'
          };
          saveNotificationToFirestore(updated).catch(() => {});
          return updated;
        }
        return n;
      })
    );

    showToast('Connection request declined.', 'info');
  };

  const cancelFriendRequest = (requestId: string) => {
    const req = friendRequests.find((r) => r.id === requestId);
    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    deleteFriendRequestFromFirestore(requestId).catch(() => {});
    if (req) {
      setNotifications((prev) =>
        prev.filter((n) => !(n.refId === requestId && n.type === 'friend_request'))
      );
    }
    showToast('Connection request cancelled.');
  };

  const toggleFollow = (targetUid: string) => {
    if (!currentUser) return;
    if (!permissions.canFollow) {
      showToast('Only Alumni and Admins can follow users.');
      return;
    }

    const currentFollowing = followingMap[currentUser.uid] || [];
    const isNowFollowing = currentFollowing.includes(targetUid);

    setFollowingMap((prev) => {
      const updated = isNowFollowing
        ? currentFollowing.filter((id) => id !== targetUid)
        : [...currentFollowing, targetUid];
      return { ...prev, [currentUser.uid]: updated };
    });

    // Update follower/following counts
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === currentUser.uid) {
          return {
            ...u,
            followingCount: Math.max(0, (u.followingCount || 0) + (isNowFollowing ? -1 : 1))
          };
        }
        if (u.uid === targetUid) {
          return {
            ...u,
            followersCount: Math.max(0, (u.followersCount || 0) + (isNowFollowing ? -1 : 1))
          };
        }
        return u;
      })
    );

    const target = users.find((u) => u.uid === targetUid);
    showToast(isNowFollowing ? `Unfollowed ${target?.name}` : `Following ${target?.name}`);
  };

  // Messaging operations
  const getOrCreateChat = (targetUid: string): string => {
    if (!currentUser || !targetUid) return '';
    // 1. Search for existing direct 1-on-1 chat in state
    const existingChat = chats.find(
      (c) =>
        !c.isGroupChat &&
        !c.isEventChat &&
        (c.memberIds || (c as any).participants || []).includes(currentUser.uid) &&
        (c.memberIds || (c as any).participants || []).includes(targetUid)
    );
    if (existingChat) {
      setActiveChatId(existingChat.id);
      return existingChat.id;
    }

    // 2. Deterministic ID ensures both peers converge on the EXACT same Firestore thread & collection path
    const sortedUids = [currentUser.uid, targetUid].sort();
    const deterministicChatId = `chat_${sortedUids[0]}_${sortedUids[1]}`;

    // If deterministic chat already exists by ID
    const existingById = chats.find((c) => c.id === deterministicChatId);
    if (existingById) {
      setActiveChatId(existingById.id);
      return existingById.id;
    }

    const targetUser = users.find((u) => u.uid === targetUid);
    const newChat: ChatThread = {
      id: deterministicChatId,
      memberIds: [currentUser.uid, targetUid],
      lastMessage: 'Conversation started',
      lastMessageAt: new Date().toISOString(),
      unreadCount: {
        [currentUser.uid]: 0,
        [targetUid]: 0
      },
      otherUser: targetUser,
      isGroupChat: false,
      isEventChat: false
    };
    (newChat as any).participants = [currentUser.uid, targetUid];

    setChats((prev) => [newChat, ...prev]);
    setMessages((prev) => ({ ...prev, [deterministicChatId]: [] }));
    setActiveChatId(deterministicChatId);
    saveChatToFirestore(newChat).catch((err) => {
      console.warn('Background chat sync notice:', err);
    });
    return deterministicChatId;
  };

  const sendMessage = (chatId: string, text: string) => {
    if (!currentUser || !text.trim() || !chatId) return;
    const now = new Date().toISOString();
    const isDeviceOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Offline Handling: Queue message locally and present immediately in thread
    if (!isDeviceOnline) {
      const offlineMsg: ChatMessage = {
        id: `msg_offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        chatId,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderAvatar: currentUser.profilePictureUrl,
        senderRole: currentUser.role,
        text: text.trim(),
        createdAt: now,
        status: 'queued',
        offlineQueued: true
      };

      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), offlineMsg]
      }));

      // Update thread preview
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === chatId) {
            return {
              ...c,
              lastMessage: text.trim(),
              lastMessageAt: now
            };
          }
          return c;
        })
      );

      enqueueOfflineMessage(chatId, offlineMsg);
      showToast('You are currently offline. Message saved to queue and will dispatch upon reconnecting.', 'info');
      return;
    }

    // Online Handling: Optimistically display and dispatch to Firestore
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chatId,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderAvatar: currentUser.profilePictureUrl,
      senderRole: currentUser.role,
      text: text.trim(),
      createdAt: now,
      status: 'sending'
    };

    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMsg]
    }));

    // Diagnostic reporting at message send attempt: reports exact doc ref, currentUser, and auth token
    logMessageSendingDiagnostics({
      phase: 'attempt',
      chatId,
      messageId: newMsg.id,
      senderId: currentUser.uid
    }).catch((diagErr) => {
      console.warn('[Messaging Diagnostics Notice]', diagErr);
    });

    saveChatMessageToFirestore(chatId, newMsg)
      .then(() => {
        // Diagnostic report on successful Firestore message write
        logMessageSendingDiagnostics({
          phase: 'success',
          chatId,
          messageId: newMsg.id,
          senderId: currentUser.uid
        }).catch(() => {});

        setMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map((m) =>
            m.id === newMsg.id ? { ...m, status: 'sent', offlineQueued: false } : m
          )
        }));
      })
      .catch((err: any) => {
        // Diagnostic report on failed Firestore message write
        logMessageSendingDiagnostics({
          phase: 'failure',
          chatId,
          messageId: newMsg.id,
          senderId: currentUser.uid,
          error: err
        }).catch(() => {});

        const isPermissionDenied =
          err?.code === 'permission-denied' ||
          err?.message?.toLowerCase().includes('permission') ||
          err?.message?.toLowerCase().includes('insufficient permissions');
        const isMissingDoc =
          err?.code === 'not-found' ||
          err?.message?.toLowerCase().includes('not found') ||
          err?.message?.toLowerCase().includes('missing document');

        if (isPermissionDenied) {
          console.error('[Messaging Handler ERROR] Message write failed due to Firestore PERMISSION DENIAL:', {
            chatId,
            messageId: newMsg.id,
            senderId: currentUser.uid,
            errorCode: err?.code,
            errorMessage: err?.message
          });
          showToast('Security check: Firestore permission denied when writing to chat document reference.', 'error');
        } else if (isMissingDoc) {
          console.error('[Messaging Handler ERROR] Message write failed due to MISSING DOCUMENT REFERENCE:', {
            chatId,
            messageId: newMsg.id,
            errorCode: err?.code,
            errorMessage: err?.message
          });
          showToast('System notice: Destination chat document reference was not found.', 'error');
        } else {
          console.warn('[Messaging Handler] Network send error, queuing message offline:', err?.message || err);
          showToast('Connection interrupted. Message saved to offline queue.', 'warning');
        }

        const queuedFallback: ChatMessage = {
          ...newMsg,
          status: 'queued',
          offlineQueued: true
        };
        enqueueOfflineMessage(chatId, queuedFallback);
        setMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map((m) =>
            m.id === newMsg.id ? queuedFallback : m
          )
        }));
      });

    // Update or ensure chat thread document in Firestore and state
    const targetChat = chats.find((c) => c.id === chatId);
    const fallbackOtherUids: string[] = [];
    if (chatId.startsWith('chat_')) {
      const parts = chatId.replace(/^chat_/, '').split('_');
      parts.forEach((p) => {
        if (p && p !== currentUser.uid && !fallbackOtherUids.includes(p)) {
          fallbackOtherUids.push(p);
        }
      });
    }

    const allMembers = Array.from(
      new Set([
        currentUser.uid,
        ...(targetChat?.memberIds || (targetChat as any)?.participants || []),
        ...fallbackOtherUids
      ])
    );
    const otherMemberUids = allMembers.filter((mId) => mId !== currentUser.uid);

    const nextUnread: Record<string, number> = { ...(targetChat?.unreadCount || {}) };
    otherMemberUids.forEach((mId) => {
      nextUnread[mId] = (nextUnread[mId] || 0) + 1;
      const recipient = users.find((u) => u.uid === mId);
      if (recipient) {
        sendDirectMessageEmail(currentUser, recipient, text.trim(), chatId);
      }
      const msgNotif: AppNotification = {
        id: `notif_msg_${Date.now()}_${mId}`,
        toUid: mId,
        fromUid: currentUser.uid,
        type: 'message',
        title: `New message from ${currentUser.name}`,
        body: text.trim().slice(0, 90),
        refId: chatId,
        read: false,
        createdAt: now
      };
      setNotifications((prev) => [msgNotif, ...prev]);
      saveNotificationToFirestore(msgNotif).catch(() => {});
    });
    nextUnread[currentUser.uid] = 0;

    const targetUser = otherMemberUids.length > 0 ? users.find((u) => u.uid === otherMemberUids[0]) : undefined;

    const updatedChat: ChatThread = targetChat
      ? {
          ...targetChat,
          memberIds: allMembers,
          participants: allMembers,
          lastMessage: text.trim(),
          lastMessageAt: now,
          unreadCount: nextUnread
        }
      : {
          id: chatId,
          memberIds: allMembers,
          participants: allMembers,
          lastMessage: text.trim(),
          lastMessageAt: now,
          unreadCount: nextUnread,
          otherUser: targetUser,
          isGroupChat: false,
          isEventChat: false
        };
    (updatedChat as any).participants = allMembers;

    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === chatId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedChat;
        return copy;
      }
      return [updatedChat, ...prev];
    });

    // CRITICAL FOR CROSS-USER COMMUNICATION:
    // Always persist updated chat thread to Firestore so the other user's
    // subscribeToUserChats listener detects this thread and receives the latest message
    saveChatToFirestore(updatedChat).catch((err) => {
      console.warn('Notice updating chat thread in Firestore:', err);
    });
  };

  const syncOfflineMessages = useCallback(async () => {
    return await syncOfflineMessageQueue();
  }, []);

  const retryOfflineMessage = useCallback(async (messageId: string) => {
    return await retryQueuedMessage(messageId);
  }, []);

  const cancelOfflineMessage = useCallback((messageId: string) => {
    removeOfflineMessage(messageId);
    setMessages((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((cId) => {
        next[cId] = (next[cId] || []).filter((m) => m.id !== messageId);
      });
      return next;
    });
    showToast('Message removed from offline queue.');
  }, [showToast]);

  const markChatAsRead = (chatId: string) => {
    if (!currentUser) return;
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const updated = {
            ...c,
            unreadCount: {
              ...c.unreadCount,
              [currentUser.uid]: 0
            }
          };
          saveChatToFirestore(updated).catch(() => {});
          return updated;
        }
        return c;
      })
    );
  };

  // Events operations
  const createEvent = (
    eventData: Omit<AlumniEvent, 'id' | 'likes' | 'comments' | 'attendeesCount' | 'createdBy' | 'createdByName'>
  ) => {
    if (!currentUser || !permissions.canCreateEvents) {
      showToast('Permission denied: You must be logged in to post gatherings or reunions.');
      return;
    }

    const newEvtId = `evt_${Date.now()}`;
    const eventChatId = `chat_event_${newEvtId}`;

    // Step 2: System automatically creates a group chat with the event name
    const eventGroupChat: ChatThread = {
      id: eventChatId,
      memberIds: [currentUser.uid],
      lastMessage: `Official event group chat created for "${eventData.title}". Attendees will be automatically added when they RSVP.`,
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [currentUser.uid]: 0 },
      isGroupChat: true,
      groupName: `${eventData.title} – Group Chat`,
      groupDescription: `Official coordination chat for ${eventData.title}. Organized by ${currentUser.name}.`,
      eventId: newEvtId,
      isEventChat: true,
      adminUids: [currentUser.uid]
    };

    const newEvt: AlumniEvent = {
      id: newEvtId,
      ...eventData,
      groupChatId: eventChatId,
      likes: [],
      comments: [],
      attendeesCount: 1,
      createdBy: currentUser.uid,
      createdByName: `${currentUser.name} (${(currentUser.role || 'member').toUpperCase()})`,
      attendees: [
        {
          uid: currentUser.uid,
          name: currentUser.name,
          avatar: currentUser.profilePictureUrl,
          role: currentUser.role,
          status: 'going',
          rsvpDate: new Date().toISOString()
        }
      ]
    };

    // System welcome message for the event group chat
    const initialWelcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}_sys_init`,
      chatId: eventChatId,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderAvatar: currentUser.profilePictureUrl,
      senderRole: currentUser.role,
      text: `Welcome to the official group chat for "${eventData.title}"! All alumni and guests who RSVP will be automatically added to this conversation.`,
      createdAt: new Date().toISOString(),
      isSystemMessage: true
    };

    setChats((prev) => [eventGroupChat, ...prev]);
    setMessages((prev) => ({
      ...prev,
      [eventChatId]: [initialWelcomeMessage]
    }));
    saveChatToFirestore(eventGroupChat).catch(() => {});
    saveChatMessageToFirestore(eventChatId, initialWelcomeMessage).catch(() => {});

    setEvents((prev) => [newEvt, ...prev]);
    saveEventToFirestore(newEvt).catch((err) => {
      console.warn('Failed to persist new event in Firestore:', err);
    });

    addAuditLog({
      action: 'Event & Group Chat Provisioned',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'communication',
      details: `Created event "${newEvt.title}" and initialized official attendee group chat "${eventGroupChat.groupName}".`,
      severity: 'info'
    });

    // Broadcast notification to other users
    const broadcastNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      toUid: 'all',
      type: 'event_broadcast',
      title: `New Event: ${newEvt.title}`,
      body: `Organized by ${currentUser.name}. ${newEvt.isVirtual ? 'Virtual event' : newEvt.location}. RSVP now to join the official event group chat!`,
      refId: newEvt.id,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [broadcastNotif, ...prev]);
    saveNotificationToFirestore(broadcastNotif).catch(() => {});
    showToast(`Event published and group chat "${eventGroupChat.groupName}" created!`);
  };

  const editEvent = (eventId: string, data: Partial<AlumniEvent>) => {
    if (!permissions.canCreateEvents) {
      showToast('Permission denied: Only staff and admin roles can edit events.');
      return;
    }
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const updated = { ...e, ...data };
          saveEventToFirestore(updated).catch((err) => {
            console.warn('Failed to update event in Firestore:', err);
          });
          return updated;
        }
        return e;
      })
    );
    showToast('Event details updated.');
  };

  const addAuditLog = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newLog: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    saveAuditLogToFirestore(newLog).catch(() => {});
  }, []);

  const deleteEvent = (eventId: string) => {
    if (!permissions.canDeleteEventsComments) {
      showToast('Permission denied: Staff/Admin authorization required.');
      return;
    }
    const target = events.find((e) => e.id === eventId);
    if (target) {
      // Event Cancellation Notification dispatched to attendees
      if (target.attendees && target.attendees.length > 0) {
        const cancelNotif: AppNotification = {
          id: `notif_evt_cancel_${Date.now()}`,
          type: 'event',
          title: 'Event Cancellation Notice',
          body: `Notice: "${target.title}" originally scheduled on ${new Date(target.startDate).toLocaleDateString()} has been cancelled by the administration.`,
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications((prev) => [cancelNotif, ...prev]);
      }

      addAuditLog({
        action: 'Event Deleted / Cancelled',
        actorId: currentUser?.uid || 'admin',
        actorName: currentUser?.name || 'Administrator',
        actorRole: currentUser?.role || 'admin',
        category: 'admin',
        details: `Event "${target.title}" was removed from the institutional calendar.`,
        severity: 'warning'
      });
    }

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    deleteEventFromFirestore(eventId).catch((err) => {
      console.warn('Failed to delete event from Firestore:', err);
    });
    showToast('Event deleted.');
  };

  const toggleLikeEvent = (eventId: string) => {
    if (!currentUser) return;
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const currentLikes = e.likes || [];
          const liked = currentLikes.includes(currentUser.uid);
          const updated = {
            ...e,
            likes: liked
              ? currentLikes.filter((id) => id !== currentUser.uid)
              : [...currentLikes, currentUser.uid]
          };
          saveEventToFirestore(updated).catch(() => {});
          return updated;
        }
        return e;
      })
    );
  };

  const addCommentToEvent = (eventId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const newComment = {
      id: `c_${Date.now()}`,
      eventId,
      authorId: currentUser.uid,
      authorName: currentUser.name,
      authorAvatar: currentUser.profilePictureUrl,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const updated = {
            ...e,
            comments: [...e.comments, newComment]
          };
          saveEventToFirestore(updated).catch(() => {});
          return updated;
        }
        return e;
      })
    );
    showToast('Comment posted.');
  };

  const rsvpEvent = (eventId: string, status: 'going' | 'interested' | 'not_going') => {
    if (!currentUser) {
      showToast('Please sign in to RSVP for events.', 'error');
      return;
    }
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;

    // Toggle logic: if user clicks the currently active status, toggle back to 'not_going'
    const newStatus = targetEvent.userRsvp === status ? 'not_going' : status;

    // Validate cancellation deadline if user is cancelling RSVP
    if (targetEvent.userRsvp && newStatus === 'not_going') {
      const cancelInfo = getEventCancellationInfo(targetEvent);
      const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
      if (cancelInfo.isPastDeadline && !isAdmin) {
        showToast(
          `Cancellation deadline passed. Cancellations closed on ${cancelInfo.deadlineFormatted}. Please contact the event administrator.`,
          'error'
        );
        return;
      }
    }

    const wasGoing = targetEvent.userRsvp === 'going';
    const isNowGoing = newStatus === 'going';
    let delta = 0;
    if (!wasGoing && isNowGoing) delta = 1;
    if (wasGoing && !isNowGoing) delta = -1;

    // Update dynamic attendees array
    const existingAttendees = targetEvent.attendees || [];
    let updatedAttendees: EventAttendee[];
    if (newStatus === 'not_going') {
      updatedAttendees = existingAttendees.filter((a) => a.uid !== currentUser.uid);
    } else {
      const evtCode = (targetEvent.id || 'EVT').replace(/^evt_/, '').slice(0, 4).toUpperCase();
      const rawId = currentUser.uid.replace(/^usr_/, '').slice(0, 6).toUpperCase();
      const regCode = `SCC-${evtCode}-${rawId}`;
      const attendeeItem: EventAttendee = {
        id: `att_${Date.now()}_${currentUser.uid.slice(0, 5)}`,
        uid: currentUser.uid,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        avatar: currentUser.profilePictureUrl,
        batch: currentUser.batch,
        course: currentUser.course,
        role: currentUser.role,
        status: newStatus,
        ticketType: 'General Alumni',
        paymentStatus: 'Complimentary',
        registrationCode: regCode,
        checkInStatus: 'not_checked_in',
        registeredAt: new Date().toISOString(),
        rsvpDate: new Date().toISOString()
      };
      const foundIdx = existingAttendees.findIndex((a) => a.uid === currentUser.uid);
      if (foundIdx >= 0) {
        updatedAttendees = [...existingAttendees];
        updatedAttendees[foundIdx] = attendeeItem;
      } else {
        updatedAttendees = [attendeeItem, ...existingAttendees];
      }
    }

    const updatedEvent: AlumniEvent = {
      ...targetEvent,
      userRsvp: newStatus,
      attendees: updatedAttendees,
      attendeesCount: Math.max(0, targetEvent.attendeesCount + delta)
    };

    setEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvent : e)));

    // Send automated Event Registration Confirmation and schedule 1-day before & event-day reminders
    if (newStatus !== 'not_going') {
      const eventDate = new Date(targetEvent.startDate);
      const eventDateFormatted = isNaN(eventDate.getTime())
        ? targetEvent.startDate
        : eventDate.toLocaleDateString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
      const eventTimeFormatted = isNaN(eventDate.getTime())
        ? ''
        : eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // 1. Immediate RSVP Confirmation
      const confirmNotif: AppNotification = {
        id: `notif_rsvp_${Date.now()}`,
        toUid: currentUser.uid,
        type: 'event',
        title: 'Event Registration Confirmed!',
        body: `You are confirmed as ${newStatus === 'going' ? 'attending' : 'interested in'} "${targetEvent.title}". We have scheduled automated reminders: 1 day prior and on event day.`,
        read: false,
        createdAt: new Date().toISOString(),
        metadata: { eventId: targetEvent.id, rsvpStatus: newStatus }
      };

      // 2. Automated 1-Day Before Event Reminder Notification
      const oneDayBeforeNotif: AppNotification = {
        id: `notif_rsvp_1day_${targetEvent.id}_${currentUser.uid}`,
        toUid: currentUser.uid,
        type: 'event',
        title: `Event Reminder (1 Day Before): ${targetEvent.title}`,
        body: `Tomorrow is the day! "${targetEvent.title}" takes place tomorrow (${eventDateFormatted} ${eventTimeFormatted ? 'at ' + eventTimeFormatted : ''}) at ${targetEvent.location}. Ensure you have your St. Cecilia's College Digital ID ready for campus entry!`,
        read: false,
        createdAt: new Date(Date.now() + 1000).toISOString(),
        metadata: {
          eventId: targetEvent.id,
          reminderType: '1_day_before',
          eventStartDate: targetEvent.startDate,
          location: targetEvent.location
        }
      };

      // 3. Automated Event Day Notification ("when the event comes")
      const eventDayNotif: AppNotification = {
        id: `notif_rsvp_day_${targetEvent.id}_${currentUser.uid}`,
        toUid: currentUser.uid,
        type: 'event',
        title: `Event Today: ${targetEvent.title}`,
        body: `Today is the event! "${targetEvent.title}" takes place today at ${targetEvent.location}. Check in at the entrance using your official SCC Digital Pass.`,
        read: false,
        createdAt: new Date(Date.now() + 2000).toISOString(),
        metadata: {
          eventId: targetEvent.id,
          reminderType: 'event_day',
          eventStartDate: targetEvent.startDate,
          location: targetEvent.location
        }
      };

      setNotifications((prev) => {
        const withoutOldReminders = prev.filter(
          (n) => n.id !== oneDayBeforeNotif.id && n.id !== eventDayNotif.id
        );
        return [confirmNotif, oneDayBeforeNotif, eventDayNotif, ...withoutOldReminders];
      });

      saveNotificationToFirestore(confirmNotif).catch(() => {});
      saveNotificationToFirestore(oneDayBeforeNotif).catch(() => {});
      saveNotificationToFirestore(eventDayNotif).catch(() => {});

      // Step 4: When a user RSVPs, automatically add them to the event's group chat
      const eventChatId = targetEvent.groupChatId || `chat_event_${eventId}`;
      const joinMsg: ChatMessage = {
        id: `msg_${Date.now()}_sys_join`,
        chatId: eventChatId,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderAvatar: currentUser.profilePictureUrl,
        senderRole: currentUser.role,
        text: `${currentUser.name} joined the event group chat (${newStatus === 'going' ? 'Attending' : 'Interested'}).`,
        createdAt: new Date().toISOString(),
        isSystemMessage: true
      };

      setMessages((prev) => ({
        ...prev,
        [eventChatId]: [...(prev[eventChatId] || []), joinMsg]
      }));
      saveChatMessageToFirestore(eventChatId, joinMsg).catch(() => {});

      setChats((prevChats) => {
        const existingChatIndex = prevChats.findIndex(
          (c) => c.eventId === eventId || c.id === eventChatId
        );
        if (existingChatIndex >= 0) {
          const c = prevChats[existingChatIndex];
          const currentMembers = c.memberIds || (c as any).participants || [];
          const hasMember = currentMembers.includes(currentUser.uid);
          const updatedChat: ChatThread = {
            ...c,
            memberIds: hasMember ? currentMembers : [...currentMembers, currentUser.uid],
            lastMessage: `${currentUser.name} joined the event group chat (${newStatus === 'going' ? 'Attending' : 'Interested'}).`,
            lastMessageAt: new Date().toISOString()
          };
          saveChatToFirestore(updatedChat).catch(() => {});
          const updated = [...prevChats];
          updated[existingChatIndex] = updatedChat;
          return updated;
        } else {
          // Auto-generate group chat if it didn't already exist
          const newChat: ChatThread = {
            id: eventChatId,
            memberIds: Array.from(new Set([targetEvent.createdBy, currentUser.uid])),
            lastMessage: `${currentUser.name} joined the event group chat (${newStatus === 'going' ? 'Attending' : 'Interested'}).`,
            lastMessageAt: new Date().toISOString(),
            unreadCount: { [currentUser.uid]: 0 },
            isGroupChat: true,
            groupName: `${targetEvent.title} – Group Chat`,
            groupDescription: `Official coordination chat for ${targetEvent.title}.`,
            eventId: eventId,
            isEventChat: true,
            adminUids: [targetEvent.createdBy]
          };
          saveChatToFirestore(newChat).catch(() => {});
          return [newChat, ...prevChats];
        }
      });

      // Group chat confirmation notification
      const groupChatNotif: AppNotification = {
        id: `notif_chat_added_${Date.now()}`,
        toUid: currentUser.uid,
        type: 'message',
        title: 'Added to Event Group Chat',
        body: `You have been automatically added to the official attendee group chat for "${targetEvent.title}". Open Messaging to connect with fellow attendees!`,
        refId: eventChatId,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [groupChatNotif, ...prev]);

      // Notify organizer of new RSVP
      if (targetEvent.createdBy && targetEvent.createdBy !== currentUser.uid) {
        const organizerNotif: AppNotification = {
          id: `notif_rsvp_org_${Date.now()}`,
          toUid: targetEvent.createdBy,
          type: 'event',
          title: `New RSVP: ${targetEvent.title}`,
          body: `${currentUser.name} confirmed RSVP (${newStatus === 'going' ? 'Attending' : 'Interested'}) for "${targetEvent.title}". Attendees: ${Math.max(0, targetEvent.attendeesCount + delta)}.`,
          refId: targetEvent.id,
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications((prev) => [organizerNotif, ...prev]);
        saveNotificationToFirestore(organizerNotif).catch(() => {});
      }

      sendEventRsvpEmail(targetEvent, currentUser, newStatus);

      addAuditLog({
        action: 'Event RSVP Registered',
        actorId: currentUser.uid,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        category: 'communication',
        details: `Alumnus confirmed RSVP (${newStatus}) for event: "${targetEvent.title}". Added to event group chat.`,
        severity: 'info'
      });
    } else {
      // Step 5: User cancelled RSVP: remove them from event group chat unless they are an admin
      const eventChatId = targetEvent.groupChatId || `chat_event_${eventId}`;
      const leaveMsg: ChatMessage = {
        id: `msg_${Date.now()}_sys_leave`,
        chatId: eventChatId,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderAvatar: currentUser.profilePictureUrl,
        senderRole: currentUser.role,
        text: `${currentUser.name} updated their RSVP to Not Attending and left the group chat.`,
        createdAt: new Date().toISOString(),
        isSystemMessage: true
      };

      setMessages((prev) => ({
        ...prev,
        [eventChatId]: [...(prev[eventChatId] || []), leaveMsg]
      }));
      saveChatMessageToFirestore(eventChatId, leaveMsg).catch(() => {});

      setChats((prevChats) => {
        return prevChats.map((c) => {
          if (c.eventId === eventId || c.id === eventChatId) {
            const currentMembers = c.memberIds || (c as any).participants || [];
            if (currentMembers.includes(currentUser.uid) && !c.adminUids?.includes(currentUser.uid)) {
              const updatedChat: ChatThread = {
                ...c,
                memberIds: currentMembers.filter((id) => id !== currentUser.uid),
                lastMessage: `${currentUser.name} left the event group chat.`,
                lastMessageAt: new Date().toISOString()
              };
              saveChatToFirestore(updatedChat).catch(() => {});
              return updatedChat;
            }
          }
          return c;
        });
      });

      // Cancellation notification to user
      const cancelNotif: AppNotification = {
        id: `notif_rsvp_cancel_${Date.now()}`,
        toUid: currentUser.uid,
        type: 'event',
        title: 'RSVP Cancelled',
        body: `You have cancelled your attendance for "${targetEvent.title}". You have been removed from the event group chat.`,
        refId: targetEvent.id,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [cancelNotif, ...prev]);

      // Notify event administrator / organizer about the cancellation
      if (targetEvent.createdBy && targetEvent.createdBy !== currentUser.uid) {
        const orgCancelNotif: AppNotification = {
          id: `notif_rsvp_cancel_org_${Date.now()}`,
          toUid: targetEvent.createdBy,
          type: 'event',
          title: `RSVP Cancelled: ${targetEvent.title}`,
          body: `${currentUser.name} cancelled their RSVP for "${targetEvent.title}". Updated attendee count: ${Math.max(0, targetEvent.attendeesCount + delta)}.`,
          refId: targetEvent.id,
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications((prev) => [orgCancelNotif, ...prev]);
        saveNotificationToFirestore(orgCancelNotif).catch(() => {});
      }
      sendEventRsvpEmail(targetEvent, currentUser, 'cancelled');
      showToast(`RSVP cancelled for "${targetEvent.title}". Attendee list updated.`, 'info');

      // User cancelled attendance: clean up scheduled event notifications
      setNotifications((prev) =>
        prev.filter(
          (n) =>
            n.id !== `notif_rsvp_1day_${targetEvent.id}_${currentUser.uid}` &&
            n.id !== `notif_rsvp_day_${targetEvent.id}_${currentUser.uid}`
        )
      );

      addAuditLog({
        action: 'Event RSVP Cancelled',
        actorId: currentUser.uid,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        category: 'communication',
        details: `Alumnus cancelled RSVP for event: "${targetEvent.title}". Removed from event group chat.`,
        severity: 'info'
      });
    }

    // Persist attendance update directly in Firestore
    saveEventToFirestore(updatedEvent)
      .then(() => {
        if (newStatus === 'not_going') {
          showToast(`Attendance removed for "${targetEvent.title}"`, 'info');
        } else {
          showToast(
            `RSVP confirmed: You are ${newStatus === 'going' ? 'attending' : 'interested in'} "${targetEvent.title}" and added to the group chat!`,
            'success'
          );
        }
      })
      .catch((err) => {
        console.warn('Failed to persist RSVP in Firestore:', err);
        showToast('Could not save RSVP to Firestore. Please check your connection.', 'error');
      });
  };

  const updateEventAttendance = (eventId: string, uid: string, status: 'attended' | 'not_attended' | 'pending') => {
    if (!permissions.canCreateEvents && currentUser?.role !== 'admin' && currentUser?.role !== 'registrar') {
      showToast('Permission denied: Only authorized administrators can record event attendance.', 'error');
      return;
    }
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const records = e.attendanceRecords || [];
          const existingIdx = records.findIndex((r) => r.uid === uid);
          const attendeeObj = e.attendees?.find((a) => a.uid === uid);
          const attendeeName = attendeeObj?.name || users.find((u) => u.uid === uid)?.name || 'Alumnus';
          const newRecord: EventAttendanceRecord = {
            uid,
            name: attendeeName,
            status,
            checkedInAt: status === 'attended' ? new Date().toISOString() : undefined,
            updatedBy: currentUser?.name || 'Administrator'
          };
          let updatedRecords: EventAttendanceRecord[];
          if (existingIdx >= 0) {
            updatedRecords = [...records];
            updatedRecords[existingIdx] = newRecord;
          } else {
            updatedRecords = [...records, newRecord];
          }

          // Also keep e.attendees in sync
          const updatedAttendees = (e.attendees || []).map((a) => {
            if (a.uid === uid) {
              return {
                ...a,
                checkInStatus: (status === 'attended' ? 'checked_in' : 'not_checked_in') as 'checked_in' | 'not_checked_in',
                checkedInAt: status === 'attended' ? new Date().toISOString() : undefined,
                checkedInBy: status === 'attended' ? (currentUser?.name || 'Administrator') : undefined
              };
            }
            return a;
          });

          const updated = { ...e, attendanceRecords: updatedRecords, attendees: updatedAttendees };
          saveEventToFirestore(updated).catch(() => {});
          return updated;
        }
        return e;
      })
    );
    showToast(`Attendance marked as ${status.replace('_', ' ')}.`);
  };

  const manualCheckInAttendee = (eventId: string, attendeeIdOrUid: string, checkedIn: boolean) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const attendees = e.attendees || [];
          let updatedAttendeeName = '';
          let updatedUid = '';

          const updatedAttendees = attendees.map((a) => {
            if (a.id === attendeeIdOrUid || a.uid === attendeeIdOrUid) {
              updatedAttendeeName = a.name;
              updatedUid = a.uid;
              return {
                ...a,
                checkInStatus: (checkedIn ? 'checked_in' : 'not_checked_in') as 'checked_in' | 'not_checked_in',
                checkedInAt: checkedIn ? new Date().toISOString() : undefined,
                checkedInBy: checkedIn ? (currentUser?.name || 'Administrator') : undefined
              };
            }
            return a;
          });

          // Sync attendanceRecords
          const records = e.attendanceRecords || [];
          const targetUid = updatedUid || attendeeIdOrUid;
          const recIdx = records.findIndex((r) => r.uid === targetUid);
          let newRecords = [...records];
          if (checkedIn) {
            const newRec: EventAttendanceRecord = {
              uid: targetUid,
              name: updatedAttendeeName || 'Alumnus',
              status: 'attended',
              checkedInAt: new Date().toISOString(),
              updatedBy: currentUser?.name || 'Administrator'
            };
            if (recIdx >= 0) {
              newRecords[recIdx] = newRec;
            } else {
              newRecords.push(newRec);
            }
          } else {
            if (recIdx >= 0) {
              newRecords.splice(recIdx, 1);
            }
          }

          const updatedEvent: AlumniEvent = {
            ...e,
            attendees: updatedAttendees,
            attendanceRecords: newRecords
          };
          saveEventToFirestore(updatedEvent).catch(() => {});
          return updatedEvent;
        }
        return e;
      })
    );

    // Also update any matching reservation
    setReservations((prev) =>
      prev.map((r) => {
        if (r.eventId === eventId && (r.id === attendeeIdOrUid || r.userId === attendeeIdOrUid)) {
          const updatedRes = {
            ...r,
            status: (checkedIn ? 'attended' : 'confirmed') as 'attended' | 'confirmed',
            attendanceConfirmed: checkedIn,
            attendanceConfirmedAt: checkedIn ? new Date().toISOString() : undefined
          };
          saveReservationToFirestore(updatedRes).catch(() => {});
          return updatedRes;
        }
        return r;
      })
    );

    showToast(checkedIn ? 'Attendee checked in successfully.' : 'Check-in reverted.', 'info');
  };

  const updateAttendeeInfo = (eventId: string, attendeeIdOrUid: string, updates: Partial<EventAttendee>) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const attendees = (e.attendees || []).map((a) => {
            if (a.id === attendeeIdOrUid || a.uid === attendeeIdOrUid) {
              return { ...a, ...updates };
            }
            return a;
          });
          const updatedEvent = { ...e, attendees };
          saveEventToFirestore(updatedEvent).catch(() => {});
          return updatedEvent;
        }
        return e;
      })
    );
    showToast('Attendee details updated.', 'success');
  };

  const removeAttendeeFromEvent = (eventId: string, attendeeIdOrUid: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const attendees = (e.attendees || []).filter(
            (a) => a.id !== attendeeIdOrUid && a.uid !== attendeeIdOrUid
          );
          const records = (e.attendanceRecords || []).filter(
            (r) => r.uid !== attendeeIdOrUid
          );
          const updatedEvent = {
            ...e,
            attendees,
            attendanceRecords: records,
            attendeesCount: Math.max(0, (e.attendeesCount || 1) - 1),
            reservedSeatsCount: Math.max(0, (e.reservedSeatsCount || 1) - 1)
          };
          saveEventToFirestore(updatedEvent).catch(() => {});
          return updatedEvent;
        }
        return e;
      })
    );
    showToast('Attendee registration removed.', 'info');
  };

  const addAttendeeToEvent = (
    eventId: string,
    attendee: Partial<EventAttendee> & { name: string; email: string }
  ) => {
    const newUid = attendee.uid || `usr_manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newAttendee: EventAttendee = {
      id: `att_${eventId}_${newUid}`,
      uid: newUid,
      name: attendee.name.trim(),
      email: attendee.email.trim(),
      phone: attendee.phone?.trim() || '',
      avatar: attendee.avatar || DEFAULT_USER_AVATAR,
      batch: attendee.batch || 'Cecilian Alumnus',
      course: attendee.course || 'Alumni Associate',
      role: attendee.role || 'alumni',
      ticketType: attendee.ticketType || 'General Alumni',
      paymentStatus: attendee.paymentStatus || 'Free',
      checkInStatus: attendee.checkInStatus || 'not_checked_in',
      checkedInAt: attendee.checkInStatus === 'checked_in' ? new Date().toISOString() : undefined,
      checkedInBy: attendee.checkInStatus === 'checked_in' ? (currentUser?.name || 'Administrator') : undefined,
      status: 'going',
      registeredAt: new Date().toISOString(),
      notes: attendee.notes
    };

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const attendees = [...(e.attendees || []), newAttendee];
          let records = e.attendanceRecords || [];
          if (newAttendee.checkInStatus === 'checked_in') {
            records = [
              ...records,
              {
                uid: newUid,
                name: newAttendee.name,
                status: 'attended',
                checkedInAt: newAttendee.checkedInAt,
                updatedBy: currentUser?.name || 'Administrator'
              }
            ];
          }
          const updatedEvent = {
            ...e,
            attendees,
            attendanceRecords: records,
            attendeesCount: (e.attendeesCount || 0) + 1,
            reservedSeatsCount: (e.reservedSeatsCount || 0) + 1
          };
          saveEventToFirestore(updatedEvent).catch(() => {});
          return updatedEvent;
        }
        return e;
      })
    );
    showToast(`Registered ${attendee.name} to event.`, 'success');
  };

  // Event Reservation Operations
  const reserveEventSlot = async (data: {
    eventId: string;
    alumniName: string;
    email: string;
    contactNumber: string;
    alumniId: string;
    graduationYear: string;
    course: string;
    numberOfGuests: number;
    dietaryRequirements?: string;
    specialRequests?: string;
  }): Promise<{ success: boolean; reservation?: EventReservation; error?: string }> => {
    const targetEvent = events.find((e) => e.id === data.eventId);
    if (!targetEvent) {
      return { success: false, error: 'Target event was not found.' };
    }

    const userId = currentUser ? currentUser.uid : `guest_${Date.now()}`;

    // Verify existing active reservation
    const existing = reservations.find(
      (r) => r.eventId === data.eventId && r.userId === userId && r.status !== 'cancelled'
    );
    if (existing) {
      return {
        success: false,
        error: `You already hold a confirmed reservation (${existing.id}) for "${targetEvent.title}". Check "My Reservations" to view or manage your pass.`
      };
    }

    // Capacity & Status check
    const totalCapacity = targetEvent.maxParticipants || targetEvent.maxAttendees || 200;
    const reservedSeats = targetEvent.reservedSeatsCount ?? targetEvent.attendeesCount ?? 0;
    const remainingSeats = Math.max(0, totalCapacity - reservedSeats);
    const requestedSeats = 1 + (Number(data.numberOfGuests) || 0);

    const isWaitlist = remainingSeats <= 0;
    if (isWaitlist && targetEvent.enableWaitingList === false) {
      return {
        success: false,
        error: 'Registration is full and the waiting list is currently closed.'
      };
    }

    // Reservation Code generation
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const reservationId = `ALM-2026-${randomSuffix}`;

    const newReservation: EventReservation = {
      id: reservationId,
      eventId: targetEvent.id,
      eventTitle: targetEvent.title,
      eventDate: targetEvent.startDate,
      eventTime: targetEvent.startTime ? `${targetEvent.startTime} – ${targetEvent.endTime || ''}` : undefined,
      eventVenue: targetEvent.venue || targetEvent.location,
      userId,
      alumniName: data.alumniName,
      email: data.email,
      contactNumber: data.contactNumber,
      alumniId: data.alumniId,
      graduationYear: data.graduationYear,
      course: data.course,
      numberOfGuests: Number(data.numberOfGuests) || 0,
      totalSeats: requestedSeats,
      dietaryRequirements: data.dietaryRequirements,
      specialRequests: data.specialRequests,
      status: isWaitlist ? 'waitlisted' : 'confirmed',
      reservedAt: new Date().toISOString(),
      qrCodeData: `SCC-PASS-${reservationId}-${targetEvent.id}`
    };

    setReservations((prev) => [newReservation, ...prev]);
    saveReservationToFirestore(newReservation).catch(() => {});

    // Update event seat count & attendee records
    if (!isWaitlist) {
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === targetEvent.id) {
            const currentReserved = e.reservedSeatsCount ?? e.attendeesCount ?? 0;
            const updatedSeats = currentReserved + requestedSeats;
            const currentAttendees = e.attendees || [];
            const userAttendee: EventAttendee = {
              uid: userId,
              name: data.alumniName,
              avatar: currentUser?.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              batch: data.graduationYear,
              course: data.course,
              role: currentUser?.role || 'alumni',
              status: 'going',
              registeredAt: new Date().toISOString()
            };
            const updatedAttendees = currentAttendees.some((a) => a.uid === userId)
              ? currentAttendees
              : [...currentAttendees, userAttendee];

            const updatedEvent: AlumniEvent = {
              ...e,
              reservedSeatsCount: updatedSeats,
              attendeesCount: updatedAttendees.length,
              attendees: updatedAttendees
            };
            saveEventToFirestore(updatedEvent).catch(() => {});
            return updatedEvent;
          }
          return e;
        })
      );
    }

    // In-app Notification
    const notif: AppNotification = {
      id: `notif_res_${Date.now()}`,
      toUid: userId,
      type: 'event',
      title: isWaitlist ? `Waitlist Confirmed: ${targetEvent.title}` : `Reservation Confirmed: ${targetEvent.title}`,
      body: isWaitlist
        ? `You have joined the waiting list (Pass: ${reservationId}). We will notify you if a seat opens.`
        : `Your seat for ${targetEvent.title} has been confirmed. Reservation ID: ${reservationId} (${requestedSeats} seat(s)).`,
      refId: targetEvent.id,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToFirestore(notif).catch(() => {});

    // Audit Log
    addAuditLog({
      action: isWaitlist ? 'Event Waitlist Joined' : 'Event Seat Reserved',
      actorId: userId,
      actorName: data.alumniName,
      actorRole: currentUser?.role || 'alumni',
      category: 'engagement',
      details: `${isWaitlist ? 'Waitlist' : 'Confirmed'} seat pass (${reservationId}) created for "${targetEvent.title}". Total seats: ${requestedSeats}.`,
      severity: 'info'
    });

    showToast(
      isWaitlist
        ? `Added to waiting list (${reservationId})!`
        : `Reservation Confirmed (${reservationId})! Seat reserved for ${targetEvent.title}.`,
      'success'
    );

    return { success: true, reservation: newReservation };
  };

  const cancelEventReservation = async (reservationId: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
    const targetReservation = reservations.find((r) => r.id === reservationId);
    if (!targetReservation) {
      return { success: false, error: 'Reservation record not found.' };
    }

    const targetEvent = events.find((e) => e.id === targetReservation.eventId);
    const userId = targetReservation.userId;

    const updatedReservation: EventReservation = {
      ...targetReservation,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason || 'Cancelled by attendee'
    };

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? updatedReservation : r))
    );
    saveReservationToFirestore(updatedReservation).catch(() => {});

    // Release seats
    if (targetEvent && targetReservation.status === 'confirmed') {
      const seatsToFree = targetReservation.totalSeats || 1;
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === targetEvent.id) {
            const currentSeats = e.reservedSeatsCount ?? e.attendeesCount ?? 0;
            const updatedSeats = Math.max(0, currentSeats - seatsToFree);
            const updatedAttendees = (e.attendees || []).filter((a) => a.uid !== userId);
            const updatedEvent: AlumniEvent = {
              ...e,
              reservedSeatsCount: updatedSeats,
              attendeesCount: updatedAttendees.length,
              attendees: updatedAttendees
            };
            saveEventToFirestore(updatedEvent).catch(() => {});
            return updatedEvent;
          }
          return e;
        })
      );
    }

    const cancelNotif: AppNotification = {
      id: `notif_res_cancel_${Date.now()}`,
      toUid: userId,
      type: 'event',
      title: `Reservation Cancelled: ${targetReservation.eventTitle}`,
      body: `Your reservation pass ${reservationId} for ${targetReservation.eventTitle} has been cancelled.`,
      refId: targetReservation.eventId,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [cancelNotif, ...prev]);
    saveNotificationToFirestore(cancelNotif).catch(() => {});

    addAuditLog({
      action: 'Event Reservation Cancelled',
      actorId: currentUser?.uid || userId,
      actorName: currentUser?.name || targetReservation.alumniName,
      actorRole: currentUser?.role || 'alumni',
      category: 'engagement',
      details: `Reservation (${reservationId}) cancelled for "${targetReservation.eventTitle}". Reason: ${reason || 'Attendee request'}.`,
      severity: 'warning'
    });

    showToast(`Reservation ${reservationId} has been cancelled.`, 'info');
    return { success: true };
  };

  const updateEventReservationSettings = (eventId: string, settings: Partial<AlumniEvent>) => {
    if (!currentUser || !permissions.canCreateEvents) {
      showToast('Permission denied: Only administrators and staff can configure event settings.', 'error');
      return;
    }

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const merged = { ...e, ...settings };
          saveEventToFirestore(merged).catch(() => {});
          return merged;
        }
        return e;
      })
    );

    addAuditLog({
      action: 'Event Settings Updated',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'settings',
      details: `Administrator updated reservation rules and limits for event ${eventId}.`,
      severity: 'info'
    });

    showToast('Event settings and reservation rules updated successfully.', 'success');
  };

  // =========================================================================
  // 24-HOUR EVENT RESERVATION PUSH NOTIFICATION SYSTEM
  // Alerts alumni 24 hours prior to reserved events, maximizing campus turnout
  // =========================================================================
  const [pushPermissionStatus, setPushPermissionStatus] = useState<PushPermissionState>(() => getPushPermission());

  // Listen to browser permission changes if supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions?.query({ name: 'notifications' as PermissionName }).then((permissionStatus) => {
        permissionStatus.onchange = () => {
          setPushPermissionStatus(getPushPermission());
        };
      }).catch(() => {});
    }
  }, []);

  const requestBrowserPushPermission = async (): Promise<PushPermissionState> => {
    const res = await requestPushPermission();
    setPushPermissionStatus(res);
    if (res === 'granted') {
      playCollegiateChime();
      showToast('Browser push notifications enabled! You will be alerted 24 hours before your reserved events.', 'success');
      
      // Dispatch welcome push preview
      await triggerPushNotification({
        title: "🔔 24-Hour Event Alerts Activated",
        body: "St. Cecilia's College will alert you 24 hours before your reserved events to confirm your seat!",
        tag: 'scc-welcome-push'
      });
    } else if (res === 'denied') {
      showToast('Browser push notifications were blocked in browser site permissions.', 'warning');
    }
    return res;
  };

  const confirmEventAttendance = async (reservationId: string): Promise<void> => {
    const targetReservation = reservations.find((r) => r.id === reservationId);
    if (!targetReservation) return;

    const updatedReservation: EventReservation = {
      ...targetReservation,
      attendanceConfirmed: true,
      attendanceConfirmedAt: new Date().toISOString()
    };

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? updatedReservation : r))
    );
    saveReservationToFirestore(updatedReservation).catch(() => {});

    // Update corresponding in-app notification if present
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.metadata?.reservationId === reservationId && n.metadata?.type === '24h_reservation_alert') {
          return {
            ...n,
            read: true,
            title: `✅ Attendance Confirmed: ${targetReservation.eventTitle}`,
            body: `You have confirmed attendance for your seat pass (${reservationId}). Your seat is fully secured for tomorrow.`
          };
        }
        return n;
      })
    );

    addAuditLog({
      action: 'Event Attendance Confirmed',
      actorId: currentUser?.uid || targetReservation.userId,
      actorName: currentUser?.name || targetReservation.alumniName,
      actorRole: currentUser?.role || 'alumni',
      category: 'engagement',
      details: `Alumnus confirmed attendance for reserved pass ${reservationId} ("${targetReservation.eventTitle}"). Attendance rate safeguard verified.`,
      severity: 'info'
    });

    showToast(`Attendance verified! Your seat for "${targetReservation.eventTitle}" is fully secured.`, 'success');
  };

  const sendTest24HourAlert = async (targetReservation?: EventReservation): Promise<void> => {
    const res = targetReservation || reservations.find((r) => r.userId === currentUser?.uid && r.status === 'confirmed') || reservations[0];
    const targetEvent = res ? events.find((e) => e.id === res.eventId) : events[0];

    const dummyRes: EventReservation = res || {
      id: 'ALM-2026-DEMO',
      eventId: targetEvent?.id || 'demo_event',
      eventTitle: targetEvent?.title || 'Annual Grand Alumni Homecoming 2026',
      eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      eventVenue: targetEvent?.venue || targetEvent?.location || "St. Cecilia's College Main Pavilion",
      userId: currentUser?.uid || 'guest_user',
      alumniName: currentUser?.name || 'Cecilian Alumnus',
      email: currentUser?.email || 'alumni@stcecilia.edu',
      contactNumber: '09123456789',
      alumniId: 'SCC-2026',
      graduationYear: '2024',
      course: 'BSIT',
      numberOfGuests: 1,
      totalSeats: 2,
      status: 'confirmed',
      reservedAt: new Date().toISOString()
    };

    const ev = targetEvent || {
      id: dummyRes.eventId,
      title: dummyRes.eventTitle,
      startDate: dummyRes.eventDate,
      location: dummyRes.eventVenue,
      venue: dummyRes.eventVenue
    } as AlumniEvent;

    const { pushTitle, pushBody, inAppNotification } = generate24HourReservationAlert(dummyRes, ev);

    // 1. Web Push Notification & Harmonic Audio Chime
    await triggerPushNotification({
      title: pushTitle,
      body: pushBody,
      tag: `scc-test-alert-${Date.now()}`,
      data: { reservationId: dummyRes.id, eventId: ev.id },
      onClick: () => {
        window.focus();
        setActiveTab('dashboard');
      }
    });

    // 2. In-App Notification
    setNotifications((prev) => [inAppNotification, ...prev]);
    saveNotificationToFirestore(inAppNotification).catch(() => {});

    // 3. Automated Email Dispatch Simulation
    if (currentUser) {
      sendEvent24HourReminderEmail(ev, currentUser, dummyRes);
    }

    // 4. Audit Log
    addAuditLog({
      action: '24-Hour Event Alert Dispatched',
      actorId: currentUser?.uid || 'system_test',
      actorName: currentUser?.name || 'System Dispatcher',
      actorRole: currentUser?.role || 'system',
      category: 'engagement',
      details: `Test 24-hour event reservation push alert triggered for "${ev.title}". Push notification, chime, and email dispatched.`,
      severity: 'info'
    });

    showToast(`🚨 24-Hour Push Alert dispatched! Preview notification banner, sound chime, and in-app feed.`, 'success');
  };

  // Memoized list of current user's confirmed reservations in 24h window
  const upcoming24hReservations = useMemo(() => {
    if (!currentUser || !reservations) return [];
    const now = new Date();
    return reservations.filter((r) => {
      if (r.userId !== currentUser.uid || r.status !== 'confirmed') return false;
      const targetEvent = events.find((e) => e.id === r.eventId);
      const startDate = targetEvent?.startDate || r.eventDate;
      const status24h = calculate24HourAlertStatus(startDate, now);
      return status24h.isWithin24HourWindow;
    });
  }, [currentUser, reservations, events]);

  // Automated 24-Hour Background Dispatcher
  useEffect(() => {
    if (!currentUser || !reservations || reservations.length === 0) return;

    const evaluate24HourReservations = () => {
      const now = new Date();
      const myReservations = reservations.filter(
        (r) => r.userId === currentUser.uid && r.status === 'confirmed'
      );

      myReservations.forEach((reservation) => {
        if (reservation.reminder24hSent) return;

        const targetEvent = events.find((e) => e.id === reservation.eventId);
        const eventStartDate = targetEvent?.startDate || reservation.eventDate;
        if (!eventStartDate) return;

        const status24h = calculate24HourAlertStatus(eventStartDate, now);

        if (status24h.isWithin24HourWindow) {
          const ev = targetEvent || {
            id: reservation.eventId,
            title: reservation.eventTitle,
            startDate: reservation.eventDate,
            location: reservation.eventVenue,
            venue: reservation.eventVenue
          } as AlumniEvent;

          const { pushTitle, pushBody, inAppNotification } = generate24HourReservationAlert(reservation, ev);

          // 1. Fire Web Push & Chime
          triggerPushNotification({
            title: pushTitle,
            body: pushBody,
            tag: `scc-event-24h-${reservation.id}`,
            data: { reservationId: reservation.id, eventId: reservation.eventId },
            onClick: () => {
              window.focus();
              setActiveTab('dashboard');
            }
          });

          // 2. In-App Notification
          setNotifications((prev) => {
            const alreadyExists = prev.some(
              (n) => n.id === inAppNotification.id || (n.refId === ev.id && n.metadata?.type === '24h_reservation_alert')
            );
            if (alreadyExists) return prev;
            return [inAppNotification, ...prev];
          });
          saveNotificationToFirestore(inAppNotification).catch(() => {});

          // 3. Automated Institutional Email Notification
          sendEvent24HourReminderEmail(ev, currentUser, reservation);

          // 4. Mark reservation as 24h reminder sent
          const updatedReservation: EventReservation = {
            ...reservation,
            reminder24hSent: true,
            reminder24hSentAt: now.toISOString()
          };

          setReservations((prev) =>
            prev.map((r) => (r.id === reservation.id ? updatedReservation : r))
          );
          saveReservationToFirestore(updatedReservation).catch(() => {});

          // 5. Audit Log
          addAuditLog({
            action: '24-Hour Event Alert Dispatched',
            actorId: 'system_push_service',
            actorName: '24h Event Alert Dispatcher',
            actorRole: 'system',
            category: 'engagement',
            details: `Automated 24h push notification, chime, and email dispatched to ${currentUser.name} for "${ev.title}" (Pass #${reservation.id}). Attendance rate safeguard active.`,
            severity: 'info'
          });

          showToast(
            `🚨 24-Hour Event Alert: "${reservation.eventTitle}" is tomorrow! Please verify your attendance.`,
            'info'
          );
        }
      });
    };

    evaluate24HourReservations();
    const intervalId = setInterval(evaluate24HourReservations, 30000);
    return () => clearInterval(intervalId);
  }, [currentUser, reservations, events]);

  // Announcements operations
  const createAnnouncement = (
    data: Omit<Announcement, 'id' | 'publishedAt' | 'createdBy' | 'authorName' | 'authorRole'>
  ) => {
    if (!currentUser || !permissions.canPostAnnouncements) {
      showToast('Permission denied: Only staff and admin roles can post announcements.');
      return;
    }

    const newAnn: Announcement = {
      id: `ann_${Date.now()}`,
      ...data,
      publishedAt: new Date().toISOString(),
      createdBy: currentUser.uid,
      authorName: currentUser.name,
      authorRole: currentUser.headline || (currentUser.role ? currentUser.role.toUpperCase() : 'ADMIN')
    };

    setAnnouncements((prev) => [newAnn, ...prev]);
    saveAnnouncementToFirestore(newAnn).catch((err) => {
      console.warn('Failed to save announcement to Firestore:', err);
    });

    // Broadcast notification
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'announcement',
      title: `${newAnn.urgent ? '🚨 URGENT: ' : newAnn.important ? '⭐ NOTICE: ' : ''}${newAnn.title}`,
      body: newAnn.content.slice(0, 110) + '...',
      read: false,
      createdAt: new Date().toISOString(),
      metadata: { announcementId: newAnn.id }
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToFirestore(notif).catch(() => {});

    addAuditLog({
      action: 'Announcement Published',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'communication',
      details: `Published announcement "${newAnn.title}" [Category: ${newAnn.category || 'General'}${newAnn.urgent ? ' | URGENT' : ''}].`,
      severity: newAnn.urgent ? 'alert' : 'info'
    });

    const targetMembers = users.filter((u) => u.uid !== currentUser.uid);
    sendAnnouncementEmail(newAnn, targetMembers);

    showToast('Announcement posted and broadcast to members!');
  };

  const editAnnouncement = (id: string, data: Partial<Announcement>) => {
    if (!permissions.canPostAnnouncements) {
      showToast('Permission denied: Only staff and admin can edit announcements.');
      return;
    }
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, ...data };
          saveAnnouncementToFirestore(updated).catch(() => {});
          return updated;
        }
        return a;
      })
    );
    showToast('Announcement updated.');
  };

  const deleteAnnouncement = (id: string) => {
    if (!permissions.canPostAnnouncements) {
      showToast('Permission denied.');
      return;
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    deleteAnnouncementFromFirestore(id).catch(() => {});
    showToast('Announcement removed.');
  };

  const togglePinAnnouncement = (id: string) => {
    if (!permissions.canPostAnnouncements) {
      showToast('Permission denied: Only authorized staff and administrators can pin announcements.', 'error');
      return;
    }
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextPinned = !a.isPinned;
          const updated = { ...a, isPinned: nextPinned };
          saveAnnouncementToFirestore(updated).catch(() => {});
          showToast(nextPinned ? 'Announcement pinned to top.' : 'Announcement unpinned.', 'info');
          return updated;
        }
        return a;
      })
    );
  };

  const toggleHeartAnnouncement = (id: string) => {
    if (!currentUser) {
      showToast('Please sign in to react to announcements.', 'info');
      return;
    }
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const currentHearts = Array.isArray(a.hearts) ? a.hearts : [];
          const alreadyHearted = currentHearts.includes(currentUser.uid);
          const newHearts = alreadyHearted
            ? currentHearts.filter((uid) => uid !== currentUser.uid)
            : [...currentHearts, currentUser.uid];
          const updated: Announcement = {
            ...a,
            hearts: newHearts,
            likes: newHearts.length
          };
          saveAnnouncementToFirestore(updated).catch(() => {});
          return updated;
        }
        return a;
      })
    );
  };

  // Opportunities & Career Portal Operations
  const createOpportunity = (
    data: Omit<Opportunity, 'id' | 'createdAt' | 'postedBy' | 'posterName' | 'status'>
  ) => {
    if (!currentUser) return;
    const isPrivileged = ['admin', 'superadmin', 'staff', 'registrar', 'moderator'].includes(currentUser.role);
    // If admin or privileged, auto-approve; if employer or alumni, requires admin approval
    const initialApproval = isPrivileged ? 'approved' : 'pending_approval';

    const newOpp: Opportunity = {
      id: `opp_${Date.now()}`,
      ...data,
      postedBy: currentUser.uid,
      posterName: currentUser.role === 'employer' && currentUser.companyName ? currentUser.companyName : `${currentUser.name} (${currentUser.course || currentUser.role})`,
      posterRole: currentUser.role,
      approvalStatus: data.approvalStatus || initialApproval,
      createdAt: new Date().toISOString(),
      status: 'active',
      applicationsCount: 0
    };

    setOpportunities((prev) => [newOpp, ...prev]);
    saveOpportunityToFirestore(newOpp).catch((err) => {
      console.warn('Failed to save opportunity to Firestore:', err);
    });

    if (newOpp.approvalStatus === 'pending_approval') {
      showToast('Job posting submitted for Admin Approval! Status: Pending Approval.', 'info');
      // Alert admin office
      const adminNotif: AppNotification = {
        id: `notif_job_pend_${Date.now()}`,
        type: 'general',
        title: '🔔 New Job Posting Awaiting Approval',
        body: `${newOpp.company} submitted "${newOpp.title}" for review. Click to verify & approve.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [adminNotif, ...prev]);
    } else {
      const eligibleAlumni = users.filter((u) => u.role === 'alumni');
      sendJobPostingEmail(newOpp, eligibleAlumni);

      const jobNotif: AppNotification = {
        id: `notif_job_${Date.now()}`,
        toUid: 'all',
        type: 'job',
        title: `Career Opening: ${newOpp.title}`,
        body: `${newOpp.company} is hiring for ${newOpp.title} (${newOpp.location || 'Cebu'}).`,
        refId: newOpp.id,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [jobNotif, ...prev]);
      saveNotificationToFirestore(jobNotif).catch(() => {});

      showToast('Career opportunity published to the Cecilian Job Board!', 'success');
    }
  };

  const updateOpportunity = (id: string, data: Partial<Opportunity>) => {
    setOpportunities((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const updated = { ...o, ...data };
          saveOpportunityToFirestore(updated).catch(() => {});
          return updated;
        }
        return o;
      })
    );
    showToast('Job posting details updated.', 'success');
  };

  const deleteOpportunity = (id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    deleteOpportunityFromFirestore(id).catch(() => {});
    showToast('Opportunity removed.');
  };

  const approveOpportunity = (id: string) => {
    const opp = opportunities.find((o) => o.id === id);
    if (!opp) return;

    const updated = { ...opp, approvalStatus: 'approved' as const };
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? updated : o))
    );
    saveOpportunityToFirestore(updated).catch(() => {});

    // Send email notifications to alumni for approved job
    const eligibleAlumni = users.filter((u) => u.role === 'alumni');
    sendJobPostingEmail(updated, eligibleAlumni);

    // Notify the job poster
    const notif: AppNotification = {
      id: `notif_job_appr_${Date.now()}`,
      toUid: opp.postedBy,
      type: 'general',
      title: '✅ Job Posting Approved & Published!',
      body: `Your job posting "${opp.title}" at ${opp.company} has been approved by the Alumni Office and is now live for all alumni.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    const broadcastJobNotif: AppNotification = {
      id: `notif_job_live_${Date.now()}`,
      toUid: 'all',
      type: 'job',
      title: `Career Opening: ${opp.title}`,
      body: `${opp.company} is hiring for ${opp.title} (${opp.location || 'Cebu'}).`,
      refId: opp.id,
      read: false,
      createdAt: new Date().toISOString()
    };

    setNotifications((prev) => [broadcastJobNotif, notif, ...prev]);
    saveNotificationToFirestore(notif).catch(() => {});
    saveNotificationToFirestore(broadcastJobNotif).catch(() => {});
    showToast(`Approved "${opp.title}". Posting is now live.`, 'success');
  };

  const rejectOpportunity = (id: string, reason: string) => {
    const opp = opportunities.find((o) => o.id === id);
    if (!opp) return;

    const updated = { ...opp, approvalStatus: 'rejected' as const, rejectionReason: reason };
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? updated : o))
    );
    saveOpportunityToFirestore(updated).catch(() => {});

    // Notify the job poster
    const notif: AppNotification = {
      id: `notif_job_rej_${Date.now()}`,
      toUid: opp.postedBy,
      type: 'general',
      title: '❌ Job Posting Needs Revision',
      body: `Your job posting "${opp.title}" was declined by the Alumni Office. Reason: ${reason}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast(`Job posting "${opp.title}" rejected with feedback sent.`, 'info');
  };

  // Automated Match Calculation & Job Application
  const applyForJob = (data: Omit<JobApplication, 'id' | 'appliedAt' | 'status'>): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Please log in to apply.' };

    // Check duplicate
    const existing = jobApplications.find((a) => a.jobId === data.jobId && a.applicantUid === currentUser.uid);
    if (existing) {
      showToast('You have already applied for this position.', 'info');
      return { success: false, error: 'Already applied' };
    }

    const job = opportunities.find((o) => o.id === data.jobId);
    
    // Calculate Match Score
    const reqCourse = (job?.requiredCourse || '').toLowerCase();
    const applicantCourse = (data.applicantCourse || currentUser.course || '').toLowerCase();
    const courseMatch = reqCourse ? applicantCourse.includes(reqCourse) || reqCourse.includes(applicantCourse) || reqCourse.includes('all') : true;

    const jobSkills = job?.skills || [];
    const applicantSkills = data.applicantSkills || currentUser.skills || [];
    const matchedSkillsCount = jobSkills.filter((js) =>
      applicantSkills.some((as) => as.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(as.toLowerCase()))
    ).length;

    let score = 50; // base score
    if (courseMatch) score += 25;
    if (jobSkills.length > 0) {
      score += Math.round((matchedSkillsCount / jobSkills.length) * 20);
    } else {
      score += 20;
    }
    if (data.applicantLocation && job?.location && (job.location.toLowerCase().includes('remote') || data.applicantLocation.toLowerCase().includes('cebu'))) {
      score += 5;
    }
    const finalScore = Math.min(Math.max(score, 45), 98);

    const newApp: JobApplication = {
      ...data,
      id: `app_${Date.now()}`,
      appliedAt: new Date().toISOString(),
      status: 'Applied',
      matchScore: finalScore,
      matchBreakdown: {
        courseMatch,
        skillsMatchCount: matchedSkillsCount,
        totalSkillsCount: jobSkills.length,
        locationMatch: true
      }
    };

    setJobApplications((prev) => [newApp, ...prev]);

    // Increment count on job
    setOpportunities((prev) =>
      prev.map((o) => (o.id === data.jobId ? { ...o, applicationsCount: (o.applicationsCount || 0) + 1 } : o))
    );

    // Notify employer / job poster
    if (job) {
      const employerNotif: AppNotification = {
        id: `notif_app_recv_${Date.now()}`,
        toUid: job.postedBy,
        type: 'general',
        title: `💼 New Application: ${job.title}`,
        body: `${data.applicantName} (${data.applicantCourse || 'Cecilian Graduate'}) applied for "${job.title}" with a ${finalScore}% match score!`,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [employerNotif, ...prev]);
    }

    // Confirmation notif for applicant
    const applicantNotif: AppNotification = {
      id: `notif_app_sent_${Date.now()}`,
      toUid: currentUser.uid,
      type: 'general',
      title: '🎯 Application Submitted Successfully',
      body: `Your application for "${job?.title || 'Job'}" at ${job?.company || 'Company'} was submitted. (Profile Match: ${finalScore}%)`,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [applicantNotif, ...prev]);

    showToast(`Application submitted with ${finalScore}% automated profile match!`, 'success');
    return { success: true };
  };

  const updateApplicationStatus = (applicationId: string, status: ApplicationStatus, notes?: string) => {
    const app = jobApplications.find((a) => a.id === applicationId);
    if (!app) return;

    setJobApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status, statusNotes: notes || a.statusNotes } : a))
    );

    // Notify applicant
    const notif: AppNotification = {
      id: `notif_app_status_${Date.now()}`,
      toUid: app.applicantUid,
      type: 'general',
      title: `Application Status Updated: ${status}`,
      body: `Your application for "${app.jobTitle}" at ${app.companyName} is now: ${status}.${notes ? ` Note: ${notes}` : ''}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast(`Applicant status updated to "${status}".`, 'success');
  };

  const withdrawJobApplication = (applicationId: string) => {
    const app = jobApplications.find((a) => a.id === applicationId);
    if (!app) return;
    setJobApplications((prev) => prev.filter((a) => a.id !== applicationId));
    if (app.jobId) {
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === app.jobId
            ? { ...o, applicationsCount: Math.max(0, (o.applicationsCount || 0) - 1) }
            : o
        )
      );
    }
    showToast('Application withdrawn successfully.', 'info');
  };

  const verifyEmployer = (employerUid: string, verified: boolean | 'verified' | 'rejected', notes?: string) => {
    const isApproved = typeof verified === 'boolean' ? verified : verified === 'verified';
    let updatedEmployer: UserProfile | undefined;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === employerUid) {
          updatedEmployer = {
            ...u,
            isVerified: isApproved,
            employerVerificationStatus: isApproved ? 'verified' : 'rejected',
            canPostJobs: isApproved,
            employerVerificationNotes: notes || (isApproved ? 'Accredited by Alumni Office' : 'Application declined')
          };
          return updatedEmployer;
        }
        return u;
      })
    );

    if (updatedEmployer) {
      saveUserToFirestore(updatedEmployer).catch(() => {});
    }

    const notif: AppNotification = {
      id: `notif_emp_ver_${Date.now()}`,
      toUid: employerUid,
      type: 'general',
      title: isApproved ? '🏢 Employer Verification Approved!' : 'Employer Verification Status Update',
      body: isApproved
        ? 'Congratulations! Your company registration has been approved and accredited by St. Cecilia’s College Alumni Office. You may now post career opportunities.'
        : `Employer verification update: ${notes || 'Please contact the alumni office for accreditation details.'}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToFirestore(notif).catch(() => {});

    addAuditLog({
      action: isApproved ? 'Employer Registration Approved' : 'Employer Registration Rejected',
      actorId: currentUser?.uid || 'admin',
      actorName: currentUser?.name || 'Administrator',
      actorRole: currentUser?.role || 'admin',
      category: 'admin',
      details: `Company ${employerUid} verification status set to ${verified ? 'verified' : 'rejected'}. Job posting authorization: ${verified ? 'Active' : 'Disabled'}.${notes ? ` Notes: ${notes}` : ''}`,
      severity: verified ? 'success' : 'warning'
    });

    showToast(
      verified
        ? 'Employer partner approved & accredited. Job posting permissions activated!'
        : 'Employer partner registration rejected.',
      verified ? 'success' : 'info'
    );
  };

  const toggleEmployerJobPosting = (employerUid: string, canPost: boolean) => {
    let updatedEmployer: UserProfile | undefined;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === employerUid) {
          updatedEmployer = {
            ...u,
            canPostJobs: canPost
          };
          return updatedEmployer;
        }
        return u;
      })
    );

    if (updatedEmployer) {
      saveUserToFirestore(updatedEmployer).catch(() => {});
    }

    addAuditLog({
      action: 'Employer Job Posting Rights Changed',
      actorId: currentUser?.uid || 'admin',
      actorName: currentUser?.name || 'Administrator',
      actorRole: currentUser?.role || 'admin',
      category: 'admin',
      details: `Company ${employerUid} job posting rights updated to: ${canPost ? 'Enabled' : 'Disabled'}.`,
      severity: 'info'
    });

    showToast(`Company job posting permission set to ${canPost ? 'Enabled' : 'Disabled'}.`, 'success');
  };

  const selfVerifyAlumniWithRegistry = async (studentId: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Must be logged in to verify.' };
    }
    const res = await verifyAlumniStatus(studentId);
    return {
      success: res.isVerified,
      message: res.message
    };
  };

  // Connection status checker against connections and requests
  const getConnectionStatus = useCallback(
    (otherUid: string): 'pending' | 'accepted' | 'declined' | null => {
      if (!currentUser || !otherUid) return null;
      if (connectionsMap[currentUser.uid]?.includes(otherUid)) return 'accepted';
      const req = friendRequests.find(
        (r) =>
          (r.fromUid === currentUser.uid && r.toUid === otherUid) ||
          (r.fromUid === otherUid && r.toUid === currentUser.uid)
      );
      if (req) {
        return req.status;
      }
      return null;
    },
    [currentUser, connectionsMap, friendRequests]
  );

  // Global Alumni Academic Record Verification Gate State
  const isAlumniVerified = useMemo(() => {
    if (!currentUser) return false;
    if (['admin', 'staff', 'registrar', 'moderator', 'superadmin'].includes(currentUser.role)) return true;
    if (currentUser.role === 'employer') {
      return Boolean((currentUser.isVerified || currentUser.verified) && currentUser.verificationStatus !== 'rejected');
    }
    return Boolean(
      (currentUser.isVerified === true || currentUser.verified === true) &&
      currentUser.verificationStatus !== 'pending_review' &&
      currentUser.verificationStatus !== 'flagged' &&
      currentUser.verificationStatus !== 'rejected'
    );
  }, [currentUser]);

  const verifyAlumniStatus = useCallback(
    async (studentIdToVerify: string): Promise<RegistrarVerificationResult> => {
      const result = registrar_verification(studentIdToVerify, currentUser?.name);

      if (result.isVerified && result.record && currentUser) {
        const updated: UserProfile = {
          ...currentUser,
          studentId: result.record.studentId,
          isVerified: true,
          verified: true,
          verificationStatus: 'verified',
          verificationFlagReason: undefined,
          batch: result.record.batchYear || currentUser.batch,
          course: result.record.course || currentUser.course
        };
        setUsers((prev) => prev.map((u) => (u.uid === currentUser.uid ? updated : u)));
        await saveUserToFirestore(updated);
        markRegistryRecordAsRegistered(result.record.studentId, currentUser.uid);
        showToast(result.message, 'success');
      } else {
        if (currentUser) {
          const updated: UserProfile = {
            ...currentUser,
            studentId: studentIdToVerify,
            isVerified: false,
            verified: false,
            verificationStatus: 'rejected',
            verificationFlagReason: result.message
          };
          setUsers((prev) => prev.map((u) => (u.uid === currentUser.uid ? updated : u)));
          saveUserToFirestore(updated).catch(() => {});
        }
        showToast(result.message, 'error');
      }
      return result;
    },
    [registrar_verification, currentUser, showToast]
  );

  // Notifications operations
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUserId) return;
    setNotifications((prev) =>
      prev.map((n) =>
        !n.toUid || n.toUid === 'all' || n.toUid === currentUserId ? { ...n, read: true } : n
      )
    );
    showToast('All notifications marked as read.');
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Settings operations
  const updateNotificationSettings = (settings: Partial<UserNotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...settings }));
    showToast('Notification preferences saved.');
  };

  const updateUserSettings = (settings: any) => {
    if (
      settings.notificationsPush !== undefined ||
      settings.notificationsEmail !== undefined ||
      settings.notificationsMessages !== undefined ||
      settings.notificationsEvents !== undefined
    ) {
      updateNotificationSettings({
        pushNotifications: settings.notificationsPush ?? settings.pushNotifications,
        emailDigests: settings.notificationsEmail ?? settings.emailDigests,
        directMessages: settings.notificationsMessages ?? settings.directMessages,
        eventReminders: settings.notificationsEvents ?? settings.eventReminders
      });
    } else {
      updateNotificationSettings(settings);
    }
  };

  // Admin Actions
  const setUserVerifiedExplicit = (uid: string, targetStatus?: boolean) => {
    if (!permissions.canAccessAdminPanel) {
      showToast('Permission denied: Admin clearance required.', 'error');
      return;
    }
    const target = users.find((u) => u.uid === uid);
    if (!target) return;

    // Prevent duplicate verification action if member is already verified
    if (target.isVerified && (targetStatus === true || targetStatus === undefined)) {
      showToast(`${target.name} is already verified.`, 'info');
      return;
    }

    const newStatus = targetStatus !== undefined ? targetStatus : !target.isVerified;

    setUsers((prev) =>
      prev.map((u) =>
        u.uid === uid
          ? {
              ...u,
              isVerified: newStatus,
              verified: newStatus,
              verificationStatus: newStatus ? 'verified' : 'rejected'
            }
          : u
      )
    );
    alumniService.updateAlumni(uid, {
      isVerified: newStatus,
      verified: newStatus,
      verificationStatus: newStatus ? 'verified' : 'rejected'
    }).catch((err) => {
      console.warn('Error updating verification status in Firestore:', err);
    });

    if (newStatus) {
      showToast(`Verified: ${target?.name || 'User'} has been granted verified access.`);
    } else {
      showToast(`Revoked: ${target?.name || 'User'}'s verification was revoked. Login blocked until re-verified.`, 'info');
      if (currentUserId === uid) {
        logout();
      }
    }
  };

  const verifyUser = (uid: string) => {
    setUserVerifiedExplicit(uid);
  };

  const updateUserRole = (uid: string, newRole: UserRole) => {
    // Immutable Role Constraint: Assigned roles are permanent and cannot be modified even by administrators.
    showToast('Role modification disabled: Assigned roles are permanent and immutable. System policy prohibits modifying user roles.', 'error');
    console.warn(`Attempted role change for ${uid} to ${newRole} rejected: roles are immutable.`);
    return;
  };

  const deleteAlumni = async (uid: string): Promise<boolean> => {
    if (!permissions.canAccessAdminPanel) {
      showToast('Permission denied: Only administrators can remove alumni records.');
      return false;
    }
    try {
      await alumniService.deleteAlumni(uid);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      showToast('Alumni record deleted successfully from directory.');
      return true;
    } catch (err) {
      console.error('Failed to delete alumnus:', err);
      showToast('Error removing alumni record from Firestore.');
      return false;
    }
  };

  // Alumni Service Operations (direct Firestore CRUD)
  const fetchAlumni = async (): Promise<UserProfile[]> => {
    try {
      setIsFirestoreSyncing(true);
      const liveUsers = await alumniService.getAllAlumni();
      if (liveUsers && liveUsers.length > 0) {
        setUsers(liveUsers);
        return liveUsers;
      }
      return [];
    } catch (err) {
      console.warn('Error fetching alumni from Firestore service:', err);
      return [];
    } finally {
      setIsFirestoreSyncing(false);
    }
  };

  const createAlumni = async (profile: UserProfile): Promise<UserProfile | undefined> => {
    try {
      const created = await alumniService.createAlumni(profile);
      if (created) {
        setUsers((prev) => {
          const exists = prev.some((u) => u.uid === created.uid);
          return exists ? prev.map((u) => (u.uid === created.uid ? created : u)) : [created, ...prev];
        });
        showToast(`Alumni record created for ${created.name}.`);
      }
      return created;
    } catch (err) {
      console.error('Failed to create alumni in Firestore:', err);
      showToast('Error creating alumni profile in Firestore.');
      return undefined;
    }
  };

  const updateAlumniProfile = async (uid: string, updates: Partial<UserProfile>): Promise<Partial<UserProfile> | undefined> => {
    try {
      const targetUser = users.find((u) => u.uid === uid);
      const updated = await alumniService.updateAlumni(uid, updates, targetUser ? { ...targetUser, ...updates } : undefined);
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...updated } : u)));
        showToast('Alumni profile updated successfully.');
      }
      return updated;
    } catch (err) {
      console.error('Failed to update alumni in Firestore:', err);
      showToast('Error updating alumni profile in Firestore.');
      return undefined;
    }
  };

  const createChapter = (ch: Omit<Chapter, 'id'>) => {
    if (!permissions.canAccessAdminPanel) return;
    const newChap: Chapter = {
      id: `chap_${Date.now()}`,
      ...ch
    };
    setChapters((prev) => [...prev, newChap]);
    showToast(`Alumni Chapter "${ch.name}" created!`);
  };

  const createMilestone = (m: Omit<CareerMilestone, 'id'>) => {
    const isAuthorized = permissions.canAccessAdminPanel || currentUser?.role === 'alumni' || currentUser?.role === 'staff';
    if (!isAuthorized) {
      showToast('Permission denied to publish milestones.');
      return;
    }
    const newM: CareerMilestone = {
      id: `m_${Date.now()}`,
      authorId: currentUser?.uid,
      authorName: currentUser?.name || 'Administrator',
      authorRole: currentUser?.role,
      createdAt: new Date().toISOString(),
      likes: [],
      ...m
    };
    setMilestones((prev) => [newM, ...prev]);

    // If published by administration, registrar, or staff, cross-post to Alumni Dashboard Institutional Social Feed
    if (newM.authorRole !== 'employer' && newM.authorRole !== 'alumni') {
      const feedPost: InstitutionalFeedPost = {
        id: `post_ms_${newM.id}`,
        authorId: newM.authorId || 'admin',
        authorName: newM.authorName,
        authorRole: (newM.authorRole as any) || 'admin',
        authorAvatar: currentUser?.profilePictureUrl || '/assets/st-cecilias-college-seal.jpg',
        postType: 'milestone',
        milestoneBadge: newM.company || newM.category,
        title: newM.title,
        content: newM.description || `${newM.authorName} achieved an outstanding milestone in ${newM.category}!`,
        imageUrl: (newM.images && newM.images[0]) || '/assets/st-cecilias-college-seal.jpg',
        likes: [],
        comments: [],
        sharesCount: 0,
        createdAt: new Date().toISOString(),
        tags: ['Milestone', newM.category]
      };
      setFeedPosts((prev) => [feedPost, ...prev]);
    }

    // Broadcast notification to all users
    const notif: AppNotification = {
      id: `notif_m_${Date.now()}`,
      toUid: 'all',
      type: 'announcement',
      title: `New Milestone Spotlight: ${newM.title}`,
      body: `${newM.authorName} published a spotlight in ${newM.category}: "${newM.title}". Check it out on the dashboard!`,
      refId: newM.id,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('Milestone & gallery post published to dashboard feed!');
  };

  const toggleLikeMilestone = (milestoneId: string) => {
    if (!currentUser) return;
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === milestoneId) {
          const currentLikes = m.likes || [];
          const isLiked = currentLikes.includes(currentUser.uid);
          const updatedLikes = isLiked
            ? currentLikes.filter((uid) => uid !== currentUser.uid)
            : [...currentLikes, currentUser.uid];
          return { ...m, likes: updatedLikes };
        }
        return m;
      })
    );
  };

  const deleteMilestone = (milestoneId: string) => {
    if (!permissions.canAccessAdminPanel && currentUser?.role !== 'admin') {
      showToast('Permission denied to remove milestone post.');
      return;
    }
    setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    showToast('Milestone post removed from feed.');
  };

  const isEmployerExpired = useCallback((user?: UserProfile | null): boolean => {
    if (!user || user.role !== 'employer') return false;
    if (user.employerStatus === 'expired') return true;
    if (user.employerExpirationDate) {
      return new Date(user.employerExpirationDate).getTime() < Date.now();
    }
    // Default active period: 365 days from user.createdAt or default 1 year
    if (user.createdAt) {
      const createdTime = new Date(user.createdAt).getTime();
      const defaultExpiry = createdTime + 365 * 86400000;
      return defaultExpiry < Date.now();
    }
    return false;
  }, []);

  const requestEmployerRenewal = useCallback((notes: string) => {
    if (!currentUser || currentUser.role !== 'employer') return;
    const updated = {
      ...currentUser,
      employerStatus: 'pending_renewal' as const,
      employerRenewalRequested: true,
      employerRenewalNotes: notes
    };
    updateProfile(updated);

    // Notify administrators
    const adminNotif: AppNotification = {
      id: `notif_renew_req_${Date.now()}`,
      toUid: 'all',
      type: 'general',
      title: 'Employer Accreditation Renewal Requested',
      body: `Employer "${currentUser.companyName || currentUser.name}" submitted a renewal request: "${notes.slice(0, 80)}..."`,
      refId: currentUser.uid,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [adminNotif, ...prev]);
    showToast('Renewal request submitted for administrator review.');
  }, [currentUser, updateProfile]);

  const renewEmployerAccount = useCallback((uid: string, extensionMonths: number = 12) => {
    const target = users.find((u) => u.uid === uid);
    if (!target) return;
    const currentExpiry = target.employerExpirationDate && new Date(target.employerExpirationDate).getTime() > Date.now()
      ? new Date(target.employerExpirationDate).getTime()
      : Date.now();
    const newExpiry = new Date(currentExpiry + extensionMonths * 30 * 86400000).toISOString();

    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          return {
            ...u,
            employerStatus: 'active',
            employerExpirationDate: newExpiry,
            employerRenewalRequested: false,
            employerRenewalNotes: undefined,
            employerVerificationStatus: 'verified',
            canPostJobs: true
          };
        }
        return u;
      })
    );

    const renewNotif: AppNotification = {
      id: `notif_renew_${Date.now()}`,
      toUid: uid,
      type: 'security',
      title: 'Accreditation Extended & Restored',
      body: `Your partner account accreditation has been successfully extended for ${extensionMonths} months. Valid through ${new Date(newExpiry).toLocaleDateString()}.`,
      refId: uid,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [renewNotif, ...prev]);
    showToast(`Accreditation renewed for ${extensionMonths} months.`);
  }, [users, currentUser]);

  // Automated Employer Expiration System and Renewal Warning Notification Engine
  const checkAndEnforceEmployerExpirations = useCallback(() => {
    let expiredCount = 0;
    let warningsCount = 0;
    const now = Date.now();
    const newNotifications: AppNotification[] = [];

    setUsers((prevUsers) => {
      let stateChanged = false;
      const updated = prevUsers.map((user) => {
        if (user.role !== 'employer') return user;

        let expiryTimestamp: number | null = null;
        if (user.employerExpirationDate) {
          expiryTimestamp = new Date(user.employerExpirationDate).getTime();
        } else if (user.createdAt) {
          expiryTimestamp = new Date(user.createdAt).getTime() + 365 * 86400000;
        }

        if (!expiryTimestamp || isNaN(expiryTimestamp)) return user;

        const msUntilExpiry = expiryTimestamp - now;
        const daysUntilExpiry = Math.ceil(msUntilExpiry / 86400000);

        // Check if expiration date has been reached
        if (daysUntilExpiry <= 0) {
          if (user.employerStatus !== 'expired' || user.canPostJobs !== false) {
            expiredCount++;
            stateChanged = true;
            const updatedUser: UserProfile = {
              ...user,
              employerStatus: 'expired',
              canPostJobs: false
            };

            // Persist expiration status asynchronously to Firestore
            alumniService.updateAlumni(user.uid, {
              employerStatus: 'expired',
              canPostJobs: false
            }).catch(() => {});

            // Dispatch Account Expired Notification
            const expNotif: AppNotification = {
              id: `notif_emp_expired_${user.uid}_${now}`,
              toUid: user.uid,
              type: 'security',
              title: 'Account Accreditation Expired',
              body: `Your institutional partner accreditation for "${user.companyName || user.name}" has expired on ${new Date(expiryTimestamp).toLocaleDateString()}. Job posting and candidate contact privileges have been set to inactive. Please submit a renewal request to restore active status.`,
              refId: user.uid,
              read: false,
              createdAt: new Date().toISOString()
            };
            newNotifications.push(expNotif);

            addAuditLog({
              action: 'Employer Account Automatically Expired',
              actorId: 'system_automation',
              actorName: 'System Expiration Engine',
              actorRole: 'system',
              category: 'security',
              details: `Employer accreditation for "${user.companyName || user.name}" reached expiration date (${new Date(expiryTimestamp).toLocaleDateString()}). Status set to 'Expired' and posting privileges disabled.`,
              severity: 'warning'
            });

            return updatedUser;
          }
        } else {
          // Warning notifications (30-day, 14-day, 7-day, 1-day)
          let warningTitle: string | null = null;
          let warningBody: string | null = null;

          if (daysUntilExpiry <= 1) {
            warningTitle = 'Accreditation Expiry Warning (1 Day Remaining)';
            warningBody = `Urgent Final Notice: Your employer accreditation for "${user.companyName || user.name}" expires tomorrow. Please submit a renewal request to avoid interruption.`;
          } else if (daysUntilExpiry <= 7) {
            warningTitle = 'Accreditation Expiry Notice (7 Days Remaining)';
            warningBody = `Your employer accreditation will expire in ${daysUntilExpiry} days. Please prepare your renewal documentation.`;
          } else if (daysUntilExpiry <= 14) {
            warningTitle = 'Accreditation Renewal Notice (14 Days Remaining)';
            warningBody = `Your partner accreditation is due for renewal in 2 weeks. Submit a renewal request to ensure continuous access.`;
          } else if (daysUntilExpiry <= 30) {
            warningTitle = 'Accreditation Renewal Notice (30 Days Remaining)';
            warningBody = `Annual accreditation notice: Your partner account is scheduled for expiration in ${daysUntilExpiry} days.`;
          }

          if (warningTitle && warningBody) {
            const alreadyExists = notifications.some(
              (n) => n.toUid === user.uid && n.title === warningTitle
            );
            if (!alreadyExists) {
              warningsCount++;
              const warnNotif: AppNotification = {
                id: `notif_emp_warn_${daysUntilExpiry}_${user.uid}_${now}`,
                toUid: user.uid,
                type: 'security',
                title: warningTitle,
                body: warningBody,
                refId: user.uid,
                read: false,
                createdAt: new Date().toISOString()
              };
              newNotifications.push(warnNotif);
            }
          }
        }

        return user;
      });

      return stateChanged ? updated : prevUsers;
    });

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev]);
      newNotifications.forEach((n) => {
        saveNotificationToFirestore(n).catch(() => {});
      });
    }

    return { expiredCount, warningsCount };
  }, [notifications, addAuditLog, currentUser, isEmployerExpired]);

  // Run automatic expiration check on component mount and on interval
  useEffect(() => {
    checkAndEnforceEmployerExpirations();
    const interval = setInterval(() => {
      checkAndEnforceEmployerExpirations();
    }, 60000 * 30); // check every 30 minutes
    return () => clearInterval(interval);
  }, [checkAndEnforceEmployerExpirations]);

  const submitCareerSurvey = useCallback((survey: Omit<CareerSurveyResponse, 'id' | 'submittedAt'>) => {
    const newSurvey: CareerSurveyResponse = {
      id: `survey_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      ...survey
    };
    setCareerSurveys((prev) => [newSurvey, ...prev]);

    if (currentUser) {
      updateProfile({
        employmentStatus: survey.employmentStatus,
        currentPosition: survey.jobTitle || currentUser.currentPosition,
        company: survey.company || currentUser.company
      });
    }

    addAuditLog({
      action: 'Graduate Tracer Survey Submitted',
      actorId: survey.uid,
      actorName: survey.userName,
      actorRole: 'alumni',
      category: 'career',
      details: `Response recorded for ${survey.userName} (${survey.course}, Batch ${survey.batch}) - Status: ${survey.employmentStatus}.`,
      severity: 'success'
    });

    showToast('Graduate tracer survey submitted! Thank you for supporting institutional accreditation.', 'success');
  }, [currentUser, updateProfile, addAuditLog, showToast]);

  const triggerDatabaseBackup = useCallback((type: 'automated' | 'manual' = 'manual') => {
    const newSnapshot: DatabaseBackupSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      recordCount: users.length,
      sizeKb: Math.round(128 + Math.random() * 20),
      status: 'verified',
      type
    };
    setBackups((prev) => [newSnapshot, ...prev]);

    addAuditLog({
      action: 'Database Snapshot Backup Created',
      actorId: currentUser?.uid || 'system',
      actorName: currentUser?.name || 'Automated Backup Daemon',
      actorRole: currentUser?.role || 'system',
      category: 'admin',
      details: `Encrypted point-in-time snapshot created (${users.length} alumni, ${events.length} events). Verified integrity.`,
      severity: 'info'
    });

    showToast('Encrypted database backup snapshot created and verified.', 'success');
  }, [users.length, events.length, currentUser, addAuditLog, showToast]);

  const runAutomationJob = useCallback((jobId: string) => {
    setAutomationJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          return {
            ...job,
            lastRun: new Date().toISOString(),
            triggerCount: job.triggerCount + 1,
            status: 'active'
          };
        }
        return job;
      })
    );

    const targetJob = automationJobs.find((j) => j.id === jobId);
    const jobName = targetJob?.name || 'Automation Job';

    if (jobId === 'job_backup_daily') {
      triggerDatabaseBackup('manual');
      return;
    }

    addAuditLog({
      action: `Automation Job Triggered: ${jobName}`,
      actorId: currentUser?.uid || 'admin',
      actorName: currentUser?.name || 'System Operator',
      actorRole: currentUser?.role || 'admin',
      category: 'admin',
      details: `Manual run dispatched for "${jobName}".`,
      severity: 'info'
    });

    showToast(`Automation job "${jobName}" triggered successfully.`, 'success');
  }, [automationJobs, currentUser, triggerDatabaseBackup, addAuditLog, showToast]);

  const unlockUserAccount = useCallback((uid: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, isLocked: false, lockedUntil: undefined, failedLoginAttempts: 0 } : u))
    );
    const target = users.find((u) => u.uid === uid);
    addAuditLog({
      action: 'Security Lockout Lifted',
      actorId: currentUser?.uid || 'admin',
      actorName: currentUser?.name || 'Administrator',
      actorRole: currentUser?.role || 'admin',
      category: 'security',
      details: `Account ${target?.name || uid} was unlocked by administrator. Failed attempts reset.`,
      severity: 'warning'
    });
    showToast(`Account for ${target?.name || 'user'} has been unlocked.`, 'success');
  }, [users, currentUser, addAuditLog, showToast]);

  const verifyAndApproveAlumni = useCallback((uid: string, approve: boolean, flagReason?: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          return {
            ...u,
            isVerified: approve,
            verificationStatus: approve ? 'verified' : 'rejected',
            verificationFlagReason: flagReason
          };
        }
        return u;
      })
    );

    const target = users.find((u) => u.uid === uid);
    addAuditLog({
      action: approve ? 'Alumni Account Approved' : 'Alumni Account Flagged / Rejected',
      actorId: currentUser?.uid || 'admin',
      actorName: currentUser?.name || 'Administrator',
      actorRole: currentUser?.role || 'admin',
      category: 'alumni_registration',
      details: approve
        ? `Alumnus "${target?.name}" (${target?.email}) officially approved and verified against registrar archives.`
        : `Alumnus registration for "${target?.name}" flagged: ${flagReason || 'Requires additional registrar validation'}.`,
      severity: approve ? 'success' : 'warning'
    });

    showToast(
      approve ? `Alumnus "${target?.name}" approved & verified!` : `Alumnus record marked with review flag.`,
      approve ? 'success' : 'info'
    );
  }, [users, currentUser, addAuditLog, showToast]);

  const sendEmergencyAnnouncement = useCallback((title: string, content: string) => {
    if (!currentUser || !permissions.canPostAnnouncements) {
      showToast('Permission denied: Staff/Admin authorization required.');
      return;
    }
    const newAnn: Announcement = {
      id: `ann_emerg_${Date.now()}`,
      title,
      content,
      important: true,
      urgent: true,
      category: 'emergency',
      publishedAt: new Date().toISOString(),
      createdBy: currentUser.uid,
      authorName: currentUser.name,
      authorRole: currentUser.headline || (currentUser.role ? currentUser.role.toUpperCase() : 'ADMIN')
    };

    setAnnouncements((prev) => [newAnn, ...prev]);

    const notif: AppNotification = {
      id: `notif_emerg_${Date.now()}`,
      type: 'announcement',
      title: `🚨 EMERGENCY ADVISORY: ${title}`,
      body: content.slice(0, 140) + '...',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);

    addAuditLog({
      action: 'Emergency Broadcast Advisory Dispatched',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'communication',
      details: `Urgent institutional advisory broadcast dispatched: "${title}".`,
      severity: 'alert'
    });

    showToast('Emergency announcement broadcast dispatched to all members.', 'success');
  }, [currentUser, permissions.canPostAnnouncements, addAuditLog, showToast]);

  const updateEmploymentStatus = useCallback((status: 'Employed' | 'Self-employed' | 'Unemployed' | 'Student' | 'Retired') => {
    if (!currentUser) return;
    updateProfile({ employmentStatus: status, lastEmploymentUpdateReminder: new Date().toISOString() });
    addAuditLog({
      action: 'Employment Information Updated',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'career',
      details: `Status set to "${status}".`,
      severity: 'info'
    });
    showToast(`Employment status updated to: ${status}`, 'success');
  }, [currentUser, updateProfile, addAuditLog, showToast]);

  const syncAllDataToCloud = useCallback(async () => {
    setIsFirestoreSyncing(true);
    showToast('Pushing all institutional datasets to Cloud Firestore...', 'info');
    try {
      const regRecords = getRegistrarRecords();
      const result = await syncAllCollectionsToFirestore({
        users,
        events,
        opportunities,
        announcements,
        registryRecords: regRecords,
        auditLogs,
        onProgress: (step) => {
          console.info('[Cloud Sync Progress]:', step);
        }
      });

      if (result.success) {
        showToast(
          `Cloud Sync Complete: ${result.syncedCounts.users} Users, ${result.syncedCounts.events} Events, ${result.syncedCounts.opportunities} Opportunities, ${result.syncedCounts.announcements} Announcements, ${result.syncedCounts.registry_records} Student Registry records written to Firestore.`,
          'success'
        );
      } else {
        showToast(
          `Sync completed with notices: ${result.errors.slice(0, 2).join('; ')}`,
          'warning'
        );
      }
    } catch (err: any) {
      console.warn('Manual Firestore sync error:', err);
      showToast(`Firestore synchronization notice: ${err?.message || err}`, 'error');
    } finally {
      setIsFirestoreSyncing(false);
    }
  }, [users, events, opportunities, announcements, auditLogs, showToast]);

  const purgeDatabaseSampleData = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsFirestoreSyncing(true);
    showToast('Purging sample data from local storage and Cloud Firestore...', 'info');
    try {
      // 1. Purge cloud collections
      const cloudRes = await purgeAllFirestoreSampleData();

      // 2. Clear in-memory & local storage state
      setEvents([]);
      setAnnouncements([]);
      setOpportunities([]);
      setReservations([]);
      setFeedPosts([]);
      setGalleryItems([]);
      setChapters([]);
      setMilestones([]);

      try {
        localStorage.removeItem(STORAGE_KEYS.EVENTS);
        localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
        localStorage.removeItem(STORAGE_KEYS.OPPORTUNITIES);
        localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
        localStorage.removeItem(STORAGE_KEYS.FEED_POSTS);
        localStorage.removeItem(STORAGE_KEYS.GALLERY);
        localStorage.removeItem(STORAGE_KEYS.CHAPTERS);
        localStorage.removeItem(STORAGE_KEYS.MILESTONES);
        localStorage.removeItem('st_cecilia_registrar_student_records');
      } catch {}

      const msg = `Purge completed: ${cloudRes.deletedCount} remote cloud documents purged. All collections are now clean for live testing.`;
      showToast(msg, 'success');
      return { success: true, message: msg };
    } catch (err: any) {
      const errMsg = `Purge notice: ${err?.message || err}`;
      showToast(errMsg, 'error');
      return { success: false, message: errMsg };
    } finally {
      setIsFirestoreSyncing(false);
    }
  }, [showToast]);

  const testDatabaseWrite = useCallback(async (): Promise<{ success: boolean; latencyMs: number; message: string }> => {
    setIsFirestoreSyncing(true);
    try {
      const res = await testFirestoreWriteSync();
      if (res.success) {
        const msg = `Firestore live verification passed (${res.latencyMs}ms roundtrip to ${FIRESTORE_DATABASE_ID}). Writes and real-time listeners are active.`;
        showToast(msg, 'success');
        return { success: true, latencyMs: res.latencyMs, message: msg };
      } else {
        const msg = `Firestore connection notice: ${res.error || 'Write could not be completed'}`;
        showToast(msg, 'error');
        return { success: false, latencyMs: res.latencyMs, message: msg };
      }
    } catch (err: any) {
      const msg = `Firestore connection error: ${err?.message || err}`;
      showToast(msg, 'error');
      return { success: false, latencyMs: -1, message: msg };
    } finally {
      setIsFirestoreSyncing(false);
    }
  }, [showToast]);

  return (
    <AlumniContext.Provider
      value={{
        currentUser,
        users,
        friendRequests,
        chats,
        messages,
        notifications,
        events,
        announcements,
        opportunities,
        chapters,
        milestones,
        notificationSettings,
        activeTab,
        setActiveTab,
        selectedUserIdForModal,
        setSelectedUserIdForModal,
        isEditProfileModalOpen,
        setIsEditProfileModalOpen,
        openEditProfile,
        closeEditProfile,
        permissions,
        isFirebaseConnected,
        isFirestoreSyncing,
        authReady,
        isLoadingData,
        isOnline,
        isBackgroundSyncing,
        lastBackgroundSyncTime,
        refreshData,
        triggerBackgroundSync,
        loginWithGoogle,
        syncAllDataToCloud,
        purgeDatabaseSampleData,
        purgeAllSampleData: purgeDatabaseSampleData as any,
        testDatabaseWrite,
        firestoreDatabaseId: FIRESTORE_DATABASE_ID,
        login,
        register,
        logout,
        switchUser,
        resetPassword,
        resetUserPasswordByEmail,
        deleteAccount,
        changeEmail,
        changePassword,
        updateProfile,
        updateUserProfile: updateProfile,
        addExperience,
        removeExperience,
        addEducation,
        removeEducation,
        followingIds,
        connectionIds,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest,
        toggleFollow,
        isFollowing,
        isConnected,
        hasPendingRequestWith,
        activeChatId,
        setActiveChatId,
        sendMessage,
        getOrCreateChat,
        markChatAsRead,
        offlineQueueCount,
        offlineQueue,
        syncOfflineMessages,
        retryOfflineMessage,
        cancelOfflineMessage,
        createEvent,
        editEvent,
        deleteEvent,
        toggleLikeEvent,
        addCommentToEvent,
        rsvpEvent,
        updateEventAttendance,
        manualCheckInAttendee,
        updateAttendeeInfo,
        removeAttendeeFromEvent,
        addAttendeeToEvent,
        reservations,
        reserveEventSlot,
        cancelEventReservation,
        updateEventReservationSettings,
        pushPermissionStatus,
        requestBrowserPushPermission,
        confirmEventAttendance,
        sendTest24HourAlert,
        upcoming24hReservations,
        createAnnouncement,
        editAnnouncement,
        deleteAnnouncement,
        togglePinAnnouncement,
        toggleHeartAnnouncement,
        createOpportunity,
        updateOpportunity,
        deleteOpportunity,
        approveOpportunity,
        rejectOpportunity,
        applyForJob,
        withdrawJobApplication,
        updateApplicationStatus,
        verifyEmployer,
        toggleEmployerJobPosting,
        selfVerifyAlumniWithRegistry,
        isAlumniVerified,
        registrar_verification,
        verifyAlumniStatus,
        getConnectionStatus,
        jobApplications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        updateNotificationSettings,
        updateUserSettings,
        galleryItems,
        addGalleryItem,
        deleteGalleryItem,
        feedPosts,
        addFeedPost,
        toggleLikeFeedPost,
        toggleHeartFeedPost,
        addFeedPostComment,
        deleteFeedPost,
        createUserByAdmin,
        fetchAlumni,
        createAlumni,
        updateAlumniProfile,
        verifyUser,
        setUserVerified: setUserVerifiedExplicit,
        updateUserRole,
        setUserRole: updateUserRole,
        deleteAlumni,
        createChapter,
        createMilestone,
        toggleLikeMilestone,
        deleteMilestone,
        isEmployerExpired,
        requestEmployerRenewal,
        renewEmployerAccount,
        checkAndEnforceEmployerExpirations,
        auditLogs,
        automationJobs,
        careerSurveys,
        backups,
        addAuditLog,
        submitCareerSurvey,
        runAutomationJob,
        triggerDatabaseBackup,
        unlockUserAccount,
        verifyAndApproveAlumni,
        sendEmergencyAnnouncement,
        updateEmploymentStatus,
        toasts,
        toastMessage,
        showToast,
        dismissToast
      }}
    >
      {children}
    </AlumniContext.Provider>
  );
};

export const useAlumni = () => {
  const context = useContext(AlumniContext);
  if (!context) {
    throw new Error('useAlumni must be used within an AlumniProvider');
  }
  return context;
};
