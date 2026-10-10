import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark,
  Calendar,
  Award,
  ChevronRight,
  Sparkles,
  BookOpen,
  Building2,
  Rocket,
  CheckCircle2,
  GraduationCap,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  FileText,
  X
} from 'lucide-react';

interface HistoryMilestone {
  year: string;
  title: string;
  badge: string;
  summary: string;
  details: string[];
  keyFigures?: string;
  recognition?: string;
  iconName: 'landmark' | 'building' | 'award' | 'graduation' | 'rocket';
}

interface HistoryEra {
  id: number;
  period: string;
  headline: string;
  theme: string;
  badge: string;
  summary: string;
  milestones: HistoryMilestone[];
  transcriptPage: number;
}

const HISTORY_ERAS: HistoryEra[] = [
  {
    id: 1,
    period: '1999 – 2004',
    headline: 'The Genesis & Humble Beginnings',
    theme: 'Foundational Heritage',
    badge: 'CHAPTER I • 1999',
    summary:
      'In January 1999, the visionary seed was planted in Poblacion Ward II, Minglanilla, Cebu. With just ten pioneer pupils and one determined educator, the cornerstone of St. Cecilia’s College was laid upon moral virtue and personal care.',
    transcriptPage: 4,
    milestones: [
      {
        year: 'January 1999',
        title: 'Establishment in Minglanilla, Cebu',
        badge: 'Institutional Genesis',
        summary:
          'Founder Mrs. Lorna Real Parrotina establishes the school in Poblacion Ward II, Minglanilla, answering the local community’s yearning for quality Christian values-based education.',
        details: [
          'Opened first classroom with 10 pioneer pupils.',
          'Focus on holistic early childhood formation and Christian values.',
          'Deep emphasis on personalized care, moral discipline, and foundational literacy.'
        ],
        keyFigures: 'Mrs. Lorna Real Parrotina (Founding Visionary)',
        iconName: 'landmark'
      },
      {
        year: '2001 – 2004',
        title: 'DepEd Recognition of Pre-School Curriculum',
        badge: 'Government Accreditation',
        summary:
          'Department of Education grants official government recognition for early childhood programs following outstanding pedagogical assessments.',
        details: [
          'Pupil population expanded from 10 to over 120 within three academic terms.',
          'Addition of dedicated kindergarten facilities and play learning spaces.'
        ],
        recognition: 'DepEd Regional Recognition No. 012',
        iconName: 'award'
      }
    ]
  },
  {
    id: 2,
    period: '2004 – 2008',
    headline: 'Stewardship Transition & Secondary Expansion',
    theme: 'Collegiate Vision',
    badge: 'CHAPTER II • 2004',
    summary:
      'The school transitioned into a broader collegiate destiny under the guidance of Mrs. Rosalina N. Go and the Board of Trustees, formally incorporating as St. Cecilia’s College - Cebu, Inc. and launching complete primary and high school curricula.',
    transcriptPage: 5,
    milestones: [
      {
        year: '2004',
        title: 'Stewardship Under Mrs. Rosalina N. Go & Board of Trustees',
        badge: 'Governance & Incorporation',
        summary:
          'Mrs. Rosalina N. Go and the Go family assumed leadership, injecting forward-looking investments into campus land acquisition, governance frameworks, and long-term academic master planning.',
        details: [
          'Formal corporate registration as St. Cecilia’s College - Cebu, Inc.',
          'Acquisition of contiguous land parcels in Minglanilla for permanent institutional buildings.',
          'Formulation of the Three Pillars: Virtus (Virtue), Scientia (Knowledge), Charitas (Charity).'
        ],
        keyFigures: 'Mrs. Rosalina N. Go, Mr. Mark Joel N. Go & Board of Trustees',
        iconName: 'building'
      },
      {
        year: '2005 – 2008',
        title: 'Complete Basic Education & High School Department',
        badge: 'Curriculum Expansion',
        summary:
          'Inauguration of the four-story primary and secondary education building with science laboratories, an auditorium, and a library collection.',
        details: [
          'First graduating class of Cecilian High School seniors.',
          'Introduction of computer literacy programs and campus student organizations.',
          'St. Cecilia High School Choir began regional inter-school choral dominance.'
        ],
        recognition: 'DepEd Region VII Secondary Charter',
        iconName: 'graduation'
      }
    ]
  },
  {
    id: 3,
    period: '2008 – 2012',
    headline: 'Collegiate Charter & CHED Recognition',
    theme: 'Tertiary Education',
    badge: 'CHAPTER III • 2008',
    summary:
      'St. Cecilia’s College advanced into higher education, establishing undergraduate degree programs to meet southern Cebu’s urgent demand for IT specialists, educators, business managers, and maritime professionals.',
    transcriptPage: 6,
    milestones: [
      {
        year: '2008 – 2009',
        title: 'Inauguration of Higher Education Degree Programs',
        badge: 'College Degree Offerings',
        summary:
          'CHED permits granted to offer Bachelor of Science in Information Technology (BSIT), Computer Science (BSCS), Business Administration (BSBA), and Teacher Education (BEED/BSED).',
        details: [
          'Modern computer programming laboratories and network simulation facilities installed.',
          'Dean of College and specialized department chairs appointed.',
          'First batch of tertiary collegiate scholars welcomed.'
        ],
        recognition: 'CHED Region VII Initial Permits',
        iconName: 'graduation'
      },
      {
        year: '2012',
        title: 'RQAT Accreditation & Full CHED Government Recognition',
        badge: 'Academic Validation',
        summary:
          'Following rigorous evaluations by the Regional Quality Assessment Team (RQAT), St. Cecilia’s College earned Full Government Recognition for its core tertiary degree offerings.',
        details: [
          'High School Choir won cultural and choral championships across Central Visayas.',
          '100% employment rate tracked for pioneer BSIT and Business Administration alumni.',
          'Initiation of formal alumni tracking and industry partnership internships.'
        ],
        recognition: 'CHED Government Recognition (GR) Series of 2012',
        iconName: 'award'
      }
    ]
  },
  {
    id: 4,
    period: '2012 – 2019',
    headline: 'Infrastructure Modernization & Quality Accreditation',
    theme: 'Institutional Quality',
    badge: 'CHAPTER IV • 2012',
    summary:
      'A decade of sustained physical and academic elevation. St. Cecilia’s College constructed its iconic Modern Academic Tower, expanded PACUCOA quality accreditations, and integrated Senior High School tracks under K-12.',
    transcriptPage: 7,
    milestones: [
      {
        year: '2014 – 2016',
        title: 'Erection of the Modern Multi-Story Academic Tower',
        badge: 'Campus Infrastructure',
        summary:
          'Construction of the landmark campus tower featuring state-of-the-art multimedia lecture halls, expanded library archives, and specialized crime laboratory suites.',
        details: [
          'Iconic architectural profile with red structural columns and grand portico.',
          'Implementation of campus-wide high-speed fiber connectivity for students.',
          'Seamless rollout of DepEd Senior High School tracks (STEM, ABM, HUMSS, TVL).'
        ],
        iconName: 'building'
      },
      {
        year: 'January 2019',
        title: 'PACUCOA Level 1 Institutional Accreditation',
        badge: 'Institutional Quality',
        summary:
          'Philippine Association of Colleges and Universities Commission on Accreditation (PACUCOA) granted Level 1 Accredited Status with interim on Governance and Physical Facilities Development.',
        details: [
          'High marks for faculty credentials, community engagement, and student welfare.',
          'Strengthened research culture and faculty scholarly publication incentives.'
        ],
        recognition: 'PACUCOA Level 1 Formal Status',
        iconName: 'award'
      }
    ]
  },
  {
    id: 5,
    period: '2019 – Present',
    headline: 'Licensure Topnotchers & Aerospace Rocketry',
    theme: 'Excellence & Frontiers',
    badge: 'CHAPTER V • PRESENT',
    summary:
      'Entering a bold new era of national prominence. St. Cecilia’s graduates ranked at the very top of national board licensure examinations, while campus engineering teams achieved the historic launch of the Philippines’ first high-powered hybrid rocket.',
    transcriptPage: 8,
    milestones: [
      {
        year: '2020 – 2021',
        title: 'Criminology Government Recognition (BSCRIM)',
        badge: 'Program Recognition',
        summary:
          'CHED formally awarded Full Government Recognition for the Bachelor of Science in Criminology program, bolstered by modern forensics, ballistic, and polygraph laboratories.',
        details: [
          'Rapidly grew into one of the most distinguished criminology faculties in Region VII.',
          'Institutional partnership with regional law enforcement agencies for tactical practicums.'
        ],
        recognition: 'CHED Government Recognition No. 008, Series 2020',
        iconName: 'award'
      },
      {
        year: '2022 – 2023',
        title: 'National Criminologist Board Exam Topnotchers',
        badge: 'National Distinction',
        summary:
          'Cecilian graduates swept top positions in the Philippine Criminologist Licensure Examination (CLE), besting hundreds of institutions nationwide with stellar passing rates.',
        details: [
          'Multiple Top 10 national ranking passers from St. Cecilia’s College - Cebu.',
          'Awarded as one of the Top Performing Schools in Southern Philippines.',
          'Alumni immediately recruited into national law enforcement leadership tracks.'
        ],
        recognition: 'PRC Board of Criminology Official Rankings',
        iconName: 'graduation'
      },
      {
        year: '2023 – 2026',
        title: 'Philippines’ First High-Powered Hybrid Rocket Launch',
        badge: 'Pioneering Aerospace Engineering',
        summary:
          'In a monumental scientific achievement, St. Cecilia’s College engineering teams spearheaded the research, manufacture, and successful launch of the first high-powered hybrid rocket in Philippine history.',
        details: [
          'Collaborated with national and international aerospace organizations.',
          'Put St. Cecilia’s College at the forefront of aerospace innovation and STEM leadership.',
          'Network expanded to 5,000+ active alumni across 12 domestic and global chapters.'
        ],
        recognition: 'Philippine Space Science & Aerospace Milestone',
        iconName: 'rocket'
      }
    ]
  }
];

export const CollegeHistorySection: React.FC = () => {
  const [selectedEraIndex, setSelectedEraIndex] = useState(0);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [activeTranscriptTab, setActiveTranscriptTab] = useState(0);

  const activeEra = HISTORY_ERAS[selectedEraIndex];

  const getMilestoneIcon = (iconName: HistoryMilestone['iconName']) => {
    switch (iconName) {
      case 'landmark':
        return <Landmark className="w-5 h-5" />;
      case 'building':
        return <Building2 className="w-5 h-5" />;
      case 'award':
        return <Award className="w-5 h-5" />;
      case 'graduation':
        return <GraduationCap className="w-5 h-5" />;
      case 'rocket':
        return <Rocket className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <section id="history" className="py-24 sm:py-32 bg-[#FAF9F6] border-t border-[#E5E7EB] relative">
      <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-18">
        
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 pb-8 border-b border-stone-200/90">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-[2px] bg-[#991B1B]" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#991B1B]">
                INSTITUTIONAL ARCHIVES & HERITAGE
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#111827] font-normal leading-[1.1] tracking-tight">
              The History of St. Cecilia’s College.
            </h2>
            <p className="text-stone-600 text-sm sm:text-base max-w-3xl mt-4 font-light leading-relaxed">
              From ten pioneer pupils in 1999 to an accredited collegiate center of learning, board topnotchers, and aerospace pioneers in southern Cebu.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setShowTranscriptModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold uppercase tracking-[0.16em] transition-all shadow-xs cursor-pointer group"
            >
              <FileText className="w-4 h-4 text-[#8B181B] group-hover:scale-110 transition-transform" />
              <span>Read Official Archival Annals (Pages 4–8)</span>
            </button>
          </div>
        </div>

        {/* Chronological Era Timeline Bar (5 Eras) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-12">
          {HISTORY_ERAS.map((era, index) => {
            const isSelected = index === selectedEraIndex;
            return (
              <button
                key={era.id}
                onClick={() => setSelectedEraIndex(index)}
                className={`p-4 sm:p-5 rounded-2xl text-left transition-all cursor-pointer relative overflow-hidden border ${
                  isSelected
                    ? 'bg-[#8B181B] text-white border-[#721316] shadow-lg shadow-red-950/20 scale-[1.02]'
                    : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-2xs hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] font-mono ${
                      isSelected ? 'text-amber-300' : 'text-[#8B181B]'
                    }`}
                  >
                    ERA 0{era.id}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      isSelected ? 'text-white/90' : 'text-stone-400'
                    }`}
                  >
                    {era.period}
                  </span>
                </div>
                <h4
                  className={`font-display text-base sm:text-lg font-bold leading-snug truncate ${
                    isSelected ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {era.headline}
                </h4>
                <div
                  className={`mt-3 h-1 w-full rounded-full transition-colors ${
                    isSelected ? 'bg-amber-400' : 'bg-stone-100'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Selected Era Main Display Stage (Expansive 12-Column Grid) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeEra.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch"
          >
            {/* Left Narrative Panel */}
            <div className="lg:col-span-4 flex flex-col justify-between bg-white border border-stone-200 rounded-3xl p-8 sm:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 border border-red-200/80 text-[11px] font-bold uppercase tracking-wider text-[#8B181B] mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{activeEra.period}</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-stone-900 font-bold leading-tight mb-4">
                  {activeEra.headline}
                </h3>

                <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-normal mb-6">
                  {activeEra.summary}
                </p>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B181B] block mb-1">
                    Archival Reference
                  </span>
                  <p className="text-xs text-stone-600">
                    Documented in St. Cecilia's College Annals, Volume I • Official Page {activeEra.transcriptPage}.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                  <MapPin className="w-4 h-4 text-[#8B181B]" />
                  <span>Minglanilla, Cebu Campus</span>
                </div>
                <button
                  onClick={() => {
                    setActiveTranscriptTab(selectedEraIndex);
                    setShowTranscriptModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B181B] hover:text-[#721316] transition-colors cursor-pointer"
                >
                  <span>View Transcript</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Milestones Cards (Spans across 8 columns with 2-grid layout) */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {activeEra.milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-stone-200 rounded-3xl p-7 sm:p-8 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] hover:border-stone-300 transition-all"
                >
                  <div>
                    {/* Icon + Year Badge */}
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#8B181B] border border-red-100 flex items-center justify-center shrink-0 shadow-2xs">
                        {getMilestoneIcon(milestone.iconName)}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-mono font-bold">
                        {milestone.year}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B181B]">
                        {milestone.badge}
                      </span>
                      <h4 className="text-lg font-bold text-stone-900 mt-0.5">
                        {milestone.title}
                      </h4>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                      {milestone.summary}
                    </p>

                    <div className="space-y-2 mt-4 pt-4 border-t border-stone-100">
                      {milestone.details.map((point, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2 text-xs text-stone-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] text-stone-500">
                    {milestone.keyFigures && (
                      <div className="font-medium text-stone-700">
                        Leadership: <span className="font-normal text-stone-600">{milestone.keyFigures}</span>
                      </div>
                    )}
                    {milestone.recognition && (
                      <div className="text-amber-800 font-medium mt-1">
                        Accreditation: <span className="text-stone-600">{milestone.recognition}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Complete Archival Annals Transcript Modal */}
      <AnimatePresence>
        {showTranscriptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#8B181B] border border-red-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900">
                      Official Archival Annals • Pages 4–8
                    </h3>
                    <p className="text-xs text-stone-500">
                      St. Cecilia's College - Cebu, Inc. Historical Documentation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTranscriptModal(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Page Tabs */}
              <div className="flex border-b border-stone-200 bg-stone-100/60 px-6 py-2 gap-2 overflow-x-auto">
                {HISTORY_ERAS.map((era, idx) => (
                  <button
                    key={era.id}
                    onClick={() => setActiveTranscriptTab(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTranscriptTab === idx
                        ? 'bg-white text-[#8B181B] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                    }`}
                  >
                    Page {era.transcriptPage} • {era.period}
                  </button>
                ))}
              </div>

              {/* Transcript Text Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-stone-700 text-sm sm:text-base leading-relaxed font-serif">
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs font-sans text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Official Institutional Transcript from the Published Annals of St. Cecilia's College – Cebu, Inc.
                  </span>
                </div>

                <div>
                  <h4 className="font-display text-2xl text-stone-900 font-bold mb-1 font-sans">
                    {HISTORY_ERAS[activeTranscriptTab].headline}
                  </h4>
                  <span className="text-xs text-[#8B181B] font-sans font-bold uppercase tracking-wider block mb-4">
                    {HISTORY_ERAS[activeTranscriptTab].badge} • {HISTORY_ERAS[activeTranscriptTab].period}
                  </span>
                  
                  <div className="space-y-4 text-stone-800 leading-relaxed">
                    <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-[#8B181B] first-letter:mr-2 first-letter:float-left">
                      {HISTORY_ERAS[activeTranscriptTab].summary}
                    </p>
                    
                    {HISTORY_ERAS[activeTranscriptTab].milestones.map((m, mIdx) => (
                      <div key={mIdx} className="pt-4 border-t border-stone-200/60 font-sans">
                        <div className="flex items-center gap-2 text-sm font-bold text-stone-900 mb-1">
                          <span className="text-[#8B181B] font-mono">{m.year}</span>
                          <span>—</span>
                          <span>{m.title}</span>
                        </div>
                        <p className="text-stone-600 text-xs leading-relaxed mb-2 font-serif">
                          {m.summary}
                        </p>
                        <ul className="list-disc list-inside text-xs text-stone-600 space-y-1">
                          {m.details.map((d, dIdx) => (
                            <li key={dIdx}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  St. Cecilia's College Archive Division • Minglanilla, Cebu
                </span>
                <button
                  onClick={() => setShowTranscriptModal(false)}
                  className="px-5 py-2 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Close Annals
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};
