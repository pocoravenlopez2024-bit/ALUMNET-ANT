import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Shield,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ChevronDown,
  BookOpen,
  Lock,
  CheckCircle2,
  Building2,
  Copy,
  Check,
  ArrowUpRight,
  MessageSquare
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { GooeyBackground } from '../common/GooeyBackground';
import { Skeleton } from '../common/BentoSkeleton';

interface HelpAndInfoSectionProps {
  isLoading?: boolean;
}

export const HelpAndInfoSection: React.FC<HelpAndInfoSectionProps> = ({ isLoading: propIsLoading }) => {
  const { setActiveTab, isLoadingData } = useAlumni();
  const isLoading = propIsLoading ?? isLoadingData;
  const [activeAccordion, setActiveAccordion] = useState<string | null>('faq_verify');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2200);
    }
  };

  const toggleAccordion = (id: string) => {
    setActiveAccordion((prev) => (prev === id ? null : id));
  };

  const faqs = [
    {
      id: 'faq_verify',
      question: 'How do I authenticate my Cecilian Alumni status?',
      answer:
        'All alumni accounts are cross-checked against official St. Cecilia’s College Registrar masterlist records using your Academic Student ID and Graduation Batch. Once validated, an official gold verified badge and encrypted Cecilian Alumni ID are issued to your profile.'
    },
    {
      id: 'faq_events',
      question: 'How do Event RSVPs and attendee group chats work?',
      answer:
        'When you RSVP "Going" to any campus or virtual alumni convocation, the portal automatically syncs you into the dedicated Event Attendee Group Chat in your Messages tab. If you update your RSVP, your membership is updated in real time.'
    },
    {
      id: 'faq_milestones',
      question: 'How can I submit career milestones or campus gallery photos?',
      answer:
        'Navigate to the Milestones tab in the portal. You can upload high-resolution photos, celebrate board exam results or promotions, tag verified batchmates, and publish directly to the live campus community stream.'
    },
    {
      id: 'faq_security',
      question: 'How are my private student records and contact details safeguarded?',
      answer:
        'Your profile is strictly protected under Republic Act 10173 (Philippine Data Privacy Act) and our Zero Disclosure Policy. Your phone number and private contact records are never published publicly or shared with commercial entities.'
    }
  ];

  if (isLoading) {
    return (
      <section className="w-full max-w-full overflow-x-hidden relative rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.03)] mt-6 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-stone-100 dark:border-stone-800">
          <div className="space-y-1.5 min-w-0">
            <Skeleton className="h-5 w-56 rounded" />
            <Skeleton className="h-3 w-80 rounded" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3.5 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-full overflow-x-hidden relative rounded-2xl bg-white border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.03)] mt-6">
      {/* SVG Liquid Gooey Filter Definitions */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="gooey-accordion-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -6"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          <filter id="gooey-office-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Institutional St. Cecilia Crimson Top Trim */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#8B181B] via-[#B45309] to-stone-300" />

      {/* Header Banner with Subtle Liquid Gooey Bloom */}
      <div className="relative w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-7 border-b border-stone-100 bg-stone-50/40">
        <GooeyBackground variant="crimson" intensity="subtle" className="opacity-30 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-[#8B181B] border border-red-200/70 flex items-center justify-center shrink-0 shadow-2xs"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
            </motion.div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-stone-900 tracking-tight break-words">
                  Help & Information Center
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-stone-500 mt-0.5 break-words">
                <span className="font-medium text-stone-700">Official Support & Governance Wing</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span>St. Cecilia's College - Cebu, Inc.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <motion.span
              whileHover={{ scale: 1.03 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-white text-stone-700 border border-stone-200/80 shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-[#8B181B]" />
              Accredited Institutional Support
            </motion.span>
          </div>
        </div>
      </div>

      {/* Collegiate Bento Grid Content */}
      <div className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-7 grid grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
        {/* Bento Tile 1 (col-span-12 lg:col-span-7): Frequently Consulted Inquiries with Gooey Accordions */}
        <div className="relative w-full max-w-full overflow-x-hidden col-span-12 lg:col-span-7 bg-[#FAF9F6] border border-stone-200/80 rounded-2xl p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
          <GooeyBackground variant="crimson" intensity="subtle" className="opacity-25 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-stone-200/70">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white border border-stone-200 flex items-center justify-center text-[#8B181B] shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5 stroke-[1.75]" />
                </div>
                <h3 className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-stone-900 break-words">
                  Frequently Consulted Inquiries
                </h3>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-stone-500">
                4 Core Directives
              </span>
            </div>

            {/* Accordion List with Liquid Gooey Animation */}
            <div className="space-y-2.5">
              {faqs.map((faq) => {
                const isOpen = activeAccordion === faq.id;
                return (
                  <motion.div
                    key={faq.id}
                    layout
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    className={`relative border rounded-xl overflow-hidden transition-all duration-300 ${
                      isOpen
                        ? 'border-red-300 bg-white shadow-[0_4px_24px_rgba(139,24,27,0.06)] ring-1 ring-red-100'
                        : 'border-stone-200/90 bg-white/95 hover:border-stone-300 hover:bg-white'
                    }`}
                  >
                    {/* Ambient Gooey Liquid Blobs inside Open Item */}
                    {isOpen && (
                      <GooeyBackground
                        variant="crimson"
                        intensity="subtle"
                        className="opacity-40 pointer-events-none"
                      />
                    )}

                    {/* Accordion Trigger Button */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      className="relative z-10 w-full p-3 sm:p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Animated Gooey Indicator Dot */}
                        <motion.div
                          animate={{
                            scale: isOpen ? 1.25 : 1,
                            backgroundColor: isOpen ? '#8B181B' : '#A8A29E'
                          }}
                          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                          className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                        />
                        <span
                          className={`text-xs sm:text-[13px] transition-colors leading-snug break-words ${
                            isOpen
                              ? 'font-bold text-[#8B181B]'
                              : 'font-semibold text-stone-900 group-hover:text-[#8B181B]'
                          }`}
                        >
                          {faq.question}
                        </span>
                      </div>

                      {/* Spring Animated Chevron Pill with Liquid Scale Feedback */}
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                          isOpen
                            ? 'bg-[#8B181B] text-white shadow-xs'
                            : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>

                    {/* Gooey Dropdown Content Reveal */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="accordion-content"
                          initial={{ opacity: 0, height: 0, scale: 0.98, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, height: 'auto', scale: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, height: 0, scale: 0.98, filter: 'blur(4px)' }}
                          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                          className="relative z-10 overflow-hidden"
                        >
                          <div className="p-3.5 sm:p-4 pt-1.5 text-[11px] sm:text-xs text-stone-700 leading-relaxed border-t border-red-100/70 bg-gradient-to-b from-red-50/30 to-white/95 backdrop-blur-xs break-words">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-stone-200/70 flex items-center justify-between text-[10px] sm:text-[11px] text-stone-500">
            <span>Need assistance with registrar validation?</span>
            <button
              onClick={() => setActiveTab('profile')}
              className="text-[#8B181B] font-semibold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Verify Profile Status</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Bento Tile 2 (col-span-12 lg:col-span-5): Data Privacy & Zero Disclosure Charter */}
        <div className="relative w-full max-w-full overflow-x-hidden col-span-12 lg:col-span-5 bg-gradient-to-br from-[#FAF9F5] to-[#F5F2EA] border border-stone-200/90 rounded-2xl p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
          {/* Subtle Gooey Amber Background */}
          <GooeyBackground variant="amber" intensity="subtle" className="opacity-45 pointer-events-none" />

          {/* Watermark Crest */}
          <div className="absolute -bottom-8 -right-8 opacity-5 text-[#8B181B] pointer-events-none">
            <Shield className="w-48 h-48" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white border border-stone-200 flex items-center justify-center text-[#B45309] shadow-2xs">
                  <ShieldAlert className="w-3.5 h-3.5 stroke-[1.75]" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Institutional Privacy Covenant
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#8B181B] bg-red-50 border border-red-200/60 px-2 py-0.5 rounded">
                RA 10173
              </span>
            </div>

            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="p-4 rounded-xl bg-white/85 border border-stone-200/70 shadow-2xs space-y-2 backdrop-blur-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-stone-900 text-xs">
                  Republic Act No. 10173 Compliance
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                St. Cecilia’s College processes alumni records strictly for academic accreditation, CHED Graduate Tracer studies, and official campus communications.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="p-4 rounded-xl bg-white/85 border border-stone-200/70 shadow-2xs space-y-2 backdrop-blur-xs"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#8B181B] shrink-0" />
                <span className="font-bold text-stone-900 text-xs">
                  Zero Disclosure & Anti-Scraping Pact
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Private contact records and student IDs are strictly guarded. Automated scraping, commercial data broker harvesting, or unauthorized directory sharing is grounds for immediate credential revocation.
              </p>
            </motion.div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-600">
            <span className="font-medium">Data Privacy Office, Minglanilla Campus</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Compliance
            </span>
          </div>
        </div>

        {/* Bento Tile 3 (col-span-12): Alumni Relations Office Contact (Redesigned with Institutional Craftsmanship) */}
        <div className="relative w-full max-w-full overflow-x-hidden col-span-12 bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 md:p-6 pt-5 pb-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_12px_28px_rgba(0,0,0,0.03)] flex flex-col justify-between overflow-hidden">
          {/* Subtle Institutional Crimson Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B181B] via-[#B45309] to-stone-200" />

          <div className="relative z-10 w-full min-w-0">
            {/* Bureau Header with Live Office Hours Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-stone-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200/80 flex items-center justify-center text-[#8B181B] shrink-0 shadow-2xs">
                  <Building2 className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-900 break-words">
                    Alumni Relations & Career Bureau
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 font-medium">
                    Institutional Desk · St. Cecilia's College - Cebu, Inc.
                  </p>
                </div>
              </div>

              {/* Live Status Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-[10px] font-bold shadow-2xs self-start sm:self-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Desk Active · Mon–Fri 8AM–5PM PST</span>
              </div>
            </div>

            {/* Channels & Verification Desks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-stone-700">
              {/* Channel 1: Official Email & Document Verification */}
              <div className="group relative p-3 sm:p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/80 hover:border-red-200/90 hover:bg-white transition-all duration-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-white text-[#8B181B] border border-stone-200/80 shrink-0 shadow-2xs group-hover:bg-[#8B181B] group-hover:text-white transition-colors duration-200">
                      <Mail className="w-4 h-4 stroke-[1.75]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-stone-900 text-xs">Registrar Credentials</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-stone-200/70 text-stone-700">
                          24h SLA
                        </span>
                      </div>
                      <a
                        href="mailto:alumni@stcecilias.edu.ph"
                        className="text-[#8B181B] hover:text-[#721316] hover:underline font-semibold text-xs break-all block mt-1 tracking-tight font-mono"
                      >
                        alumni@stcecilias.edu.ph
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-stone-200/50">
                  <button
                    type="button"
                    onClick={() => handleCopy('alumni@stcecilias.edu.ph', 'email')}
                    className={`flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                      copiedField === 'email'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                    title="Copy official email"
                  >
                    {copiedField === 'email' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 stroke-[2]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-stone-500 stroke-[1.75]" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <a
                    href="mailto:alumni@stcecilias.edu.ph?subject=Cecilian%20Alumni%20Validation%20Inquiry"
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-[#8B181B] hover:bg-[#721316] text-white transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <ArrowUpRight className="w-3 h-3 stroke-[2]" />
                    <span>Compose</span>
                  </a>
                </div>
              </div>

              {/* Channel 2: Telephone Trunklines & Mobile Hotline */}
              <div className="group relative p-3 sm:p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/80 hover:border-amber-200/90 hover:bg-white transition-all duration-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-white text-amber-800 border border-stone-200/80 shrink-0 shadow-2xs group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
                      <Phone className="w-4 h-4 stroke-[1.75]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-stone-900 text-xs">Direct Campus Trunklines</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100/80 text-amber-900">
                          Minglanilla Hub
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <a href="tel:+63322684746" className="text-stone-800 hover:text-[#8B181B] font-mono text-xs font-semibold">
                          +63 (032) 268-4746
                        </a>
                        <span className="text-stone-300">·</span>
                        <a href="tel:+639171234567" className="text-stone-800 hover:text-[#8B181B] font-mono text-xs font-semibold">
                          +63 917 123 4567
                        </a>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-1 font-medium">
                        Loc. 104 (Alumni Affairs) · Loc. 108 (Career)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-200/50">
                  <button
                    type="button"
                    onClick={() => handleCopy('+63 (032) 268-4746 / +63 917 123 4567', 'phone')}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                      copiedField === 'phone'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                    title="Copy phone numbers"
                  >
                    {copiedField === 'phone' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 stroke-[2]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-stone-500 stroke-[1.75]" />
                        <span>Copy Phone Lines</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Channel 3: Campus Office Locator */}
              <div className="group relative p-3 sm:p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/80 hover:border-stone-300 hover:bg-white transition-all duration-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-white text-stone-700 border border-stone-200/80 shrink-0 shadow-2xs group-hover:bg-stone-800 group-hover:text-white transition-colors duration-200">
                    <MapPin className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0 text-[11px] text-stone-600 leading-snug">
                    <span className="font-bold text-stone-900 text-xs block">Campus Office Locator:</span>
                    <span className="font-semibold text-stone-800">
                      Alumni Affairs Wing, 2nd Floor Admin Hall
                    </span>
                    <p className="text-[10px] text-stone-500 mt-1">
                      St. Cecilia’s College - Cebu, Inc., Poblacion Ward II, Minglanilla, Cebu (East Wing, adjacent to Registrar)
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-200/50">
                  <a
                    href="mailto:alumni@stcecilias.edu.ph?subject=Formal%20Alumni%20Assistance%20Request"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#8B181B] hover:bg-[#721316] transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5 stroke-[1.75]" />
                    <span>Send Direct Inquiry</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Footer Action Bar */}
          <div className="relative z-10 pt-3.5 mt-3.5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-stone-500">
            <div className="flex items-center gap-1.5 font-medium text-stone-700">
              <Shield className="w-3.5 h-3.5 text-[#8B181B] stroke-[1.75]" />
              <span>Accredited Institutional Desk · Minglanilla Campus</span>
            </div>
            <span className="text-stone-400 text-[10px]">Office Hours: Mon–Fri 8:00 AM – 5:00 PM PST</span>
          </div>
        </div>
      </div>
    </section>
  );
};
