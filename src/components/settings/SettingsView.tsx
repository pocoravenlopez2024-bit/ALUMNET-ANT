/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Bell,
  HelpCircle,
  Shield,
  Info,
  LogOut,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Volume2,
  Sparkles,
  Clock,
  Sun,
  Moon,
  Monitor,
  Palette,
  ShieldCheck,
  Radio,
  SlidersHorizontal,
  ArrowRight,
  Smartphone,
  Cpu,
  Layers,
  ScanFace,
  RefreshCw,
  Sliders,
  Send,
  Share2,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlumni } from '../../context/AlumniContext';
import { ThemeMode, applyTheme, getStoredTheme } from '../../lib/theme';
import { UserRoleBadge } from '../common/UserRoleBadge';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';
import {
  checkBiometricAvailability,
  isBiometricLoginEnabled,
  enableBiometricLogin,
  disableBiometricLogin,
  authenticateWithBiometrics,
  isBiometricAppLockEnabled,
  setBiometricAppLockEnabled,
  verifyBiometricForDashboardAccess,
  BiometricAvailability
} from '../../services/biometricAuthService';
import {
  checkPushPermissions,
  requestPushNotifications,
  sendInAppPushAlert
} from '../../services/pushNotificationService';
import { openExternalUrl } from '../../services/externalLinkService';
import { shareAlumniPortal } from '../../services/nativeShareService';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    logout,
    deleteAccount,
    changePassword,
    showToast,
    notificationSettings,
    updateNotificationSettings,
    pushPermissionStatus,
    requestBrowserPushPermission,
    sendTest24HourAlert
  } = useAlumni();

  // Active filter pill for Command Center navigation
  const [activeFilterPill, setActiveFilterPill] = useState<'all' | 'security' | 'notifications' | 'appearance' | 'compliance'>('all');

  // Hero Card tool view: 'security_radar' | 'channels_meter' | 'session_info'
  const [selectedHeroTool, setSelectedHeroTool] = useState<'security_radar' | 'channels_meter' | 'session_info'>('security_radar');

  // Clipboard & Modal States
  const [copiedId, setCopiedId] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Administrative roles cannot delete their accounts from settings
  const isAdminRole = ['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(currentUser?.role || '');

  // Email form
  const [newEmail, setNewEmail] = useState('');
  const [emailStatusMessage, setEmailStatusMessage] = useState('');

  // Notification toggles
  const [pushEnabled, setPushEnabled] = useState(
    currentUser?.settings?.notificationsPush ?? notificationSettings?.pushNotifications ?? true
  );
  const [emailEnabled, setEmailEnabled] = useState(
    currentUser?.settings?.notificationsEmail ?? notificationSettings?.emailDigests ?? true
  );
  const [messagesEnabled, setMessagesEnabled] = useState(
    currentUser?.settings?.notificationsMessages ?? notificationSettings?.directMessages ?? true
  );
  const [eventsEnabled, setEventsEnabled] = useState(
    currentUser?.settings?.notificationsEvents ?? notificationSettings?.eventReminders ?? true
  );
  const [jobsEnabled, setJobsEnabled] = useState(
    currentUser?.settings?.notificationsJobs ?? notificationSettings?.jobOpportunities ?? true
  );

  // Biometric state (Face Detection)
  const [biometricAvail, setBiometricAvail] = useState<BiometricAvailability>({
    isAvailable: false,
    biometryType: 'none',
    label: 'Biometrics'
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricTesting, setIsBiometricTesting] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability().then((avail) => {
      setBiometricAvail(avail);
      setBiometricEnabled(isBiometricLoginEnabled(currentUser?.uid));
      setAppLockEnabled(isBiometricAppLockEnabled(currentUser?.uid));
    });
  }, [currentUser?.uid]);

  const handleToggleAppLock = (enabled: boolean) => {
    if (!currentUser) return;
    setBiometricAppLockEnabled(currentUser.uid, enabled);
    setAppLockEnabled(enabled);
    if (enabled) {
      showToast('Secondary biometric app lock enabled! App will lock when returning from background.', 'success');
    } else {
      showToast('Secondary biometric app lock disabled.', 'info');
    }
  };

  const handleToggleBiometrics = async (enabled: boolean) => {
    if (!currentUser) return;
    if (enabled) {
      const success = await enableBiometricLogin(currentUser.uid, currentUser.email);
      if (success) {
        setBiometricEnabled(true);
        showToast(`${biometricAvail.label} login enabled successfully!`, 'success');
      } else {
        showToast('Could not enable biometric authentication.', 'error');
      }
    } else {
      await disableBiometricLogin(currentUser.uid);
      setBiometricEnabled(false);
      showToast('Biometric login disabled.', 'info');
    }
  };

  const handleTestBiometrics = async () => {
    setIsBiometricTesting(true);
    try {
      const res = await verifyBiometricForDashboardAccess(currentUser?.name);
      if (res.success) {
        showToast(`${biometricAvail.label} verified successfully! Hardware security active.`, 'success');
      } else if (res.error) {
        showToast(res.error, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Biometric recognition test cancelled.', 'error');
    } finally {
      setIsBiometricTesting(false);
    }
  };

  const handleSendTestPush = (category: 'event' | 'message' | 'announcement') => {
    const titles = {
      event: 'Cecilian Grand Reunion: 24h Confirmation',
      message: 'New Direct Message from Maria Santos',
      announcement: 'Presidential Advisory: Centennial Homecoming'
    };
    const bodies = {
      event: 'Your reserved seat at the Centennial Grand Alumni Reunion is scheduled for tomorrow at 6:00 PM.',
      message: '"Hi! Great catching up with you during the Alumni Homecoming seminar."',
      announcement: 'Registration is now open for the 2026 Batch Representative Council meeting.'
    };

    sendInAppPushAlert({
      title: titles[category],
      body: bodies[category],
      category,
      data: { category }
    });

    showToast(`Test ${category} alert triggered!`, 'success');
  };

  const handleShareApp = async () => {
    const res = await shareAlumniPortal();
    if (res.shared) {
      showToast('Thank you for sharing Cecilian Alumnet!', 'success');
    } else if (res.copiedToClipboard) {
      showToast('Portal link copied to clipboard! Share it with your fellow alumni.', 'success');
    } else if (res.error) {
      showToast(res.error, 'error');
    }
  };

  // Theme switcher state
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    const handleThemeEvent = (e: any) => {
      if (e.detail?.mode) {
        setThemeMode(e.detail.mode);
      }
    };
    window.addEventListener('cecilian:theme-change', handleThemeEvent);
    return () => window.removeEventListener('cecilian:theme-change', handleThemeEvent);
  }, []);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyTheme(mode);
    showToast(`Switched to ${mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'System'} mode`, 'info');
  };

  useEffect(() => {
    if (notificationSettings) {
      setPushEnabled(notificationSettings.pushNotifications ?? true);
      setEmailEnabled(notificationSettings.emailDigests ?? true);
      setMessagesEnabled(notificationSettings.directMessages ?? true);
      setEventsEnabled(notificationSettings.eventReminders ?? true);
      setJobsEnabled(notificationSettings.jobOpportunities ?? true);
    }
  }, [notificationSettings]);

  if (!currentUser) return null;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(currentUser.uid);
    setCopiedId(true);
    showToast('UID copied to clipboard for IT support.', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggle = (key: 'push' | 'email' | 'messages' | 'events' | 'jobs', value: boolean) => {
    if (key === 'push') {
      setPushEnabled(value);
      updateNotificationSettings({ pushNotifications: value });
    }
    if (key === 'email') {
      setEmailEnabled(value);
      updateNotificationSettings({ emailDigests: value });
    }
    if (key === 'messages') {
      setMessagesEnabled(value);
      updateNotificationSettings({ directMessages: value });
    }
    if (key === 'events') {
      setEventsEnabled(value);
      updateNotificationSettings({ eventReminders: value });
    }
    if (key === 'jobs') {
      setJobsEnabled(value);
      updateNotificationSettings({ jobOpportunities: value });
    }
    showToast(`Updated ${key} notification preference`, 'info');
  };

  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;
    setEmailStatusMessage(`Verification email dispatched to ${newEmail}. Please confirm to finalize change.`);
    setTimeout(() => {
      setShowEmailModal(false);
      setEmailStatusMessage('');
      setNewEmail('');
    }, 2500);
  };

  const openPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowOldPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword.trim()) {
      setPasswordError('Please enter your current (old) password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword === oldPassword) {
      setPasswordError('New password must be different from your old password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match. Please re-enter.');
      return;
    }

    const res = changePassword(oldPassword, newPassword);
    if (typeof res === 'object' && res !== null && !res.success) {
      setPasswordError(res.message || 'The current password you entered is incorrect.');
      return;
    }

    setPasswordSuccess('Your password has been changed successfully!');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess(null);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1800);
  };

  // Active channel count
  const activeChannelsCount = [pushEnabled, emailEnabled, messagesEnabled, eventsEnabled, jobsEnabled].filter(Boolean).length;

  return (
    <div className="w-full space-y-6 antialiased pb-12">
      {/* ========================================================================= */}
      {/* TOP HEADER SECTION (COMMAND CENTER AESTHETIC)                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="flex flex-wrap items-center gap-6 sm:gap-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
              Console Settings
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              St. Cecilia's College • Institutional System Governance, Credentials & Workspace Configurations
            </p>
          </div>

          {/* Metric Pill 1: Account Authority */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-700 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block leading-tight font-medium">
                Authority Role
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-stone-900 uppercase tracking-tight">
                  {currentUser.role}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">tier</span>
              </div>
            </div>
          </div>

          {/* Metric Pill 2: Security & Protection Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-700 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block leading-tight font-medium">
                Security Posture
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                  100%
                </span>
                <span className="text-[10px] text-stone-400 font-medium">Protected</span>
              </div>
            </div>
          </div>

          {/* Metric Pill 3: Active Dispatch Channels */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-700 shrink-0">
              <Bell className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block leading-tight font-medium">
                Dispatch Channels
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-stone-900 tracking-tight">
                  {activeChannelsCount}/5
                </span>
                <span className="text-[10px] text-stone-400 font-medium">active alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills + Profile Action (Command Center Style) */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center p-1 bg-stone-100/90 rounded-full border border-stone-200 shadow-2xs relative">
            <button
              type="button"
              onClick={() => setActiveFilterPill('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'all'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>All Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterPill('security')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'security'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Security</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterPill('notifications')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'notifications'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Alerts</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeFilterPill === 'notifications' ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-600'
              }`}>
                {activeChannelsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterPill('appearance')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'appearance'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Theme</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterPill('compliance')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'compliance'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Governance</span>
            </button>
          </div>

          {/* Quick Action: Edit Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Desk</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HERO BENTO CARD: ACCOUNT ANCHOR & SECURITY POSTURE                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[32px] p-6 sm:p-7 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] border border-stone-200/90 transition-all duration-300">
        {/* Institutional St. Cecilia Crimson Architectural Top Trim */}
        <div className="h-1 absolute top-0 left-0 right-0 bg-[#8B181B]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
          {/* Left Details */}
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200/60 shadow-2xs">
                Console Security
              </span>
              <span className="text-xs font-semibold text-stone-500">
                Institutional Session
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-stone-900 tracking-tight leading-tight">
                Account Governance
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Configure credential verification, multi-channel dispatch alerts, visual theme preferences, and identity protection.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {/* Chip 1: Account UID with Copy Button */}
              <button
                type="button"
                onClick={handleCopyId}
                className="w-full text-left bg-stone-50/80 hover:bg-stone-100/90 rounded-2xl p-3 flex items-center justify-between border border-stone-200/80 shadow-2xs cursor-pointer transition-all group"
              >
                <div>
                  <span className="text-[11px] font-bold text-stone-800 group-hover:text-[#8B181B] transition-colors flex items-center gap-1.5">
                    <span>Account UID</span>
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {currentUser.uid.slice(0, 16)}...
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#8B181B]">
                  {copiedId ? 'Copied' : 'Copy ID'}
                </span>
              </button>

              {/* Chip 2: Password Security with Change Button */}
              <div className="bg-stone-50/80 rounded-2xl p-3 flex items-center justify-between border border-stone-200/80 shadow-2xs">
                <div>
                  <span className="text-[11px] font-bold text-stone-800 block">
                    Password Security
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Encrypted with PBKDF2 hash
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="px-2.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] active:scale-95 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center / Right: Interactive Visualizer & Tools */}
          <div className="flex-1 flex flex-col items-center lg:items-end justify-center gap-3 pt-4 lg:pt-0">
            <div className="flex items-end justify-center lg:justify-end gap-3 sm:gap-4.5 w-full">
              {/* Tool 1: Notification Channel Meters */}
              {selectedHeroTool === 'channels_meter' && (
                <div className="flex items-end gap-2.5 sm:gap-4">
                  {[
                    { label: 'Push', active: pushEnabled },
                    { label: 'Email', active: emailEnabled },
                    { label: 'Chat', active: messagesEnabled },
                    { label: 'Events', active: eventsEnabled },
                    { label: 'Jobs', active: jobsEnabled }
                  ].map((ch, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveFilterPill('notifications')}
                      title={`${ch.label} Channel: ${ch.active ? 'Active' : 'Disabled'}`}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="flex flex-col-reverse gap-1 items-center p-1 rounded-xl group-hover:bg-stone-50 transition-all">
                        {[1, 2, 3].map((segIdx) => (
                          <div
                            key={segIdx}
                            className={`w-7 sm:w-8 h-6 sm:h-7 rounded-lg transition-all ${
                              ch.active
                                ? 'bg-[#8B181B] shadow-xs'
                                : 'bg-stone-200 border border-stone-200/60'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-[10px] font-medium transition-colors ${ch.active ? 'text-[#8B181B] font-bold' : 'text-stone-400'}`}>
                        {ch.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tool 2: Security Radar */}
              {selectedHeroTool === 'security_radar' && (
                <div className="w-full max-w-sm bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-white/60 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-800 pb-1 border-b border-stone-100">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Session & Cryptographic State
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Active Session
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 rounded-xl bg-stone-50">
                      <span className="text-stone-400 block text-[9px]">Account Role</span>
                      <span className="font-extrabold text-stone-900 uppercase font-mono text-xs">{currentUser.role}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-stone-50">
                      <span className="text-stone-400 block text-[9px]">Verification</span>
                      <span className="font-extrabold text-emerald-700 font-mono text-xs">
                        {currentUser.isVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-stone-50">
                      <span className="text-stone-400 block text-[9px]">Interface Mode</span>
                      <span className="font-extrabold text-stone-900 uppercase font-mono text-xs">{themeMode}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-stone-50">
                      <span className="text-stone-400 block text-[9px]">Push Support</span>
                      <span className="font-extrabold text-stone-900 uppercase font-mono text-xs">{pushPermissionStatus}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-stone-50 col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-stone-400 block text-[9px]">Biometric App Lock</span>
                        <span className={`font-extrabold font-mono text-xs ${appLockEnabled ? 'text-emerald-700' : 'text-stone-500'}`}>
                          {appLockEnabled ? 'ENFORCED ON RESUME' : 'DISABLED'}
                        </span>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${appLockEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Tool 3: Member Profile Spotlight */}
              {selectedHeroTool === 'session_info' && (
                <div className="w-full max-w-sm bg-stone-900 text-stone-100 rounded-2xl p-4 border border-stone-800 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={getUserAvatar(currentUser.profilePictureUrl)}
                      alt={currentUser.name}
                      onError={handleUserAvatarError}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#8B181B]"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{currentUser.name}</h4>
                      <p className="text-[11px] text-stone-400 truncate">{currentUser.email}</p>
                      <div className="mt-1">
                        <UserRoleBadge role={currentUser.role} size="xs" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                    <span>Batch: {currentUser.batch || 'Cecilian'}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              )}

              {/* Tool Switcher Rail */}
              <div className="flex flex-col items-center gap-2 pl-3 border-l border-black/5 ml-2 relative">
                <button
                  type="button"
                  onClick={() => setSelectedHeroTool('security_radar')}
                  title="Security Radar"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    selectedHeroTool === 'security_radar'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[1.75]" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedHeroTool('channels_meter')}
                  title="Alert Channels Meter"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    selectedHeroTool === 'channels_meter'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 stroke-[1.75]" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedHeroTool('session_info')}
                  title="Identity Spotlight"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    selectedHeroTool === 'session_info'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5 stroke-[1.75]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM 3 BENTO TILES (CUSTOM CONSOLE WORKSPACE SUITE)                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* BENTO TILE 1: "Appearance & Theme Studio" */}
        <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#8B181B]" />
                <span>Theme Studio</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 uppercase font-mono">
                {themeMode}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-0.5">
              Interface mode & visual contrast
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 py-4">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer border ${
                themeMode === 'light'
                  ? 'bg-amber-50/80 border-amber-400 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-400/40'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-600" />
              <span className="text-xs">Light</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer border ${
                themeMode === 'dark'
                  ? 'bg-stone-900 border-stone-700 text-white font-bold shadow-2xs ring-1 ring-stone-600'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
              }`}
            >
              <Moon className="w-4 h-4 text-amber-400" />
              <span className="text-xs">Dark</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer border ${
                themeMode === 'system'
                  ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-400/40'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
              }`}
            >
              <Monitor className="w-4 h-4 text-blue-600" />
              <span className="text-xs">System</span>
            </button>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500 text-[10px] font-medium">
              Applied automatically across sessions
            </span>
            <span className="text-[11px] font-bold text-[#8B181B]">
              Active
            </span>
          </div>
        </div>

        {/* BENTO TILE 2: "24-Hour Push Notification Safeguard" */}
        <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8B181B]" />
                <span>24h Alert System</span>
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  pushPermissionStatus === 'granted'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : pushPermissionStatus === 'denied'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {pushPermissionStatus === 'granted' ? 'Push Active' : pushPermissionStatus === 'denied' ? 'Blocked' : 'Default'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-0.5">
              Campus event kick-off chime & alert
            </p>
          </div>

          <div className="py-3 space-y-2">
            {pushPermissionStatus !== 'granted' ? (
              <button
                type="button"
                onClick={requestBrowserPushPermission}
                className="w-full py-2 px-3 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Authorize OS Push Alerts</span>
              </button>
            ) : (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Browser Push Notifications Authorized</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => sendTest24HourAlert()}
              className="w-full py-2 px-3 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Test Audio Chime & Push</span>
            </button>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500 text-[10px] font-medium">
              High Attendance Safeguard
            </span>
            <span className="text-[11px] font-bold text-stone-700 font-mono">
              24h Advance
            </span>
          </div>
        </div>

        {/* BENTO TILE 3: "Governance & Support Desk" */}
        <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#8B181B]" />
                <span>Governance & Help</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                v2.4.0
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-0.5">
              Alumni policies, FAQ, & registrar support
            </p>
          </div>

          <div className="py-2 divide-y divide-stone-100 text-xs">
            {/* Share App Action */}
            <div className="pb-2">
              <button
                type="button"
                onClick={handleShareApp}
                className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100/80 text-[#8B181B] rounded-xl font-bold flex items-center justify-between transition-colors cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Share App with Alumni</span>
                </div>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-red-200 font-semibold text-stone-700">
                  Invite
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => openExternalUrl('https://stcecilia.edu.ph')}
              className="w-full py-2 flex items-center justify-between text-stone-700 hover:text-[#8B181B] cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-stone-400" />
                Official College Website
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => setShowFaqModal(true)}
              className="w-full py-2 flex items-center justify-between text-stone-700 hover:text-[#8B181B] cursor-pointer"
            >
              <span>Frequently Asked Questions</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="w-full py-2 flex items-center justify-between text-stone-700 hover:text-[#8B181B] cursor-pointer"
            >
              <span>Directory Privacy Policy</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="w-full py-2 flex items-center justify-between text-stone-700 hover:text-[#8B181B] cursor-pointer"
            >
              <span>About Alumni Network</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <a
              href="mailto:support@scc.edu.ph"
              className="text-[#8B181B] hover:underline font-semibold text-[11px] flex items-center gap-1"
            >
              <Mail className="w-3 h-3" />
              <span>Contact IT Registrar Support</span>
            </a>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* DETAILED SETTINGS CARDS (FILTERABLE COMMAND SECTIONS)                      */}
      {/* ========================================================================= */}
      
      {/* SECTION 1: SECURITY & CREDENTIALS ACCESS */}
      {(activeFilterPill === 'all' || activeFilterPill === 'security') && (
        <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-stone-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-[#8B181B] flex items-center justify-center">
                <Lock className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Security Credentials & Access</h3>
                <p className="text-xs text-stone-500">Manage account authentication, institutional email, and encryption</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              Active Protection
            </span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {/* Email Setting */}
            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                <div>
                  <p className="font-bold text-stone-900 text-xs">Institutional Email Address</p>
                  <p className="text-stone-500 text-[11px]">{currentUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-semibold transition-colors cursor-pointer self-start sm:self-auto"
              >
                Change Email
              </button>
            </div>

            {/* Password Setting */}
            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-stone-400 shrink-0" />
                <div>
                  <p className="font-bold text-stone-900 text-xs">Access Password</p>
                  <p className="text-stone-500 text-[11px]">Protected via authenticated password hash</p>
                </div>
              </div>
              <button
                type="button"
                onClick={openPasswordModal}
                className="px-3.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl font-semibold transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                Update Password
              </button>
            </div>

            {/* ========================================================================= */}
            {/* SUB-SECTION: BIOMETRIC PREFERENCES & SECONDARY APP LOCK                   */}
            {/* ========================================================================= */}
            <div className="mt-6 pt-5 border-t border-stone-100">
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-[#8B181B] flex items-center justify-center">
                    <ScanFace className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <span>Face Detection Preferences</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {biometricAvail.label}
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Configure optical Face Detection hardware authorization and secondary app-lock protection
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
                  <span className={`w-2 h-2 rounded-full ${biometricAvail.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                  <span>{biometricAvail.isAvailable ? 'Face Sensor Ready' : 'Hardware Inactive'}</span>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* 1. Dashboard Biometric Access Gate */}
                <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-850/80 border border-stone-200/80 dark:border-stone-800 space-y-3 transition-all hover:bg-stone-50 dark:hover:bg-stone-850">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-stone-900 dark:text-stone-100 text-xs flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Dashboard Face Detection Gate</span>
                        </p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          appLockEnabled
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-stone-200/70 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                        }`}>
                          {appLockEnabled ? 'ENFORCED BEFORE DASHBOARD' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-1 leading-relaxed">
                        Requires user authentication using optical Face Detection recognition via @capgo/capacitor-native-biometric before accessing the main dashboard.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={handleTestBiometrics}
                        disabled={isBiometricTesting}
                        className="px-3 py-1.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                        title="Test native Face Detection prompt"
                      >
                        <ScanFace className="w-3.5 h-3.5 text-[#8B181B] dark:text-rose-400" />
                        <span>{isBiometricTesting ? 'Scanning...' : 'Test Face Scan'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('applet:lock-dashboard'));
                        }}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white dark:bg-stone-700 dark:hover:bg-stone-600 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                        title="Immediately lock the dashboard now"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-300" />
                        <span>Lock Now</span>
                      </button>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appLockEnabled}
                          onChange={(e) => handleToggleAppLock(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-stone-200 dark:bg-stone-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B181B]" />
                      </label>
                    </div>
                  </div>

                  {/* Clear educational bullet points for transparency */}
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/80 text-[11px] space-y-1.5 text-stone-600 dark:text-stone-300">
                    <p className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                      <HelpCircle className="w-3.5 h-3.5 text-[#8B181B] dark:text-rose-400 shrink-0" />
                      <span>How Dashboard Face Detection Lock Works:</span>
                    </p>
                    <ul className="space-y-1 pl-4 list-disc text-stone-600 dark:text-stone-300 text-[11px]">
                      <li>
                        <strong>When Leaving App / Switching Tabs:</strong> Whenever you minimize the app, switch to another app, or lock your phone, your collegiate session is automatically shielded.
                      </li>
                      <li>
                        <strong>Face Recognition Hardware Enclave:</strong> Prompts native iOS Face ID or Android BiometricPrompt with front camera face detection via Capacitor. On desktop/browser, it activates optical viewfinder simulation or WebAuthn platform authenticator.
                      </li>
                      <li>
                        <strong>Quick Manual Lock:</strong> You can also lock your screen instantly anytime from the profile avatar menu, or by pressing <kbd className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border text-[10px]">⌘K</kbd> &rarr; <em>"Lock Dashboard"</em>.
                      </li>
                      <li>
                        <strong>Never Locked Out:</strong> If your camera is blocked or lighting is dim, you can tap <em>"Use Password Instead"</em> to safely authenticate via your normal account password.
                      </li>
                    </ul>
                  </div>

                  {/* Persistence confirmation tag */}
                  <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-[10px] text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-stone-400" />
                      Status: <strong>{appLockEnabled ? 'Enforced on launch, resume & lock' : 'Bypass on launch'}</strong>
                    </span>
                    <span className="font-mono text-[9px] text-stone-400">
                      @capgo/capacitor-native-biometric
                    </span>
                  </div>
                </div>

                {/* 2. Primary Biometric Quick Sign-In */}
                <div className="p-4 rounded-2xl bg-white border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-stone-900 text-xs">Face Detection Quick Sign-In</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        biometricEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {biometricEnabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Store credentials in native Keychain / Keystore to sign in with your face from the login screen
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {biometricEnabled && (
                      <button
                        type="button"
                        onClick={handleTestBiometrics}
                        disabled={isBiometricTesting}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        {isBiometricTesting ? 'Scanning...' : 'Test Face Scan'}
                      </button>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={biometricEnabled}
                        onChange={(e) => handleToggleBiometrics(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B181B]" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: DISPATCH CHANNELS & NOTIFICATION MATRIX */}
      {(activeFilterPill === 'all' || activeFilterPill === 'notifications') && (
        <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-stone-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Bell className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Dispatch Channels & Notification Matrix</h3>
                <p className="text-xs text-stone-500">Configure real-time event reminders, direct dispatches, and career notices</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold">
              {activeChannelsCount} Enabled
            </span>
          </div>

          <div className="space-y-4">
            {/* Toggle 1: Push */}
            <div className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-stone-900">Native Push Notifications</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      @capacitor/push-notifications
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Real-time alerts on Android & iOS for alumni events, direct messages, and campus announcements
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      setPushEnabled(checked);
                      handleToggle('push', checked);
                      if (checked) {
                        const res = await requestPushNotifications();
                        if (res.granted) {
                          showToast('Push notifications registered! Real-time alerts active.', 'success');
                        } else if (res.error) {
                          showToast(res.error, 'error');
                        }
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B181B]" />
                </label>
              </div>

              {pushEnabled && (
                <div className="pt-2.5 border-t border-stone-200/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <span className="text-stone-500 font-medium">Test Real-Time Alert Channels:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSendTestPush('event')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-[#8B181B] text-stone-700 font-semibold transition-colors cursor-pointer text-[10px]"
                    >
                      Events (24h RSVP)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendTestPush('message')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-[#8B181B] text-stone-700 font-semibold transition-colors cursor-pointer text-[10px]"
                    >
                      Peer Message
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendTestPush('announcement')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-[#8B181B] text-stone-700 font-semibold transition-colors cursor-pointer text-[10px]"
                    >
                      Announcement
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle 2: Email */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/70 border border-stone-200/70">
              <div className="min-w-0 pr-4">
                <p className="text-xs font-bold text-stone-900">Email Digest & Institutional Broadcasts</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Monthly alumni circulars, reunion invitations, and career opportunities</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => handleToggle('email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B181B]" />
              </label>
            </div>

            {/* Toggle 3: Messages */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/70 border border-stone-200/70">
              <div className="min-w-0 pr-4">
                <p className="text-xs font-bold text-stone-900">Direct Messages & Peer Dispatches</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Notify instantly when another alumnus, staff member, or event cohort reaches out</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={messagesEnabled}
                  onChange={(e) => handleToggle('messages', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B181B]" />
              </label>
            </div>

            {/* Toggle 4: Events */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/70 border border-stone-200/70">
              <div className="min-w-0 pr-4">
                <p className="text-xs font-bold text-stone-900">Campus Events & Reunion Cohorts</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Automated reminders for reunions you marked "Going" or "Interested"</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={eventsEnabled}
                  onChange={(e) => handleToggle('events', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B181B]" />
              </label>
            </div>

            {/* Toggle 5: Jobs */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/70 border border-stone-200/70">
              <div className="min-w-0 pr-4">
                <p className="text-xs font-bold text-stone-900">Job Postings & Career Opportunities</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Instant alerts when vacancies matching your academic program are published</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={jobsEnabled}
                  onChange={(e) => handleToggle('jobs', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B181B]" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: SESSION TERMINATION & DANGER DESK */}
      {(activeFilterPill === 'all' || activeFilterPill === 'security') && (
        <div className="bg-red-50/40 rounded-[32px] p-6 sm:p-7 border border-red-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-red-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
                <LogOut className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-950">Session & Account Lifecycle</h3>
                <p className="text-xs text-red-700/80">Manage active authenticated token or remove alumni record</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-200">
              Authorized Actions
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div>
              <p className="text-xs font-bold text-stone-900">Active Console Session</p>
              <p className="text-[11px] text-stone-500">End your active authenticated session on this device</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-600" />
                <span>Log Out of Console</span>
              </button>

              {!isAdminRole && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHANGE EMAIL MODAL                                                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 text-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Change Account Email</h3>
                    <p className="text-[11px] text-stone-500">Update your verified address for circulars</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {emailStatusMessage ? (
                <div className="my-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{emailStatusMessage}</span>
                </div>
              ) : (
                <form onSubmit={handleChangeEmail} className="space-y-3.5">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 block text-[11px]">Current Address</span>
                    <span className="font-bold text-stone-900 text-xs">{currentUser.email}</span>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">New Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. cecilian.alumni@domain.com"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#8B181B]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl font-bold cursor-pointer shadow-2xs"
                    >
                      Dispatch Verification
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CHANGE PASSWORD MODAL                                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl border border-stone-200 text-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#8B181B]/10 flex items-center justify-center text-[#8B181B]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Change Account Password</h3>
                    <p className="text-[11px] text-stone-500">Verify current password and set your new credential</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {passwordSuccess ? (
                <div className="my-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs">Password Updated</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">{passwordSuccess}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3.5">
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {/* Old Password */}
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Current (Old) Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPass ? 'text' : 'password'}
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs pr-10 focus:bg-white focus:outline-hidden focus:border-[#8B181B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs pr-10 focus:bg-white focus:outline-hidden focus:border-[#8B181B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">Must be at least 6 characters and different from old password.</p>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs pr-10 focus:bg-white focus:outline-hidden focus:border-[#8B181B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl font-bold cursor-pointer shadow-2xs"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* FAQ MODAL                                                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showFaqModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl border border-stone-200 max-h-[85vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Frequently Asked Questions</h3>
                    <p className="text-[11px] text-stone-500">St. Cecilia's College Alumni Network</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900">Who can connect with who?</h4>
                  <p className="mt-1">
                    Peer dispatches are open across verified alumni, staff officers, and authorized university administrators. Unverified accounts cannot message directory members.
                  </p>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900">How do I verify my degree and graduation records?</h4>
                  <p className="mt-1">
                    University Registrars cross-match graduation masterlists. You can also submit student verification via the Registrar Matcher in your profile.
                  </p>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900">Who can create events and circulars?</h4>
                  <p className="mt-1">
                    Admins, Registrars, Staff members, and Chapter Leaders have publishing privileges for official campus events and announcements.
                  </p>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900">How can I post jobs on the Alumni Board?</h4>
                  <p className="mt-1">
                    Any verified alumnus or corporate partner can post career openings directly from the Career Opportunities hub.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Close FAQ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PRIVACY POLICY MODAL                                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl border border-stone-200 max-h-[85vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Privacy Policy & Directory Governance</h3>
                    <p className="text-[11px] text-stone-500">St. Cecilia's College - Cebu, Inc.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
                <p>
                  The Cecilian Alumni Portal complies strictly with Republic Act No. 10173 (Data Privacy Act of 2012). Personal contact details, phone numbers, and private emails are never exposed to public internet search crawlers.
                </p>
                <p>
                  Directory information is visible only to authenticated alumni, staff officers, and authorized university administrators who have accepted institutional terms.
                </p>
                <p>
                  You retain full control over your career tracer visibility and can delete your profile records permanently at any time.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ABOUT MODAL                                                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl border border-stone-200 text-center text-xs space-y-4"
            >
              <img
                src="/assets/cecilians-seal.jpg"
                alt="St. Cecilia's Seal"
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-[#8B181B] shadow-md"
              />
              <div>
                <h3 className="text-base font-extrabold text-stone-900 font-serif">St. Cecilia's College Alumni Network</h3>
                <p className="text-[11px] text-stone-400 mt-0.5">Version 2.4.0 (Production Release)</p>
              </div>
              <p className="text-stone-600 leading-relaxed text-xs">
                Empowering graduates of St. Cecilia's College - Cebu, Inc. across disciplines with lifelong mentorship, institutional verification, and career mobility.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => openExternalUrl('https://stcecilia.edu.ph')}
                  className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100/80 text-[#8B181B] rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Visit Official College Website</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8B181B]" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAboutModal(false)}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* LOGOUT CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-stone-200 text-xs text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#8B181B] flex items-center justify-center mx-auto shadow-2xs">
                <LogOut className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-base font-bold text-stone-900">End Active Session?</h3>
              <p className="text-stone-500 leading-relaxed">
                Are you sure you want to end your authenticated session on this workstation?
              </p>
              <div className="pt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl font-medium text-stone-700 cursor-pointer"
                >
                  Stay Connected
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                  }}
                  className="px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl font-bold shadow-2xs cursor-pointer"
                >
                  Yes, Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DELETE ACCOUNT CONFIRMATION MODAL                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {!isAdminRole && showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-red-200 text-xs space-y-3"
            >
              <div className="flex items-center gap-2.5 text-red-600">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-red-950">Permanently Remove Account?</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                This action is permanent and irreversible. Your alumni registry verification, direct message history, and career postings will be permanently expunged.
              </p>
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    deleteAccount();
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
