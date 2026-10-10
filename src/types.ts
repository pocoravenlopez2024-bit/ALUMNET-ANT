export type UserRole = 'alumni' | 'admin' | 'registrar' | 'staff' | 'moderator' | 'superadmin' | 'employer';

/**
 * Role-Based Categorization:
 * Determines if a user belongs to an administrative or staff management role
 * such as Admin, Registrar, Employer, Staff, Moderator, Super Admin, System Administrator.
 * Alumni and Student users return false.
 */
export function isAdministrativeOrStaffRole(role?: string): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  const administrativeRoles = [
    'admin',
    'superadmin',
    'registrar',
    'employer',
    'staff',
    'moderator',
    'system_administrator',
    'administrator',
    'officer'
  ];
  return administrativeRoles.includes(normalized);
}

export const OFFICIAL_DEGREE_PROGRAMS = [
  'B.S. Information Technology',
  'B.S. Computer Science',
  'B.S. Information Systems',
  'B.S. Computer Engineering',
  'B.S. Accountancy',
  'B.S. Business Administration',
  'B.S. Hospitality Management',
  'B.S. Tourism Management',
  'B.S. Nursing',
  'B.S. Criminology',
  'B.S. Education',
  'B.S. Secondary Education',
  'B.S. Elementary Education',
  'B.S. Public Administration',
  'B.S. Psychology'
] as const;

export type DegreeProgram = typeof OFFICIAL_DEGREE_PROGRAMS[number] | string;

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  honors?: string;
}

export type QuickStatusAvailability =
  | 'Open to Networking'
  | 'Hiring'
  | 'Busy'
  | 'Seeking Opportunities'
  | 'Mentoring'
  | 'Offline';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  batch?: string; // e.g., "2019"
  course?: string; // e.g., "B.S. Computer Science"
  location: string;
  profilePictureUrl: string;
  coverPhotoUrl: string;
  headline: string;
  about: string;
  bio?: string;
  phone: string;
  isVerified?: boolean;
  verified?: boolean;
  followersCount: number;
  followingCount: number;
  connectionsCount: number;
  skills?: string[];
  currentPosition?: string;
  company?: string;
  experience: Experience[];
  education: Education[];
  createdAt: string;
  alumniId?: string; // Official Alumni ID (e.g. SCC-ALUM-2024-0192), distinct from Student ID
  studentId?: string; // Student ID from academic registrar records
  employeeId?: string;
  department?: string;
  password?: string;
  authProvider?: 'password' | 'google' | 'firebase';
  settings?: Record<string, any>;
  // Automation & System Health Fields
  employmentStatus?: 'Employed' | 'Self-employed' | 'Unemployed' | 'Student' | 'Retired';
  birthday?: string; // 'YYYY-MM-DD' or 'MM-DD'
  lastLoginAt?: string;
  engagementScore?: number; // 0 - 100
  verificationStatus?: 'verified' | 'pending_review' | 'flagged' | 'rejected';
  verificationFlagReason?: string;
  failedLoginAttempts?: number;
  isLocked?: boolean;
  lockedUntil?: string;
  emailVerified?: boolean;
  lastProfileUpdateReminder?: string;
  lastEmploymentUpdateReminder?: string;
  // Quick Status & Availability
  quickStatus?: QuickStatusAvailability | string;
  quickStatusNote?: string;
  quickStatusUpdatedAt?: string;
  // Employer / Partner Company Specific Profile Fields
  companyName?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companyAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  employerVerificationStatus?: 'pending_verification' | 'verified' | 'rejected';
  employerVerificationNotes?: string;
  canPostJobs?: boolean;
  profileCompleted?: boolean;
  isProfileSetupCompleted?: boolean;
  avatar?: string;
  photoUrl?: string;
  industry?: string;
  yearsOfExperience?: string | number;
  workLocation?: string;
  privacyConsentAccepted?: boolean;
  privacyConsentDate?: string;
  zeroDisclosureAccepted?: boolean;
  zeroDisclosureDate?: string;
  employerExpirationDate?: string;
  employerStatus?: 'active' | 'expired' | 'pending_renewal' | 'pending_verification';
  employerRenewalRequested?: boolean;
  employerRenewalNotes?: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string; // usually `${fromUid}_${toUid}`
  fromUid: string;
  toUid: string;
  status: FriendRequestStatus;
  createdAt: string;
  senderProfile?: UserProfile;
  receiverProfile?: UserProfile;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: UserRole;
  isSystemMessage?: boolean;
  status?: 'sending' | 'queued' | 'syncing' | 'sent' | 'failed';
  offlineQueued?: boolean;
}

export interface ChatThread {
  id: string;
  memberIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: Record<string, number>; // uid -> count
  otherUser?: UserProfile;
  isGroupChat?: boolean;
  groupName?: string;
  groupDescription?: string;
  eventId?: string;
  isEventChat?: boolean;
  adminUids?: string[];
}

export type NotificationType = 
  | 'friend_request'
  | 'friend_accepted'
  | 'event_broadcast'
  | 'announcement_broadcast'
  | 'message'
  | 'general'
  | 'event'
  | 'announcement'
  | 'profile_update'
  | 'security'
  | 'gallery'
  | 'job';

export interface AppNotification {
  id: string;
  toUid?: string;
  fromUid?: string;
  type: NotificationType;
  title: string;
  body: string;
  refId?: string; // e.g. eventId, friendRequestId, announcementId, chatId
  actionStatus?: 'pending' | 'accepted' | 'declined';
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
  fromUser?: UserProfile;
}

export interface EventComment {
  id: string;
  eventId?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt?: string;
  timestamp?: string;
}

export type EventTemporalStatus = 'upcoming' | 'ongoing' | 'completed';

export interface EventAttendee {
  id?: string;
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
  avatarUrl?: string;
  batch?: string;
  course?: string;
  role?: UserRole;
  status?: 'going' | 'interested';
  ticketType?: string; // 'General Alumni' | 'VIP / Jubilarian' | 'Faculty & Staff' | 'Student Delegate' | 'Guest'
  paymentStatus?: 'Paid' | 'Complimentary' | 'Free' | 'Waived' | 'Pending' | string;
  rsvpDate?: string;
  registeredAt?: string;
  checkInStatus?: 'checked_in' | 'not_checked_in';
  checkedInAt?: string;
  checkedInBy?: string;
  notes?: string;
  registrationCode?: string;
  qrCode?: string;
}

export interface EventAttendanceRecord {
  uid: string;
  name: string;
  status: 'attended' | 'not_attended' | 'pending';
  checkedInAt?: string;
  updatedBy?: string;
}

export type EventRegistrationStatusType = 'open' | 'almost_full' | 'closed' | 'fully_booked' | 'upcoming';

export interface EventReservation {
  id: string; // e.g. "ALM-2026-00125"
  eventId: string;
  eventTitle: string;
  eventDate: string; // ISO string
  eventTime?: string;
  eventVenue: string;
  userId: string;
  alumniName: string;
  email: string;
  contactNumber: string;
  alumniId: string;
  graduationYear: string;
  course: string;
  numberOfGuests: number;
  totalSeats: number; // 1 + numberOfGuests
  dietaryRequirements?: string;
  specialRequests?: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled' | 'attended';
  reservedAt: string; // ISO string
  qrCodeData?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  reminder24hSent?: boolean;
  reminder24hSentAt?: string;
  attendanceConfirmed?: boolean;
  attendanceConfirmedAt?: string;
}

export interface AlumniEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  venue?: string;
  tagline?: string;
  type: 'reunion' | 'workshop' | 'networking' | 'webinar' | 'social';
  startDate: string; // ISO string
  endDate: string;
  date?: string; // Compatibility alias
  startTime?: string;
  endTime?: string;
  heroImageUrl: string;
  eventImages?: string[];
  isVirtual: boolean;
  isImportant?: boolean;
  isFeaturedReservation?: boolean;
  maxAttendees?: number;
  maxParticipants?: number;
  reservedSeatsCount?: number;
  maxGuestsPerAlumni?: number;
  registrationOpenDate?: string;
  registrationCloseDate?: string;
  registrationCloseDaysBefore?: number;
  calculatedDeadline?: string;
  enableWaitingList?: boolean;
  manualStatusOverride?: 'auto' | 'open' | 'almost_full' | 'closed' | 'fully_booked';
  autoConfirm?: boolean;
  emailNotificationEnabled?: boolean;
  reservationNotice?: string;
  attendeesCount: number;
  createdBy?: string;
  createdByName?: string;
  organizerId?: string;
  organizerName?: string;
  likes: string[]; // array of uids who liked
  comments: EventComment[];
  userRsvp?: 'going' | 'interested' | 'not_going' | null;
  attendees?: EventAttendee[];
  attendanceRecords?: EventAttendanceRecord[];
  groupChatId?: string;
  cancellationDeadlineHours?: number; // Hours before event start where RSVP cancellation is accepted (default: 24)
  cancellationDeadline?: string; // Optional explicit ISO cancellation deadline
  agenda?: Array<{ time: string; title: string }>;
}

export interface AnnouncementAttachment {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  important: boolean;
  urgent?: boolean;
  isPinned?: boolean;
  category?: 'department' | 'batch' | 'institutional' | 'emergency' | 'general' | 'academic' | 'career' | 'campus' | 'reunion' | string;
  targetBatches?: string[];
  targetDepartments?: string[];
  publishedAt: string;
  createdBy?: string;
  authorId?: string;
  authorName: string;
  authorRole: string;
  imageUrl?: string;
  attachments?: AnnouncementAttachment[];
  isImportant?: boolean;
  createdAt?: string;
  likes?: number;
  hearts?: string[]; // Array of user UIDs who reacted with a heart
  commentsCount?: number;
  pinned?: boolean;
  views?: number;
}

export interface Opportunity {
  id: string;
  title: string;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Mentorship';
  employmentType?: string; // Compatibility alias
  company: string;
  location: string;
  description: string;
  salaryOrStipend?: string;
  skills?: string[];
  requirements?: string[];
  applicationUrl?: string;
  contactEmail?: string;
  postedBy?: string;
  postedByUid?: string; // Compatibility alias
  posterName?: string;
  postedByName?: string; // Compatibility alias
  posterRole?: UserRole;
  createdAt?: string;
  postedAt?: string; // Compatibility alias
  status?: 'active' | 'closed';
  // Automated matching & workflow fields
  requiredCourse?: string; // e.g. 'BS Information Technology'
  experienceLevel?: string; // e.g. '0–2 years', 'Fresh Graduate', '3–5 years'
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  rejectionReason?: string;
  applicationDeadline?: string;
  deadline?: string; // Compatibility alias
  howToApply?: 'internal' | 'external' | 'both';
  applicationsCount?: number;
}

export type ApplicationStatus = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicantUid: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantCourse?: string;
  applicantBatch?: string;
  applicantSkills?: string[];
  applicantLocation?: string;
  portfolioUrl?: string;
  resumeFileName?: string;
  resumeSummary?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  statusNotes?: string;
  appliedAt: string;
  matchScore?: number;
  matchBreakdown?: {
    courseMatch: boolean;
    skillsMatchCount: number;
    totalSkillsCount: number;
    locationMatch: boolean;
  };
}

export interface Chapter {
  id: string;
  name: string;
  region: string;
  leadName: string;
  leadEmail: string;
  memberCount?: number;
  meetingFrequency?: string;
  description?: string;
}

export interface TaggedAlumnus {
  uid: string;
  name: string;
  batch?: string;
  avatar?: string;
}

export interface CareerMilestone {
  id: string;
  uid?: string;
  alumnusId?: string;
  alumniName?: string;
  alumnusName?: string;
  alumnusAvatar?: string;
  companyOrOrg?: string;
  batch?: string;
  title: string;
  company?: string;
  category: 'Promotion' | 'Startup' | 'Award' | 'Publication' | 'Leadership' | 'Campus Gallery' | 'Achievement' | string;
  date?: string;
  description: string;
  images?: string[];
  taggedAlumniIds?: string[];
  taggedAlumni?: TaggedAlumnus[];
  likes?: string[];
  authorId?: string;
  authorName?: string;
  authorRole?: UserRole;
  createdAt?: string;
}

export interface UserNotificationSettings {
  pushNotifications: boolean;
  emailDigests: boolean;
  directMessages: boolean;
  eventReminders: boolean;
  jobOpportunities?: boolean;
}

export interface GalleryItem {
  id: string;
  category: 'campus' | 'homecoming' | 'commencement' | 'heritage';
  title: string;
  year: string;
  url: string;
  description?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploaderRole?: UserRole;
  createdAt?: string;
}

export interface FeedComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface InstitutionalFeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'registrar' | 'staff' | 'moderator' | 'alumni';
  authorAvatar: string;
  postType: 'milestone' | 'gallery' | 'announcement';
  title: string;
  content: string;
  imageUrl?: string;
  milestoneBadge?: string;
  likes: string[]; // array of user UIDs who liked
  hearts?: string[]; // array of user UIDs who reacted with a heart
  comments: FeedComment[];
  sharesCount: number;
  createdAt: string;
  isPinned?: boolean;
  tags?: string[];
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastNotification {
  id: string;
  message: string;
  type: ToastType;
}

export interface StudentVerificationRecord {
  id?: string;
  studentId: string;
  fullName: string;
  batchYear: string;
  course: string;
  status?: 'Graduated' | 'Enrolled' | 'Alumni' | 'unverified' | 'duplicate';
  honors?: string;
  verifiedAt?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  graduationStatus?: string;
  latinHonors?: string;
  isRegistered?: boolean;
  registeredAt?: string;
  matchedUid?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  sourceFile?: string;
  verification_status?: string;
}

export interface RegistrarVerificationResult {
  isVerified: boolean;
  status: 'verified' | 'unconfirmed' | 'format_error' | 'not_found';
  message: string;
  studentId?: string;
  record?: StudentVerificationRecord;
}

export interface RegistrationConflictRecord {
  id: string;
  applicantUid?: string;
  applicantName: string;
  applicantEmail: string;
  applicantStudentId?: string;
  applicantBatch?: string;
  applicantCourse?: string;
  targetRegistryStudentId?: string;
  registryRecord?: StudentVerificationRecord;
  conflictType:
    | 'name_mismatch'
    | 'duplicate_id'
    | 'email_mismatch'
    | 'batch_discrepancy'
    | 'partial_match'
    | 'unlisted_record'
    | 'manual_verification_request'
    | 'claimed_id_dispute';
  severity: 'high' | 'medium' | 'low';
  confidenceScore: number;
  flaggedAt: string;
  status: 'pending' | 'resolved_verified' | 'resolved_rejected' | 'dismissed';
  notes: string;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// ==========================================
// ALUMNI MANAGEMENT AUTOMATIONS INTERFACES
// ==========================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  category: 'alumni_registration' | 'career' | 'communication' | 'engagement' | 'security' | 'admin' | 'registry_masterlist' | 'conflict_resolution' | 'settings' | 'alumni_verification' | 'user_management';
  details: string;
  severity: 'info' | 'warning' | 'alert' | 'success';
  ipAddress?: string;
  targetRecordId?: string;
}

export interface AutomationJob {
  id: string;
  name: string;
  category: 'alumni' | 'career' | 'communication' | 'engagement' | 'security' | 'admin';
  description: string;
  lastRun: string;
  status: 'active' | 'scheduled' | 'running';
  triggerCount: number;
  frequency: string;
  nextRun: string;
}

export interface CareerSurveyResponse {
  id: string;
  uid: string;
  userName: string;
  batch: string;
  course: string;
  employmentStatus: 'Employed' | 'Self-employed' | 'Unemployed' | 'Student' | 'Retired';
  industry: string;
  jobTitle: string;
  company: string;
  relevanceToDegree: 'Directly Related' | 'Somewhat Related' | 'Not Related';
  salaryRange: string;
  milestoneAfterGraduation: '6 months' | '1 year' | '3 years' | '5 years';
  feedback: string;
  submittedAt: string;
}

export interface AlumniReportSummary {
  id: string;
  title: string;
  period: 'monthly' | 'yearly' | 'ad-hoc';
  generatedAt: string;
  totalAlumni: number;
  verifiedRate: number; // percentage e.g. 92
  employmentRate: number; // percentage e.g. 88
  topIndustries: { industry: string; count: number; percentage: number }[];
  batchDistribution: { batch: string; count: number }[];
  geographicDistribution: { region: string; count: number }[];
  activeEngagementRate: number;
}

export interface DuplicateRecordFlag {
  id: string;
  primaryUid: string;
  primaryName: string;
  potentialDuplicateUid: string;
  potentialDuplicateName: string;
  matchCriteria: 'studentId' | 'email' | 'name' | 'phone';
  confidenceScore: number; // e.g. 95
  detectedAt: string;
  status: 'open' | 'resolved' | 'dismissed';
}

export interface IncompleteRecordFlag {
  uid: string;
  name: string;
  batch?: string;
  email: string;
  missingFields: string[];
  completionPercentage: number;
  lastReminderSentAt?: string;
}

export interface JobMatchResult {
  opportunityId: string;
  title: string;
  company: string;
  matchScore: number; // 0 - 100
  matchingSkills: string[];
  courseAlignment: boolean;
  locationAlignment: boolean;
}

export interface DatabaseBackupSnapshot {
  id: string;
  timestamp: string;
  recordCount: number;
  sizeKb: number;
  status: 'completed' | 'verified' | 'restored';
  type: 'automated' | 'manual';
}


