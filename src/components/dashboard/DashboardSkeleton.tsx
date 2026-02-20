// Full dashboard skeleton (for loading.tsx)
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen -m-6 p-6 lg:p-8 bg-gradient-to-b from-amber-50/40 to-white">
      <div className="space-y-5 max-w-[1400px] mx-auto animate-pulse">
        <WelcomeStripSkeleton />
        <CardsRowSkeleton />
        <BottomSectionSkeleton />
      </div>
    </div>
  );
}

// Section 1: Welcome strip (Load First)
export function WelcomeStripSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-56 bg-gray-200/70 rounded-lg" />
        <div className="h-4 w-24 bg-gray-200/50 rounded" />
      </div>
      <div className="h-4 w-64 bg-gray-200/50 rounded" />
    </div>
  );
}

// Section 2: 3-column cards row (Load Second)
export function CardsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {/* Profile Card Skeleton */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col items-center">
        <div className="h-14 w-14 bg-gray-200/70 rounded-full mb-3" />
        <div className="h-5 w-24 bg-gray-200/60 rounded mb-1" />
        <div className="h-3 w-16 bg-gray-200/50 rounded mb-4" />
        <div className="h-10 w-full bg-gray-200/60 rounded-lg" />
      </div>

      {/* Progress Card Skeleton */}
      <div className="rounded-xl bg-white border border-gray-200 p-5">
        <div className="flex justify-between mb-3">
          <div className="h-4 w-20 bg-gray-200/60 rounded" />
          <div className="h-4 w-16 bg-gray-200/50 rounded" />
        </div>
        <div className="h-12 w-20 bg-gray-200/70 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-2 w-full bg-gray-200/60 rounded-full" />
          <div className="h-2 w-full bg-gray-200/60 rounded-full" />
        </div>
      </div>

      {/* Stats Card Skeleton */}
      <div className="rounded-xl bg-white border border-gray-200 p-5">
        <div className="h-4 w-24 bg-gray-200/60 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200/50 rounded-lg" />
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
      <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
        {[1, 2].map((i) => (
          <div key={i} className="px-4 py-3">
            <div className="h-4 w-28 bg-gray-200/60 rounded" />
          </div>
        ))}
      </div>

      {/* Events Skeleton */}
      <div className="rounded-xl bg-white border border-gray-200 p-4">
        <div className="h-4 w-32 bg-gray-200/60 rounded mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200/60 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200/60 rounded mb-1" />
                <div className="h-3 w-1/2 bg-gray-200/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Skeleton */}
      <div className="rounded-xl bg-white border border-gray-200 p-4">
        <div className="h-4 w-24 bg-gray-200/60 rounded mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2 p-2">
              <div className="h-4 w-4 bg-gray-200/50 rounded" />
              <div className="h-4 flex-1 bg-gray-200/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 animate-pulse">
      <div className="h-4 w-24 bg-gray-200/60 rounded mb-4" />
      <div className="h-8 w-16 bg-gray-200/70 rounded mb-2" />
      <div className="h-3 w-32 bg-gray-200/50 rounded" />
    </div>
  );
}
