import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Megaphone,
  UserCheck,
  UserPlus,
  Clock,
  ChevronRight,
  Check,
  X,
  Sparkles,
  AlertCircle,
  MapPin,
  Building2,
  Users,
  Eye,
  ArrowRight,
  Briefcase,
  GraduationCap,
  DollarSign,
  Radio
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { AlumniEvent, Announcement, FriendRequest, Opportunity, UserProfile } from '../../types';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';
import { Skeleton } from '../common/BentoSkeleton';

interface RecentActivityFeedProps {
  onOpenAnnouncement?: (announcement: Announcement) => void;
  onOpenEventModal?: (event: AlumniEvent) => void;
  onOpenOpportunity?: (opportunity: Opportunity) => void;
  isLoading?: boolean;
}

type ActivityType = 'event' | 'opportunity' | 'alumni_registration' | 'announcement' | 'connection_request';

interface ActivityItem {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO date
  dateObj: Date;
  title: string;
  subtitle?: string;
  contentSnippet?: string;
  badgeText?: string;
  badgeVariant?: 'blue' | 'amber' | 'emerald' | 'red' | 'purple' | 'indigo';
  isUrgent?: boolean;
  avatarUrl?: string;
  eventData?: AlumniEvent;
  opportunityData?: Opportunity;
  announcementData?: Announcement;
  friendRequestData?: {
    request: FriendRequest;
    sender?: UserProfile;
  };
  userData?: UserProfile;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  onOpenAnnouncement,
  onOpenEventModal,
  onOpenOpportunity,
  isLoading: propIsLoading
}) => {
  const {
    currentUser,
    events,
    opportunities,
    announcements,
    friendRequests,
    users,
    acceptFriendRequest,
    declineFriendRequest,
    rsvpEvent,
    sendFriendRequest,
    hasPendingRequestWith,
    isConnected,
    setActiveTab,
    setSelectedUserIdForModal,
    isLoadingData
  } = useAlumni();

  const isLoading = propIsLoading ?? isLoadingData;

  const [filter, setFilter] = useState<'all' | 'event' | 'opportunity' | 'alumni' | 'announcement'>('all');
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Format relative time helper
  const getRelativeTime = (date: any): string => {
    try {
      if (!date) return 'Recently';
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'Recently';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Build unified chronological activity items
  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // 1. Events Activities
    events.forEach((evt) => {
      const evtStartDate = new Date(evt.startDate);
      const isFuture = evtStartDate.getTime() >= Date.now();

      items.push({
        id: `act_evt_${evt.id}`,
        type: 'event',
        timestamp: evt.startDate,
        dateObj: evtStartDate,
        title: evt.title,
        subtitle: `${evt.isVirtual ? 'Virtual Webinar' : evt.location} • ${evt.attendeesCount} alumni attending`,
        contentSnippet: evt.description,
        badgeText: isFuture ? 'Upcoming Campus Event' : 'Recent Event',
        badgeVariant: evt.isImportant ? 'red' : 'blue',
        isUrgent: evt.isImportant,
        eventData: evt
      });
    });

    // 2. Job Opportunities Activities
    const approvedOpportunities = opportunities.filter(
      (opp) => !opp.approvalStatus || opp.approvalStatus === 'approved'
    );
    approvedOpportunities.forEach((opp) => {
      const oppDate = new Date(opp.createdAt || Date.now());

      items.push({
        id: `act_opp_${opp.id}`,
        type: 'opportunity',
        timestamp: opp.createdAt || new Date().toISOString(),
        dateObj: oppDate,
        title: `${opp.title} at ${opp.company}`,
        subtitle: `${opp.type} • ${opp.location} • ${opp.salaryOrStipend || 'Competitive Rate'}`,
        contentSnippet: opp.description,
        badgeText: `Hiring: ${opp.type}`,
        badgeVariant: 'indigo',
        opportunityData: opp
      });
    });

    // 3. New Alumni Registrations
    const registeredAlumni = users
      .filter((u) => u.role === 'alumni' && u.uid !== currentUser?.uid)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    registeredAlumni.forEach((alum) => {
      const joinDate = new Date(alum.createdAt || Date.now());
      items.push({
        id: `act_reg_${alum.uid}`,
        type: 'alumni_registration',
        timestamp: alum.createdAt || new Date().toISOString(),
        dateObj: joinDate,
        title: `${alum.name} joined the St. Cecilia Alumni Directory`,
        subtitle: `Class of ${alum.batch || 'Alumni'} • ${alum.course || 'Degree Graduate'}`,
        contentSnippet: alum.headline || alum.about || 'Newly registered Cecilian alumnus.',
        badgeText: alum.batch && currentUser?.batch && alum.batch === currentUser.batch
          ? `Batch ${currentUser.batch} Alum`
          : 'New Registration',
        badgeVariant: 'purple',
        avatarUrl: alum.profilePictureUrl,
        userData: alum
      });
    });

    // 4. Announcements Activities
    announcements.forEach((ann) => {
      const pubDate = new Date(ann.publishedAt || Date.now());

      items.push({
        id: `act_ann_${ann.id}`,
        type: 'announcement',
        timestamp: ann.publishedAt || new Date().toISOString(),
        dateObj: pubDate,
        title: ann.title,
        subtitle: `${ann.authorName || 'Alumni Affairs'} • ${ann.category || 'Institutional Advisory'}`,
        contentSnippet: ann.content,
        badgeText: ann.urgent ? 'URGENT NOTICE' : ann.important ? 'Important' : 'Announcement',
        badgeVariant: ann.urgent ? 'red' : ann.important ? 'amber' : 'emerald',
        isUrgent: ann.urgent || ann.important,
        announcementData: ann
      });
    });

    // 5. Incoming Connection Requests for current user
    if (currentUser) {
      friendRequests
        .filter((r) => r.toUid === currentUser.uid && r.status === 'pending')
        .forEach((req) => {
          const sender = users.find((u) => u.uid === req.fromUid);
          const reqDate = new Date(req.createdAt || Date.now());

          items.push({
            id: `act_req_${req.id}`,
            type: 'connection_request',
            timestamp: req.createdAt || new Date().toISOString(),
            dateObj: reqDate,
            title: `${sender?.name || 'Fellow Alumnus'} sent you a connection request`,
            subtitle: `Class of ${sender?.batch || 'Alumni'} • ${sender?.course || 'Degree Graduate'}`,
            contentSnippet: sender?.headline || 'Interested in connecting with fellow Cecilian graduates.',
            badgeText: 'Pending Connection',
            badgeVariant: 'amber',
            avatarUrl: sender?.profilePictureUrl,
            friendRequestData: {
              request: req,
              sender
            }
          });
        });
    }

    // Sort descending by recency
    return items.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [events, opportunities, announcements, friendRequests, users, currentUser]);

  // Filter items
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activityItems;
    if (filter === 'event') return activityItems.filter((i) => i.type === 'event');
    if (filter === 'opportunity') return activityItems.filter((i) => i.type === 'opportunity');
    if (filter === 'alumni') {
      return activityItems.filter(
        (i) => i.type === 'alumni_registration' || i.type === 'connection_request'
      );
    }
    if (filter === 'announcement') return activityItems.filter((i) => i.type === 'announcement');
    return activityItems;
  }, [activityItems, filter]);

  // Display only top highlights by default to prevent long feed scrolling
  const displayedActivities = useMemo(() => {
    if (showAllActivities) return filteredActivities;
    return filteredActivities.slice(0, 4);
  }, [filteredActivities, showAllActivities]);

  const eventCount = useMemo(() => activityItems.filter((i) => i.type === 'event').length, [activityItems]);
  const jobCount = useMemo(() => activityItems.filter((i) => i.type === 'opportunity').length, [activityItems]);
  const alumniCount = useMemo(() => activityItems.filter((i) => i.type === 'alumni_registration').length, [activityItems]);
  const announcementCount = useMemo(() => activityItems.filter((i) => i.type === 'announcement').length, [activityItems]);

  if (isLoading) {
    return (
      <div className="relative w-full max-w-full overflow-x-hidden bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_12px_28px_rgba(0,0,0,0.03)]">
        <div className="h-1 bg-gradient-to-r from-[#8B181B] via-[#B45309] to-stone-200" />
        <div className="p-4 sm:p-5 md:p-6 border-b border-stone-100 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
            <Skeleton className="h-3 w-80 rounded" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 sm:p-4 rounded-xl border border-stone-150 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-2.5 w-14 rounded" />
                  </div>
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-1/2 rounded" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-lg shrink-0 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-full overflow-x-hidden bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_12px_28px_rgba(0,0,0,0.03)]">
      {/* Subtle Institutional Crimson Top Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B181B] via-[#B45309] to-stone-200 z-10" />

      {/* Feed Header with Real-Time Indicator (Redesigned with Institutional Craftsmanship) */}
      <div className="p-4 sm:p-5 md:p-6 pt-5 pb-5 border-b border-stone-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 bg-gradient-to-r from-[#FAF9F6] via-white to-white w-full max-w-full overflow-x-hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#8B181B] border border-red-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <Radio className="w-4 h-4 stroke-[1.75]" />
            </div>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-stone-900 tracking-tight break-words">
              Recent Activity Feed
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50/90 text-emerald-800 border border-emerald-200/80 shrink-0 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Ledger Sync</span>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 mt-1 break-words leading-relaxed">
            Aggregated stream of campus convocations, career placements, and recent Cecilian registrations
          </p>
        </div>

        {/* Filter Chips with Precision Segmented Styling */}
        <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl shrink-0 self-start lg:self-center overflow-x-auto max-w-full border border-stone-200/60">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Activity ({activityItems.length})
          </button>

          <button
            onClick={() => setFilter('event')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === 'event'
                ? 'bg-white text-blue-800 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Events ({eventCount})</span>
          </button>

          <button
            onClick={() => setFilter('opportunity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === 'opportunity'
                ? 'bg-white text-indigo-800 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Jobs ({jobCount})</span>
          </button>

          <button
            onClick={() => setFilter('alumni')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === 'alumni'
                ? 'bg-white text-purple-800 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Alumni ({alumniCount})</span>
          </button>

          <button
            onClick={() => setFilter('announcement')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === 'announcement'
                ? 'bg-white text-[#8B181B] shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Notices ({announcementCount})</span>
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="divide-y divide-stone-100">
        {filteredActivities.length === 0 ? (
          <div className="p-10 text-center text-stone-500">
            <Clock className="w-8 h-8 text-stone-300 mx-auto mb-2 stroke-[1.5]" />
            <p className="text-xs font-bold text-stone-700">No recent activities in this category</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Check back soon for new community happenings or switch to All Activity.
            </p>
          </div>
        ) : (
          displayedActivities.map((item) => {
            const timeAgo = getRelativeTime(item.dateObj);

            // 1. EVENT POSTING
            if (item.type === 'event' && item.eventData) {
              const evt = item.eventData;
              const evtDate = new Date(evt.startDate);
              const isGoing = evt.userRsvp === 'going';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-stone-50/70 transition-colors duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-12 rounded-xl bg-stone-50 border border-stone-200/90 flex flex-col items-center justify-center text-blue-900 shrink-0 shadow-2xs group-hover:border-blue-300 transition-colors">
                      {(() => {
                        const isValid = !isNaN(evtDate.getTime());
                        return (
                          <>
                            <span className="text-[9px] font-extrabold uppercase leading-none text-blue-700">
                              {isValid ? evtDate.toLocaleString('default', { month: 'short' }) : 'EVT'}
                            </span>
                            <span className="text-sm font-extrabold leading-tight text-stone-900 font-mono mt-0.5">
                              {isValid ? evtDate.getDate() : '--'}
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200/60">
                          {evt.type ? evt.type.toUpperCase() : 'CAMPUS CONVOCATION'}
                        </span>
                        {evt.isImportant && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200/60 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5 stroke-[2]" />
                            Priority
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 stroke-[1.75]" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => {
                          if (onOpenEventModal) onOpenEventModal(evt);
                          else setActiveTab('events');
                        }}
                        className="text-xs sm:text-sm md:text-[15px] font-bold text-stone-900 mt-1 group-hover:text-[#8B181B] cursor-pointer truncate break-words transition-colors"
                      >
                        {evt.title}
                      </h3>

                      <p className="hidden sm:block text-[11px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1 break-words">
                        {evt.isVirtual ? 'Virtual Webinar' : evt.location} • <span className="font-semibold text-blue-800">{evt.attendeesCount} alumni confirmed</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => rsvpEvent(evt.id, isGoing ? 'not_going' : 'going')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isGoing
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2]" />
                      <span>{isGoing ? 'Attending' : 'RSVP'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenEventModal) onOpenEventModal(evt);
                        else setActiveTab('events');
                      }}
                      className="hidden sm:flex px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80 rounded-lg text-xs font-semibold transition-colors items-center gap-1 cursor-pointer"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>
                  </div>
                </div>
              );
            }

            // 2. JOB OPPORTUNITY POSTING
            if (item.type === 'opportunity' && item.opportunityData) {
              const opp = item.opportunityData;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-stone-50/70 transition-colors duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-12 rounded-xl bg-stone-50 border border-stone-200/90 flex items-center justify-center text-indigo-800 shrink-0 shadow-2xs group-hover:border-indigo-300 transition-colors">
                      <Briefcase className="w-5 h-5 stroke-[1.75]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                          {opp.type || 'CAREER'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 text-stone-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-stone-500 stroke-[1.75]" />
                          {opp.company}
                        </span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 stroke-[1.75]" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => {
                          if (onOpenOpportunity) onOpenOpportunity(opp);
                          else setActiveTab('opportunities');
                        }}
                        className="text-xs sm:text-sm md:text-[15px] font-bold text-stone-900 mt-1 group-hover:text-indigo-800 cursor-pointer truncate break-words transition-colors"
                      >
                        {opp.title}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1 break-words">
                        {opp.location} • <span className="font-semibold text-emerald-700">{opp.salaryOrStipend || 'Competitive Salary'}</span> • {opp.requiredCourse || 'Open to all graduates'}
                      </p>

                      {opp.skills && opp.skills.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {opp.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-medium rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                          {opp.skills.length > 3 && (
                            <span className="text-[10px] text-stone-400 font-medium">
                              +{opp.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        if (onOpenOpportunity) onOpenOpportunity(opp);
                        else setActiveTab('opportunities');
                      }}
                      className="px-3.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <span>View & Apply</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  </div>
                </div>
              );
            }

            // 3. NEW ALUMNI REGISTRATION
            if (item.type === 'alumni_registration' && item.userData) {
              const alum = item.userData;
              const reqStatus = hasPendingRequestWith(alum.uid);
              const connected = isConnected(alum.uid);

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-stone-50/70 transition-colors duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={getUserAvatar(alum.profilePictureUrl)}
                      alt={alum.name}
                      onError={handleUserAvatarError}
                      onClick={() => setSelectedUserIdForModal(alum.uid)}
                      className="w-11 h-11 rounded-full object-cover border border-stone-200/90 shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200/60 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 stroke-[1.75]" />
                          {item.badgeText}
                        </span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 stroke-[1.75]" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedUserIdForModal(alum.uid)}
                        className="text-xs sm:text-sm md:text-[15px] font-bold text-stone-900 mt-1 group-hover:text-[#8B181B] cursor-pointer truncate break-words transition-colors"
                      >
                        {alum.name}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 truncate break-words">
                        Batch {alum.batch || 'Alumni'} • {alum.course || 'Graduate'} {alum.location ? `• ${alum.location}` : ''}
                      </p>

                      {alum.headline && (
                        <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 truncate max-w-md break-words">
                          {alum.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUserIdForModal(alum.uid)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Profile
                    </button>

                    {connected ? (
                      <span className="px-3 py-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[2]" />
                        Connected
                      </span>
                    ) : reqStatus === 'sent' ? (
                      <span className="px-3 py-1.5 text-xs text-stone-500 bg-stone-100 rounded-lg">
                        Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(alum.uid)}
                        className="px-3.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                      >
                        <UserPlus className="w-3.5 h-3.5 stroke-[1.75]" />
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // 4. ANNOUNCEMENT
            if (item.type === 'announcement' && item.announcementData) {
              const ann = item.announcementData;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 transition-colors duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                    ann.urgent ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-stone-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        ann.urgent
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-red-50 text-[#8B181B] border border-red-200/80'
                      }`}
                    >
                      <Megaphone className="w-5 h-5 stroke-[1.75]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ann.urgent ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5 stroke-[2]" />
                            URGENT ADVISORY
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-700 uppercase">
                            {ann.category || 'Institutional Bulletin'}
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 stroke-[1.75]" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => onOpenAnnouncement && onOpenAnnouncement(ann)}
                        className="text-xs sm:text-sm md:text-[15px] font-bold text-stone-900 mt-1 group-hover:text-[#8B181B] cursor-pointer truncate break-words transition-colors"
                      >
                        {ann.title}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1 max-w-xl break-words">
                        {ann.content}
                      </p>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onOpenAnnouncement && onOpenAnnouncement(ann)}
                      className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Read Advisory</span>
                      <ChevronRight className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>
                  </div>
                </div>
              );
            }

            // 5. CONNECTION REQUEST
            if (item.type === 'connection_request' && item.friendRequestData) {
              const { request, sender } = item.friendRequestData;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 bg-amber-50/40 hover:bg-amber-50/70 transition-colors duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={getUserAvatar(sender?.profilePictureUrl)}
                      alt={sender?.name || 'Alumnus'}
                      onError={handleUserAvatarError}
                      onClick={() => sender && setSelectedUserIdForModal(sender.uid)}
                      className="w-11 h-11 rounded-full object-cover border border-amber-300 shrink-0 cursor-pointer shadow-2xs"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/80">
                          Connection Request
                        </span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 stroke-[1.75]" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => sender && setSelectedUserIdForModal(sender.uid)}
                        className="text-xs sm:text-sm md:text-[15px] font-bold text-stone-900 mt-1 hover:text-[#8B181B] cursor-pointer break-words transition-colors"
                      >
                        {sender?.name} wants to connect with you
                      </h3>

                      <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5 truncate break-words">
                        Batch {sender?.batch} • {sender?.course}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => acceptFriendRequest(request.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => declineFriendRequest(request.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            }

            return null;
          })
        )}
      </div>

      {/* Show More / Top Highlights Toggle Button (Redesigned Drawer Control) */}
      {filteredActivities.length > 4 && (
        <div className="p-3 sm:p-3.5 text-center border-t border-stone-100 bg-[#FAF9F6] flex items-center justify-center">
          <button
            type="button"
            onClick={() => setShowAllActivities(!showAllActivities)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#8B181B] hover:text-[#721316] bg-white border border-stone-200/90 hover:border-red-200 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <span>
              {showAllActivities
                ? 'Show Top Highlights Only'
                : `View More Activities (${filteredActivities.length - 4} more)`}
            </span>
            <ChevronRight
              className={`w-3.5 h-3.5 stroke-[2] transition-transform duration-200 ${
                showAllActivities ? '-rotate-90' : 'rotate-90'
              }`}
            />
          </button>
        </div>
      )}

      {/* Feed Footer (Redesigned with Collegiate Precision) */}
      <div className="p-4 sm:p-4.5 bg-stone-50/70 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-stone-600">Live institutional ledger synchronized with campus activity</span>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <button
            onClick={() => setActiveTab('events')}
            className="text-stone-700 hover:text-[#8B181B] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Events Calendar</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>
          <span className="text-stone-300">·</span>
          <button
            onClick={() => setActiveTab('opportunities')}
            className="text-stone-700 hover:text-[#8B181B] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Career Board</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>
          <span className="text-stone-300">·</span>
          <button
            onClick={() => setActiveTab('network')}
            className="text-stone-700 hover:text-[#8B181B] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Alumni Directory</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
};

