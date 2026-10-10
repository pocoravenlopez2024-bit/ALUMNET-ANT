import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Megaphone,
  Briefcase,
  ShieldCheck,
  User as UserIcon,
  Settings as SettingsIcon,
  Building2,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
  Image as ImageIcon,
  Sparkles,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useAlumni } from '../../context/AlumniContext';
import { useTheme } from '../../lib/theme';
import { BouncyAccordion, type BouncyAccordionItem } from '../ui/skiper-ui/skiper103';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { GlassDock, type DockItem } from '../ui/glass-dock';
import { triggerHaptic } from '../../services/hapticsService';

interface NavigationProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

// Framer Motion animation variants for mobile burger menu
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
};

const drawerVariants: Variants = {
  hidden: { y: '100%', opacity: 0.6 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 300,
      staggerChildren: 0.045,
      delayChildren: 0.06
    }
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const navItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -24,
    filter: 'blur(2px)'
  },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      damping: 22,
      stiffness: 280
    }
  }
};

export const Navigation: React.FC<NavigationProps> = ({ onOpenAuth }) => {
  const { activeTab, setActiveTab, chats, currentUser, permissions, activeChatId } = useAlumni();
  const { isDark, toggleTheme } = useTheme();
  const [showMobileMore, setShowMobileMore] = useState(false);

  // Auto-retract & proximity auto-expand state (no manual toggle button required)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const isCollapsed = !isExpanded;
  const isEffectiveExpanded = isExpanded;
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const expandSidebar = React.useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsExpanded(true);
  }, []);

  const retractSidebar = React.useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 200);
  }, []);

  // Proximity detection: when mouse cursor is near the left edge (<= 120px) auto-expand,
  // and when cursor moves away (> 260px) auto-retract
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (typeof window === 'undefined' || window.innerWidth < 768) return;
      if (e.clientX <= 120) {
        expandSidebar();
      } else if (e.clientX > 260 && isExpanded) {
        retractSidebar();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, [expandSidebar, retractSidebar, isExpanded]);

  // Keyboard shortcut listener: [ or Cmd+B / Ctrl+B
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || (document.activeElement as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') || e.key === '[') {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for global custom events to open mobile navigation
  useEffect(() => {
    const handleOpenMobile = () => setShowMobileMore(true);
    const handleCloseMobile = () => setShowMobileMore(false);
    window.addEventListener('applet:open-mobile-menu', handleOpenMobile);
    window.addEventListener('applet:close-mobile-menu', handleCloseMobile);
    return () => {
      window.removeEventListener('applet:open-mobile-menu', handleOpenMobile);
      window.removeEventListener('applet:close-mobile-menu', handleCloseMobile);
    };
  }, []);

  // Compute total unread messages for current user
  const totalUnreadMessages = React.useMemo(() => {
    if (!currentUser || !chats) return 0;
    return chats.reduce((acc, chat) => {
      if (!chat || !chat.unreadCount) return acc;
      return acc + (chat.unreadCount[currentUser.uid] || 0);
    }, 0);
  }, [chats, currentUser]);

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | null;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(currentUser?.role === 'employer'
      ? [{ id: 'employer_portal', label: 'Employer Dashboard', icon: Building2 }]
      : []),
    { id: 'network', label: 'My Network', icon: Users },
    {
      id: 'messages',
      label: 'Direct Messages',
      icon: MessageSquare,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : null
    },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'opportunities', label: 'Job Board', icon: Briefcase },
    ...(permissions.canAccessAdminPanel
      ? [{ id: 'admin', label: 'Admin Panel', icon: ShieldCheck }]
      : [])
  ];

  const isDrawerActive = !['dashboard', 'network', 'events', 'opportunities'].includes(activeTab);

  // Mobile Floating Glass Dock Items: Home, My network, Events, Jobs, Menu
  const mobileDockItems: DockItem[] = [
    {
      id: 'dashboard',
      title: 'Home',
      icon: LayoutDashboard,
      isActive: activeTab === 'dashboard' && !showMobileMore,
      onClick: () => {
        triggerHaptic('light');
        setActiveTab('dashboard');
        setShowMobileMore(false);
      }
    },
    {
      id: 'network',
      title: 'My network',
      icon: Users,
      isActive: activeTab === 'network' && !showMobileMore,
      onClick: () => {
        triggerHaptic('light');
        setActiveTab('network');
        setShowMobileMore(false);
      }
    },
    {
      id: 'events',
      title: 'Events',
      icon: Calendar,
      isActive: activeTab === 'events' && !showMobileMore,
      onClick: () => {
        triggerHaptic('light');
        setActiveTab('events');
        setShowMobileMore(false);
      }
    },
    {
      id: 'opportunities',
      title: 'Jobs',
      icon: Briefcase,
      isActive: activeTab === 'opportunities' && !showMobileMore,
      onClick: () => {
        triggerHaptic('light');
        setActiveTab('opportunities');
        setShowMobileMore(false);
      }
    },
    {
      id: 'menu',
      title: 'Menu',
      icon: Menu,
      isActive: showMobileMore || isDrawerActive,
      badge: totalUnreadMessages > 0 ? (totalUnreadMessages > 9 ? '9+' : totalUnreadMessages) : null,
      onClick: () => {
        triggerHaptic('selection');
        setShowMobileMore((prev) => !prev);
      }
    }
  ];

  // Complete items in the mobile burger navigation drawer
  const mobileDrawerItems = [
    {
      id: 'dashboard',
      label: 'Home & Overview',
      icon: LayoutDashboard,
      desc: 'Alumni dashboard, feed & recent updates'
    },
    {
      id: 'network',
      label: 'Alumni Network',
      icon: Users,
      desc: 'Batch directory & verified Cecilian graduates'
    },
    {
      id: 'messages',
      label: 'Direct Messages & Chats',
      icon: MessageSquare,
      desc: '1-on-1 private messaging & cohort chat'
    },
    {
      id: 'events',
      label: 'Events & Reunions',
      icon: Calendar,
      desc: 'Grand alumni homecoming & campus gatherings'
    },
    {
      id: 'announcements',
      label: 'Official Announcements',
      icon: Megaphone,
      desc: 'Campus bulletins, alerts & college news'
    },
    {
      id: 'opportunities',
      label: 'Career Job Board',
      icon: Briefcase,
      desc: 'Alumni hiring, internships & career listings'
    },
    ...(currentUser?.role === 'employer'
      ? [
          {
            id: 'employer_portal',
            label: 'Employer Recruitment Portal',
            icon: Building2,
            desc: 'Post job openings & evaluate candidates'
          }
        ]
      : []),
    ...(permissions.canAccessAdminPanel
      ? [
          {
            id: 'admin',
            label: 'Administration Console',
            icon: ShieldCheck,
            desc: 'User verification, moderation & records'
          }
        ]
      : []),
    {
      id: 'gallery',
      label: 'Campus & Heritage Gallery',
      icon: ImageIcon,
      desc: 'Campus landmarks, archival images & historical photos'
    },
    {
      id: 'profile',
      label: 'My Alumni Profile',
      icon: UserIcon,
      desc: 'Manage your degree, work & contact info'
    },
    {
      id: 'settings',
      label: 'Account & Privacy Settings',
      icon: SettingsIcon,
      desc: 'Password, notifications & directory privacy'
    }
  ];

  const handleMobileNavClick = (tabId: string) => {
    triggerHaptic('light');
    if (tabId === 'gallery') {
      window.dispatchEvent(new CustomEvent('applet:open-gallery'));
      setShowMobileMore(false);
      return;
    }
    setActiveTab(tabId);
    setShowMobileMore(false);
  };

  return (
    <>
      {/* Desktop / Tablet Left Sidebar Navigation Bar */}
      <nav
        onMouseEnter={expandSidebar}
        onMouseLeave={retractSidebar}
        className="hidden md:block sticky top-14 sm:top-16 z-30 shrink-0 self-start h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] border-r border-stone-200/80 bg-white/95 backdrop-blur-md shadow-[1px_0_3px_rgba(0,0,0,0.02)] transition-colors"
      >
        <div className="h-full">
          {/* CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > nav:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) */}
          <motion.div
            initial={false}
            animate={{ width: isEffectiveExpanded ? 240 : 76 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="flex flex-col justify-between h-full p-2.5 overflow-hidden select-none"
          >
            {/* CSS selector 2: div#root:nth-of-type(1) > div:nth-of-type(1) > nav:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) */}
            <div className="flex flex-col gap-1 overflow-y-auto scrollbar-none flex-1 py-1">
              {/* Sidebar Header (Automatic Retract & Proximity Auto-Expand) */}
              <div className="h-8 px-2 mb-1.5 border-b border-stone-100 flex items-center overflow-hidden">
                <AnimatePresence initial={false}>
                  {isEffectiveExpanded ? (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                    >
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                        Navigation
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mx-auto"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Items Stack */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveTab(item.id);
                    }}
                    title={!isEffectiveExpanded ? item.label : undefined}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 shrink-0 cursor-pointer select-none group active:scale-[0.98] ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/80'
                    } ${!isEffectiveExpanded ? 'justify-center' : ''}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="desktopActiveNavBubble"
                        className="absolute inset-0 bg-[#8B181B] rounded-xl -z-10 shadow-[0_2px_8px_rgba(139,24,27,0.28)]"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                      />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                        isActive
                          ? 'text-white scale-110'
                          : 'text-stone-500 group-hover:text-stone-800 group-hover:scale-105'
                      }`}
                    />

                    {/* Animated Text Label */}
                    <AnimatePresence initial={false}>
                      {isEffectiveExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="tracking-tight truncate whitespace-nowrap overflow-hidden flex-1 text-left"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Badge */}
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold transition-colors shrink-0 ${
                          isActive
                            ? 'bg-white text-[#8B181B] shadow-2xs'
                            : 'bg-[#8B181B] text-white shadow-2xs'
                        } ${!isEffectiveExpanded ? 'absolute -top-1 -right-1' : 'ml-auto'}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CSS selector 3: div#root:nth-of-type(1) > div:nth-of-type(1) > nav:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > button:nth-of-type(1) */}
            <div className="pt-2 border-t border-stone-100 flex flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('applet:open-gallery'))}
                title={!isEffectiveExpanded ? 'Campus Heritage Gallery' : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-[#8B181B] hover:bg-red-50/60 border border-stone-200/80 shadow-2xs transition-all cursor-pointer group active:scale-[0.98] ${
                  !isEffectiveExpanded ? 'justify-center' : ''
                }`}
              >
                <ImageIcon className="w-4 h-4 text-[#8B181B] shrink-0 group-hover:scale-110 transition-transform" />
                <AnimatePresence initial={false}>
                  {isEffectiveExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="truncate whitespace-nowrap overflow-hidden"
                    >
                      Campus Gallery
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                title={!isEffectiveExpanded ? (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode') : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80 shadow-2xs transition-all cursor-pointer group active:scale-[0.98] ${
                  !isEffectiveExpanded ? 'justify-center' : ''
                }`}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-600 shrink-0" />
                )}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="truncate whitespace-nowrap overflow-hidden"
                    >
                      {isDark ? 'Light Theme' : 'Dark Theme'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Mobile Floating Glass Dock (VengeanceUI) - Hidden when conversation is open so chat input is never covered */}
      {!(activeTab === 'messages' && Boolean(activeChatId)) && (
        <div className="md:hidden fixed bottom-3 inset-x-0 z-40 flex justify-center pointer-events-none px-2 sm:px-3 pb-[calc(env(safe-area-inset-bottom,0px))]">
          <div className="pointer-events-auto max-w-full">
            <GlassDock
              items={mobileDockItems}
              className="mx-auto"
              dockClassName="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-200/90 dark:border-stone-700/80 shadow-[0_12px_36px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] px-2 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-3xl"
              showLabels={true}
            />
          </div>
        </div>
      )}

      {/* Mobile Burger Drawer with Staggered Link Entry Animation */}
      <AnimatePresence>
        {showMobileMore && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setShowMobileMore(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              data-mobile-drawer-open="true"
              className="relative bg-white dark:bg-stone-900 rounded-t-3xl border-t border-stone-200 dark:border-stone-800 shadow-2xl p-5 max-h-[84vh] overflow-y-auto z-10 space-y-3 pb-28 pb-safe"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-1" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-[#8B181B]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Alumni Portal Navigation</h3>
                    <p className="text-[11px] text-stone-500">St. Cecilia's College Global Alumni</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileMore(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Skiper103 Bouncy Accordion Navigation Inside Burger Drawer */}
              <div className="pt-2">
                <BouncyAccordion
                  defaultOpenId="core-portals"
                  allowMultiple={false}
                  items={[
                    {
                      id: 'core-portals',
                      title: 'Core Alumni Portals',
                      subtitle: 'Home, Network directory, events & chats',
                      icon: LayoutDashboard,
                      iconBg: 'bg-red-50 text-[#8B181B]',
                      content: (
                        <div className="space-y-1 pt-1">
                          {mobileDrawerItems
                            .filter((i) => ['dashboard', 'network', 'messages', 'events', 'gallery'].includes(i.id))
                            .map((item) => {
                              const Icon = item.icon;
                              const isActive = activeTab === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleMobileNavClick(item.id)}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left min-h-[44px] cursor-pointer group ${
                                    isActive
                                      ? 'bg-red-50 text-[#8B181B] font-bold border border-red-200 shadow-2xs'
                                      : 'hover:bg-stone-100/80 text-stone-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-[#8B181B] text-white' : 'bg-stone-200/70 text-stone-700'}`}>
                                      <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-stone-900 truncate">{item.label}</p>
                                        {(item as any).badge !== null && (item as any).badge !== undefined && (
                                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#8B181B] text-white">
                                            {(item as any).badge}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-stone-500 truncate">{item.desc}</p>
                                    </div>
                                  </div>
                                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#8B181B]' : 'text-stone-400'}`} />
                                </button>
                              );
                            })}
                        </div>
                      )
                    },
                    {
                      id: 'career-hub',
                      title: 'Career & Collaborative Hub',
                      subtitle: 'Job listings, announcements & opportunities',
                      icon: Briefcase,
                      iconBg: 'bg-amber-50 text-amber-700',
                      content: (
                        <div className="space-y-1 pt-1">
                          {mobileDrawerItems
                            .filter((i) => ['opportunities', 'announcements', 'employer_portal'].includes(i.id))
                            .map((item) => {
                              const Icon = item.icon;
                              const isActive = activeTab === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleMobileNavClick(item.id)}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left min-h-[44px] cursor-pointer group ${
                                    isActive
                                      ? 'bg-red-50 text-[#8B181B] font-bold border border-red-200 shadow-2xs'
                                      : 'hover:bg-stone-100/80 text-stone-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-[#8B181B] text-white' : 'bg-stone-200/70 text-stone-700'}`}>
                                      <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-stone-900 truncate">{item.label}</p>
                                      <p className="text-[10px] text-stone-500 truncate">{item.desc}</p>
                                    </div>
                                  </div>
                                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#8B181B]' : 'text-stone-400'}`} />
                                </button>
                              );
                            })}
                        </div>
                      )
                    },
                    {
                      id: 'institutional',
                      title: 'Institutional & Settings',
                      subtitle: 'Administration, account privacy & settings',
                      icon: ShieldCheck,
                      iconBg: 'bg-stone-100 text-stone-800',
                      content: (
                        <div className="space-y-1 pt-1">
                          {mobileDrawerItems
                            .filter((i) => ['admin', 'profile', 'settings'].includes(i.id))
                            .map((item) => {
                              const Icon = item.icon;
                              const isActive = activeTab === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleMobileNavClick(item.id)}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left min-h-[44px] cursor-pointer group ${
                                    isActive
                                      ? 'bg-red-50 text-[#8B181B] font-bold border border-red-200 shadow-2xs'
                                      : 'hover:bg-stone-100/80 text-stone-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-[#8B181B] text-white' : 'bg-stone-200/70 text-stone-700'}`}>
                                      <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-stone-900 truncate">{item.label}</p>
                                      <p className="text-[10px] text-stone-500 truncate">{item.desc}</p>
                                    </div>
                                  </div>
                                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#8B181B]' : 'text-stone-400'}`} />
                                </button>
                              );
                            })}
                        </div>
                      )
                    }
                  ]}
                />

                {/* Theme Toggle in Mobile Drawer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700">Display Appearance</span>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-800 cursor-pointer shadow-2xs"
                  >
                    {isDark ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-stone-600" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
