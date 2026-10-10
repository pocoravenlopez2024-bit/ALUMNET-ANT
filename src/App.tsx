/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlumniProvider, useAlumni, STORAGE_KEYS } from './context/AlumniContext';
import { Navigation } from './components/layout/Navigation';
import { DashboardView } from './components/dashboard/DashboardView';
import { NetworkView } from './components/network/NetworkView';
import { MessagesView } from './components/messages/MessagesView';
import { EventsView } from './components/events/EventsView';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { OpportunitiesView } from './components/opportunities/OpportunitiesView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { AdminPanelView } from './components/admin/AdminPanelView';
import { EmployerDashboardView } from './components/opportunities/EmployerDashboardView';
import { AdminWorkspaceLayout } from './components/admin/AdminWorkspaceLayout';
import { AlumniWorkspaceLayout } from './components/alumni/AlumniWorkspaceLayout';
import { isAdministrativeOrStaffRole } from './types';
import { PublicProfileModal } from './components/profile/PublicProfileModal';
import { FirstTimeProfileSetupModal } from './components/profile/FirstTimeProfileSetupModal';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { AuthPage } from './components/auth/AuthPage';
import { LandingPage } from './components/landing/LandingPage';
import { ToastContainer } from './components/common/ToastContainer';
import { VerificationGate } from './components/common/VerificationGate';
import { CecilianLoader } from './components/common/CecilianLoader';
import { CampusGalleryModal } from './components/gallery/CampusGalleryModal';
import { GraduationCap, LogIn, UserPlus, Globe } from 'lucide-react';
import { SplashScreen } from '@capacitor/splash-screen';
import { initPushNotificationListeners } from './services/pushNotificationService';
import { Network } from '@capacitor/network';
import { App as CapApp } from '@capacitor/app';
import { BiometricAppLockModal } from './components/auth/BiometricAppLockModal';
import { isBiometricAppLockEnabled } from './services/biometricAuthService';
import { initMobileApp } from './services/mobileAppService';
import { initEventReminderScheduler } from './services/eventReminderService';

function AppContent() {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    authReady,
    logout,
    activeChatId,
    setActiveChatId,
    selectedUserIdForModal,
    setSelectedUserIdForModal,
    isEditProfileModalOpen,
    closeEditProfile,
    showToast
  } = useAlumni();
  const [currentView, setCurrentView] = useState<'landing' | 'portal' | 'auth'>(() => {
    try {
      // User rule: When viewing the web, the very first thing users see is the landing page
      const savedSession =
        localStorage.getItem(STORAGE_KEYS.USER_ID) ||
        localStorage.getItem('alumni_auth_session_real_v1');
      const savedView = localStorage.getItem(STORAGE_KEYS.VIEW);

      // Only enter portal if there is an active session AND portal was explicitly saved
      if (savedSession && savedView === 'portal') {
        return 'portal';
      }
      // If user had clicked to open auth explicitly during active session
      if (savedSession && savedView === 'auth') {
        return 'auth';
      }
      // Default initial view for all visitors is ALWAYS the institutional landing page
      return 'landing';
    } catch {
      return 'landing';
    }
  });
  const [authViewMode, setAuthViewMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'alumni' | 'employer'>('alumni');
  const [showProfileSetupModal, setShowProfileSetupModal] = useState(false);

  // Secondary Face Detection Biometric Authentication Layer (Face ID App Lock)
  const [isAppBiometricallyLocked, setIsAppBiometricallyLocked] = useState<boolean>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID) || localStorage.getItem('alumni_auth_session_real_v1');
      if (savedUserId && isBiometricAppLockEnabled(savedUserId)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Re-lock with secondary biometric authentication when native app resumes from background
  React.useEffect(() => {
    if (!currentUser) return;

    const handleResume = () => {
      if (isBiometricAppLockEnabled(currentUser.uid)) {
        setIsAppBiometricallyLocked(true);
      }
    };

    const appListenerPromise = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        handleResume();
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleResume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleAppLockChange = (e: any) => {
      const { enabled } = e.detail || {};
      if (!enabled) {
        setIsAppBiometricallyLocked(false);
      }
    };

    const handleLockDashboard = () => {
      setIsAppBiometricallyLocked(true);
    };

    window.addEventListener('applet:biometric-applock-change', handleAppLockChange);
    window.addEventListener('applet:lock-dashboard', handleLockDashboard);

    return () => {
      appListenerPromise.then((handle) => handle.remove()).catch(() => {});
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('applet:biometric-applock-change', handleAppLockChange);
      window.removeEventListener('applet:lock-dashboard', handleLockDashboard);
    };
  }, [currentUser]);

  // Native Capacitor Android hardware back button & step-back navigation handling
  React.useEffect(() => {
    const backListenerPromise = CapApp.addListener('backButton', () => {
      // 1. If secondary biometric lock is showing, exit app (do not bypass authentication)
      if (isAppBiometricallyLocked) {
        CapApp.exitApp();
        return;
      }

      // 2. Close any open modals if active
      if (isEditProfileModalOpen) {
        closeEditProfile();
        return;
      }

      if (showProfileSetupModal) {
        setShowProfileSetupModal(false);
        return;
      }

      if (selectedUserIdForModal) {
        setSelectedUserIdForModal(null);
        return;
      }

      // Check if campus gallery modal is open
      const campusModal = document.querySelector('[data-campus-gallery-modal]');
      if (campusModal) {
        window.dispatchEvent(new CustomEvent('applet:close-gallery'));
        return;
      }

      // Check if image viewer modal is open
      const imageModal = document.querySelector('[data-image-viewer-modal]');
      if (imageModal) {
        window.dispatchEvent(new CustomEvent('applet:close-image-viewer'));
        return;
      }

      // Check if mobile navigation drawer or menus are open
      const mobileDrawerOpen = document.querySelector('[data-mobile-drawer-open]');
      if (mobileDrawerOpen) {
        window.dispatchEvent(new CustomEvent('applet:close-mobile-menu'));
        return;
      }

      // 3. If in auth view, step back to landing (or portal if already authenticated)
      if (currentView === 'auth') {
        if (currentUser) {
          setCurrentView('portal');
        } else {
          setCurrentView('landing');
        }
        return;
      }

      // 4. If in portal view:
      if (currentView === 'portal') {
        // If in messages with an active chat, return to chat list
        if (activeTab === 'messages' && activeChatId) {
          setActiveChatId(null);
          return;
        }

        // If in any subtab other than dashboard, return to dashboard
        if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
          return;
        }

        // If already on dashboard at root, exit app on native Android
        CapApp.exitApp();
        return;
      }

      // 5. If in landing view:
      if (currentView === 'landing') {
        CapApp.exitApp();
        return;
      }
    });

    return () => {
      backListenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, [
    isAppBiometricallyLocked,
    isEditProfileModalOpen,
    closeEditProfile,
    showProfileSetupModal,
    selectedUserIdForModal,
    setSelectedUserIdForModal,
    currentView,
    currentUser,
    activeTab,
    setActiveTab,
    activeChatId,
    setActiveChatId
  ]);

  // Global click anywhere listener: If anything is hovering in the UI, clicking anywhere causes it to vanish
  React.useEffect(() => {
    const handleGlobalClickDismiss = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      // Do not force blur if the user is interacting with form controls or interactive buttons
      if (target && target.closest('input, textarea, select, button, a, [contenteditable="true"]')) {
        return;
      }
      // Blur active element to clear any CSS focus/hover states on neutral surfaces
      if (document.activeElement && document.activeElement instanceof HTMLElement && !document.activeElement.closest('input, textarea, select')) {
        document.activeElement.blur();
      }
      // Dispatch dismiss-hover for all custom hover cards, tooltips, and popovers
      window.dispatchEvent(new CustomEvent('applet:dismiss-hover', { detail: { target: e.target } }));
    };

    window.addEventListener('pointerdown', handleGlobalClickDismiss);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalClickDismiss);
    };
  }, []);

  // Sync currentView changes to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW, currentView);
    } catch {}
  }, [currentView]);

  // Hide native Capacitor splash screen smoothly once the app is loaded and auth state is ready
  React.useEffect(() => {
    if (authReady) {
      SplashScreen.hide({ fadeOutDuration: 350 }).catch(() => {});
    }
  }, [authReady]);

  // Initialize native Capacitor mobile ergonomics (Keyboard, Status Bar, Safe Areas)
  React.useEffect(() => {
    initMobileApp();
  }, []);

  // Initialize Native Push Notification routing for Events, Messages & Announcements
  React.useEffect(() => {
    const cleanup = initPushNotificationListeners((targetTab) => {
      setCurrentView('portal');
      setActiveTab(targetTab);
    });
    return () => {
      cleanup();
    };
  }, [setActiveTab]);

  // Initialize scheduled event reminder supervisor loop & handle reminder triggers
  React.useEffect(() => {
    initEventReminderScheduler();

    const handleReminderFired = (e: any) => {
      const { eventTitle, venue } = e.detail || {};
      showToast(
        `Starting in 1 hour: ${eventTitle || 'Campus Gathering'} at ${venue || 'Main Campus'}!`,
        'info'
      );
    };

    const handleNavigateEvent = () => {
      setCurrentView('portal');
      setActiveTab('events');
    };

    window.addEventListener('applet:event-reminder-fired', handleReminderFired);
    window.addEventListener('applet:navigate-event', handleNavigateEvent);

    return () => {
      window.removeEventListener('applet:event-reminder-fired', handleReminderFired);
      window.removeEventListener('applet:navigate-event', handleNavigateEvent);
    };
  }, [setActiveTab, showToast]);

  // Global Network connectivity listener (Powered by @capacitor/network)
  React.useEffect(() => {
    let wasOffline = false;

    // Check initial connectivity status on launch
    Network.getStatus()
      .then((status) => {
        if (!status.connected) {
          wasOffline = true;
          showToast('You are currently offline', 'error');
        }
      })
      .catch(() => {});

    // Listen for live online/offline network changes
    const listenerPromise = Network.addListener('networkStatusChange', (status) => {
      if (!status.connected) {
        wasOffline = true;
        showToast('You are currently offline', 'error');
      } else if (wasOffline) {
        wasOffline = false;
        showToast('Internet connection restored. You are back online.', 'success');
      }
    });

    return () => {
      listenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, [showToast]);

  // Synchronize view state with user authentication status & verification enforcement
  React.useEffect(() => {
    if (currentUser) {
      // Strict Verification Enforcement: Do not let unverified accounts access the portal
      const isAlumniVerified = !!(currentUser.isVerified || currentUser.verified || currentUser.verificationStatus === 'verified');
      if (currentUser.role === 'alumni' && !isAlumniVerified) {
        logout();
        setCurrentView('landing');
        return;
      }
      if (currentUser.role === 'employer' && (!currentUser.isVerified || currentUser.employerVerificationStatus === 'rejected')) {
        logout();
        setCurrentView('landing');
        return;
      }
      if (currentView === 'auth') {
        setCurrentView('portal');
      }
    } else {
      const hasStoredSession =
        typeof window !== 'undefined' &&
        (!!localStorage.getItem(STORAGE_KEYS.USER_ID) ||
         !!localStorage.getItem('alumni_auth_session_real_v1'));
      if (!hasStoredSession && currentView === 'portal') {
        setCurrentView('landing');
      }
    }
  }, [currentUser, currentView, logout]);

  React.useEffect(() => {
    // Prioritize Profile Setup on first-time login
    if (
      currentUser &&
      currentUser.role === 'alumni' &&
      (!currentUser.isProfileSetupCompleted || !currentUser.currentPosition || !currentUser.company)
    ) {
      const dismissed =
        sessionStorage.getItem(`dismissed_setup_${currentUser.uid}`) ||
        localStorage.getItem(`dismissed_setup_${currentUser.uid}`);
      if (!dismissed) {
        setShowProfileSetupModal(true);
      }
    }
  }, [currentUser]);

  const handleLoginSuccess = (_role?: string) => {
    setCurrentView('portal');
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW, 'portal');
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, 'dashboard');
    } catch {}
    // User requested: Always direct to home (dashboard) on login
    setActiveTab('dashboard');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Protected Member Portal View Check
  const hasStoredSession =
    typeof window !== 'undefined' &&
    (!!localStorage.getItem(STORAGE_KEYS.USER_ID) ||
     !!localStorage.getItem('alumni_auth_session_real_v1'));

  if (!currentUser && hasStoredSession && !authReady && currentView === 'portal') {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
        <CecilianLoader text="Restoring your Cecilian session..." />
      </div>
    );
  }

  // Animate view transitions (landing, auth, portal)
  return (
    <AnimatePresence mode="wait">
      {/* Landing page view */}
      {currentView === 'landing' && (
        <motion.div
          key="view-landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen"
        >
          <LandingPage
            onNavigateToAuth={(mode, role = 'alumni') => {
              setAuthViewMode(mode);
              setAuthRole(role);
              setCurrentView('auth');
            }}
          />
        </motion.div>
      )}

      {/* Authentication page view */}
      {currentView === 'auth' && (
        <motion.div
          key="view-auth"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen"
        >
          <AuthPage
            initialMode={authViewMode}
            initialRole={authRole}
            onLoginSuccess={handleLoginSuccess}
            onBackToApp={() => {
              if (currentUser) {
                handleLoginSuccess(currentUser.role);
              } else {
                setCurrentView('landing');
              }
            }}
          />
        </motion.div>
      )}

      {/* Authenticated Member Portal View or Fallback to Landing */}
      {currentView === 'portal' && (!currentUser ? (
        <motion.div
          key="view-landing-fallback"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen"
        >
          <LandingPage
            onNavigateToAuth={(mode, role = 'alumni') => {
              setAuthViewMode(mode);
              setAuthRole(role);
              setCurrentView('auth');
            }}
          />
        </motion.div>
      ) : isAppBiometricallyLocked ? (
        /* Optical Face Detection Biometric Recognition Gate Before Accessing Main Dashboard */
        <motion.div
          key="view-portal-biometric-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-h-screen bg-stone-950 flex flex-col font-sans"
        >
          <BiometricAppLockModal
            currentUser={currentUser}
            isOpen={isAppBiometricallyLocked}
            onUnlocked={() => setIsAppBiometricallyLocked(false)}
            onSignOut={() => {
              setIsAppBiometricallyLocked(false);
              logout();
              setCurrentView('landing');
            }}
          />
        </motion.div>
      ) : isAdministrativeOrStaffRole(currentUser.role) ? (
        /* Reference-Inspired Administrative Management & Dashboard Workspace (Admin, Registrar, Employer, Staff, Moderator, Super Admin) */
        <motion.div
          key="view-portal-admin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-h-screen bg-[#F9FAFB] dark:bg-[#121316] flex flex-col font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-[#8B181B] selection:text-white"
        >
          <AdminWorkspaceLayout
            onOpenAuth={(mode) => {
              setAuthViewMode(mode);
              setCurrentView('auth');
            }}
            onGoToLanding={() => setCurrentView('landing')}
          />

          {/* Public Profile Modal (Available anywhere in the app) */}
          <PublicProfileModal />

          {/* Global Edit Profile Modal */}
          <EditProfileModal
            isOpen={isEditProfileModalOpen}
            onClose={closeEditProfile}
          />
        </motion.div>
      ) : (
        /* Redesigned Alumni Workspace - Matches Admin Workspace Specification */
        <motion.div
          key="view-portal-alumni"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-h-screen bg-[#F9FAFB] dark:bg-[#121316] flex flex-col font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-[#8B181B] selection:text-white"
        >
          <AlumniWorkspaceLayout
            onOpenAuth={(mode) => {
              setAuthViewMode(mode);
              setCurrentView('auth');
            }}
            onGoToLanding={() => setCurrentView('landing')}
          />

          {/* Public Profile Modal (Available anywhere in the app) */}
          <PublicProfileModal />

          {/* Global Edit Profile Modal */}
          <EditProfileModal
            isOpen={isEditProfileModalOpen}
            onClose={closeEditProfile}
          />

          {/* Priority First-Time Profile Setup Modal */}
          <FirstTimeProfileSetupModal
            isOpen={showProfileSetupModal}
            onClose={() => {
              setShowProfileSetupModal(false);
              if (currentUser) {
                try {
                  localStorage.setItem(`dismissed_setup_${currentUser.uid}`, 'true');
                  sessionStorage.setItem(`dismissed_setup_${currentUser.uid}`, 'true');
                } catch {}
              }
            }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AlumniProvider>
      <AppContent />
      <ToastContainer />
    </AlumniProvider>
  );
}
