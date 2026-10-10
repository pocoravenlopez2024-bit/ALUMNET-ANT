import {
  UserProfile,
  FriendRequest,
  ChatThread,
  ChatMessage,
  AppNotification,
  AlumniEvent,
  EventReservation,
  Announcement,
  Opportunity,
  JobApplication,
  Chapter,
  CareerMilestone,
  GalleryItem,
  AuditLogEntry,
  AutomationJob,
  CareerSurveyResponse,
  DatabaseBackupSnapshot,
  InstitutionalFeedPost
} from '../types';

/**
 * Official Seed Accounts for St. Cecilia's College Deployment
 * Pristine, verified credentials for every system role.
 */
export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'usr_superadmin_cecilia',
    name: 'Dr. Emmanuel C. Salcedo',
    email: 'superadmin@stcecilia.edu.ph',
    password: 'Password123!',
    role: 'superadmin',
    batch: '2010',
    course: 'PhD in Educational Technology & Systems Administration',
    location: 'St. Cecilia’s Executive Complex, Minglanilla, Cebu',
    profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
    headline: 'Executive Systems Administrator & Chief Information Officer',
    about: 'Chief system architect overseeing data governance, emergency administrative controls, platform security, and digital longevity for the St. Cecilia’s College network.',
    phone: '+63 917 111 2001',
    employeeId: 'SCC-SUP-001',
    department: 'Office of the Executive President & IT Directorate',
    isVerified: true,
    followersCount: 28,
    followingCount: 14,
    connectionsCount: 12,
    experience: [
      {
        id: 'exp_exec_1',
        title: 'Executive Director of Institutional Technology',
        company: 'St. Cecilia’s College - Cebu, Inc.',
        location: 'Executive Campus',
        startDate: '2015-06',
        current: true,
        description: 'Directing enterprise infrastructure, multi-role RBAC architecture, and centenary archives.'
      }
    ],
    education: [
      {
        id: 'edu_exec_1',
        degree: 'Doctor of Philosophy in Educational Technology & Systems',
        institution: 'St. Cecilia’s College',
        fieldOfStudy: 'Educational Systems',
        startYear: '2006',
        endYear: '2010',
        honors: 'Summa Cum Laude'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_admin_cecilia',
    name: 'Prof. Teresa B. Carreon',
    email: 'admin@stcecilia.edu.ph',
    password: 'Password123!',
    role: 'admin',
    batch: '2014',
    course: 'Master of Arts in Educational Management',
    location: 'St. Cecilia’s Campus, Administration Hall',
    profilePictureUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
    headline: 'Director of Alumni Affairs & Institutional Advancement',
    about: 'Leading global alumni engagement, campus reunions, regional chapter charters, and institutional endowments at St. Cecilia’s College.',
    phone: '+63 917 222 3002',
    employeeId: 'SCC-ADM-002',
    department: 'Institutional Advancement & Alumni Operations',
    isVerified: true,
    followersCount: 45,
    followingCount: 26,
    connectionsCount: 24,
    experience: [
      {
        id: 'exp_adm_1',
        title: 'Director of Alumni Relations',
        company: 'St. Cecilia’s College',
        location: 'Administration Hall',
        startDate: '2017-04',
        current: true,
        description: 'Managing alumni engagement initiatives, corporate accreditation, and institutional development.'
      }
    ],
    education: [
      {
        id: 'edu_adm_1',
        degree: 'Master of Arts in Educational Management',
        institution: 'St. Cecilia’s College',
        fieldOfStudy: 'Educational Management',
        startYear: '2010',
        endYear: '2014',
        honors: 'Magna Cum Laude'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_registrar_cecilia',
    name: 'Atty. Dominic R. Villacarlos',
    email: 'registrar@stcecilia.edu.ph',
    password: 'Password123!',
    role: 'registrar',
    batch: '2015',
    course: 'Bachelor of Laws (LL.B.) / Records Management',
    location: 'St. Cecilia’s Campus, Office of the University Registrar',
    profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
    headline: 'University Registrar • Academic Masterlist & Verification Authority',
    about: 'Primary authority for graduation archives, student ID verifications, academic masterlist maintenance, commencement diplomas, and registration dispute resolutions.',
    phone: '+63 917 333 4003',
    employeeId: 'SCC-REG-003',
    department: 'Office of the University Registrar',
    isVerified: true,
    followersCount: 32,
    followingCount: 18,
    connectionsCount: 16,
    experience: [
      {
        id: 'exp_reg_1',
        title: 'Head University Registrar',
        company: 'St. Cecilia’s College',
        location: 'Registrar Hall',
        startDate: '2018-02',
        current: true,
        description: 'Directing the academic registry, student record verifications, and graduation certifications.'
      }
    ],
    education: [
      {
        id: 'edu_reg_1',
        degree: 'Bachelor of Laws (LL.B.) & Records Administration',
        institution: 'St. Cecilia’s College',
        fieldOfStudy: 'Law & Records',
        startYear: '2011',
        endYear: '2015',
        honors: 'Cum Laude'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_staff_cecilia',
    name: 'Bernadette M. Castro',
    email: 'staff@stcecilia.edu.ph',
    password: 'Password123!',
    role: 'staff',
    batch: '2019',
    course: 'BS in Hospitality Management',
    location: 'St. Cecilia’s Campus, Student & Alumni Activity Center',
    profilePictureUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
    headline: 'Alumni Affairs Logistics Officer & Campus Event Coordinator',
    about: 'Coordinating event logistics for grand reunions, campus assemblies, attendee check-ins, regional chapter meetups, and campus gallery curation.',
    phone: '+63 917 444 5004',
    employeeId: 'SCC-STF-004',
    department: 'Campus Operations, Logistics & Regional Chapters',
    isVerified: true,
    followersCount: 48,
    followingCount: 32,
    connectionsCount: 30,
    experience: [
      {
        id: 'exp_stf_1',
        title: 'Events & Logistics Coordinator',
        company: 'St. Cecilia’s College',
        location: 'Campus Activity Center',
        startDate: '2020-01',
        current: true,
        description: 'Managing alumni reunions, operational announcements, and regional chapter coordination.'
      }
    ],
    education: [
      {
        id: 'edu_stf_1',
        degree: 'Bachelor of Science in Hospitality Management',
        institution: 'St. Cecilia’s College',
        fieldOfStudy: 'Hospitality Management',
        startYear: '2015',
        endYear: '2019'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_moderator_cecilia',
    name: 'Engr. Christian Dave Oporto',
    email: 'moderator@stcecilia.edu.ph',
    password: 'Password123!',
    role: 'moderator',
    batch: '2020',
    course: 'BS in Information Technology',
    location: 'Minglanilla / Talisay City, Cebu',
    profilePictureUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    headline: 'Community Standards & Career Placement Review Officer',
    about: 'Dedicated to community safety, reviewing job opportunities and employer listings, ensuring compliance with institutional standards, and moderating public discussions.',
    phone: '+63 917 555 6005',
    employeeId: 'SCC-MOD-005',
    department: 'Community Standards & Career Placement Bureau',
    isVerified: true,
    followersCount: 35,
    followingCount: 22,
    connectionsCount: 20,
    experience: [
      {
        id: 'exp_mod_1',
        title: 'Community Standards Officer',
        company: 'St. Cecilia’s College Alumni Council',
        location: 'Minglanilla, Cebu',
        startDate: '2021-03',
        current: true,
        description: 'Reviewing job postings, moderating discussion forums, and resolving community reports.'
      }
    ],
    education: [
      {
        id: 'edu_mod_1',
        degree: 'Bachelor of Science in Information Technology',
        institution: 'St. Cecilia’s College',
        fieldOfStudy: 'Information Technology',
        startYear: '2016',
        endYear: '2020'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_employer_cecilia',
    name: 'Celeste V. Ramirez',
    email: 'employer@stcecilia.edu.ph',
    password: 'Password123!',
    role: 'employer',
    batch: 'N/A',
    course: 'Corporate Industry Partner',
    location: 'Cebu IT Park, Lahug, Cebu City',
    profilePictureUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
    headline: 'VP of Global Talent Acquisition • MetroCebu InnovateCorp',
    about: 'Official accredited recruitment partner actively hiring St. Cecilia’s College graduates in engineering, cloud infrastructure, and business development.',
    phone: '+63 32 388 9200',
    company: 'MetroCebu InnovateCorp',
    industry: 'Software Engineering & Digital Transformation',
    employerVerificationStatus: 'verified',
    employerStatus: 'active',
    employerExpirationDate: '2028-12-31T23:59:59.000Z',
    canPostJobs: true,
    isVerified: true,
    followersCount: 62,
    followingCount: 15,
    connectionsCount: 30,
    experience: [],
    education: [],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_alumni_cecilia_01',
    name: 'Julian Marc S. Villareal',
    email: 'alumni@stcecilia.edu.ph',
    password: 'Password123!',
    role: 'alumni',
    batch: '2023',
    course: 'BS in Information Technology',
    studentId: 'SCC-2019-1082',
    alumniId: 'SCC-ALUM-2023-1082',
    location: 'Cebu City, Philippines',
    profilePictureUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    headline: 'Lead Full-Stack Cloud Engineer • Archipelagic Systems • Class of 2023',
    about: 'BSIT 2023 Magna Cum Laude graduate specializing in distributed cloud infrastructure, microservices, and Kubernetes. Passionate mentor in the Cecilian coding community.',
    phone: '+63 917 777 8007',
    company: 'Archipelagic Cloud Systems',
    currentPosition: 'Lead Full-Stack Cloud Engineer',
    industry: 'Cloud Computing & IT',
    isVerified: true,
    isProfileSetupCompleted: true,
    profileCompleted: true,
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
    experience: [],
    education: [],
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [];
export const INITIAL_CHATS: ChatThread[] = [];
export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_EVENTS: AlumniEvent[] = [];
export const INITIAL_RESERVATIONS: EventReservation[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_OPPORTUNITIES: Opportunity[] = [];
export const INITIAL_JOB_APPLICATIONS: JobApplication[] = [];
export const INITIAL_CHAPTERS: Chapter[] = [];
export const INITIAL_MILESTONES: CareerMilestone[] = [];
export const INITIAL_GALLERY_ITEMS: GalleryItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_deploy_init',
    timestamp: new Date().toISOString(),
    action: 'System Initialized for Production',
    actorId: 'usr_superadmin_cecilia',
    actorName: 'Dr. Emmanuel C. Salcedo',
    actorRole: 'superadmin',
    category: 'admin',
    details: 'St. Cecilia’s College Alumni Portal initialized with clean production baseline for user testing.',
    severity: 'success',
    ipAddress: '127.0.0.1'
  }
];

export const INITIAL_AUTOMATION_JOBS: AutomationJob[] = [
  {
    id: 'job_reg_verifier',
    name: 'Automatic Alumni Registrar Verification & Approval',
    category: 'alumni',
    description: 'Matches incoming registrations against accredited St. Cecilia’s College registrar records and auto-approves verified graduates.',
    lastRun: new Date().toISOString(),
    status: 'active',
    triggerCount: 0,
    frequency: 'Instant / Event-Driven',
    nextRun: 'Listening on new registration'
  }
];

export const INITIAL_CAREER_SURVEYS: CareerSurveyResponse[] = [];
export const INITIAL_BACKUPS: DatabaseBackupSnapshot[] = [];
export const INITIAL_FEED_POSTS: InstitutionalFeedPost[] = [];

