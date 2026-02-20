import Link from 'next/link';
import { getSessionUser } from '@/lib/workos-auth';
import { getDashboardPersonalStats } from '@/actions/dashboard';
import { getTodayAttendance } from '@/actions/attendance';
import { ProfileTimeCard } from '@/components/dashboard/ProfileTimeCard';

export async function CardsRowSection() {
  let user, personalStats, attendanceData;
  
  try {
    [user, personalStats, attendanceData] = await Promise.all([
      getSessionUser(),
      getDashboardPersonalStats(),
      getTodayAttendance(),
    ]);
  } catch (error) {
    console.error('CardsRowSection error:', error);
    // Return minimal UI on error
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'User';
  const userInitials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || user?.name?.[0] || 'U');
  const loginStreak = personalStats?.loginStreak || 0;

  // Prepare initial attendance data for client component - with safe null checks
  const attendance = attendanceData?.attendance;
  const initialAttendance = {
    isCheckedIn: attendanceData?.isCheckedIn ?? false,
    isOnBreak: attendanceData?.isOnBreak ?? false,
    hasCheckedOutToday: !!(attendance?.lastCheckOut) && !(attendanceData?.isCheckedIn),
    attendance: attendance ? {
      id: attendance.id,
      locationType: attendance.locationType,
      lastCheckOut: attendance.lastCheckOut ? new Date(attendance.lastCheckOut).toISOString() : null,
      sessions: (attendance.sessions || []).map(s => ({
        checkInAt: new Date(s.checkInAt).toISOString(),
        checkOutAt: s.checkOutAt ? new Date(s.checkOutAt).toISOString() : null,
        durationMinutes: s.durationMinutes || 0,
      })),
      breaks: (attendance.breaks || []).map(b => ({
        id: b.id,
        endTime: b.endTime ? new Date(b.endTime).toISOString() : null,
        duration: b.duration || 0,
      })),
    } : null,
    currentSession: attendanceData?.currentSession ? {
      checkInAt: new Date(attendanceData.currentSession.checkInAt).toISOString(),
    } : null,
    currentBreak: attendanceData?.currentBreak ? {
      startTime: new Date(attendanceData.currentBreak.startTime).toISOString(),
    } : null,
    todayHours: attendanceData?.todayHours ?? 0,
    todayMinutes: attendanceData?.todayMinutes ?? 0,
    weekHours: attendanceData?.weekHours ?? 0,
  };

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
        initialAttendance={initialAttendance}
      />

      {/* ── Progress Card ── */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">This Week</h3>
          <Link href="/tasks" className="text-xs text-[#B8860B] hover:text-[#DAA520]">
            View tasks
          </Link>
        </div>
        
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-bold text-gray-900">{personalStats?.timeStats.totalHoursWeek || 0}</span>
          <span className="text-lg text-gray-400">hours</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Monthly Progress</span>
              <span className="font-medium text-gray-700">{personalStats?.timeStats.totalHoursMonth || 0}h</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#B8860B] rounded-full" 
                style={{ width: `${Math.min((personalStats?.timeStats.totalHoursMonth || 0) / 160 * 100, 100)}%` }} 
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Tasks Completed</span>
              <span className="font-medium text-gray-700">{personalStats?.taskStats.completed || 0}/{personalStats?.taskStats.total || 0}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${personalStats?.taskStats.completionRate || 0}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Card ── */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Stats</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-emerald-50">
            <p className="text-2xl font-bold text-emerald-600">{personalStats?.taskStats.completed || 0}</p>
            <p className="text-[10px] text-emerald-600/70">Completed</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-2xl font-bold text-blue-600">{personalStats?.taskStats.inProgress || 0}</p>
            <p className="text-[10px] text-blue-600/70">In Progress</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-50">
            <p className="text-2xl font-bold text-amber-600">{personalStats?.taskStats.todo || 0}</p>
            <p className="text-[10px] text-amber-600/70">To Do</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-violet-50">
            <p className="text-2xl font-bold text-violet-600">{personalStats?.projects.length || 0}</p>
            <p className="text-[10px] text-violet-600/70">Projects</p>
          </div>
        </div>
      </div>
    </div>
  );
}
