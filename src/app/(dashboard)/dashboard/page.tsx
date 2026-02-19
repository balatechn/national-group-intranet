import Link from 'next/link';
import { getSessionUser } from '@/lib/workos-auth';
import ProfilePhotoUpload from '@/components/dashboard/ProfilePhotoUpload';
import prisma from '@/lib/db';
import {
  Building2,
  Users,
  CheckSquare,
  Calendar,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Globe,
  Zap,
  UserCircle,
  ArrowUpRight,
  Clock,
  MapPin,
  Timer,
  Target,
  FolderKanban,
  CircleDot,
  PauseCircle,
  IndianRupee,
  AlertTriangle,
  Flame,
  Play,
  Pause,
  Monitor,
  FileText,
  Shield,
} from 'lucide-react';

export const revalidate = 60;

// ── Fetch org-wide dashboard stats ──
async function getDashboardStats() {
  try {
    const today = new Date();
    const dayOfW = today.getDay();
    const monOff = dayOfW === 0 ? -6 : 1 - dayOfW;
    const calStart = new Date(today);
    calStart.setDate(today.getDate() + monOff);
    calStart.setHours(0, 0, 0, 0);
    const calEnd = new Date(calStart);
    calEnd.setDate(calStart.getDate() + 5);
    calEnd.setHours(23, 59, 59, 999);

    const [
      totalEmployees,
      activeEmployees,
      totalCompanies,
      totalDepartments,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      totalProjects,
      activeProjects,
      recentTasks,
      upcomingEvents,
      recentProjects,
      weekEvents,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      prisma.company.count().catch(() => 0),
      prisma.department.count().catch(() => 0),
      prisma.task.count().catch(() => 0),
      prisma.task.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }).catch(() => 0),
      prisma.task.count({
        where: { status: { notIn: ['COMPLETED', 'CANCELLED'] }, dueDate: { lt: new Date() } },
      }).catch(() => 0),
      prisma.project.count().catch(() => 0),
      prisma.project.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      prisma.task.findMany({
        take: 5, orderBy: { updatedAt: 'desc' },
        select: {
          id: true, title: true, status: true, priority: true, dueDate: true, updatedAt: true,
          assignee: { select: { firstName: true, lastName: true, avatar: true } },
        },
      }).catch(() => []),
      prisma.event.findMany({
        where: { startDate: { gte: today }, isPublic: true },
        take: 5, orderBy: { startDate: 'asc' },
        select: { id: true, title: true, startDate: true, endDate: true, type: true, location: true, isAllDay: true },
      }).catch(() => []),
      prisma.project.findMany({
        where: { status: 'ACTIVE' }, take: 5, orderBy: { updatedAt: 'desc' },
        select: {
          id: true, name: true, status: true, updatedAt: true,
          owner: { select: { firstName: true, lastName: true } },
          _count: { select: { members: true } },
        },
      }).catch(() => []),
      prisma.event.findMany({
        where: { startDate: { gte: calStart, lte: calEnd } },
        take: 20, orderBy: { startDate: 'asc' },
        select: { id: true, title: true, startDate: true, endDate: true, type: true, location: true, isAllDay: true },
      }).catch(() => []),
    ]);

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalEmployees, activeEmployees, totalCompanies, totalDepartments,
      totalTasks, completedTasks, inProgressTasks, overdueTasks,
      totalProjects, activeProjects, taskCompletionRate,
      recentTasks, upcomingEvents, recentProjects, weekEvents,
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return {
      totalEmployees: 0, activeEmployees: 0, totalCompanies: 0, totalDepartments: 0,
      totalTasks: 0, completedTasks: 0, inProgressTasks: 0, overdueTasks: 0,
      totalProjects: 0, activeProjects: 0, taskCompletionRate: 0,
      recentTasks: [] as any[], upcomingEvents: [] as any[],
      recentProjects: [] as any[], weekEvents: [] as any[],
    };
  }
}

// ── Fetch personal stats for the logged-in user ──
async function getPersonalStats(userId: string) {
  try {
    const now = new Date();

    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { hourlyRate: true, lastLoginAt: true },
    });

    const allTasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      select: {
        id: true, title: true, status: true, priority: true,
        dueDate: true, completedAt: true, estimatedHours: true, actualHours: true,
        project: { select: { id: true, name: true, code: true } },
        createdAt: true, updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const taskStats = {
      total: allTasks.length,
      todo: allTasks.filter(t => t.status === 'TODO').length,
      inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
      onHold: allTasks.filter(t => t.status === 'ON_HOLD').length,
      completed: allTasks.filter(t => t.status === 'COMPLETED').length,
      cancelled: allTasks.filter(t => t.status === 'CANCELLED').length,
      overdue: allTasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < now && !['COMPLETED', 'CANCELLED'].includes(t.status)
      ).length,
      completionRate: allTasks.length > 0
        ? Math.round((allTasks.filter(t => t.status === 'COMPLETED').length / allTasks.length) * 100) : 0,
    };

    const pendingTasks = allTasks
      .filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status))
      .slice(0, 8);

    const projectMemberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true, name: true, code: true, status: true,
            _count: { select: { tasks: true, members: true } },
          },
        },
      },
    });

    const allTimeEntries = await prisma.taskTimeEntry.findMany({
      where: { userId },
      select: {
        id: true, hours: true, cost: true, date: true, description: true,
        task: { select: { id: true, title: true, project: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
    });

    const totalHours = allTimeEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalCost = allTimeEntries.reduce((sum, e) => sum + (e.cost || 0), 0);

    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const thisWeekEntries = allTimeEntries.filter(e => {
      const d = new Date(e.date);
      return d >= weekStart && d <= weekEnd;
    });

    const weeklyHours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dateStr = date.toDateString();
      const dayEntries = thisWeekEntries.filter(e => new Date(e.date).toDateString() === dateStr);
      return {
        day,
        date: date.toISOString(),
        hours: Math.round(dayEntries.reduce((sum, e) => sum + e.hours, 0) * 100) / 100,
      };
    });

    const totalHoursWeek = thisWeekEntries.reduce((sum, e) => sum + e.hours, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEntries = allTimeEntries.filter(e => new Date(e.date) >= monthStart);
    const totalHoursMonth = thisMonthEntries.reduce((sum, e) => sum + e.hours, 0);

    const completedTasksList = allTasks.filter(t => t.status === 'COMPLETED');
    const onTimeCompleted = completedTasksList.filter(t =>
      !t.dueDate || (t.completedAt && new Date(t.completedAt) <= new Date(t.dueDate))
    ).length;
    const totalEstimated = allTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = allTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    return {
      hourlyRate: userInfo?.hourlyRate || 0,
      lastLoginAt: userInfo?.lastLoginAt || null,
      loginStreak: weeklyHours.filter(d => d.hours > 0).length,
      taskStats,
      pendingTasks,
      projects: projectMemberships.map(pm => ({
        id: pm.project.id, name: pm.project.name, code: pm.project.code,
        status: pm.project.status, role: pm.role,
        totalTasks: pm.project._count.tasks, totalMembers: pm.project._count.members,
      })),
      timeStats: {
        totalHours: Math.round(totalHours * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalHoursWeek: Math.round(totalHoursWeek * 100) / 100,
        totalHoursMonth: Math.round(totalHoursMonth * 100) / 100,
        weeklyHours,
      },
      performance: {
        completionRate: taskStats.completionRate,
        onTimeRate: completedTasksList.length > 0
          ? Math.round((onTimeCompleted / completedTasksList.length) * 100) : 0,
        hoursUtilization: totalEstimated > 0
          ? Math.round((totalActual / totalEstimated) * 100) : 0,
        totalEstimated: Math.round(totalEstimated * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
      },
      recentTimeEntries: allTimeEntries.slice(0, 5),
    };
  } catch (error) {
    console.error('Personal stats error:', error);
    return null;
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ══════════════════════════════════════════
// ██  DASHBOARD PAGE
// ══════════════════════════════════════════

export default async function DashboardPage() {
  const [user, stats] = await Promise.all([
    getSessionUser(),
    getDashboardStats(),
  ]);

  const personalStats = user?.id ? await getPersonalStats(user.id) : null;

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'User';
  const greeting = getGreeting();
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const userInitials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || user?.name?.[0] || 'U');

  // Smart greeting
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

  // Time tracker
  const todayEntry = personalStats?.timeStats.weeklyHours.find(
    (d: any) => new Date(d.date).toDateString() === today.toDateString()
  );
  const todayHours = todayEntry?.hours || 0;
  const todayFmt = `${String(Math.floor(todayHours)).padStart(2, '0')}:${String(Math.round((todayHours % 1) * 60)).padStart(2, '0')}`;

  // Week calendar days (Mon–Sat)
  const dayOfWeek = today.getDay();
  const mondayOff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const calDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOff + i);
    return d;
  });
  const calDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calMonthLabel = today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const prevMonthLabel = new Date(today.getFullYear(), today.getMonth() - 1).toLocaleDateString('en-IN', { month: 'long' });
  const nextMonthLabel = new Date(today.getFullYear(), today.getMonth() + 1).toLocaleDateString('en-IN', { month: 'long' });
  const calTimeSlots = ['8:00 am', '9:00 am', '10:00 am', '11:00 am'];

  const loginStreak = personalStats?.loginStreak || 0;

  return (
    <div className="min-h-screen -m-6 p-6 lg:p-8 bg-gradient-to-br from-amber-50/60 via-[#fdf8ef] to-orange-50/30">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-100/50 blur-[150px]" />
        <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] rounded-full bg-orange-100/30 blur-[120px]" />
      </div>

      <div className="space-y-5 relative z-10 max-w-[1400px] mx-auto">

        {/* ═══════════════════════════════════════════
            ROW 1 — Welcome Strip
        ═══════════════════════════════════════════ */}
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
              { icon: Users, value: stats.activeEmployees, label: 'Employees' },
              { icon: Building2, value: stats.totalDepartments, label: 'Departments' },
              { icon: Briefcase, value: stats.totalProjects, label: 'Projects' },
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

        {/* ═══════════════════════════════════════════
            ROW 2 — 4-Column Cards
        ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* ── Profile Card ── */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-50/80 via-[#fdf3d7] to-orange-50/60 border border-amber-200/40 shadow-sm p-5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(184,134,11,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10 flex flex-col items-center w-full">
              <ProfilePhotoUpload
                currentAvatar={user?.avatar || null}
                userInitials={userInitials}
                userName={firstName}
              />
              <h3 className="text-base font-semibold text-gray-900 mt-1">{user?.name || firstName}</h3>
              <p className="text-[11px] text-gray-500 mb-2">{user?.role?.replace('_', ' ') || 'Employee'}</p>

              {/* Rate badge */}
              {personalStats && personalStats.hourlyRate > 0 && (
                <div className="inline-flex items-center gap-1 rounded-full bg-white/90 border border-amber-300/60 px-3 py-1 mb-3 shadow-sm">
                  <IndianRupee className="h-3 w-3 text-[#B8860B]" />
                  <span className="text-sm font-bold text-gray-900">{personalStats.hourlyRate.toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* 4 Quick Action Icons */}
              <div className="grid grid-cols-4 gap-3 w-full mb-3">
                {[
                  { icon: CheckSquare, label: 'Tasks', href: '/tasks', bg: 'bg-[#4CAF50]' },
                  { icon: Briefcase, label: 'Projects', href: '/projects', bg: 'bg-[#2196F3]' },
                  { icon: Calendar, label: 'Calendar', href: '/calendar', bg: 'bg-[#26A69A]' },
                  { icon: FolderOpen, label: 'Drives', href: '/drives', bg: 'bg-[#F97316]' },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.href} href={action.href} className="flex flex-col items-center gap-1.5 group">
                      <div className={`${action.bg} rounded-xl p-2.5 transition-transform group-hover:scale-110 shadow-sm`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[9px] text-gray-400 group-hover:text-gray-600 transition-colors">{action.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Streak + Online */}
              <div className="w-full flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-amber-200/40">
                {loginStreak > 0 ? (
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />{loginStreak}-day streak
                  </span>
                ) : <span />}
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          </div>

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
            {/* Week comparison */}
            <p className="text-[10px] text-emerald-600 mb-3 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              {personalStats?.timeStats.totalHoursMonth || 0}h this month
            </p>

            {/* Bar Chart */}
            {personalStats && (
              <>
                <div className="flex items-end justify-between gap-1.5" style={{ height: '90px' }}>
                  {personalStats.timeStats.weeklyHours.map((d: any, i: number) => {
                    const maxH = Math.max(...personalStats.timeStats.weeklyHours.map((x: any) => x.hours), 1);
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
                  {personalStats.timeStats.weeklyHours.map((d: any, i: number) => {
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

          {/* ── Time Tracker Card ── */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-5 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Time tracker</h3>
              <Link href="/tasks" className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ArrowUpRight className="w-3 h-3 text-gray-500" />
              </Link>
            </div>

            {/* Circular Ring */}
            <div className="relative w-28 h-28 mb-2">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="url(#timeGold)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min((personalStats?.timeStats.totalHoursWeek || 0) / 40, 1))}`}
                />
                <defs>
                  <linearGradient id="timeGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8860B" />
                    <stop offset="100%" stopColor="#DAA520" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{todayFmt}</span>
                <span className="text-[9px] text-gray-400 mt-0.5">Work Time</span>
              </div>
            </div>

            {/* Play/Pause Controls */}
            <div className="flex items-center gap-3 mb-3">
              <Link href="/tasks" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <Play className="w-3.5 h-3.5 text-gray-600 ml-0.5" />
              </Link>
              <span className="w-px h-4 bg-gray-200" />
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Pause className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-[#B8860B]" />
              </div>
            </div>

            {/* Month stat */}
            <div className="text-center">
              <span className="text-[10px] text-gray-400">This month: </span>
              <span className="text-xs font-bold text-gray-700">{personalStats?.timeStats.totalHoursMonth || 0}h</span>
            </div>
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
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[10px] font-medium text-amber-700">Task</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[10px] font-medium text-blue-700">Review</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-medium text-emerald-700">Done</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            ROW 3 — 3-Column Bottom
        ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Accordion Panels ── */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm overflow-hidden divide-y divide-gray-100">

            {/* Pending Reviews */}
            <details className="group">
              <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Pending Reviews</span>
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 space-y-2">
                {personalStats && personalStats.taskStats.overdue > 0 ? (
                  <p className="text-xs text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    {personalStats.taskStats.overdue} overdue item{personalStats.taskStats.overdue > 1 ? 's' : ''} need attention
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">No pending reviews.</p>
                )}
                {personalStats?.pendingTasks.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH').slice(0, 3).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.priority === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}`} />
                    <span className="text-gray-700 truncate flex-1">{task.title}</span>
                    <span className="text-gray-400 text-[10px]">{task.priority}</span>
                  </Link>
                ))}
              </div>
            </details>

            {/* My Projects */}
            <details open className="group">
              <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">My Projects</span>
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 space-y-1.5">
                {personalStats && personalStats.projects.length > 0 ? (
                  personalStats.projects.slice(0, 4).map((proj) => (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group/proj"
                    >
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-100 to-purple-50 border border-violet-200/60 flex items-center justify-center text-[10px] font-bold text-violet-600 shrink-0">
                        {proj.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate group-hover/proj:text-gray-900">{proj.name}</p>
                        <p className="text-[10px] text-gray-400">{proj.code} · {proj.totalTasks} tasks</p>
                      </div>
                      <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                        proj.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                        proj.status === 'PLANNED' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{proj.status}</span>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-2">No projects yet.</p>
                )}
              </div>
            </details>

            {/* Quick Links */}
            <details className="group">
              <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Quick Links</span>
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 grid grid-cols-2 gap-2">
                {[
                  { icon: FolderOpen, label: 'Drives', href: '/drives', color: 'text-orange-600' },
                  { icon: Monitor, label: 'IT Portal', href: '/it', color: 'text-blue-600' },
                  { icon: FileText, label: 'Policies', href: '/policies', color: 'text-violet-600' },
                  { icon: Shield, label: 'Settings', href: '/settings', color: 'text-gray-600' },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Icon className={`h-3.5 w-3.5 ${link.color}`} />
                      <span className="text-xs text-gray-600">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </details>

            {/* Organization */}
            <details className="group">
              <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Organization</span>
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 space-y-2">
                {[
                  { label: 'Companies', value: stats.totalCompanies, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', href: '/companies' },
                  { label: 'Departments', value: stats.totalDepartments, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/departments' },
                  { label: 'Employees', value: stats.totalEmployees, icon: UserCircle, color: 'text-teal-600', bg: 'bg-teal-50', href: '/employees' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.label} href={item.href} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`rounded-md ${item.bg} p-1.5`}>
                          <Icon className={`h-3 w-3 ${item.color}`} />
                        </div>
                        <span className="text-xs text-gray-500">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{item.value}</span>
                    </Link>
                  );
                })}
              </div>
            </details>
          </div>

          {/* ── Weekly Calendar Schedule ── */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Month header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <span className="text-xs text-gray-400">{prevMonthLabel}</span>
              <h3 className="text-sm font-semibold text-gray-800">{calMonthLabel}</h3>
              <span className="text-xs text-gray-400">{nextMonthLabel}</span>
            </div>

            {/* Day columns + time grid */}
            <div className="flex">
              {/* Time labels */}
              <div className="w-16 shrink-0 pt-12 border-r border-gray-50">
                {calTimeSlots.map((t) => (
                  <div key={t} className="h-16 flex items-start justify-end pr-2 pt-0.5">
                    <span className="text-[10px] text-gray-400">{t}</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              <div className="flex-1 grid grid-cols-6">
                {calDays.map((day, di) => {
                  const isToday = day.toDateString() === today.toDateString();
                  const dayEvents = (stats.weekEvents || []).filter((e: any) =>
                    new Date(e.startDate).toDateString() === day.toDateString()
                  );
                  return (
                    <div key={di} className={`border-r border-gray-50 last:border-r-0 ${isToday ? 'bg-amber-50/30' : ''}`}>
                      {/* Day header */}
                      <div className={`text-center py-2 border-b border-gray-50 ${isToday ? 'bg-amber-50/50' : ''}`}>
                        <p className={`text-[10px] ${isToday ? 'text-[#B8860B]' : 'text-gray-400'}`}>{calDayNames[di]}</p>
                        <p className={`text-lg font-bold leading-tight ${isToday ? 'text-[#B8860B]' : 'text-gray-800'}`}>
                          {day.getDate()}
                        </p>
                      </div>
                      {/* Time slots */}
                      {calTimeSlots.map((t, ti) => {
                        const hour = 8 + ti;
                        const slotEvents = dayEvents.filter((e: any) => {
                          const h = new Date(e.startDate).getHours();
                          return h >= hour && h < hour + 1;
                        });
                        return (
                          <div key={ti} className="h-16 border-b border-gray-50 p-0.5 relative">
                            {slotEvents.map((e: any) => (
                              <div
                                key={e.id}
                                className="rounded-md bg-amber-100/80 border-l-2 border-[#B8860B] p-1 h-full"
                              >
                                <p className="text-[8px] font-semibold text-gray-700 truncate leading-tight">{e.title}</p>
                                <p className="text-[7px] text-gray-500 truncate">{e.location || ''}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Show upcoming events below if no events in grid */}
            {stats.weekEvents.length === 0 && stats.upcomingEvents.length > 0 && (
              <div className="p-4 border-t border-gray-100 space-y-2">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Upcoming</p>
                {stats.upcomingEvents.slice(0, 3).map((event: any) => (
                  <div key={event.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[7px] font-bold text-orange-500/70 leading-none">
                        {new Date(event.startDate).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-orange-600 leading-tight">{new Date(event.startDate).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{event.title}</p>
                      <p className="text-[10px] text-gray-400">
                        {event.isAllDay ? 'All Day' : new Date(event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {event.location && ` · ${event.location}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {stats.weekEvents.length === 0 && stats.upcomingEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No events this week</p>
              </div>
            )}
          </div>

          {/* ── Active Tasks Card (Light with Amber Highlight) ── */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-50/40 via-white/80 to-orange-50/30 backdrop-blur-xl border border-amber-200/50 shadow-sm overflow-hidden">
            {/* Gold accent top bar */}
            <div className="h-1 bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B]" />

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-[#B8860B]" />
                  Active Tasks
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#B8860B]">
                    {personalStats?.taskStats.completed || 0}
                  </span>
                  <span className="text-gray-400 text-sm">/</span>
                  <span className="text-lg text-gray-400">{personalStats?.taskStats.total || 0}</span>
                </div>
              </div>

              {/* Task checklist */}
              <div className="space-y-1 max-h-[340px] overflow-y-auto scrollbar-thin">
                {personalStats && personalStats.pendingTasks.length > 0 ? (
                  personalStats.pendingTasks.map((task, idx) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < today;
                    const statusColor = task.status === 'IN_PROGRESS' ? 'bg-blue-500'
                      : task.status === 'ON_HOLD' ? 'bg-amber-500' : 'bg-gray-400';
                    const typeIcon = idx % 5 === 0 ? Target : idx % 5 === 1 ? Zap : idx % 5 === 2 ? Clock : idx % 5 === 3 ? Globe : FolderKanban;
                    const TypeIcon = typeIcon;
                    const iconBg = idx % 5 === 0 ? 'bg-violet-100 text-violet-600'
                      : idx % 5 === 1 ? 'bg-blue-100 text-blue-600'
                      : idx % 5 === 2 ? 'bg-amber-100 text-amber-600'
                      : idx % 5 === 3 ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-pink-100 text-pink-600';

                    return (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors group ${
                          isOverdue ? 'bg-red-50 hover:bg-red-100/60 border border-red-200/40' : 'hover:bg-amber-50/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate group-hover:text-gray-900">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {task.project && (
                              <span className="text-[9px] text-gray-400 truncate">{task.project.name}</span>
                            )}
                            {task.dueDate && (
                              <span className={`text-[9px] ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                {new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                {!task.project && ', '}
                                {new Date(task.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${statusColor} shrink-0`} />
                      </Link>
                    );
                  })
                ) : (
                  <>
                    {/* Completed tasks indicator */}
                    {stats.recentTasks.filter((t: any) => t.status === 'COMPLETED').slice(0, 3).map((task: any) => (
                      <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl opacity-60">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-400 truncate line-through">{task.title}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>
                    ))}
                    {stats.recentTasks.length === 0 && (
                      <div className="text-center py-12">
                        <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                        <p className="text-xs text-gray-400">No tasks assigned yet</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer link */}
              {personalStats && personalStats.pendingTasks.length > 0 && (
                <Link
                  href="/tasks"
                  className="mt-3 pt-3 border-t border-amber-200/40 flex items-center justify-center gap-1.5 text-[11px] text-[#B8860B] hover:text-[#DAA520] transition-colors"
                >
                  View all tasks <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
