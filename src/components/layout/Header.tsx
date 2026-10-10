import React, { useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  Bell,
  Search,
  UserCheck,
  Check,
  X,
  Shield,
  GraduationCap,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
  ExternalLink,
  Image as ImageIcon,
  LogIn,
  UserPlus,
  ArrowRightLeft,
  MessageSquare,
  Menu,
  HelpCircle,
  Briefcase,
  Calendar,
  Megaphone,
  Users,
  Building2,
  Mail,
  Phone,
  Clock,
  Sparkles,
  ChevronRight,
  FileText,
  ShieldCheck,
  Moon,
  Sun,
  Lock,
  ScanFace,
  Smartphone,
  Download,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { useTheme } from '../../lib/theme';
import { UserRole } from '../../types';
import { CampusGalleryModal } from '../gallery/CampusGalleryModal';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';

export const Header: React.FC<{
  onOpenSearch?: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onGoToLanding?: () => void;
}> = ({ onOpenAuth, onGoToLanding }) => {
  const {
    currentUser,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    isConnected,
    getConnectionStatus,
    setActiveTab,
    logout,
    switchUser,
    setSelectedUserIdForModal,
    chats,
    users,
    activeChatId,
    setActiveChatId,
    markChatAsRead
  } = useAlumni();

  const { isDark, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessagesPopover, setShowMessagesPopover] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Smooth horizontal scroll progress for reading long content pages (flutter-free 1:1 tracking)
  const { scrollYProgress } = useScroll();
  const scaleX = scrollYProgress;

  const handleHeaderSearch = (query: string) => {
    setHeaderSearchQuery(query);
    setActiveTab('network');
    window.dispatchEvent(new CustomEvent('applet:network-search', { detail: { query } }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('network');
    window.dispatchEvent(new CustomEvent('applet:network-search', { detail: { query: headerSearchQuery } }));
    setShowMobileSearch(false);
  };

  // Compute unread messages count for current user
  const totalUnreadMessages = React.useMemo(() => {
    if (!currentUser) return 0;
    return (chats || []).reduce((acc, chat) => {
      return acc + (chat.unreadCount?.[currentUser.uid] || 0);
    }, 0);
  }, [chats, currentUser]);

  // Recent chats list for popover
  const recentUserChats = React.useMemo(() => {
    if (!currentUser) return [];
    return (chats || [])
      .filter((chat) => (chat.memberIds || (chat as any).participants || []).includes(currentUser.uid))
      .sort((a, b) => {
        const timeB = new Date(b.lastMessageAt || (b as any).updatedAt || 0).getTime();
        const timeA = new Date(a.lastMessageAt || (a as any).updatedAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [chats, currentUser]);

  // Close any active popovers when user clicks outside, but protect clicks inside dropdowns
  React.useEffect(() => {
    const handleGlobalDismiss = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('[data-header-dropdown]')) {
        setShowNotifications(false);
        setShowMessagesPopover(false);
        setShowNavMenu(false);
        setShowProfileMenu(false);
      }
    };

    const handleCustomDismiss = (e: Event) => {
      const customDetail = (e as CustomEvent)?.detail;
      const target = customDetail?.target as HTMLElement | null;
      // Do not dismiss if user clicked inside any header dropdown
      if (target && target.closest && target.closest('[data-header-dropdown]')) {
        return;
      }
      setShowNotifications(false);
      setShowMessagesPopover(false);
      setShowNavMenu(false);
      setShowProfileMenu(false);
    };

    const handleOpenGallery = () => {
      setShowNavMenu(false);
      setShowProfileMenu(false);
      setShowNotifications(false);
      setShowMessagesPopover(false);
      setShowGalleryModal(true);
    };

    window.addEventListener('pointerdown', handleGlobalDismiss);
    window.addEventListener('click', handleGlobalDismiss);
    window.addEventListener('applet:dismiss-hover', handleCustomDismiss);
    window.addEventListener('applet:open-gallery', handleOpenGallery);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalDismiss);
      window.removeEventListener('click', handleGlobalDismiss);
      window.removeEventListener('applet:dismiss-hover', handleCustomDismiss);
      window.removeEventListener('applet:open-gallery', handleOpenGallery);
    };
  }, []);

  // Helper to ensure clean redirection from portal burger menu and header controls
  const handlePortalRedirect = (action: string | (() => void)) => {
    setShowNavMenu(false);
    setShowProfileMenu(false);
    setShowNotifications(false);
    setShowMessagesPopover(false);
    if (typeof action === 'string') {
      setActiveTab(action);
    } else {
      action();
    }
  };

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'registrar':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'moderator':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  const userNotifications = notifications.filter(
    (n) => !n.toUid || n.toUid === 'all' || n.toUid === currentUser?.uid
  );

  const handleNotificationClick = (n: any) => {
    markNotificationAsRead(n.id);
    setShowNotifications(false);
    if (n.type === 'message') {
      setActiveTab('messages');
      if (n.refId) setActiveChatId(n.refId);
    } else if (n.type === 'announcement' || n.type === 'announcement_broadcast') {
      setActiveTab('announcements');
    } else if (n.type === 'event' || n.type === 'event_broadcast') {
      setActiveTab('events');
    } else if (n.type === 'gallery') {
      window.dispatchEvent(new CustomEvent('applet:open-gallery'));
    } else if (n.type === 'job') {
      setActiveTab('opportunities');
    } else if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      setActiveTab('network');
    }
  };

  const handleLogoClick = () => {
    setActiveTab('dashboard');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('applet:refresh-home'));
    }
  };

  return (
    <>
      {/* Mobile Popover Backdrop Overlay */}
      {(showNotifications || showMessagesPopover || showNavMenu || showProfileMenu) && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 sm:hidden transition-opacity duration-200"
          onClick={() => {
            setShowNotifications(false);
            setShowMessagesPopover(false);
            setShowNavMenu(false);
            setShowProfileMenu(false);
          }}
        />
      )}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#181615]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-2xs pt-safe">
        <div className="w-full max-w-[98vw] 2xl:max-w-[98vw] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Logo and Brand */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0"
            onClick={handleLogoClick}
            title="Return to Home & Refresh"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLogoClick();
              }
            }}
          >
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#8B181B] to-amber-500 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 group-active:scale-95 transition-transform">
              <img
                src="/assets/cecilians-seal.jpg"
                alt="Alumni Cecilian's Seal"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-serif font-bold text-sm sm:text-lg text-stone-900 dark:text-stone-100 tracking-tight truncate">
                  Cecilian Alumnet
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-bold rounded-full bg-red-50 dark:bg-rose-950/60 text-[#8B181B] dark:text-rose-400 border border-red-200 dark:border-rose-900/60">
                  SCC Portal
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block truncate">
                St. Cecilia's College Global Alumni Association
              </p>
            </div>
          </div>

          {/* Center search form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-md hidden md:block"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={headerSearchQuery}
                onChange={(e) => handleHeaderSearch(e.target.value)}
                onFocus={() => {
                  if (headerSearchQuery) {
                    setActiveTab('network');
                  }
                }}
                placeholder="Search alumni by name, course, batch, or company..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-850 hover:bg-stone-100/90 dark:hover:bg-stone-800 focus:bg-white dark:focus:bg-stone-900 border border-stone-200 dark:border-stone-700 focus:border-[#8B181B] dark:focus:border-rose-500 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 transition-all font-sans cursor-text"
              />
              {headerSearchQuery && (
                <button
                  type="button"
                  onClick={() => handleHeaderSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* View Landing Page (Only when not logged in) */}
            {onGoToLanding && !currentUser && (
              <button
                onClick={onGoToLanding}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors whitespace-nowrap min-h-[36px]"
                title="View Public Landing Page"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#991B1B] dark:text-rose-400" />
                <span>Landing Page</span>
              </button>
            )}

            {/* Campus & Heritage Gallery trigger (Only when not logged in) */}
            {!currentUser && (
              <button
                onClick={() => setShowGalleryModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors whitespace-nowrap min-h-[36px]"
                title="View Campus & Heritage Gallery"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#991B1B] dark:text-rose-400" />
                <span>Campus Gallery</span>
              </button>
            )}

            {/* Sign In & Register when not logged in */}
            {!currentUser && onOpenAuth && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl text-stone-700 dark:text-stone-200 hover:text-[#991B1B] dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer min-h-[36px] whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#991B1B] dark:text-rose-400" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl bg-[#991B1B] hover:bg-[#7f1616] text-white shadow-xs transition-colors cursor-pointer min-h-[36px] whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}

            {/* Mobile Search Trigger Button */}
            <button
              type="button"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Search"
              title="Search Directory"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications Bell with Popover */}
            <div className="relative" data-header-dropdown="true">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowMessagesPopover(false);
                  setShowNavMenu(false);
                  setShowProfileMenu(false);
                }}
                className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                  showNotifications
                    ? 'text-[#8B181B] dark:text-rose-400 bg-red-50 dark:bg-rose-950/50 ring-1 ring-red-200 dark:ring-rose-800'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="fixed left-3 right-3 top-15 max-h-[calc(100dvh-5rem)] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-none bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200/90 dark:border-stone-800 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">Notifications</span>
                      {unreadNotificationsCount > 0 && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-100 dark:bg-rose-950 text-red-700 dark:text-rose-400 font-medium rounded-full">
                          {unreadNotificationsCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="sm:hidden p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                        aria-label="Close notifications"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                    {userNotifications.length === 0 ? (
                      <div className="p-6 text-center text-stone-400 dark:text-stone-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      userNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 transition-colors cursor-pointer ${
                            !n.read ? 'bg-blue-50/60 dark:bg-blue-950/30' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">{n.title}</div>
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 shrink-0">
                              {new Date(n.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">{n.body}</p>

                          {/* Inline Accept/Decline for Friend Requests */}
                          {n.type === 'friend_request' && (
                            <div className="mt-2.5">
                              {n.actionStatus === 'accepted' || isConnected(n.fromUid || '') || getConnectionStatus(n.fromUid || '') === 'accepted' ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-md border border-emerald-200">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Connection Accepted</span>
                                </div>
                              ) : n.actionStatus === 'declined' || getConnectionStatus(n.fromUid || '') === 'declined' ? (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-500 bg-stone-100 rounded-md">
                                  <span>Request declined</span>
                                </div>
                              ) : n.refId ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      acceptFriendRequest(n.refId!);
                                      markNotificationAsRead(n.id);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#991B1B] hover:bg-[#7f1616] rounded-md shadow-xs transition-colors cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      declineFriendRequest(n.refId!);
                                      markNotificationAsRead(n.id);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-200 hover:bg-stone-300 rounded-md transition-colors cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Decline</span>
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Messaging Logo Button beside Notification */}
            {currentUser && (
              <div className="relative" data-header-dropdown="true">
                <button
                  onClick={() => {
                    setShowMessagesPopover(!showMessagesPopover);
                    setShowNotifications(false);
                    setShowNavMenu(false);
                    setShowProfileMenu(false);
                  }}
                  className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                    showMessagesPopover
                      ? 'text-[#8B181B] bg-red-50 ring-1 ring-red-200'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                  aria-label="Messaging"
                  title="Messaging & Chats"
                >
                  <MessageSquare className="w-5 h-5" />
                  {totalUnreadMessages > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#8B181B] text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                      {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                    </span>
                  )}
                </button>

                {showMessagesPopover && (
                  <div className="fixed left-3 right-3 top-15 max-h-[calc(100dvh-5rem)] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-none bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200/90 dark:border-stone-800 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 shrink-0">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#8B181B] dark:text-rose-400" />
                        <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">Conversations</span>
                        {totalUnreadMessages > 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-red-100 dark:bg-rose-950 text-red-700 dark:text-rose-400 font-medium rounded-full">
                            {totalUnreadMessages} unread
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveTab('messages');
                            setShowMessagesPopover(false);
                          }}
                          className="text-xs text-[#8B181B] dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                        >
                          Full Messenger
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowMessagesPopover(false)}
                          className="sm:hidden p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                          aria-label="Close conversations"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                      {recentUserChats.length === 0 ? (
                        <div className="p-6 text-center">
                          <MessageSquare className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">No conversations yet</p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Connect with alumni in My Network to start chatting.</p>
                          <button
                            onClick={() => {
                              setActiveTab('network');
                              setShowMessagesPopover(false);
                            }}
                            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors"
                          >
                            Explore Network
                          </button>
                        </div>
                      ) : (
                        recentUserChats.map((chat) => {
                          const members = chat.memberIds || (chat as any).participants || [];
                          const otherUid = members.find((uid: string) => uid !== currentUser.uid);
                          const otherUser = chat.otherUser || (users || []).find((u) => u.uid === otherUid);
                          const unreadCount = chat.unreadCount?.[currentUser.uid] || 0;
                          const lastMsg = (chat as any).messages?.[(chat as any).messages.length - 1];
                          const lastMsgText = lastMsg?.text || chat.lastMessage || 'Start a conversation...';
                          const lastMsgTime = lastMsg?.timestamp || lastMsg?.createdAt || chat.lastMessageAt;
                          const chatTitle = chat.groupName || (chat as any).title || otherUser?.name || 'Cecilian Chat';
                          const isGroup = Boolean(chat.isGroupChat || (chat as any).type === 'group' || chat.isEventChat);

                          return (
                            <div
                              key={chat.id}
                              onClick={() => {
                                setActiveChatId(chat.id);
                                markChatAsRead(chat.id);
                                setActiveTab('messages');
                                setShowMessagesPopover(false);
                              }}
                              className={`p-3.5 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors cursor-pointer ${
                                unreadCount > 0 ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                              }`}
                            >
                              <img
                                src={
                                  isGroup
                                    ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80'
                                    : otherUser?.profilePictureUrl ||
                                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                                }
                                alt="Participant avatar"
                                className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                                    {chatTitle}
                                  </h4>
                                  {lastMsgTime && (
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 shrink-0 ml-1">
                                      {new Date(lastMsgTime).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-600 dark:text-stone-300 truncate mt-0.5">
                                  {lastMsgText}
                                </p>
                              </div>

                              {unreadCount > 0 && (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#8B181B] shrink-0" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-2.5 bg-stone-50 dark:bg-stone-850 border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => {
                          setActiveTab('messages');
                          setShowMessagesPopover(false);
                        }}
                        className="w-full py-2 px-3 text-xs font-bold text-center text-white bg-[#8B181B] hover:bg-[#721316] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Go to All Messages</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Universal Quick Theme Toggle (Light / Dark Mode) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Dark/Light Theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400 stroke-[1.75]" />
              ) : (
                <Moon className="w-5 h-5 text-stone-600 dark:text-stone-300 stroke-[1.75]" />
              )}
            </button>

            {/* Menu Logo Button beside Messaging and Notifications */}
            <div className="relative hidden lg:block" data-header-dropdown="true">
              <button
                onClick={() => {
                  setShowNavMenu(!showNavMenu);
                  setShowNotifications(false);
                  setShowMessagesPopover(false);
                  setShowProfileMenu(false);
                }}
                className={`relative p-2 rounded-lg transition-colors cursor-pointer border ${
                  showNavMenu
                    ? 'text-[#8B181B] dark:text-rose-400 bg-red-50/90 dark:bg-rose-950/50 border-red-200 dark:border-rose-800 shadow-2xs'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200/80 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850/50'
                }`}
                aria-label="Portal Menu"
                title="Cecilian Services Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {showNavMenu && (
                <div
                  className="fixed left-3 right-3 top-15 max-h-[calc(100dvh-5rem)] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-w-none bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200/90 dark:border-stone-800 p-3 z-50 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Institutional Header in Menu */}
                  <div className="px-3 py-2.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 rounded-xl mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="/assets/cecilians-seal.jpg"
                        alt="Seal"
                        className="w-9 h-9 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-stone-900 dark:text-stone-100">Cecilian Portal Menu</div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">Quick Access & Institutional Hub</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNavMenu(false)}
                      className="sm:hidden p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                      aria-label="Close portal menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Institutional Services Group */}
                  <div className="space-y-1">
                    <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      Services & Portals
                    </div>

                    {/* Dashboard */}
                    <button
                      type="button"
                      onClick={() => handlePortalRedirect('dashboard')}
                      className="w-full flex items-center justify-between p-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-[#8B181B] dark:text-rose-400 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800 dark:text-stone-200">Alumni Dashboard</div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">Overview, feed & quick updates</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                    </button>

                    {/* Campus Gallery */}
                    <button
                      type="button"
                      onClick={() => handlePortalRedirect(() => setShowGalleryModal(true))}
                      className="w-full flex items-center justify-between p-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-[#8B181B] dark:text-rose-400 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800 dark:text-stone-200">Campus Gallery</div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">Campus landmarks & memory archive</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                    </button>

                    {/* Events & Reunions */}
                    <button
                      type="button"
                      onClick={() => handlePortalRedirect('events')}
                      className="w-full flex items-center justify-between p-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800 dark:text-stone-200">Events & Reunions</div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">Homecoming and gatherings</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                    </button>

                    {/* Career Job Board */}
                    <button
                      type="button"
                      onClick={() => handlePortalRedirect('opportunities')}
                      className="w-full flex items-center justify-between p-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800 dark:text-stone-200">Career Job Board</div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">Alumni hiring & opportunities</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                    </button>

                    {/* My Network */}
                    <button
                      type="button"
                      onClick={() => handlePortalRedirect('network')}
                      className="w-full flex items-center justify-between p-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800 dark:text-stone-200">My Network</div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">Batch directory & Cecilian alumni</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                    </button>

                    {/* Direct Messages */}
                    <button
                      type="button"
                      onClick={() => handlePortalRedirect('messages')}
                      className="w-full flex items-center justify-between p-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800 dark:text-stone-200">Peer Messages</div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">Direct chats & batch conversations</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                    </button>

                    {/* Announcements */}
                    <button
                      type="button"
                      onClick={() => handlePortalRedirect('announcements')}
                      className="w-full flex items-center justify-between p-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800 dark:text-stone-200">Announcements</div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">Institutional advisories & notices</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                    </button>

                    {/* Admin Panel (for superadmin/admin/registrar/staff/moderator) */}
                    {currentUser && ['superadmin', 'admin', 'registrar', 'staff', 'moderator'].includes(currentUser.role) && (
                      <button
                        type="button"
                        onClick={() => handlePortalRedirect('admin')}
                        className="w-full flex items-center justify-between p-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-stone-900 dark:bg-stone-800 text-white flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4 text-rose-300" />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 dark:text-stone-100">Administration Console</div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400">Official management & records</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                      </button>
                    )}

                    {/* Employer Portal (for employers) */}
                    {currentUser?.role === 'employer' && (
                      <button
                        type="button"
                        onClick={() => handlePortalRedirect('employer_portal')}
                        className="w-full flex items-center justify-between p-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-900 dark:bg-amber-800 text-white flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 dark:text-stone-100">Employer Recruitment</div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400">Job postings & applicant reviews</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                      </button>
                    )}
                  </div>

                  {/* Help, Account & Settings Group */}
                  <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1">
                    <div className="px-2 pt-0.5 pb-1 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      Account & Assistance
                    </div>

                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => handlePortalRedirect('profile')}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer text-left"
                      >
                        <UserIcon className="w-4 h-4 text-stone-500 dark:text-stone-400 shrink-0" />
                        <span>My Alumni Profile</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePortalRedirect('settings')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer text-left"
                    >
                      <SettingsIcon className="w-4 h-4 text-stone-500 dark:text-stone-400 shrink-0" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handlePortalRedirect(() => {
                          window.dispatchEvent(new CustomEvent('applet:open-privacy'));
                        });
                      }}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer text-left"
                    >
                      <Shield className="w-4 h-4 text-stone-500 dark:text-stone-400 shrink-0" />
                      <span>Privacy Policy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePortalRedirect(() => setShowMobileAppModal(true))}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer text-left"
                    >
                      <Smartphone className="w-4 h-4 text-[#8B181B] dark:text-rose-400 shrink-0" />
                      <span className="font-semibold">Mobile App (Android APK & PWA)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePortalRedirect(() => setShowHelpModal(true))}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer text-left"
                    >
                      <HelpCircle className="w-4 h-4 text-stone-500 dark:text-stone-400 shrink-0" />
                      <span>Help & Alumni Support</span>
                    </button>

                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => handlePortalRedirect(() => logout())}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-600 dark:text-rose-400 shrink-0" />
                        <span>Sign Out of Portal</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current User Avatar & Dropdown */}
            {currentUser && (
              <div className="relative" data-header-dropdown="true">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                    setShowMessagesPopover(false);
                    setShowNavMenu(false);
                  }}
                  className="flex items-center justify-center p-1 rounded-full hover:ring-2 hover:ring-[#8B181B]/40 focus:ring-2 focus:ring-[#8B181B]/40 transition-all cursor-pointer min-w-[38px] min-h-[38px] shrink-0 ml-0.5"
                  aria-label="Current User Profile and Account Menu"
                >
                  <img
                    src={getUserAvatar(currentUser.profilePictureUrl)}
                    alt={currentUser.name}
                    onError={handleUserAvatarError}
                    className="w-8 h-8 rounded-full object-cover border border-stone-200 shadow-2xs bg-stone-100"
                  />
                </button>

                {showProfileMenu && (
                  <div className="fixed left-3 right-3 sm:left-auto sm:right-0 top-15 sm:top-full sm:mt-2 max-w-xs ml-auto sm:w-60 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200/90 dark:border-stone-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/70 rounded-xl mb-1">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{currentUser.email}</p>
                      <span
                        className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] rounded-full uppercase font-bold border ${getRoleBadgeColor(
                          currentUser.role
                        )}`}
                      >
                        {currentUser.role}
                      </span>
                    </div>

                    <div className="py-1 space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer min-h-[38px] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                        <span>View Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer min-h-[38px] transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                        <span>Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          window.dispatchEvent(new CustomEvent('applet:lock-dashboard'));
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer min-h-[38px] transition-colors"
                        title="Lock active session with Face Detection protection"
                      >
                        <Lock className="w-4 h-4 text-[#8B181B] dark:text-rose-400" />
                        <span>Lock Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-xl border-t border-stone-100 dark:border-stone-800 mt-1 pt-2 cursor-pointer min-h-[38px] transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Expandable Bar */}
        {showMobileSearch && (
          <div className="md:hidden pb-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={headerSearchQuery}
                onChange={(e) => handleHeaderSearch(e.target.value)}
                placeholder="Search alumni by name, course, batch..."
                className="w-full pl-9 pr-8 py-2 text-xs text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 focus:border-[#8B181B] dark:focus:border-rose-500 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20"
              />
              {headerSearchQuery && (
                <button
                  type="button"
                  onClick={() => handleHeaderSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-0.5 cursor-pointer"
                  title="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Subtle Horizontal Scroll Reading Progress Bar (Framer Motion) */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#8B181B] via-[#B45309] to-amber-500 origin-left z-50 pointer-events-none shadow-[0_1px_4px_rgba(139,24,27,0.3)]"
        style={{ scaleX }}
      />
    </header>

    <CampusGalleryModal
      isOpen={showGalleryModal}
      onClose={() => setShowGalleryModal(false)}
    />

    {/* Help & Support Desk Modal */}
    {showHelpModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 max-w-lg w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8B181B] to-[#5a1012] p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">Alumni Affairs Help & Support</h3>
                <p className="text-xs text-stone-200">St. Cecilia's College Official Support Desk</p>
              </div>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="p-3.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#8B181B] dark:text-rose-400" />
                <span>Office of Alumni & Student Affairs</span>
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                2nd Floor, St. Cecilia's College Administration Building, Minglanilla, Cebu, Philippines.
              </p>
              <div className="pt-2 border-t border-stone-200/70 dark:border-stone-700/70 space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#8B181B] dark:text-rose-400" />
                  <span>alumni.affairs@stcecilias.edu.ph</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#8B181B] dark:text-rose-400" />
                  <span>(032) 268-4746 / (032) 268-4747 local 105</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#8B181B] dark:text-rose-400" />
                  <span>Mon – Fri: 8:00 AM – 5:00 PM • Sat: 8:00 AM – 12:00 PM</span>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">Frequently Asked Questions</h4>

              <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850/50 hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
                <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">How do I request official transcripts or diplomas?</h5>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                  Contact the Registrar's Office with your verified Cecilian Student ID number or submit an online verification request via your alumni profile.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850/50 hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
                <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">How do I RSVP for reunions & campus events?</h5>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                  Navigate to the <strong>Events</strong> tab in your navigation and click "RSVP Attendance". You can cancel anytime before the cancellation deadline.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850/50 hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
                <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">How do I post job openings for fellow Cecilians?</h5>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                  Employer partners and alumni business owners can sign up as an Employer or contact Alumni Affairs to publish verified job openings on the Job Board.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800 flex justify-end">
            <button
              onClick={() => setShowHelpModal(false)}
              className="px-4 py-2 text-xs font-bold text-white bg-[#8B181B] hover:bg-[#721316] rounded-xl transition-colors cursor-pointer"
            >
              Close Help Desk
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Mobile App Guide & APK Download Modal */}
    {showMobileAppModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 max-w-xl w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8B181B] to-[#5a1012] p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">Cecilian Alumnet Mobile App</h3>
                <p className="text-xs text-stone-200">Android APK, Capacitor Native & PWA Guide</p>
              </div>
            </div>
            <button
              onClick={() => setShowMobileAppModal(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Quick Download Banner */}
            <div className="bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Android Release APK Package</span>
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Package: com.aistudio.applet.cnztsm • Version 1.0.0
                </div>
              </div>
              <a
                href="/downloads/cecilian-alumnet.apk"
                download="cecilian-alumnet.apk"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download APK (Direct)</span>
              </a>
            </div>

            {/* Instruction Tabs / Steps */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                How to Run on Mobile Device
              </h4>

              {/* Step 1: Direct Android Install */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#8B181B] text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">Direct Android APK Install (Phone or Tablet)</h5>
                </div>
                <ul className="text-[11px] text-stone-600 dark:text-stone-400 pl-7 list-disc space-y-1 leading-relaxed">
                  <li>Click <strong>Download APK (Direct)</strong> above or copy the APK to your Android device.</li>
                  <li>Tap the downloaded file in your device's <em>Files / Downloads</em> folder.</li>
                  <li>If prompted, toggle on <em>"Allow from this source"</em> to allow sideloading.</li>
                  <li>Tap <strong>Install</strong>. Once complete, launch <strong>Cecilian Alumnet</strong> from your app drawer!</li>
                </ul>
              </div>

              {/* Step 2: Android Studio & CLI */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">Run via Android Studio / Capacitor CLI</h5>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 pl-7 leading-relaxed">
                  To run or debug directly from the development repository:
                </p>
                <div className="ml-7 bg-stone-900 text-stone-200 rounded-lg p-2.5 font-mono text-[10px] space-y-1">
                  <div>npm run build</div>
                  <div>npx cap sync</div>
                  <div>npm run cap:android</div>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 pl-7">
                  This opens the <code>/android</code> project in Android Studio. Select your emulator or connected USB device and click the green <strong>Run</strong> button.
                </p>
              </div>

              {/* Step 3: iOS Xcode */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                  <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">Run on iOS (Mac with Xcode)</h5>
                </div>
                <div className="ml-7 bg-stone-900 text-stone-200 rounded-lg p-2.5 font-mono text-[10px] space-y-1">
                  <div>npm run build && npx cap sync ios</div>
                  <div>npm run cap:ios</div>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 pl-7">
                  Opens <code>/ios/App</code> in Xcode. Select an iPhone Simulator and press <strong>Cmd + R</strong>.
                </p>
              </div>

              {/* Step 4: Instant PWA Mobile Install */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-white text-[11px] font-bold flex items-center justify-center">4</span>
                  <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">Instant Progressive Web App (PWA)</h5>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 pl-7 leading-relaxed">
                  Open this application in your mobile browser:
                  <br />• <strong>iOS Safari:</strong> Tap the Share icon (box with up arrow) &rarr; tap <em>"Add to Home Screen"</em>.
                  <br />• <strong>Android Chrome:</strong> Tap the 3 dots menu (&vellip;) &rarr; tap <em>"Install App"</em> or <em>"Add to Home Screen"</em>.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800 flex justify-end">
            <button
              onClick={() => setShowMobileAppModal(false)}
              className="px-4 py-2 text-xs font-bold text-white bg-[#8B181B] hover:bg-[#721316] rounded-xl transition-colors cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};
