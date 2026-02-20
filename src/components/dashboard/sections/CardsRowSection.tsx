import Link from 'next/link';
import { getSessionUser } from '@/lib/workos-auth';
import { getDashboardPersonalStats } from '@/actions/dashboard';
import { ProfileTimeCard } from '@/components/dashboard/ProfileTimeCard';
import { ArrowUpRight } from 'lucide-react';

export async function CardsRowSection() {
  const [user, personalStats] = await Promise.all([
    getSessionUser(),
    getDashboardPersonalStats(),
  ]);

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'User';
  const userInitials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || user?.name?.[0] || 'U');
  const today = new Date();
  const loginStreak = personalStats?.loginStreak || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* ── Profile + Time Tracking Card ── */}
      <ProfileTimeCard
        userName={user?.name || firstName}
        userRole={user?.role?.replace('_', ' ') || 'Employee'}
        userInitials={userInitials}
        hasAvatar={personalStats?.hasAvatar || false}
        hourlyRate={personalStats?.hourlyRate || 0}
        loginStreak={loginStreak}
      />

      {/* ── Progress Card ── */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-800">Progress</h3>
          <Link href="/tasks" className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ArrowUpRight className="w-3 h-3 text-gray-500" />
          </Link>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-gray-900">{personalStats?.timeStats.totalHoursWeek || 0}h</span>
          <span className="text-[11px] text-gray-400 leading-tight">Work Time<br />this week</span>
        </div>
        <p className="text-[10px] text-emerald-600 mb-3 flex items-center gap-0.5">
          <ArrowUpRight className="w-3 h-3" />
          {personalStats?.timeStats.totalHoursMonth || 0}h this month
        </p>

        {/* Bar Chart */}
        {personalStats && (
          <>
            <div className="flex items-end justify-between gap-1.5" style={{ height: '90px' }}>
              {personalStats.timeStats.weeklyHours.map((d, i) => {
                const maxH = Math.max(...personalStats.timeStats.weeklyHours.map((x) => x.hours), 1);
                const height = maxH > 0 ? (d.hours / maxH) * 100 : 0;
                const isToday = new Date(d.date).toDateString() === today.toDateString();
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    {d.hours > 0 && (
                      <span className={`text-[8px] font-semibold ${isToday ? 'text-[#B8860B] bg-amber-50 px-1 rounded' : 'text-gray-400'}`}>
                        {d.hours}h
                      </span>
                    )}
                    <div className="w-full flex items-end justify-center flex-1">
                      <div
                        className={`w-full max-w-[18px] rounded-t-md transition-all ${
                          isToday ? 'bg-gradient-to-t from-[#B8860B] to-[#DAA520]' : d.hours > 0 ? 'bg-gray-800' : 'bg-gray-100'
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1.5">
              {personalStats.timeStats.weeklyHours.map((d, i) => {
                const isToday = new Date(d.date).toDateString() === today.toDateString();
                return (
                  <span key={i} className={`text-[10px] flex-1 text-center ${isToday ? 'text-[#B8860B] font-bold' : 'text-gray-400'}`}>
                    {d.day.charAt(0)}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Completion Card ── */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Completion</h3>
          <span className="text-2xl font-bold text-gray-900">{personalStats?.taskStats.completionRate || 0}%</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Task Completion', value: personalStats?.performance.completionRate || 0, color: 'bg-emerald-500' },
            { label: 'On-Time Delivery', value: personalStats?.performance.onTimeRate || 0, color: 'bg-[#B8860B]' },
            { label: 'Hours Budget', value: Math.min(personalStats?.performance.hoursUtilization || 0, 100), color: 'bg-blue-500' },
          ].map((bar) => (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-500">{bar.label}</span>
                <span className="text-[11px] font-semibold text-gray-700">{bar.value}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${bar.color} rounded-full transition-all`} style={{ width: `${bar.value}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-4">
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[10px] font-medium text-amber-700">Task</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[10px] font-medium text-blue-700">Review</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-medium text-emerald-700">Done</span>
        </div>
      </div>
    </div>
  );
}
