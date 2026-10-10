import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Command,
  Users,
  ShieldCheck,
  GraduationCap,
  Calendar,
  Megaphone,
  Briefcase,
  FileText,
  Award,
  MapPin,
  ImageIcon,
  CheckCircle,
  Plus,
  RefreshCw,
  Download,
  AlertTriangle,
  ArrowRight,
  X,
  Building2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserProfile } from '../../types';

interface AdminCommandBarProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateUser: () => void;
  onOpenCreateEvent: () => void;
  onOpenCreateAnnouncement: () => void;
  onOpenGalleryUpload: () => void;
  onExportCsv: () => void;
}

export const AdminCommandBar: React.FC<AdminCommandBarProps> = ({
  onNavigateTab,
  onOpenCreateUser,
  onOpenCreateEvent,
  onOpenCreateAnnouncement,
  onOpenGalleryUpload,
  onExportCsv
}) => {
  const {
    users,
    opportunities,
    events,
    announcements,
    setUserVerified,
    setSelectedUserIdForModal,
    syncAllDataToCloud,
    isFirestoreSyncing,
    showToast
  } = useAlumni();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut listener: Cmd+K or Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input or textarea unless it's Cmd+K
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === '/' && !isInput && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Quick Action Definitions
  const quickActions = useMemo(() => {
    return [
      {
        id: 'act-new-user',
        title: 'Create Member / Alumnus Account',
        subtitle: 'Manually register a verified graduate or administrator',
        category: 'Quick Actions',
        icon: Plus,
        iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        keywords: 'create add new user member student alumnus alumni register',
        run: () => {
          setIsOpen(false);
          onOpenCreateUser();
        }
      },
      {
        id: 'act-new-announcement',
        title: 'Publish Institutional Announcement',
        subtitle: 'Broadcast official circular or bulletin to all cohorts',
        category: 'Quick Actions',
        icon: Megaphone,
        iconBg: 'bg-rose-50 text-[#8B181B] border-rose-200',
        keywords: 'create add announcement circular bulletin notice post news',
        run: () => {
          setIsOpen(false);
          onOpenCreateAnnouncement();
        }
      },
      {
        id: 'act-new-event',
        title: 'Schedule Campus Convocation or Reunion',
        subtitle: 'Plan a campus gathering, virtual conference, or gala',
        category: 'Quick Actions',
        icon: Calendar,
        iconBg: 'bg-amber-50 text-amber-800 border-amber-200',
        keywords: 'create add event reunion gathering convocation gala schedule',
        run: () => {
          setIsOpen(false);
          onOpenCreateEvent();
        }
      },
      {
        id: 'act-upload-gallery',
        title: 'Add Photo to Campus & Heritage Gallery',
        subtitle: 'Upload historic campus photography and homecoming moments',
        category: 'Quick Actions',
        icon: ImageIcon,
        iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
        keywords: 'upload add photo image gallery campus heritage photo picture',
        run: () => {
          setIsOpen(false);
          onOpenGalleryUpload();
        }
      },
      {
        id: 'act-export-roster',
        title: 'Export Official Alumni Roster (CSV)',
        subtitle: 'Download complete verified student and alumni registry',
        category: 'Quick Actions',
        icon: Download,
        iconBg: 'bg-stone-100 text-stone-800 border-stone-200',
        keywords: 'export download csv excel roster spreadsheet members',
        run: () => {
          setIsOpen(false);
          onExportCsv();
        }
      },
      {
        id: 'act-cloud-sync',
        title: 'Synchronize Data to Cloud Firestore',
        subtitle: 'Push local modifications and cached records directly to database',
        category: 'Quick Actions',
        icon: RefreshCw,
        iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        keywords: 'sync cloud firestore database save backup push force',
        run: () => {
          setIsOpen(false);
          syncAllDataToCloud();
        }
      }
    ];
  }, [onOpenCreateUser, onOpenCreateAnnouncement, onOpenCreateEvent, onOpenGalleryUpload, onExportCsv, syncAllDataToCloud]);

  // System Modules Definitions
  const systemModules = useMemo(() => {
    return [
      {
        id: 'mod-overview',
        title: 'Dashboard Overview & Analytics',
        subtitle: 'Executive KPIs, moderation queue, and institutional charts',
        category: 'Admin Modules',
        icon: ShieldCheck,
        tab: 'overview',
        keywords: 'overview dashboard home analytics kpis charts stats'
      },
      {
        id: 'mod-users',
        title: 'Members Directory & Roster',
        subtitle: 'Search, filter, edit, and audit all alumni accounts',
        category: 'Admin Modules',
        icon: Users,
        tab: 'users',
        keywords: 'members users directory alumni students search table'
      },
      {
        id: 'mod-registry',
        title: 'Registrar Registry & Masterlist',
        subtitle: 'CSV student records, bulk matching, and algorithmic audits',
        category: 'Admin Modules',
        icon: GraduationCap,
        tab: 'registry',
        keywords: 'registrar registry masterlist csv matcher match students'
      },
      {
        id: 'mod-conflicts',
        title: 'Requests & Conflicts Resolution',
        subtitle: 'Pending alumni approvals, identity triage, and registry collision audits',
        category: 'Admin Modules',
        icon: AlertTriangle,
        tab: 'conflicts',
        keywords: 'requests conflicts verification triage pending claims review collision'
      },
      {
        id: 'mod-announcements',
        title: 'Announcements & Circulars Board',
        subtitle: 'Manage administrative bulletins and cohort broadcasts',
        category: 'Admin Modules',
        icon: Megaphone,
        tab: 'announcements',
        keywords: 'announcements circulars news bulletins board'
      },
      {
        id: 'mod-events',
        title: 'Events, Convocations & Reunions',
        subtitle: 'Manage dates, attendees, RSVPs, and campus gatherings',
        category: 'Admin Modules',
        icon: Calendar,
        tab: 'events',
        keywords: 'events reunions convocations gatherings calendar rsvp'
      },
      {
        id: 'mod-jobs',
        title: 'Employers & Career Placements',
        subtitle: 'Accredit corporate partners and moderate job postings',
        category: 'Admin Modules',
        icon: Briefcase,
        tab: 'jobs',
        keywords: 'employers jobs career placements opportunities partners corporate'
      },
      {
        id: 'mod-audit',
        title: 'Security & System Audit Logs',
        subtitle: 'Traceable institutional activity trails and compliance history',
        category: 'Admin Modules',
        icon: FileText,
        tab: 'audit',
        keywords: 'audit security logs trail compliance history activity'
      },
      {
        id: 'mod-milestones',
        title: 'Alumni Milestones & Hall of Fame',
        subtitle: 'Honor notable Cecilian achievements and promotions',
        category: 'Admin Modules',
        icon: Award,
        tab: 'milestones',
        keywords: 'milestones honors achievements hall of fame awards laureates'
      },
      {
        id: 'mod-chapters',
        title: 'Regional Chapters & Global Hubs',
        subtitle: 'Manage alumni chapters across regions and international locations',
        category: 'Admin Modules',
        icon: MapPin,
        tab: 'chapters',
        keywords: 'chapters regional hubs locations branches'
      },
      {
        id: 'mod-gallery',
        title: 'Campus & Heritage Photo Gallery',
        subtitle: 'Curate campus imagery, archival memories, and gallery sets',
        category: 'Admin Modules',
        icon: ImageIcon,
        tab: 'gallery',
        keywords: 'gallery campus photos imagery pictures heritage'
      }
    ];
  }, []);

  // Filtered members matching search query
  const matchingMembers = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return (users || [])
      .filter((u) => {
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const studentId = (u.studentId || '').toLowerCase();
        const alumniId = (u.alumniId || '').toLowerCase();
        const course = (u.course || '').toLowerCase();
        const batch = String(u.batch || '').toLowerCase();
        const company = (u.company || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          studentId.includes(q) ||
          alumniId.includes(q) ||
          course.includes(q) ||
          batch.includes(q) ||
          company.includes(q)
        );
      })
      .slice(0, 5);
  }, [users, query]);

  // Filtered quick actions
  const matchingQuickActions = useMemo(() => {
    if (!query.trim()) return quickActions.slice(0, 4);
    const q = query.toLowerCase().trim();
    return quickActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q) || a.keywords.includes(q)
    );
  }, [quickActions, query]);

  // Filtered modules
  const matchingModules = useMemo(() => {
    if (!query.trim()) return systemModules.slice(0, 6);
    const q = query.toLowerCase().trim();
    return systemModules.filter(
      (m) => m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q) || m.keywords.includes(q)
    );
  }, [systemModules, query]);

  // Consolidated items list for keyboard navigation
  const allFilteredItems = useMemo(() => {
    return [
      ...matchingMembers.map((m) => ({ type: 'member' as const, data: m })),
      ...matchingQuickActions.map((a) => ({ type: 'action' as const, data: a })),
      ...matchingModules.map((m) => ({ type: 'module' as const, data: m }))
    ];
  }, [matchingMembers, matchingQuickActions, matchingModules]);

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < allFilteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allFilteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const currentItem = allFilteredItems[selectedIndex];
      if (currentItem) {
        if (currentItem.type === 'member') {
          setSelectedUserIdForModal(currentItem.data.uid);
          setIsOpen(false);
        } else if (currentItem.type === 'action') {
          currentItem.data.run();
        } else if (currentItem.type === 'module') {
          onNavigateTab(currentItem.data.tab);
          setIsOpen(false);
        }
      }
    }
  };

  const handleQuickVerify = (user: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserVerified(user.uid, true);
    showToast(`Verified ${user.name} (${user.studentId || 'Alumnus'})!`, 'success');
  };

  return (
    <>
      {/* 1. Sleek Search Input Trigger Bar in Admin Interface */}
      <div className="w-full">
        <div
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-between w-full px-4 py-2.5 bg-white hover:bg-stone-50/80 border border-stone-200/90 hover:border-stone-300 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-stone-400 group-hover:text-stone-600 transition-colors min-w-0">
            <Search className="w-4 h-4 shrink-0 text-stone-500 stroke-[2]" />
            <span className="text-xs sm:text-sm text-stone-500 truncate">
              Search graduates, student IDs, modules, or run actions...
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-stone-500 bg-stone-100 border border-stone-200 rounded-md">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </kbd>
            <span className="hidden sm:inline text-xs text-stone-300">or</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-stone-500 bg-stone-100 border border-stone-200 rounded-md">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* 2. Spotlight Command Palette Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[85vh]"
          >
            {/* Search Input Header */}
            <div className="p-3.5 sm:p-4 border-b border-stone-100 flex items-center gap-3 bg-stone-50/50">
              <Search className="w-5 h-5 text-stone-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDownInInput}
                placeholder="Type to search alumni, student IDs (SCC-...), modules, or commands..."
                className="w-full bg-transparent text-sm sm:text-base text-stone-900 placeholder-stone-400 focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-stone-400 bg-stone-100 border border-stone-200 rounded">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results Scroll Area */}
            <div className="overflow-y-auto p-2 sm:p-3 space-y-4 max-h-[60vh] scrollbar-thin">
              {/* Section 1: Members Match */}
              {matchingMembers.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                    <span>Members & Candidates ({matchingMembers.length})</span>
                    <span className="text-[10px] font-normal lowercase">Press Enter to view</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingMembers.map((member, idx) => {
                      const isSelected = selectedIndex === idx;
                      const isPending = !member.isVerified;

                      return (
                        <div
                          key={member.uid}
                          onClick={() => {
                            setSelectedUserIdForModal(member.uid);
                            setIsOpen(false);
                          }}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-rose-50/60 border border-red-200/80'
                              : 'hover:bg-stone-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={member.profilePictureUrl || '/assets/st-cecilias-college-seal.jpg'}
                              alt={member.name}
                              onError={(e) => {
                                e.currentTarget.src = '/assets/st-cecilias-college-seal.jpg';
                              }}
                              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-stone-200"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                                  {member.name}
                                </span>
                                {member.studentId && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
                                    {member.studentId}
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    member.isVerified
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {member.isVerified ? 'Verified' : 'Pending'}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                {member.email} · Batch {member.batch || '2025'} · {member.course || 'Graduate'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isPending && (
                              <button
                                type="button"
                                onClick={(e) => handleQuickVerify(member, e)}
                                title="Instantly verify alumni record"
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Verify</span>
                              </button>
                            )}
                            <span className="text-xs font-semibold text-stone-400 group-hover:text-[#8B181B] flex items-center gap-0.5">
                              <span>Profile</span>
                              <ArrowRight className="w-3 h-3 stroke-[2]" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Quick Actions */}
              {matchingQuickActions.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Quick Actions
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                    {matchingQuickActions.map((action, idx) => {
                      const absoluteIndex = matchingMembers.length + idx;
                      const isSelected = selectedIndex === absoluteIndex;
                      const Icon = action.icon;

                      return (
                        <div
                          key={action.id}
                          onClick={action.run}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-rose-50/60 border-red-200/80 shadow-2xs'
                              : 'bg-stone-50/50 hover:bg-stone-100/70 border-stone-150'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${action.iconBg}`}
                          >
                            <Icon className="w-4 h-4 stroke-[1.75]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-stone-900 truncate">{action.title}</h4>
                            <p className="text-[10px] text-stone-500 truncate">{action.subtitle}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 3: Navigation Modules */}
              {matchingModules.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    System Subsystems & Modules
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingModules.map((mod, idx) => {
                      const absoluteIndex = matchingMembers.length + matchingQuickActions.length + idx;
                      const isSelected = selectedIndex === absoluteIndex;
                      const Icon = mod.icon;

                      return (
                        <div
                          key={mod.id}
                          onClick={() => {
                            onNavigateTab(mod.tab);
                            setIsOpen(false);
                          }}
                          className={`p-2 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-rose-50/60 border border-red-200/80'
                              : 'hover:bg-stone-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 border border-stone-200">
                              <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-stone-900 block truncate">{mod.title}</span>
                              <span className="text-[10px] text-stone-500 block truncate">{mod.subtitle}</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-[#8B181B] shrink-0 flex items-center gap-0.5">
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3 stroke-[2]" />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {allFilteredItems.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold text-stone-700">No matching members or commands found</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Try searching by full student ID, first or last name, degree program, or module title.
                  </p>
                </div>
              )}
            </div>

            {/* Keyboard Shortcuts Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-stone-200 font-mono text-[10px]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-stone-200 font-mono text-[10px]">↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-stone-200 font-mono text-[10px]">↵</kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-stone-200 font-mono text-[10px]">ESC</kbd>
                  <span>Close</span>
                </span>
              </div>
              <span className="font-medium text-[#8B181B]">St. Cecilia Administration Omnibar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
