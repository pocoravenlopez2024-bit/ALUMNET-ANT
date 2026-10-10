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
  ArrowRight,
  X,
  Building2,
  ExternalLink,
  QrCode,
  Moon,
  Sun,
  ScanFace,
  MessageSquare,
  Sparkles,
  Settings as SettingsIcon,
  User as UserIcon,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlumni } from '../../context/AlumniContext';
import { useTheme } from '../../lib/theme';
import { UserProfile } from '../../types';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';
import { exportAlumniRosterCsv } from '../../services/adminExportService';

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab
}) => {
  const {
    currentUser,
    users,
    opportunities,
    events,
    announcements,
    activeTab,
    setActiveTab,
    setSelectedUserIdForModal,
    getOrCreateChat,
    syncAllDataToCloud,
    isFirestoreSyncing,
    showToast
  } = useAlumni();

  const { isDark, toggleTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
    }
  }, [isOpen]);

  const handleNavigate = (tab: string) => {
    onClose();
    if (onSelectTab) {
      onSelectTab(tab);
    } else {
      setActiveTab(tab as any);
    }
  };

  // Fast Navigation Actions
  const navigationItems = useMemo(() => [
    {
      id: 'nav-dashboard',
      title: 'Alumni Dashboard / Hub',
      subtitle: 'Overview, latest social feed & recent activity',
      category: 'Navigation',
      icon: LayoutDashboard,
      keywords: 'home dashboard hub overview feed activity',
      action: () => handleNavigate('dashboard')
    },
    {
      id: 'nav-network',
      title: 'Alumni Directory & Network',
      subtitle: 'Browse verified batchmates, search colleagues & connect',
      category: 'Navigation',
      icon: Users,
      keywords: 'directory network alumni graduates batch classmates search people',
      action: () => handleNavigate('network')
    },
    {
      id: 'nav-messages',
      title: 'Direct Messages & Chat',
      subtitle: 'Send instant private messages to classmates and faculty',
      category: 'Navigation',
      icon: MessageSquare,
      keywords: 'chat message dm messaging peer inbox',
      action: () => handleNavigate('messages')
    },
    {
      id: 'nav-events',
      title: 'Campus Reunions & Events',
      subtitle: 'Grand homecoming, workshops, assemblies and RSVP passes',
      category: 'Navigation',
      icon: Calendar,
      keywords: 'events reunions homecoming assembly schedule rsvp tickets',
      action: () => handleNavigate('events')
    },
    {
      id: 'nav-announcements',
      title: 'Official Bulletins & Circulars',
      subtitle: 'Campus notices, academic bulletins & institutional news',
      category: 'Navigation',
      icon: Megaphone,
      keywords: 'announcements bulletins news circulars notices campus updates',
      action: () => handleNavigate('announcements')
    },
    {
      id: 'nav-opportunities',
      title: 'Career Placements & Job Board',
      subtitle: 'Alumni hiring, internships, vacancies and recruiter postings',
      category: 'Navigation',
      icon: Briefcase,
      keywords: 'jobs careers opportunities placements hiring vacancies internships work',
      action: () => handleNavigate('opportunities')
    },
    {
      id: 'nav-gallery',
      title: 'Campus Heritage & Landmarks Gallery',
      subtitle: 'Archival photos, historic landmarks & campus heritage',
      category: 'Navigation',
      icon: ImageIcon,
      keywords: 'gallery photos landmarks history campus buildings memories pictures',
      action: () => {
        onClose();
        window.dispatchEvent(new CustomEvent('applet:open-gallery'));
      }
    },
    {
      id: 'nav-profile',
      title: 'My Alumni Dossier & Profile',
      subtitle: 'View credentials, work experience & digital degree card',
      category: 'Navigation',
      icon: UserIcon,
      keywords: 'profile dossier me account card degree credentials my',
      action: () => handleNavigate('profile')
    },
    {
      id: 'nav-settings',
      title: 'Account & Security Settings',
      subtitle: 'Change password, biometric locks & privacy preferences',
      category: 'Navigation',
      icon: SettingsIcon,
      keywords: 'settings privacy account security password notifications biometrics',
      action: () => handleNavigate('settings')
    }
  ], []);

  // Instant Utilities / Quick Actions
  const quickActions = useMemo(() => [
    {
      id: 'act-alumni-pass',
      title: 'Show My Digital Alumni ID Pass',
      subtitle: 'Display official holographic QR credential for campus access',
      category: 'Quick Actions',
      icon: QrCode,
      keywords: 'qr pass id card digital alumni credential badge gate access',
      action: () => {
        onClose();
        window.dispatchEvent(new CustomEvent('applet:open-alumni-pass'));
      }
    },
    {
      id: 'act-toggle-theme',
      title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      subtitle: `Currently using ${isDark ? 'Dark Mode' : 'Light Mode'}`,
      category: 'Quick Actions',
      icon: isDark ? Sun : Moon,
      keywords: 'theme dark light mode appearance display toggle switch',
      action: () => {
        toggleTheme();
        onClose();
        showToast(`Switched to ${!isDark ? 'Dark' : 'Light'} Mode`, 'info');
      }
    },
    {
      id: 'act-sync-cloud',
      title: 'Synchronize Cloud Database',
      subtitle: isFirestoreSyncing ? 'Syncing data now...' : 'Sync with Firestore cloud backup',
      category: 'Quick Actions',
      icon: RefreshCw,
      keywords: 'sync refresh update cloud database firestore backup save',
      action: () => {
        onClose();
        syncAllDataToCloud();
      }
    },
    {
      id: 'act-lock-dashboard',
      title: 'Lock Dashboard (Face Detection)',
      subtitle: 'Trigger Face Detection optical lock protection',
      category: 'Quick Actions',
      icon: ScanFace,
      keywords: 'lock face detection biometric face id security privacy protection signout glance camera',
      action: () => {
        onClose();
        window.dispatchEvent(new CustomEvent('applet:lock-dashboard'));
      }
    },
    {
      id: 'act-export-csv',
      title: 'Export Alumni Directory to CSV',
      subtitle: 'Download complete roster of verified Cecilians as a spreadsheet',
      category: 'Quick Actions',
      icon: Download,
      keywords: 'export csv download spreadsheet roster alumni list records excel',
      action: () => {
        onClose();
        exportAlumniRosterCsv(users, 'st_cecilia_alumni_directory');
        showToast(`Exported ${users.length} verified records to CSV!`, 'success');
      }
    }
  ], [isDark, isFirestoreSyncing, users]);

  // Alumni Search Matching
  const matchedAlumni = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return users
      .filter((u) => {
        const name = (u.name || '').toLowerCase();
        const course = (u.course || '').toLowerCase();
        const batch = (u.batch || '').toLowerCase();
        const company = (u.company || '').toLowerCase();
        const position = (u.currentPosition || '').toLowerCase();
        const location = (u.location || '').toLowerCase();
        return (
          name.includes(q) ||
          course.includes(q) ||
          batch.includes(q) ||
          company.includes(q) ||
          position.includes(q) ||
          location.includes(q)
        );
      })
      .slice(0, 6)
      .map((u) => ({
        id: `user-${u.uid}`,
        title: u.name,
        subtitle: `${u.course || 'Alumnus'} • Class of ${u.batch || '2024'} • ${u.company || u.location || 'Cebu'}`,
        category: 'Alumni Directory',
        icon: Users,
        avatarUrl: getUserAvatar(u.profilePictureUrl),
        isVerified: u.isVerified,
        user: u,
        action: () => {
          onClose();
          setSelectedUserIdForModal(u.uid);
        }
      }));
  }, [users, query]);

  // Combine and Filter all Results
  const allResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // Default initial view: Quick Actions + Top Navigation
      return [...quickActions, ...navigationItems];
    }

    const filteredNav = navigationItems.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    );

    const filteredActions = quickActions.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    );

    return [...matchedAlumni, ...filteredNav, ...filteredActions];
  }, [query, matchedAlumni, navigationItems, quickActions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(allResults.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + Math.max(allResults.length, 1)) % Math.max(allResults.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          allResults[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allResults, selectedIndex, onClose]);

  // Auto scroll into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 bg-stone-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50">
          <Search className="w-5 h-5 text-stone-400 dark:text-stone-500 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, destination, or alumnus name... (e.g. 'pass', 'reunion', 'maria')"
            className="w-full text-sm sm:text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 bg-transparent focus:outline-hidden font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-stone-500 dark:text-stone-400 bg-stone-200/60 dark:bg-stone-800 border border-stone-300/80 dark:border-stone-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[60vh] scrollbar-thin">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-stone-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No matching commands or alumni found</p>
              <p className="text-xs text-stone-400 mt-1">Try searching for "events", "jobs", "directory", or a batchmate's name.</p>
            </div>
          ) : (
            allResults.map((item: any, idx) => {
              const isSelected = selectedIndex === idx;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-red-50/90 dark:bg-rose-950/40 text-stone-900 dark:text-white'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.avatarUrl ? (
                      <div className="relative shrink-0">
                        <img
                          src={item.avatarUrl}
                          alt={item.title}
                          onError={handleUserAvatarError}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                        />
                        {item.isVerified && (
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#8B181B] text-white border-[#8B181B]'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-stone-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    {item.user && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          getOrCreateChat(item.user.uid);
                          handleNavigate('messages');
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs mr-1"
                        title="Send Direct Message"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span className="hidden sm:inline">Message</span>
                      </button>
                    )}
                    <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#8B181B] dark:text-rose-400 translate-x-0.5' : 'text-stone-300 dark:text-stone-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-stone-50 dark:bg-stone-850 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="px-1 py-0.5 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700">↑</kbd> <kbd className="px-1 py-0.5 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700">↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.5 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700">Enter</kbd> to select</span>
          </div>
          <span className="hidden sm:inline font-serif italic text-stone-400">Cecilian Alumnet • Speed Navigation</span>
        </div>
      </div>
    </div>
  );
};
