import { Suspense } from 'react';
import Link from 'next/link';
import { getSessionUser } from '@/lib/workos-auth';
import {
  getDashboardOrgStats,
  getDashboardPersonalStats,
} from '@/actions/dashboard';
import { CardsRowSection } from '@/components/dashboard/sections/CardsRowSection';
import { BottomSection } from '@/components/dashboard/sections/BottomSection';
import {
  WelcomeStripSkeleton,
  CardsRowSkeleton,
  BottomSectionSkeleton,
} from '@/components/dashboard/DashboardSkeleton';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export const revalidate = 60;

// ═══════════════════════════════════════════
// Section 1: Welcome Strip (loads first - fast)
// ═══════════════════════════════════════════
async function WelcomeSection() {
  const [user, orgStats, personalStats] = await Promise.all([
    getSessionUser(),
    getDashboardOrgStats(),
    getDashboardPersonalStats(),
  ]);

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'User';
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });

  const overdueCount = personalStats?.taskStats.overdue || 0;
  const tasksActive = (personalStats?.taskStats.inProgress || 0) + (personalStats?.taskStats.todo || 0);
  const projectsCount = personalStats?.projects.length || 0;
  const hoursWeek = personalStats?.timeStats.totalHoursWeek || 0;

  return (
    <div className="space-y-3">
      {/* Simple Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
          Welcome,{' '}
          <span className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
        <p className="text-sm text-gray-400">{dateStr}</p>
      </div>

      {/* Quick Stats Line */}
      <p className="text-sm text-gray-500">
        {tasksActive > 0 && <><strong className="text-gray-700">{tasksActive}</strong> active tasks · </>}
        {projectsCount > 0 && <><strong className="text-gray-700">{projectsCount}</strong> projects · </>}
        <strong className="text-gray-700">{hoursWeek}h</strong> this week
      </p>

      {/* Alert Strip — overdue tasks */}
      {overdueCount > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200/60 px-4 py-2 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800">
            <strong>{overdueCount}</strong> overdue task{overdueCount > 1 ? 's' : ''}
          </span>
          <Link href="/tasks" className="ml-auto text-xs text-[#B8860B] font-semibold hover:text-[#DAA520] flex items-center gap-1">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Dashboard Page with Suspense Boundaries
// ═══════════════════════════════════════════
export default function DashboardPage() {
  return (
    <div className="min-h-screen -m-6 p-6 lg:p-8 bg-gradient-to-b from-amber-50/40 to-white">
      <div className="space-y-5 max-w-[1400px] mx-auto">
        {/* Section 1: Welcome Strip - Loads First */}
        <Suspense fallback={<WelcomeStripSkeleton />}>
          <WelcomeSection />
        </Suspense>

        {/* Section 2: Cards Row - Loads Second */}
        <Suspense fallback={<CardsRowSkeleton />}>
          <CardsRowSection />
        </Suspense>

        {/* Section 3: Bottom Section - Loads Third */}
        <Suspense fallback={<BottomSectionSkeleton />}>
          <BottomSection />
        </Suspense>
      </div>
    </div>
  );
}
