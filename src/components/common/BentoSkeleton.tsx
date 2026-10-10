import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Universal minimal skeleton primitive adhering to St. Cecilia design standards.
 * Uses soft stone-200/70 neutral tones with subtle pulse animation.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div
      style={style}
      aria-hidden="true"
      className={`bg-stone-200/80 dark:bg-stone-800 animate-pulse rounded-md ${className}`}
    />
  );
};

/**
 * Skeleton for top metric cards (Dashboard & Admin Overview)
 */
export const BentoMetricCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <Skeleton className="h-7 sm:h-8 w-16 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
      </div>
      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
        <Skeleton className="h-2.5 w-24 rounded" />
        <Skeleton className="h-3.5 w-16 rounded" />
      </div>
    </div>
  );
};

/**
 * Card A Skeleton: Campus Community Pulse & Activity Feed
 */
export const BentoPulseStreamSkeleton: React.FC<{ isFeedMode?: boolean }> = ({ isFeedMode = false }) => {
  return (
    <div
      className={`w-full bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col ${
        isFeedMode ? 'col-span-12 lg:col-span-8' : 'col-span-12 lg:col-span-7'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-2.5 w-48 rounded hidden sm:block" />
          </div>
        </div>
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200/60">
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
      </div>

      {/* Stream Content Skeleton */}
      <div className="p-3 sm:p-3.5 space-y-2">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 pb-1">
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-5 w-16 rounded" />
        </div>

        {/* List Items */}
        <div className="space-y-2 pt-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg border border-stone-150 bg-stone-50/50 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Skeleton className="w-7 h-7 rounded-md shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-14 rounded" />
                    <Skeleton className="h-2.5 w-16 rounded" />
                  </div>
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-1/2 rounded" />
                </div>
              </div>
              <Skeleton className="h-3 w-12 rounded shrink-0 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Card B Skeleton: Institutional Career Tracer Study
 */
export const BentoCareerTracerSkeleton: React.FC<{ isFeedMode?: boolean }> = ({ isFeedMode = false }) => {
  return (
    <div
      className={`w-full bg-white border border-stone-200/90 rounded-xl p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between ${
        isFeedMode ? 'col-span-12 md:col-span-6 lg:col-span-4' : 'col-span-12 md:col-span-6 lg:col-span-5'
      }`}
    >
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-stone-100">
        <div className="flex items-center gap-2 min-w-0">
          <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-2.5 w-40 rounded" />
          </div>
        </div>
        <Skeleton className="h-4 w-20 rounded" />
      </div>

      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-4/5 rounded" />

        <div className="pt-2">
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        <div className="pt-1 flex items-center justify-between">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
    </div>
  );
};

/**
 * Card C Skeleton: Official Circulars & Bulletins
 */
export const BentoCircularsSkeleton: React.FC = () => {
  return (
    <div className="w-full col-span-12 md:col-span-6 lg:col-span-6 bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col justify-between">
      <div>
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-2.5 w-44 rounded hidden sm:block" />
            </div>
          </div>
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200/60">
            <Skeleton className="h-4.5 w-10 rounded" />
            <Skeleton className="h-4.5 w-12 rounded" />
          </div>
        </div>

        <div className="p-3 sm:p-3.5 space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="p-2.5 rounded-lg border border-stone-150 bg-stone-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-2.5 w-16 rounded" />
                <Skeleton className="h-2.5 w-12 rounded" />
              </div>
              <Skeleton className="h-3.5 w-3/4 rounded" />
              <Skeleton className="h-2.5 w-full rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-2.5 px-3.5 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between">
        <Skeleton className="h-2.5 w-20 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
    </div>
  );
};

/**
 * Card D Skeleton: Campus Gatherings & Reunions
 */
export const BentoGatheringsSkeleton: React.FC = () => {
  return (
    <div className="w-full col-span-12 md:col-span-6 lg:col-span-6 bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col justify-between">
      <div>
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-2.5 w-40 rounded hidden sm:block" />
            </div>
          </div>
          <Skeleton className="h-3 w-14 rounded" />
        </div>

        <div className="p-3 sm:p-3.5 space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="p-2 rounded-lg border border-stone-150 bg-stone-50/50 flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2.5 w-12 rounded" />
                  <Skeleton className="h-2.5 w-14 rounded" />
                </div>
                <Skeleton className="h-3.5 w-4/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2.5 px-3.5 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between">
        <Skeleton className="h-2.5 w-24 rounded" />
        <Skeleton className="h-3 w-14 rounded" />
      </div>
    </div>
  );
};

/**
 * Card E Skeleton: Curated Career Placements
 */
export const BentoOpportunitiesSkeleton: React.FC = () => {
  return (
    <div className="w-full col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col justify-between">
      <div className="px-3.5 py-2.5 border-b border-stone-100 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
          <Skeleton className="h-3.5 w-24 rounded" />
        </div>
        <Skeleton className="h-2.5 w-10 rounded" />
      </div>

      <div className="p-3 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="p-2 rounded-lg border border-stone-150 bg-stone-50/50 flex items-center justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <Skeleton className="h-3 w-3/4 rounded" />
              <Skeleton className="h-2.5 w-1/2 rounded" />
            </div>
            <Skeleton className="h-4 w-12 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Card F Skeleton: Cecilians in Your Vicinity
 */
export const BentoVicinitySkeleton: React.FC = () => {
  return (
    <div className="w-full col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col justify-between">
      <div className="px-3.5 py-2.5 border-b border-stone-100 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
          <Skeleton className="h-3.5 w-28 rounded" />
        </div>
        <Skeleton className="h-2.5 w-14 rounded" />
      </div>

      <div className="p-3 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="p-1.5 rounded-lg border border-stone-150 bg-stone-50/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Skeleton className="w-6 h-6 rounded-full shrink-0" />
              <div className="space-y-1 flex-1 min-w-0">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-2 w-32 rounded" />
              </div>
            </div>
            <Skeleton className="h-5 w-12 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Card G Skeleton: Institutional Governance & Accreditation
 */
export const BentoGovernanceCardSkeleton: React.FC = () => {
  return (
    <div className="w-full col-span-12 md:col-span-6 lg:col-span-4 bg-gradient-to-br from-stone-50 via-white to-stone-50 rounded-xl border border-stone-200/90 p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs">
      <div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-3.5 h-3.5 rounded" />
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-3.5 w-14 rounded ml-auto" />
        </div>
        <div className="mt-2 space-y-1">
          <Skeleton className="h-2.5 w-full rounded" />
          <Skeleton className="h-2.5 w-4/5 rounded" />
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between">
        <Skeleton className="h-2.5 w-24 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
    </div>
  );
};

/**
 * Full Bento Grid Skeleton Loader for the Main Dashboard
 */
export const DashboardBentoGridSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 4 Top Metric Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <BentoMetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Main 12-Column Bento Grid Skeleton */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 auto-rows-auto gap-4 items-stretch">
        <BentoPulseStreamSkeleton />
        <BentoCareerTracerSkeleton />
        <BentoCircularsSkeleton />
        <BentoGatheringsSkeleton />
        <BentoOpportunitiesSkeleton />
        <BentoVicinitySkeleton />
        <BentoGovernanceCardSkeleton />
      </div>
    </div>
  );
};

/**
 * Admin Bento Skeleton: Tile 1 Governance Moderation Desk
 */
export const AdminBentoModerationSkeleton: React.FC<{ isWide?: boolean }> = ({ isWide = true }) => {
  return (
    <div
      className={`${
        isWide ? 'col-span-12 lg:col-span-8' : 'col-span-12 md:col-span-6 lg:col-span-4'
      } bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden`}
    >
      <div>
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-44 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-3 w-64 rounded hidden sm:block" />
            </div>
          </div>
          <Skeleton className="h-7 w-24 rounded-xl shrink-0" />
        </div>

        <div className="p-3 sm:p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 pb-1 overflow-x-auto">
            <Skeleton className="h-6 w-14 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-18 rounded-lg" />
          </div>

          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-stone-200/80 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="space-y-1 min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-36 rounded" />
                    <Skeleton className="h-2.5 w-48 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Skeleton className="h-7 w-16 rounded-lg" />
                  <Skeleton className="h-7 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Admin Bento Skeleton: Tile 2 Official Verification Standing Donut
 */
export const AdminBentoVerificationSkeleton: React.FC = () => {
  return (
    <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-2.5 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-16 rounded" />
        </div>

        {/* Circular Donut Skeleton */}
        <div className="mt-4 h-48 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full border-8 border-stone-200/60 flex items-center justify-center">
            <div className="space-y-1 text-center">
              <Skeleton className="h-5 w-12 rounded mx-auto" />
              <Skeleton className="h-2.5 w-14 rounded mx-auto" />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 pt-3 border-t border-stone-100">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-stone-100">
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Admin Bento Skeleton: Tile 3 Graduation Cohorts Bar Chart
 */
export const AdminBentoCohortsSkeleton: React.FC = () => {
  return (
    <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-44 rounded" />
              <Skeleton className="h-2.5 w-56 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-20 rounded" />
        </div>

        {/* Bar Chart Area */}
        <div className="h-56 flex items-end justify-between gap-3 px-4 pt-4 bg-stone-50/50 rounded-xl border border-stone-150">
          <Skeleton className="w-8 h-20 rounded-t" />
          <Skeleton className="w-8 h-28 rounded-t" />
          <Skeleton className="w-8 h-36 rounded-t" />
          <Skeleton className="w-8 h-48 rounded-t" />
          <Skeleton className="w-8 h-40 rounded-t" />
          <Skeleton className="w-8 h-52 rounded-t" />
          <Skeleton className="w-8 h-44 rounded-t" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
        <Skeleton className="h-3 w-40 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
    </div>
  );
};

/**
 * Admin Bento Skeleton: Tile 4 Academic Degree Programs
 */
export const AdminBentoDepartmentsSkeleton: React.FC = () => {
  return (
    <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-2.5 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-16 rounded" />
        </div>

        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-2.5 rounded-xl border border-stone-150 bg-stone-50/50 space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-32 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-stone-100">
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Admin Bento Skeleton: Tile 5 Recent Alumni Registrations
 */
export const AdminBentoRecentRosterSkeleton: React.FC = () => {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-12 rounded" />
        </div>

        <div className="mt-3 space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-xl border border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                <div className="space-y-1 min-w-0">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-2 w-36 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-14 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-stone-100">
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Admin Bento Skeleton: Tile 6 Upcoming Campus Convocations
 */
export const AdminBentoEventsSkeleton: React.FC = () => {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-2.5 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="h-3 w-14 rounded" />
        </div>

        <div className="mt-3 space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-2.5 rounded-xl border border-stone-150 bg-stone-50/50 flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="space-y-1 flex-1 min-w-0">
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-2.5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-stone-100">
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Admin Bento Skeleton: Tile 7 Institutional Audit Trail & Security Logs
 */
export const AdminBentoAuditLogsSkeleton: React.FC = () => {
  return (
    <div className="col-span-12 md:col-span-12 lg:col-span-4 bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-2.5 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="h-3 w-12 rounded" />
        </div>

        <div className="mt-3 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-2 rounded-lg border border-stone-150 bg-stone-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-2.5 w-20 rounded" />
                <Skeleton className="h-2.5 w-12 rounded" />
              </div>
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-stone-100">
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Full Admin Bento Grid Skeleton Loader
 */
export const AdminDashboardBentoSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 4 Top Bento Metric Cards Skeleton */}
      <div className="grid grid-cols-12 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3">
            <BentoMetricCardSkeleton />
          </div>
        ))}
      </div>

      {/* Main Admin Bento Grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-5 items-stretch">
        <AdminBentoModerationSkeleton isWide={true} />
        <AdminBentoVerificationSkeleton />
        <AdminBentoCohortsSkeleton />
        <AdminBentoDepartmentsSkeleton />
        <AdminBentoRecentRosterSkeleton />
        <AdminBentoEventsSkeleton />
        <AdminBentoAuditLogsSkeleton />
      </div>
    </div>
  );
};

/**
 * Skeleton for Collegiate Greeting Banner
 */
export const CollegiateGreetingBannerSkeleton: React.FC = () => {
  return (
    <div className="relative overflow-hidden w-full rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="h-1 w-full bg-[#8B181B]/40" />
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-40 rounded" />
            <Skeleton className="h-3 w-28 rounded hidden sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3.5 w-64 rounded" />
            </div>
          </div>
          <div className="pt-1 flex items-center gap-2">
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg hidden sm:block" />
          </div>
        </div>
        <div className="hidden sm:flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 lg:border-l border-stone-100 dark:border-stone-800 pt-3 lg:pt-0 lg:pl-6 shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-2.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-2 w-20 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for the Main 3-Column Dashboard News Feed View
 */
export const DashboardViewSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-full pb-12 space-y-4">
      {/* 24-Hour Reminder Banner Skeleton */}
      <div className="w-full h-12 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-6 h-6 rounded-md" />
          <Skeleton className="h-3.5 w-60 rounded" />
        </div>
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>

      {/* 3-Column Facebook-style layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Rail Skeleton (3 cols) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
          {/* Mini Profile Card */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-36 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-20 rounded" />
                <Skeleton className="h-2.5 w-10 rounded" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-3 w-32 rounded mt-1" />
            </div>
          </div>

          {/* Feed Filter Shortcuts */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-2 space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <Skeleton className="h-3.5 w-6 rounded-full" />
              </div>
            ))}
          </div>

          {/* Quick Passes & Vault */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-3 space-y-2">
            <Skeleton className="h-2.5 w-24 rounded mx-2" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3.5 h-3.5 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
                <Skeleton className="w-3.5 h-3.5 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Center Feed Column Skeleton (6 cols on XL) */}
        <div className="col-span-1 lg:col-span-9 xl:col-span-6 space-y-4">
          {/* Stories Carousel Skeleton */}
          <div className="flex items-center gap-2.5 overflow-x-hidden pb-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-28 sm:w-32 h-44 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-2 flex flex-col justify-between shrink-0"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="w-7 h-7 rounded-full" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-2 w-12 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Composer Box Skeleton */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <Skeleton className="h-10 flex-1 rounded-full" />
            </div>
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-between gap-2">
              <Skeleton className="h-7 flex-1 rounded-xl" />
              <Skeleton className="h-7 flex-1 rounded-xl" />
              <Skeleton className="h-7 flex-1 rounded-xl" />
            </div>
          </div>

          {/* Feed Filter Bar Skeleton */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-2.5 flex items-center justify-between gap-2">
            <Skeleton className="h-8 flex-1 rounded-xl" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-12 rounded-xl" />
              <Skeleton className="h-7 w-16 rounded-xl" />
              <Skeleton className="h-7 w-14 rounded-xl hidden sm:block" />
            </div>
          </div>

          {/* 3 Unified Feed Item Skeletons */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-32 rounded" />
                    <Skeleton className="h-2.5 w-44 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
              </div>

              {/* Media image placeholder on 1st & 2nd cards */}
              {i !== 3 && (
                <Skeleton className="w-full h-48 sm:h-56 rounded-xl" />
              )}

              {/* Reaction footer */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-16 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
                <Skeleton className="h-6 w-12 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Rail Skeleton (3 cols on XL) */}
        <div className="hidden xl:flex xl:col-span-3 flex-col gap-4">
          {/* Upcoming Convocations Skeleton */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-3.5 w-36 rounded" />
              </div>
              <Skeleton className="h-3 w-12 rounded" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5 p-1">
                  <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <Skeleton className="h-3 w-3/4 rounded" />
                    <Skeleton className="h-2 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Alumni Skeleton */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-3.5 w-32 rounded" />
              </div>
              <Skeleton className="h-3 w-10 rounded" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <Skeleton className="h-3 w-24 rounded" />
                      <Skeleton className="h-2 w-32 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-14 rounded-lg shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Governance Badge Skeleton */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <Skeleton className="h-2.5 w-full rounded" />
            <Skeleton className="h-2.5 w-4/5 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for the Employer Corporate Recruitment Dashboard
 */
export const EmployerDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 antialiased">
      {/* Top Banner Skeleton */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-48 rounded" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-64 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-4">
          <Skeleton className="h-3.5 w-36 rounded" />
          <Skeleton className="h-3.5 w-44 rounded" />
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-2"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="w-7 h-7 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Filter & Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs">
        <Skeleton className="h-9 w-full sm:w-72 rounded-xl" />
        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto">
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* Job Postings List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-52 rounded" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

