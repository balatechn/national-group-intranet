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
import {
  Building2,
  Users,
  Briefcase,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export const revalidate = 60;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

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
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const overdueCount = personalStats?.taskStats.overdue || 0;
  const smartGreeting = overdueCount > 0
    ? `You have ${overdueCount} task${overdueCount > 1 ? 's' : ''} needing attention`
    : (personalStats?.taskStats.completed || 0) > 0
    ? 'All caught up — great work!'
    : "Here's your productivity snapshot for today";

  // Pill badge values
  const taskActivePercent = personalStats
    ? Math.round(((personalStats.taskStats.inProgress + personalStats.taskStats.todo) / Math.max(personalStats.taskStats.total, 1)) * 100)
    : 0;
  const completedPercent = personalStats?.taskStats.completionRate || 0;
  const hoursPercent = personalStats
    ? Math.min(Math.round((personalStats.timeStats.totalHoursWeek / 40) * 100), 100)
    : 0;
  const outputPercent = personalStats?.performance.onTimeRate || 0;

  return (
    <>
      {/* Welcome Strip */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Welcome in,{' '}
            <span className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
          <p className="text-sm text-gray-500">
            {smartGreeting} · <span className="text-gray-400">{dateStr}</span>
          </p>

          {/* 4 Pill Badges */}
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: 'Tasks', value: taskActivePercent, color: 'bg-emerald-500' },
              { label: 'Completed', value: completedPercent, color: 'bg-blue-500' },
              { label: 'Hours', value: hoursPercent, color: 'bg-amber-500' },
              { label: 'Output', value: outputPercent, color: 'bg-purple-500' },
            ].map((pill) => (
              <div key={pill.label} className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200/80 pl-1 pr-3 py-1 shadow-sm">
                <div className="relative h-6 w-14 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${pill.color} rounded-full transition-all`}
                    style={{ width: `${Math.max(pill.value, 4)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference">
                    {pill.value}%
                  </span>
                </div>
                <span className="text-xs text-gray-500">{pill.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Big Stat Counters */}
        <div className="flex gap-6 lg:gap-8">
          {[
            { icon: Users, value: orgStats.activeEmployees, label: 'Employees' },
            { icon: Building2, value: orgStats.totalDepartments, label: 'Departments' },
            { icon: Briefcase, value: orgStats.totalProjects, label: 'Projects' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-2.5">
                <Icon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-3xl lg:text-4xl font-bold text-gray-900 leading-none">{stat.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert Strip — overdue tasks */}
      {overdueCount > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-4 py-2.5 flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800">
            You have <strong>{overdueCount}</strong> overdue task{overdueCount > 1 ? 's' : ''} needing attention
          </span>
          <Link href="/tasks" className="ml-auto text-xs text-[#B8860B] font-semibold hover:text-[#DAA520] transition-colors flex items-center gap-1">
            View Tasks <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════
// Main Dashboard Page with Suspense Boundaries
// ═══════════════════════════════════════════
export default function DashboardPage() {
  return (
    <div className="min-h-screen -m-6 p-6 lg:p-8 bg-gradient-to-br from-amber-50/60 via-[#fdf8ef] to-orange-50/30">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-100/50 blur-[150px]" />
        <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] rounded-full bg-orange-100/30 blur-[120px]" />
      </div>

      <div className="space-y-5 relative z-10 max-w-[1400px] mx-auto">
        {/* Section 1: Welcome Strip - Loads First */}
        <Suspense fallback={<WelcomeStripSkeleton />}>
          <WelcomeSection />
        </Suspense>

        {/* Section 2: 4-Column Cards - Loads Second */}
        <Suspense fallback={<CardsRowSkeleton />}>
          <CardsRowSection />
        </Suspense>

        {/* Section 3: Bottom 3-Column - Loads Third */}
        <Suspense fallback={<BottomSectionSkeleton />}>
          <BottomSection />
        </Suspense>
      </div>
    </div>
  );
}
