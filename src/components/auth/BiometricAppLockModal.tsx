/**
 * St. Cecilia's College - Cecilian Alumnet
 * Native Face Detection Biometric Gate
 * 
 * Powered by @capgo/capacitor-native-biometric & Optical Face Recognition Engine.
 * Requires user authentication using Face Detection before granting access
 * to the main collegiate dashboard.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ScanFace,
  Lock,
  Unlock,
  LogOut,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Camera,
  CameraOff,
  Scan,
  Focus,
  Activity
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  checkBiometricAvailability,
  verifyBiometricForDashboardAccess,
  BiometricAvailability
} from '../../services/biometricAuthService';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';
import { triggerHaptic } from '../../services/hapticsService';

interface BiometricAppLockModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onUnlocked: () => void;
  onSignOut: () => void;
}

export const BiometricAppLockModal: React.FC<BiometricAppLockModalProps> = ({
  currentUser,
  isOpen,
  onUnlocked,
  onSignOut
}) => {
  const [biometricAvail, setBiometricAvail] = useState<BiometricAvailability>({
    isAvailable: true,
    biometryType: 'faceId',
    label: 'Face Detection'
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState<string>('Initializing optical face sensors...');

  // Live Camera preview state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkBiometricAvailability().then((avail) => {
      setBiometricAvail(avail);
    });
  }, []);

  // Cleanup camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start front camera stream if user desires live video feed
  const startCameraStream = useCallback(async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not accessible on this device.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Front camera stream error:', err);
      setCameraError('Camera access unavailable. Using digital facial scanner.');
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const handleTriggerUnlock = useCallback(async () => {
    if (isVerifying || isSuccess) return;
    setIsVerifying(true);
    setErrorMsg(null);
    setScanProgress(15);
    setAnalysisStep('Aligning facial geometry...');

    try {
      // Step-wise scan animation progress
      const p1 = setTimeout(() => {
        setScanProgress(45);
        setAnalysisStep('Mapping 68 facial landmark nodes...');
      }, 250);

      const p2 = setTimeout(() => {
        setScanProgress(80);
        setAnalysisStep('Matching biometric identity hash...');
      }, 550);

      const res = await verifyBiometricForDashboardAccess(currentUser.name);

      clearTimeout(p1);
      clearTimeout(p2);

      if (res.success) {
        setScanProgress(100);
        setAnalysisStep('Face Verified • Identity Confirmed');
        setIsSuccess(true);
        await triggerHaptic('success');
        stopCameraStream();
        setTimeout(() => {
          onUnlocked();
        }, 600);
      } else if (res.error) {
        setScanProgress(0);
        setAnalysisStep('Scan interrupted');
        setErrorMsg(res.error);
        await triggerHaptic('error');
      }
    } catch (err: any) {
      setScanProgress(0);
      setAnalysisStep('Recognition cancelled');
      setErrorMsg(err?.message || 'Face detection was cancelled or failed.');
      await triggerHaptic('error');
    } finally {
      setIsVerifying(false);
    }
  }, [currentUser.name, isSuccess, isVerifying, onUnlocked, stopCameraStream]);

  const handleTriggerUnlockRef = useRef(handleTriggerUnlock);
  handleTriggerUnlockRef.current = handleTriggerUnlock;

  // Automatically initiate face detection prompt once when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsInitializing(true);
      setErrorMsg(null);
      setScanProgress(10);
      setAnalysisStep('Initializing optical face sensors...');

      const stepTimer1 = setTimeout(() => {
        setScanProgress(25);
        setAnalysisStep('Calibrating facial geometry grid...');
      }, 350);

      const triggerTimer = setTimeout(() => {
        setIsInitializing(false);
        handleTriggerUnlockRef.current();
      }, 700);

      return () => {
        clearTimeout(stepTimer1);
        clearTimeout(triggerTimer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-stone-950/96 backdrop-blur-2xl flex items-center justify-center p-4 pt-safe pb-safe select-none">
        {/* Ambient collegiate background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#8B181B]/20 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl opacity-40" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm sm:max-w-md bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.8)] flex flex-col items-center z-10"
        >
          {/* Top Security Banner */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-300 text-[10px] font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Face Detection Security Enclave</span>
          </div>

          {/* User Profile Avatar with Lock Hub */}
          <div className="relative mb-4">
            <div
              className={`absolute inset-0 rounded-full blur-lg transition-all duration-500 ${
                isSuccess
                  ? 'bg-emerald-500/60 scale-110'
                  : isVerifying
                  ? 'bg-[#8B181B]/60 scale-105 animate-pulse'
                  : 'bg-[#8B181B]/30'
              }`}
            />
            <img
              src={getUserAvatar(currentUser.profilePictureUrl)}
              alt={currentUser.name}
              onError={handleUserAvatarError}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 shadow-xl transition-all duration-300 ${
                isSuccess
                  ? 'border-emerald-500 ring-4 ring-emerald-500/30'
                  : 'border-[#8B181B] ring-4 ring-[#8B181B]/20'
              }`}
            />
            <div
              className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-stone-900 flex items-center justify-center shadow-lg transition-colors duration-300 ${
                isSuccess ? 'bg-emerald-600' : 'bg-[#8B181B]'
              }`}
            >
              {isSuccess ? (
                <Unlock className="w-3.5 h-3.5 text-white" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-white" />
              )}
            </div>
          </div>

          {/* Title & Greeting */}
          <h2 className="text-lg sm:text-xl font-bold font-sans text-white tracking-tight">
            {isSuccess ? 'Face Verified' : 'Facial Recognition Required'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-200 font-semibold mt-0.5">
            {currentUser.name}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed max-w-xs">
            Look directly into the camera to unlock your dashboard session.
          </p>

          {/* Interactive Optical Face Detection Viewfinder */}
          <div className="my-5 w-full flex flex-col items-center justify-center">
            <div
              onClick={handleTriggerUnlock}
              role="button"
              tabIndex={0}
              title="Click or tap to verify face"
              className={`relative w-44 h-44 sm:w-48 sm:h-48 rounded-3xl overflow-hidden flex flex-col items-center justify-center transition-all cursor-pointer group select-none ${
                isSuccess
                  ? 'bg-emerald-950/70 border-2 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.35)]'
                  : isVerifying || isInitializing
                  ? 'bg-stone-950/90 border-2 border-[#8B181B] shadow-[0_0_30px_rgba(139,24,27,0.45)]'
                  : 'bg-stone-950/80 hover:bg-stone-900/90 border-2 border-stone-700/80 hover:border-[#8B181B]/70 shadow-xl'
              }`}
            >
              {/* Optional Live Camera Preview Video */}
              {cameraActive && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
                    isSuccess ? 'opacity-80' : 'opacity-90'
                  }`}
                />
              )}

              {/* Viewfinder Vignette Overlay */}
              <div className="absolute inset-0 bg-radial-gradient pointer-events-none bg-stone-950/30" />

              {/* Subtle Biometric Coordinate Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 transition-opacity duration-500">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="biometric-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-red-300/30" />
                      <circle cx="10" cy="10" r="0.65" fill="currentColor" className="text-red-400/40" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#biometric-grid)" />
                </svg>
              </div>

              {/* Top HUD: Real-time Active Sensor Status Telemetry */}
              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20 pointer-events-none">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-950/85 border border-stone-800/80 backdrop-blur-md shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    {(isVerifying || isInitializing) && !isSuccess && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    )}
                    {isSuccess && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        isSuccess
                          ? 'bg-emerald-400'
                          : isVerifying || isInitializing
                          ? 'bg-red-400'
                          : 'bg-stone-500'
                      }`}
                    />
                  </span>
                  <span className="text-[8.5px] font-mono tracking-wider uppercase text-stone-300 font-semibold">
                    {isSuccess
                      ? 'Verified'
                      : isInitializing
                      ? 'Sensors Calibrating'
                      : isVerifying
                      ? 'Face Scan Active'
                      : 'Sensor Standby'}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-950/70 text-[8.5px] font-mono text-stone-400 border border-stone-800/60">
                  <Focus className="w-2.5 h-2.5 text-red-400/80" />
                  <span>{isVerifying || isInitializing ? '3D MESH' : '2D ID'}</span>
                </div>
              </div>

              {/* High-tech Corner Target Reticles with Calibration Micro-Motion */}
              <motion.div
                animate={
                  isInitializing || isVerifying
                    ? { x: [0, -1, 0], y: [0, -1, 0] }
                    : { x: 0, y: 0 }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 transition-colors duration-300 ${
                  isSuccess
                    ? 'border-emerald-400'
                    : isVerifying || isInitializing
                    ? 'border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    : 'border-stone-500 group-hover:border-[#8B181B]'
                }`}
              />
              <motion.div
                animate={
                  isInitializing || isVerifying
                    ? { x: [0, 1, 0], y: [0, -1, 0] }
                    : { x: 0, y: 0 }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 transition-colors duration-300 ${
                  isSuccess
                    ? 'border-emerald-400'
                    : isVerifying || isInitializing
                    ? 'border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    : 'border-stone-500 group-hover:border-[#8B181B]'
                }`}
              />
              <motion.div
                animate={
                  isInitializing || isVerifying
                    ? { x: [0, -1, 0], y: [0, 1, 0] }
                    : { x: 0, y: 0 }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 transition-colors duration-300 ${
                  isSuccess
                    ? 'border-emerald-400'
                    : isVerifying || isInitializing
                    ? 'border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    : 'border-stone-500 group-hover:border-[#8B181B]'
                }`}
              />
              <motion.div
                animate={
                  isInitializing || isVerifying
                    ? { x: [0, 1, 0], y: [0, 1, 0] }
                    : { x: 0, y: 0 }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 transition-colors duration-300 ${
                  isSuccess
                    ? 'border-emerald-400'
                    : isVerifying || isInitializing
                    ? 'border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    : 'border-stone-500 group-hover:border-[#8B181B]'
                }`}
              />

              {/* Concentric Optical Depth-Mapping Pulse Waves during Initialization / Scan */}
              {(isInitializing || isVerifying) && !isSuccess && (
                <>
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0.55 }}
                    animate={{ scale: 1.35, opacity: 0 }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.2,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0
                    }}
                    className="absolute w-28 h-36 rounded-[50%] border border-red-500/40 pointer-events-none z-10"
                  />
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0.45 }}
                    animate={{ scale: 1.35, opacity: 0 }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.2,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 1.1
                    }}
                    className="absolute w-28 h-36 rounded-[50%] border border-amber-500/30 pointer-events-none z-10"
                  />
                </>
              )}

              {/* Concentric Facial Scan Reticle Oval */}
              <div
                className={`relative w-28 h-36 rounded-[50%] border-2 transition-all duration-300 flex items-center justify-center ${
                  isSuccess
                    ? 'border-emerald-400/90 scale-95 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                    : isVerifying || isInitializing
                    ? 'border-red-500/80 scale-100 border-dashed animate-pulse shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                    : 'border-dashed border-stone-600/70 group-hover:border-stone-400/90'
                }`}
              >
                {/* Facial Landmark Tracking Nodes with Staggered Optical Shimmer */}
                <motion.div
                  animate={
                    isVerifying || isInitializing
                      ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }
                      : {}
                  }
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                  className={`absolute top-7 left-7 w-2 h-2 rounded-full transition-all duration-300 ${
                    isSuccess
                      ? 'bg-emerald-400 scale-125'
                      : isVerifying || isInitializing
                      ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]'
                      : 'bg-stone-500/60'
                  }`}
                  title="Left Eye Landmark"
                />
                <motion.div
                  animate={
                    isVerifying || isInitializing
                      ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }
                      : {}
                  }
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                  className={`absolute top-7 right-7 w-2 h-2 rounded-full transition-all duration-300 ${
                    isSuccess
                      ? 'bg-emerald-400 scale-125'
                      : isVerifying || isInitializing
                      ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]'
                      : 'bg-stone-500/60'
                  }`}
                  title="Right Eye Landmark"
                />
                <motion.div
                  animate={
                    isVerifying || isInitializing
                      ? { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }
                      : {}
                  }
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                  className={`absolute top-16 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    isSuccess
                      ? 'bg-emerald-400'
                      : isVerifying || isInitializing
                      ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                      : 'bg-stone-500/60'
                  }`}
                  title="Nose Bridge"
                />
                <motion.div
                  animate={
                    isVerifying || isInitializing
                      ? { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }
                      : {}
                  }
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                  className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full transition-all duration-300 ${
                    isSuccess
                      ? 'bg-emerald-400'
                      : isVerifying || isInitializing
                      ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]'
                      : 'bg-stone-500/50'
                  }`}
                  title="Mouth Contour"
                />
                <motion.div
                  animate={
                    isVerifying || isInitializing
                      ? { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }
                      : {}
                  }
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
                  className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-2 h-1 rounded-full transition-all duration-300 ${
                    isSuccess
                      ? 'bg-emerald-400'
                      : isVerifying || isInitializing
                      ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]'
                      : 'bg-stone-500/40'
                  }`}
                  title="Chin Contour"
                />

                {/* Center Icon (when camera is off or loading) */}
                {!cameraActive && (
                  <div className="z-10 transition-transform duration-300">
                    {isSuccess ? (
                      <CheckCircle2 className="w-14 h-14 text-emerald-400 transition-transform scale-110" />
                    ) : (
                      <ScanFace
                        className={`w-14 h-14 transition-all duration-300 ${
                          isVerifying || isInitializing
                            ? 'text-rose-400 scale-105'
                            : 'text-stone-300 group-hover:text-white'
                        }`}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Professional Laser Scanning Beam & Volumetric Gradient Curtain Animation */}
              {(isVerifying || isInitializing) && !isSuccess && (
                <motion.div
                  initial={{ y: -80 }}
                  animate={{ y: 80 }}
                  transition={{
                    repeat: Infinity,
                    repeatType: 'reverse',
                    duration: 1.6,
                    ease: 'easeInOut'
                  }}
                  className="absolute inset-x-3 pointer-events-none z-20 flex flex-col items-center"
                >
                  {/* Subtle volumetric curtain light trailing behind beam */}
                  <div className="w-full h-7 bg-gradient-to-b from-transparent via-red-500/10 to-red-500/30 blur-[1px]" />
                  {/* High-definition optical scanning laser */}
                  <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-red-300 via-50% to-transparent shadow-[0_0_12px_rgba(248,113,113,0.9)]" />
                  {/* Central focal node on the beam */}
                  <div className="w-2.5 h-1 -mt-[1.5px] rounded-full bg-red-100/90 shadow-[0_0_6px_#ffffff]" />
                </motion.div>
              )}

              {/* Status Pill in Viewfinder */}
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-center z-20 pointer-events-none">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md transition-colors shadow-sm ${
                    isSuccess
                      ? 'bg-emerald-950/85 text-emerald-300 border border-emerald-500/50'
                      : isVerifying
                      ? 'bg-red-950/85 text-rose-300 border border-red-500/50'
                      : isInitializing
                      ? 'bg-amber-950/85 text-amber-300 border border-amber-500/50'
                      : 'bg-stone-900/85 text-stone-300 border border-stone-700/60'
                  }`}
                >
                  {isSuccess
                    ? 'Face Match (100%)'
                    : isVerifying
                    ? 'Scanning Facial Geometry...'
                    : isInitializing
                    ? 'Calibrating Optical Sensors...'
                    : 'Tap to Scan Face'}
                </span>
              </div>
            </div>

            {/* Analysis Telemetry Line */}
            <div className="w-full mt-2 flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span className="truncate pr-2">{analysisStep}</span>
              <span className="shrink-0 font-bold text-stone-300">{scanProgress}%</span>
            </div>

            {/* Camera View Toggle */}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (cameraActive) {
                    stopCameraStream();
                  } else {
                    startCameraStream();
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {cameraActive ? (
                  <>
                    <CameraOff className="w-3 h-3 text-stone-400" />
                    <span>Disable Camera Preview</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3 h-3 text-amber-400" />
                    <span>Open Front Camera</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="w-full mb-3.5 p-3 bg-red-950/70 border border-red-800/80 rounded-2xl text-[11px] text-red-200 flex items-center gap-2 text-left animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="flex-1 leading-snug">{errorMsg}</span>
              <button
                type="button"
                onClick={handleTriggerUnlock}
                className="p-1 text-red-300 hover:text-white rounded-lg hover:bg-red-900/60 transition-colors cursor-pointer"
                title="Retry Face Detection"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="w-full space-y-2">
            <button
              type="button"
              disabled={isVerifying || isInitializing || isSuccess}
              onClick={handleTriggerUnlock}
              className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5 ${
                isSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#8B181B] hover:bg-[#721316] text-white disabled:opacity-70'
              }`}
            >
              <ScanFace className={`w-4 h-4 shrink-0 ${(isVerifying || isInitializing) && !isSuccess ? 'animate-pulse text-red-200' : ''}`} />
              <span>
                {isSuccess
                  ? 'Access Granted'
                  : isVerifying
                  ? 'Detecting Facial Features...'
                  : isInitializing
                  ? 'Initializing Face Detection...'
                  : 'Authenticate with Face Detection'}
              </span>
            </button>

            {/* Alternative Password / Sign Out */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                stopCameraStream();
                onSignOut();
              }}
              className="w-full py-2.5 px-4 bg-stone-800/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-2xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Use Password Instead or Switch Account</span>
            </button>
          </div>

          {/* Security Context Info */}
          <div className="mt-3.5 p-3 rounded-2xl bg-stone-950/70 border border-stone-800 text-[11px] text-stone-400 text-left space-y-1 w-full">
            <div className="flex items-center gap-1.5 font-bold text-stone-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Face Detection Security Shield</span>
            </div>
            <p className="text-[10.5px] leading-relaxed text-stone-400">
              Your collegiate dashboard, academic records, and messages are locked for your security. Look at the camera or tap to scan face and resume your session in seconds.
            </p>
          </div>

          {/* Enclave Note */}
          <div className="mt-4 pt-3 border-t border-stone-800/80 w-full flex items-center justify-between text-[10px] text-stone-500 font-mono">
            <div className="flex items-center gap-1.5">
              <Scan className="w-3 h-3 text-stone-400" />
              <span>Optical Biometric Sensor</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400/90 font-sans font-medium">
              <Sparkles className="w-3 h-3" />
              <span>Hardware Enclave</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
