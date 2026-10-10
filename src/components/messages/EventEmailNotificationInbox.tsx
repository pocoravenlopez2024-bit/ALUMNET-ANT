import React, { useState, useMemo } from 'react';
import {
  Mail,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  CalendarCheck,
  Star,
  Printer,
  Download,
  ExternalLink,
  Ticket,
  Video,
  ShieldCheck,
  Search,
  Check,
  ArrowRight,
  Info,
  CalendarPlus,
  RefreshCw
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { AlumniEvent } from '../../types';

interface EventEmailNotification {
  id: string;
  eventId: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  recipientName: string;
  sentDate: string;
  read: boolean;
  starred: boolean;
  urgency: 'high' | 'normal' | 'reminder';
  type: 'confirmation' | 'reminder' | 'update' | 'welcome';
  event: AlumniEvent;
  rsvpStatus: 'going' | 'interested' | 'not_registered';
}

export const EventEmailNotificationInbox: React.FC = () => {
  const { currentUser, events, rsvpEvent, setActiveTab, showToast } = useAlumni();

  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'registered' | 'unread' | 'starred'>('all');
  const [readState, setReadState] = useState<Record<string, boolean>>({});
  const [starredState, setStarredState] = useState<Record<string, boolean>>({});

  // Registered events for current user
  const userRegisteredEvents = useMemo(() => {
    if (!currentUser) return [];
    return events.filter((e) => {
      const isUserGoing = e.userRsvp === 'going' || e.userRsvp === 'interested';
      const isUserInAttendees = e.attendees?.some(
        (a) => a.uid === currentUser.uid && (a.status as string) !== 'not_going'
      );
      return isUserGoing || isUserInAttendees;
    });
  }, [events, currentUser]);

  // Construct official email-style dispatches based on events
  const emailNotifications = useMemo<EventEmailNotification[]>(() => {
    const list: EventEmailNotification[] = [];
    const now = new Date();

    // 1. If user has registered events, create targeted official email notices for each
    userRegisteredEvents.forEach((ev) => {
      const evDate = new Date(ev.startDate);
      const diffDays = Math.ceil((evDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const userStatus: 'going' | 'interested' = ev.userRsvp === 'interested' ? 'interested' : 'going';

      // Primary confirmation & pass email
      list.push({
        id: `email-reg-${ev.id}`,
        eventId: ev.id,
        subject: `[CONFIRMED PASS] Your Official Registration for ${ev.title}`,
        senderName: "Office of Alumni Affairs • St. Cecilia's College",
        senderEmail: 'events@alumni.stcecilia.edu',
        recipientEmail: currentUser?.email || 'alumni@stcecilia.edu',
        recipientName: currentUser?.name || 'Valued Cecilian Alum',
        sentDate: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
        read: readState[`email-reg-${ev.id}`] ?? false,
        starred: starredState[`email-reg-${ev.id}`] ?? true,
        urgency: 'high',
        type: 'confirmation',
        event: ev,
        rsvpStatus: userStatus
      });

      // If event is coming up soon (within 30 days), generate countdown reminder dispatch
      if (diffDays >= 0 && diffDays <= 30) {
        list.push({
          id: `email-remind-${ev.id}`,
          eventId: ev.id,
          subject: `[UPCOMING IN ${diffDays === 0 ? 'TODAY' : `${diffDays} DAYS`}] Logistics & Schedule for ${ev.title}`,
          senderName: "Event Committee • St. Cecilia's College",
          senderEmail: 'notifications@stcecilia.edu',
          recipientEmail: currentUser?.email || 'alumni@stcecilia.edu',
          recipientName: currentUser?.name || 'Valued Cecilian Alum',
          sentDate: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
          read: readState[`email-remind-${ev.id}`] ?? false,
          starred: starredState[`email-remind-${ev.id}`] ?? false,
          urgency: diffDays <= 3 ? 'high' : 'reminder',
          type: 'reminder',
          event: ev,
          rsvpStatus: userStatus
        });
      }
    });

    // 2. Also provide institutional invitation dispatches for other upcoming events
    const otherUpcoming = events.filter(
      (e) => !userRegisteredEvents.some((reg) => reg.id === e.id)
    );

    otherUpcoming.slice(0, 3).forEach((ev) => {
      list.push({
        id: `email-invite-${ev.id}`,
        eventId: ev.id,
        subject: `[OFFICIAL INVITATION] ${ev.title}`,
        senderName: "St. Cecilia's College Alumni Relations",
        senderEmail: 'invitations@alumni.stcecilia.edu',
        recipientEmail: currentUser?.email || 'alumni@stcecilia.edu',
        recipientName: currentUser?.name || 'Valued Cecilian Alum',
        sentDate: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        read: readState[`email-invite-${ev.id}`] ?? true,
        starred: starredState[`email-invite-${ev.id}`] ?? false,
        urgency: 'normal',
        type: 'update',
        event: ev,
        rsvpStatus: 'not_registered'
      });
    });

    return list;
  }, [userRegisteredEvents, events, currentUser, readState, starredState]);

  // Selected email object
  const activeEmail = useMemo(() => {
    if (!selectedNotificationId) return emailNotifications[0] || null;
    return emailNotifications.find((n) => n.id === selectedNotificationId) || emailNotifications[0] || null;
  }, [emailNotifications, selectedNotificationId]);

  // Filtered emails
  const filteredEmails = useMemo(() => {
    return emailNotifications.filter((email) => {
      const matchesSearch =
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.senderName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'registered') {
        return email.rsvpStatus === 'going' || email.rsvpStatus === 'interested';
      }
      if (filterType === 'unread') {
        return !email.read;
      }
      if (filterType === 'starred') {
        return email.starred;
      }
      return true;
    });
  }, [emailNotifications, searchQuery, filterType]);

  const toggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStarredState((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const markAsRead = (id: string) => {
    setReadState((prev) => ({
      ...prev,
      [id]: true
    }));
  };

  const toggleReadStatus = (id: string) => {
    setReadState((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calendar .ics download generator
  const handleDownloadIcs = (event: AlumniEvent) => {
    const formatDate = (isoStr: string) => {
      return new Date(isoStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatDate(event.startDate);
    const end = formatDate(event.endDate || new Date(new Date(event.startDate).getTime() + 3600000 * 3).toISOString());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//St. Cecilia College Alumni Portal//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:scc_event_${event.id}@stcecilia.edu`,
      `DTSTAMP:${formatDate(new Date().toISOString())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_calendar_pass.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Calendar pass downloaded (.ics). Import directly into Outlook, Apple, or Google Calendar.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-white">
      {/* LEFT LIST: EMAIL DISPATCHES INBOX */}
      <div
        className={`w-full md:w-84 lg:w-96 border-r border-stone-200 flex flex-col shrink-0 bg-stone-50/50 ${
          selectedNotificationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Inbox Search & Filter Header */}
        <div className="p-3.5 border-b border-stone-200 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#8B181B]/10 text-[#8B181B] flex items-center justify-center font-bold">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 leading-tight">Event Alerts Mailbox</h3>
                <p className="text-[10px] text-stone-500">Official registrations & reminders</p>
              </div>
            </div>
            {userRegisteredEvents.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B181B] text-white">
                {userRegisteredEvents.length} Registered
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event dispatches..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-100 border border-stone-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-[#8B181B]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] scrollbar-none">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-semibold shrink-0 cursor-pointer transition-colors ${
                filterType === 'all'
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Alerts ({emailNotifications.length})
            </button>
            <button
              onClick={() => setFilterType('registered')}
              className={`px-2.5 py-1 rounded-md font-semibold shrink-0 cursor-pointer transition-colors ${
                filterType === 'registered'
                  ? 'bg-[#8B181B] text-white'
                  : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
              }`}
            >
              My Registrations ({userRegisteredEvents.length})
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-2.5 py-1 rounded-md font-semibold shrink-0 cursor-pointer transition-colors ${
                filterType === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterType('starred')}
              className={`px-2.5 py-1 rounded-md font-semibold shrink-0 cursor-pointer transition-colors ${
                filterType === 'starred'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Starred
            </button>
          </div>
        </div>

        {/* List of Email Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400 space-y-2">
              <Mail className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="font-semibold text-stone-600">No event notices found</p>
              <p className="text-[11px]">
                {filterType === 'registered'
                  ? 'You have not registered for any events yet. Check upcoming events to register.'
                  : 'Try adjusting your search query or filter.'}
              </p>
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = activeEmail?.id === email.id;
              const isRegistered = email.rsvpStatus === 'going' || email.rsvpStatus === 'interested';
              const daysLeft = Math.ceil(
                (new Date(email.event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={email.id}
                  onClick={() => {
                    setSelectedNotificationId(email.id);
                    markAsRead(email.id);
                  }}
                  className={`p-3.5 cursor-pointer transition-all border-l-3 ${
                    isSelected
                      ? 'bg-amber-50/50 border-l-[#8B181B]'
                      : email.read
                      ? 'bg-white hover:bg-stone-50/80 border-l-transparent'
                      : 'bg-blue-50/40 hover:bg-blue-50/70 border-l-blue-600 font-semibold'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-bold text-stone-900 truncate">
                        {email.senderName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-stone-400">
                        {new Date(email.event.startDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleStar(email.id, e)}
                        className={`p-0.5 hover:text-amber-500 cursor-pointer ${
                          email.starred ? 'text-amber-500' : 'text-stone-300'
                        }`}
                        title="Star notice"
                      >
                        <Star className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-stone-900 leading-snug line-clamp-1">
                    {email.subject}
                  </h4>

                  <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                    {email.type === 'confirmation'
                      ? `Official registration pass confirmed for ${email.event.title}. Attendance status: ${email.rsvpStatus}. Venue: ${email.event.location}.`
                      : email.type === 'reminder'
                      ? `Reminder: ${email.event.title} is approaching in ${daysLeft} days! Please review check-in guidelines and access pass.`
                      : `You are cordially invited to ${email.event.title}. Register now to reserve your alumni seat.`}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-100 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      {isRegistered ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Registered ({email.rsvpStatus})</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                          Invitation
                        </span>
                      )}

                      {daysLeft >= 0 && daysLeft <= 7 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                          {daysLeft === 0 ? 'Today!' : `In ${daysLeft}d`}
                        </span>
                      )}
                    </div>

                    {!email.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: OFFICIAL INSTITUTIONAL EMAIL READER */}
      <div className={`flex-1 flex flex-col bg-stone-100/50 ${!selectedNotificationId ? 'hidden md:flex' : 'flex'}`}>
        {activeEmail ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Action Bar */}
            <div className="p-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedNotificationId(null)}
                  className="md:hidden p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
                  title="Back to inbox"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
                <button
                  onClick={() => toggleReadStatus(activeEmail.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-stone-500" />
                  <span>{activeEmail.read ? 'Mark Unread' : 'Mark Read'}</span>
                </button>
                <button
                  onClick={() => toggleStar(activeEmail.id)}
                  className={`p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer ${
                    activeEmail.starred ? 'text-amber-500' : 'text-stone-400'
                  }`}
                  title="Star email"
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadIcs(activeEmail.event)}
                  className="px-2.5 py-1 text-xs font-semibold text-[#8B181B] bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  title="Download .ics calendar event"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add to Calendar (.ics)</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="p-1.5 text-stone-600 hover:bg-stone-100 rounded-lg border border-stone-200 cursor-pointer"
                  title="Print event pass / notification"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTab('events')}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 cursor-pointer"
                  title="Open full events directory"
                >
                  <span>Events Directory</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Email Message Content Envelope */}
            <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-4">
              {/* Subject Banner Card */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#8B181B] text-white">
                      Official Dispatch
                    </span>
                    {activeEmail.rsvpStatus !== 'not_registered' ? (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        RSVP Confirmed: {(activeEmail.rsvpStatus || '').toUpperCase()}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-300">
                        Open Invitation
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400 font-mono">
                    {new Date(activeEmail.sentDate).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>

                <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  {activeEmail.subject}
                </h1>

                {/* Sender & Recipient Header */}
                <div className="pt-3 border-t border-stone-100 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8B181B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      SCC
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-stone-900">
                        {activeEmail.senderName}{' '}
                        <span className="font-normal text-stone-400">&lt;{activeEmail.senderEmail}&gt;</span>
                      </div>
                      <div className="text-stone-500">
                        To:{' '}
                        <span className="text-stone-800 font-medium">
                          {activeEmail.recipientName} &lt;{activeEmail.recipientEmail}&gt;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formatted Official Letterhead Notice */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                {/* College Official Letterhead Crest */}
                <div className="bg-gradient-to-r from-[#8B181B] to-[#5C0F12] text-white p-5 sm:p-6 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 block">
                    St. Cecilia's College - Cebu Global Alumni Portal
                  </span>
                  <h2 className="font-serif text-lg sm:text-xl font-semibold tracking-wide">
                    OFFICE OF ALUMNI RELATIONS & HERITAGE ADVANCEMENT
                  </h2>
                  <p className="text-xs text-white/80 font-light">
                    Electronic Notice of Registration & Official Event Access Bulletin
                  </p>
                </div>

                {/* Email Body */}
                <div className="p-5 sm:p-8 space-y-6 text-stone-800 text-sm leading-relaxed">
                  {/* Salutation */}
                  <div>
                    <p className="font-semibold text-stone-900">
                      Dear {currentUser?.name || 'Cecilian Alumnus'},
                    </p>
                    <p className="text-stone-600 mt-1">
                      {activeEmail.rsvpStatus !== 'not_registered'
                        ? `This email confirms that you are officially registered to attend the upcoming institution event highlighted below. Please review your schedule, venue guidelines, and admission credentials.`
                        : `You are cordially invited to participate in the upcoming institutional event at St. Cecilia's College. You may confirm your attendance directly via this dispatch.`}
                    </p>
                  </div>

                  {/* Highlighted Event Box */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {(activeEmail.event.type || 'campus').toUpperCase()} EVENT
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-1">
                          {activeEmail.event.title}
                        </h3>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-stone-200">
                        <Calendar className="w-4 h-4 text-[#8B181B] shrink-0" />
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold block uppercase">Date & Schedule</span>
                          <span className="font-semibold text-stone-800">
                            {new Date(activeEmail.event.startDate).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-stone-200">
                        <Clock className="w-4 h-4 text-[#8B181B] shrink-0" />
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold block uppercase">Time</span>
                          <span className="font-semibold text-stone-800">
                            {new Date(activeEmail.event.startDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}{' '}
                            -{' '}
                            {new Date(activeEmail.event.endDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-stone-200">
                        <MapPin className="w-4 h-4 text-[#8B181B] shrink-0" />
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold block uppercase">Venue & Location</span>
                          <span className="font-semibold text-stone-800 truncate block">
                            {activeEmail.event.location}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-stone-200">
                        {activeEmail.event.isVirtual ? (
                          <Video className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold block uppercase">Format</span>
                          <span className="font-semibold text-stone-800">
                            {activeEmail.event.isVirtual ? 'Virtual Live Stream Available' : 'On-Campus In-Person Event'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed border-t border-stone-200/80 pt-3">
                      {activeEmail.event.description}
                    </p>
                  </div>

                  {/* Official Gathering Notice */}
                  <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-br from-stone-50 to-amber-50/30 border border-stone-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <CalendarCheck className="w-4 h-4 text-[#8B181B]" />
                        <span className="text-xs font-bold text-stone-900 tracking-wide uppercase">
                          Gathering & Reunion Invitation
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        You are warmly invited to join fellow alumni for this special convocation on campus.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono text-stone-600 justify-center sm:justify-start">
                        <span className="px-2 py-0.5 bg-white border border-stone-200 rounded">
                          ALUMNI: {currentUser?.name || 'Cecilian Alumnus'}
                        </span>
                        <span className="px-2 py-0.5 bg-white border border-stone-200 rounded">
                          BATCH: {currentUser?.batch || 'Alumni Community'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white px-4 py-3 rounded-xl border border-stone-200 shadow-2xs flex flex-col items-center shrink-0 text-center">
                      <span className="text-[10px] font-bold text-[#8B181B] uppercase tracking-wider">RSVP Confirmed</span>
                      <span className="text-xs font-bold text-stone-900 mt-0.5">See you there!</span>
                    </div>
                  </div>

                  {/* Quick Attendance Control */}
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-[#8B181B]" />
                      <span>Manage Your RSVP for this Event</span>
                    </h4>
                    <p className="text-xs text-stone-500">
                      Update your attendance directly from this notification to help the organizing committee manage seating and catering:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          rsvpEvent(activeEmail.event.id, 'going');
                          showToast(`RSVP updated: Confirmed Going for "${activeEmail.event.title}"!`, 'success');
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                          activeEmail.event.userRsvp === 'going'
                            ? 'bg-[#8B181B] text-white shadow-xs'
                            : 'bg-white hover:bg-red-50 text-stone-700 border border-stone-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>I Am Attending (Going)</span>
                      </button>

                      <button
                        onClick={() => {
                          rsvpEvent(activeEmail.event.id, 'interested');
                          showToast(`RSVP updated: Marked Interested in "${activeEmail.event.title}".`, 'info');
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          activeEmail.event.userRsvp === 'interested'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white hover:bg-amber-50 text-stone-700 border border-stone-200'
                        }`}
                      >
                        <span>Interested</span>
                      </button>

                      {activeEmail.event.userRsvp && (
                        <button
                          onClick={() => {
                            rsvpEvent(activeEmail.event.id, 'not_going');
                            showToast(`RSVP cancelled for "${activeEmail.event.title}".`, 'info');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-red-600 bg-white hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors cursor-pointer"
                        >
                          Cancel RSVP
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Institutional Closing & Sign-off */}
                  <div className="pt-4 border-t border-stone-200 text-xs text-stone-600 space-y-1">
                    <p>In Saint Cecilia's spirit,</p>
                    <p className="font-bold text-stone-900">Office of Alumni Affairs & Community Engagement</p>
                    <p className="text-stone-500">St. Cecilia's College - Cebu</p>
                    <p className="text-[11px] text-stone-400 pt-2">
                      Notice ID: NOTIF-{activeEmail.id} • Confidential Alumni Communication • This dispatch was generated automatically for your registered profile.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-stone-400">
            <Mail className="w-12 h-12 text-stone-300 mb-2" />
            <p className="text-sm font-semibold text-stone-700">Select an event alert</p>
            <p className="text-xs text-stone-400 mt-1">
              Choose an event dispatch from the list to view your confirmation pass and instructions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
