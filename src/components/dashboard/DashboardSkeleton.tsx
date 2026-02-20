// Full dashboard skeleton (for loading.tsx)
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen -m-6 p-6 lg:p-8 bg-gradient-to-br from-amber-50/60 via-[#fdf8ef] to-orange-50/30">
      <div className="space-y-5 max-w-[1400px] mx-auto animate-pulse">
        <WelcomeStripSkeleton />
        <CardsRowSkeleton />
        <BottomSectionSkeleton />
      </div>
    </div>
  );
}

// Section 1: Welcome strip + org stats (Load First)
export function WelcomeStripSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 animate-pulse">
      <div className="space-y-3">
        <div className="h-10 w-72 bg-gray-200/70 rounded-lg" />
        <div className="h-4 w-96 bg-gray-200/50 rounded" />
        <div className="flex gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 bg-gray-200/60 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex gap-6 lg:gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="h-5 w-5 bg-gray-200/50 rounded" />
            <div>
              <div className="h-10 w-12 bg-gray-200/70 rounded" />
              <div className="h-3 w-16 bg-gray-200/50 rounded mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Section 2: 4-column cards row (Load Second)
export function CardsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {/* Profile Card Skeleton */}
      <div className="rounded-2xl bg-amber-50/50 border border-amber-200/40 p-5 flex flex-col items-center">
        <div className="h-16 w-16 bg-gray-200/70 rounded-full mb-2" />
        <div className="h-5 w-24 bg-gray-200/60 rounded mb-1" />
        <div className="h-3 w-16 bg-gray-200/50 rounded mb-3" />
        <div className="grid grid-cols-4 gap-3 w-full mb-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-9 w-9 bg-gray-200/60 rounded-xl" />
              <div className="h-2 w-8 bg-gray-200/50 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Progress Card Skeleton */}
      <div className="rounded-2xl bg-white/80 border border-gray-200/80 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-16 bg-gray-200/60 rounded" />
          <div className="h-6 w-6 bg-gray-200/50 rounded-md" />
        </div>
        <div className="h-9 w-20 bg-gray-200/70 rounded mb-1" />
        <div className="h-3 w-24 bg-gray-200/50 rounded mb-4" />
        <div className="flex items-end justify-between gap-1.5 h-20">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200/60 rounded-t"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>

      {/* Attendance Card Skeleton */}
      <div className="rounded-2xl bg-white/80 border border-gray-200/80 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-20 bg-gray-200/60 rounded" />
          <div className="h-6 w-20 bg-gray-200/50 rounded-full" />
        </div>
        <div className="h-12 w-32 bg-gray-200/70 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-200/50 rounded" />
          <div className="h-3 w-3/4 bg-gray-200/40 rounded" />
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-9 flex-1 bg-gray-200/60 rounded-lg" />
          <div className="h-9 flex-1 bg-gray-200/60 rounded-lg" />
        </div>
      </div>

      {/* Completion Card Skeleton */}
      <div className="rounded-2xl bg-white/80 border border-gray-200/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-20 bg-gray-200/60 rounded" />
          <div className="h-8 w-12 bg-gray-200/70 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="h-3 w-24 bg-gray-200/50 rounded" />
                <div className="h-3 w-8 bg-gray-200/50 rounded" />
              </div>
              <div className="h-1.5 bg-gray-200/60 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Section 3: Bottom 3-column row (Load Third)
export function BottomSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
      {/* Accordion Panel Skeleton */}
      <div className="rounded-2xl bg-white/80 border border-gray-200/80 divide-y divide-gray-100">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-5 py-3.5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-gray-200/60 rounded" />
              <div className="h-4 w-4 bg-gray-200/50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Skeleton */}
      <div className="rounded-2xl bg-white/80 border border-gray-200/80 p-5">
        <div className="flex justify-between mb-4">
          <div className="h-4 w-20 bg-gray-200/50 rounded" />
          <div className="h-4 w-28 bg-gray-200/60 rounded" />
          <div className="h-4 w-20 bg-gray-200/50 rounded" />
        </div>
        <div className="grid grid-cols-6 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-gray-200/60 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-200/50 rounded" />
          ))}
        </div>
      </div>

      {/* Recent Tasks Skeleton */}
      <div className="rounded-2xl bg-white/80 border border-gray-200/80 p-5">
        <div className="h-5 w-24 bg-gray-200/60 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="h-8 w-8 bg-gray-200/60 rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200/60 rounded mb-1" />
                <div className="h-3 w-1/2 bg-gray-200/50 rounded" />
              </div>
              <div className="h-5 w-16 bg-gray-200/50 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/80 border border-gray-200/80 p-5 animate-pulse">
      <div className="h-4 w-24 bg-gray-200/60 rounded mb-4" />
      <div className="h-8 w-16 bg-gray-200/70 rounded mb-2" />
      <div className="h-3 w-32 bg-gray-200/50 rounded" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="flex gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2.5">
          <div className="h-5 w-5 bg-gray-200/50 rounded" />
          <div>
            <div className="h-10 w-12 bg-gray-200/70 rounded" />
            <div className="h-3 w-16 bg-gray-200/50 rounded mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
