import Link from 'next/link';
import Image from 'next/image';
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
  Briefcase,
  Globe,
  Zap,
  Sparkles,
  UserCircle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  MapPin,
  Timer,
  Target,
  FolderKanban,
  CircleDot,
  PauseCircle,
  IndianRupee,
} from 'lucide-react';

// Revalidate every 60 seconds for fresh data
export const revalidate = 60;

// Fetch real dashboard stats
async function getDashboardStats() {
  try {
    const today = new Date();

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
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      prisma.company.count().catch(() => 0),
      prisma.department.count().catch(() => 0),
      prisma.task.count().catch(() => 0),
      prisma.task.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }).catch(() => 0),
      prisma.task.count({
        where: {
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: new Date() },
        },
      }).catch(() => 0),
      prisma.project.count().catch(() => 0),
      prisma.project.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      prisma.task.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          updatedAt: true,
          assignee: { select: { firstName: true, lastName: true, avatar: true } },
        },
      }).catch(() => []),
      prisma.event.findMany({
        where: { startDate: { gte: today }, isPublic: true },
        take: 5,
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          type: true,
          location: true,
          isAllDay: true,
        },
      }).catch(() => []),
      prisma.project.findMany({
        where: { status: 'ACTIVE' },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
          owner: { select: { firstName: true, lastName: true } },
          _count: { select: { members: true } },
        },
      }).catch(() => []),
    ]);

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
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
      taskCompletionRate,
      recentTasks,
      upcomingEvents,
      recentProjects,
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      totalCompanies: 0,
      totalDepartments: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      totalProjects: 0,
      activeProjects: 0,
      taskCompletionRate: 0,
      recentTasks: [] as any[],
      upcomingEvents: [] as any[],
      recentProjects: [] as any[],
    };
  }
}

// Fetch personal work stats for the logged-in user
async function getPersonalStats(userId: string) {
  try {
    const now = new Date();
    
    // User info with hourly rate
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { hourlyRate: true },
    });

    // All tasks assigned to user
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

    // Project involvement
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

    // Time entries
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

    // Weekly hours 
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

    // Monthly hours
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEntries = allTimeEntries.filter(e => new Date(e.date) >= monthStart);
    const totalHoursMonth = thisMonthEntries.reduce((sum, e) => sum + e.hours, 0);

    // Performance
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED');
    const onTimeCompleted = completedTasks.filter(t =>
      !t.dueDate || (t.completedAt && new Date(t.completedAt) <= new Date(t.dueDate))
    ).length;
    const totalEstimated = allTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = allTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    return {
      hourlyRate: userInfo?.hourlyRate || 0,
      taskStats,
      pendingTasks,
      projects: projectMemberships.map(pm => ({
        id: pm.project.id,
        name: pm.project.name,
        code: pm.project.code,
        status: pm.project.status,
        role: pm.role,
        totalTasks: pm.project._count.tasks,
        totalMembers: pm.project._count.members,
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
        onTimeRate: completedTasks.length > 0
          ? Math.round((onTimeCompleted / completedTasks.length) * 100) : 0,
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

export default async function DashboardPage() {
  const [user, stats] = await Promise.all([
    getSessionUser(),
    getDashboardStats(),
  ]);

  const personalStats = user?.id ? await getPersonalStats(user.id) : null;

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'User';
  const greeting = getGreeting();
  const today = new Date();

  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const userInitials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || user?.name?.[0] || 'U');

  return (
    <div className="min-h-screen -m-6 p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Subtle ambient decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-100/40 blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-100/30 blur-[120px]" />
      </div>

      <div className="space-y-5 relative z-10 max-w-[1400px] mx-auto">

        {/* ═══ ROW 1: Hero Greeting + Profile Card ═══ */}
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* Hero / Greeting */}
          <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-6 lg:p-7">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br from-[#DAA520]/15 to-orange-400/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(184,134,11,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/national-logo.png"
                  alt="National Group"
                  width={36}
                  height={36}
                  className="rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm"
                />
                <span className="text-[11px] text-gray-400 font-medium tracking-widest uppercase">{dateStr}</span>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1.5">
                  {greeting}, <span className="bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] bg-clip-text text-transparent">{firstName}</span>
                  <Sparkles className="inline-block ml-2 h-5 w-5 text-amber-500/70" />
                </h1>
                <p className="text-gray-500 text-sm">
                  Welcome to National Group Intranet — your central hub for collaboration and productivity.
                </p>
              </div>
              {/* Stat Chips */}
              <div className="flex flex-wrap gap-2.5">
                <Link href="/employees" className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3.5 py-1.5 text-xs shadow-sm transition-all hover:shadow-md hover:border-gray-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="text-gray-500">Employees</span>
                  <span className="font-bold text-gray-900">{stats.activeEmployees}</span>
                </Link>
                <Link href="/companies" className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3.5 py-1.5 text-xs shadow-sm transition-all hover:shadow-md hover:border-gray-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span className="text-gray-500">Companies</span>
                  <span className="font-bold text-gray-900">{stats.totalCompanies}</span>
                </Link>
                <Link href="/departments" className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3.5 py-1.5 text-xs shadow-sm transition-all hover:shadow-md hover:border-gray-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  <span className="text-gray-500">Departments</span>
                  <span className="font-bold text-gray-900">{stats.totalDepartments}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-5 flex flex-col items-center text-center">
            <ProfilePhotoUpload
              currentAvatar={user?.avatar || null}
              userInitials={userInitials}
              userName={firstName}
            />
            <h3 className="text-base font-semibold text-gray-900 mb-0.5">{user?.name || firstName}</h3>
            <p className="text-[11px] text-gray-400 mb-4 tracking-wide">{user?.role?.replace('_', ' ') || 'EMPLOYEE'}</p>

            {/* Quick Action Icons */}
            <div className="grid grid-cols-4 gap-2 w-full mb-4">
              {[
                { icon: CheckSquare, label: 'Tasks', href: '/tasks', gradient: 'from-green-500 to-emerald-600' },
                { icon: Briefcase, label: 'Projects', href: '/projects', gradient: 'from-indigo-500 to-blue-600' },
                { icon: Calendar, label: 'Calendar', href: '/calendar', gradient: 'from-orange-500 to-amber-600' },
                { icon: FolderOpen, label: 'Drives', href: '/drives', gradient: 'from-yellow-500 to-orange-600' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} className="flex flex-col items-center gap-1 group">
                    <div className={`rounded-lg bg-gradient-to-br ${action.gradient} p-2 transition-transform group-hover:scale-110 shadow-sm`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[9px] text-gray-400 group-hover:text-gray-600 transition-colors">{action.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mini Productivity */}
            <div className="w-full rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-[#B8860B] font-medium">My Productivity</span>
                <TrendingUp className="h-3 w-3 text-[#B8860B]" />
              </div>
              <div className="flex items-end gap-1">
                <span className="text-xl font-bold text-gray-900">{personalStats?.taskStats.completionRate ?? stats.taskCompletionRate}%</span>
                <span className="text-[10px] text-emerald-600 mb-0.5 ml-0.5">tasks done</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ROW 2: 4 Key Metric Cards ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'My Tasks',
              value: personalStats ? `${personalStats.taskStats.inProgress + personalStats.taskStats.todo}` : stats.inProgressTasks,
              sub: personalStats ? `of ${personalStats.taskStats.total} total` : 'in progress',
              icon: CheckSquare,
              color: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'border-emerald-200/60',
              href: '/tasks',
            },
            {
              label: 'My Projects',
              value: personalStats ? personalStats.projects.length : stats.activeProjects,
              sub: personalStats ? `${personalStats.projects.filter(p => p.status === 'ACTIVE').length} active` : `of ${stats.totalProjects} total`,
              icon: FolderKanban,
              color: 'text-violet-600', bg: 'bg-violet-50', accent: 'border-violet-200/60',
              href: '/projects',
            },
            {
              label: 'Hours This Week',
              value: personalStats ? `${personalStats.timeStats.totalHoursWeek}h` : '—',
              sub: personalStats ? `${personalStats.timeStats.totalHoursMonth}h this month` : 'no data',
              icon: Timer,
              color: 'text-blue-600', bg: 'bg-blue-50', accent: 'border-blue-200/60',
              href: '/tasks',
            },
            {
              label: 'Completion Rate',
              value: `${personalStats?.taskStats.completionRate ?? stats.taskCompletionRate}%`,
              sub: personalStats ? `${personalStats.taskStats.completed} completed` : `${stats.completedTasks} completed`,
              icon: Target,
              color: 'text-[#B8860B]', bg: 'bg-amber-50', accent: 'border-amber-200/60',
              href: '/tasks',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className={`group rounded-2xl bg-white/80 backdrop-blur-xl border ${stat.accent} p-4 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`rounded-lg ${stat.bg} p-2`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-gray-900 leading-tight">{stat.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{stat.sub}</p>
                <p className="text-[10px] text-gray-300 mt-1 font-medium tracking-wide uppercase">{stat.label}</p>
              </Link>
            );
          })}
        </div>

        {/* ═══ ROW 3: Progress + Time Tracker + Performance ═══ */}
        {personalStats && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Weekly Progress Bar Chart */}
            <div className="lg:col-span-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-800">My Progress</h3>
                <Link href="/tasks" className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <ArrowUpRight className="w-3 h-3 text-gray-500" />
                </Link>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold text-gray-900">{personalStats.timeStats.totalHoursWeek}h</span>
                <span className="text-xs text-gray-400">this week</span>
              </div>
              <div className="flex items-end justify-between gap-1 min-h-[90px]">
                {personalStats.timeStats.weeklyHours.map((d, i) => {
                  const maxH = Math.max(...personalStats.timeStats.weeklyHours.map(x => x.hours), 1);
                  const height = maxH > 0 ? (d.hours / maxH) * 100 : 0;
                  const isToday = new Date(d.date).toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      {d.hours > 0 && (
                        <span className={`text-[9px] font-semibold ${isToday ? 'text-[#B8860B]' : 'text-gray-400'}`}>
                          {d.hours}h
                        </span>
                      )}
                      <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                        <div
                          className={`w-full max-w-[24px] rounded-t-md transition-all ${
                            isToday ? 'bg-gradient-to-t from-[#B8860B] to-[#DAA520]' : d.hours > 0 ? 'bg-gray-800' : 'bg-gray-100'
                          }`}
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] ${isToday ? 'text-[#B8860B] font-bold' : 'text-gray-400'}`}>
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time Tracker Ring */}
            <div className="lg:col-span-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-5 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-gray-800 self-start mb-3">Time Tracker</h3>
              <div className="relative w-28 h-28 mb-3">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="url(#dashGold)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min(personalStats.performance.hoursUtilization, 100) / 100)}`}
                  />
                  <defs>
                    <linearGradient id="dashGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#B8860B" />
                      <stop offset="100%" stopColor="#DAA520" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">{personalStats.timeStats.totalHours}</span>
                  <span className="text-[9px] text-gray-400 font-medium">TOTAL HRS</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full text-center">
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-xs font-bold text-gray-900">{personalStats.timeStats.totalHoursMonth}h</p>
                  <p className="text-[9px] text-gray-400">This Month</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2">
                  <p className="text-xs font-bold text-[#B8860B]">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(personalStats.timeStats.totalCost)}
                  </p>
                  <p className="text-[9px] text-gray-400">Total Cost</p>
                </div>
              </div>
            </div>

            {/* Performance Card */}
            <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/80 border border-amber-200/50 shadow-sm p-5 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#B8860B]" />
                Performance
              </h3>
              <div className="space-y-3.5 flex-1">
                {[
                  { label: 'Task Completion', value: personalStats.performance.completionRate, color: 'bg-emerald-500' },
                  { label: 'On-Time Delivery', value: personalStats.performance.onTimeRate, color: 'bg-[#B8860B]' },
                  {
                    label: 'Hours Budget',
                    value: personalStats.performance.hoursUtilization,
                    color: personalStats.performance.hoursUtilization > 120 ? 'bg-red-500' :
                           personalStats.performance.hoursUtilization > 100 ? 'bg-amber-500' : 'bg-blue-500',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-bold text-gray-800">{item.value}%</span>
                    </div>
                    <div className="h-1.5 bg-white rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${Math.min(item.value, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {personalStats.hourlyRate > 0 && (
                <div className="mt-4 pt-3 border-t border-amber-200/50 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Hourly Rate</span>
                  <span className="text-xs font-bold text-[#B8860B] flex items-center gap-0.5">
                    <IndianRupee className="w-3 h-3" />{personalStats.hourlyRate.toLocaleString('en-IN')}/hr
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ROW 4: Active Tasks + Events | Projects + Org ═══ */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Active Tasks — Dark Card */}
            {personalStats && (
              <div className="rounded-2xl bg-[#1a1a2e] p-5 text-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-[#DAA520]" />
                    Active Tasks
                  </h3>
                  <Link href="/tasks" className="text-[10px] text-[#DAA520] hover:text-[#FFD700] transition-colors flex items-center gap-1">
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* Task breakdown bar */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
                  <div className="relative w-11 h-11 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
                      <circle cx="22" cy="22" r="18" fill="none" stroke="#DAA520" strokeWidth="3.5" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 18}`}
                        strokeDashoffset={`${2 * Math.PI * 18 * (1 - personalStats.taskStats.completionRate / 100)}`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#DAA520]">{personalStats.taskStats.completionRate}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-x-3 text-[10px] flex-1">
                    <span className="text-white/50 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" /> To Do {personalStats.taskStats.todo}</span>
                    <span className="text-white/50 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Active {personalStats.taskStats.inProgress}</span>
                    <span className="text-white/50 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Hold {personalStats.taskStats.onHold}</span>
                    <span className="text-white/50 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Done {personalStats.taskStats.completed}</span>
                  </div>
                </div>

                {/* Task list */}
                <div className="space-y-0.5 max-h-[240px] overflow-y-auto scrollbar-thin">
                  {personalStats.pendingTasks.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-6">No pending tasks — nicely done!</p>
                  ) : (
                    personalStats.pendingTasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        {task.status === 'IN_PROGRESS' ? <Timer className="w-3.5 h-3.5 text-blue-400 shrink-0" /> :
                         task.status === 'ON_HOLD' ? <PauseCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> :
                         <CircleDot className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 truncate group-hover:text-white">{task.title}</p>
                          <p className="text-[10px] text-white/35">
                            {task.project?.name || 'No Project'}
                            {task.dueDate && (
                              <span className={task.dueDate && new Date(task.dueDate) < new Date() ? ' text-red-400' : ''}>
                                {' · '}{new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold tracking-wide ${
                          task.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                          task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                          task.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {task.priority}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Upcoming Events
                </h3>
                <Link href="/calendar" className="text-[10px] text-[#B8860B] hover:text-[#DAA520] transition-colors flex items-center gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-4">
                {stats.upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                    <p className="text-xs text-gray-400">No upcoming events.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {stats.upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[8px] font-bold text-orange-500/70 leading-none">
                            {new Date(event.startDate).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className="text-sm font-bold text-orange-600 leading-tight">
                            {new Date(event.startDate).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{event.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-gray-300" />
                            <span className="text-[11px] text-gray-400">
                              {event.isAllDay ? 'All Day' : new Date(event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.location && (
                              <>
                                <MapPin className="h-3 w-3 text-gray-300 ml-1" />
                                <span className="text-[11px] text-gray-400 truncate">{event.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                          {event.type.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-5">
            {/* My Projects */}
            {personalStats && (
              <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-violet-500" />
                    My Projects
                  </h3>
                  <Link href="/projects" className="text-[10px] text-[#B8860B] hover:text-[#DAA520] transition-colors flex items-center gap-1">
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="p-4 space-y-1.5 max-h-[260px] overflow-y-auto">
                  {personalStats.projects.length === 0 ? (
                    <div className="text-center py-8">
                      <FolderKanban className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                      <p className="text-xs text-gray-400">Not part of any projects yet.</p>
                    </div>
                  ) : (
                    personalStats.projects.map((proj) => (
                      <Link
                        key={proj.id}
                        href={`/projects/${proj.id}`}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-[#B8860B]/30 hover:shadow-sm transition-all group"
                      >
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-100 to-purple-50 border border-violet-200/60 flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
                          {proj.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">{proj.name}</p>
                          <p className="text-[10px] text-gray-400">{proj.code} · {proj.role || 'Member'}</p>
                        </div>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                          proj.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                          proj.status === 'PLANNED' ? 'bg-blue-50 text-blue-700' :
                          proj.status === 'ON_HOLD' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {proj.status}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Organization Overview */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#B8860B]" />
                Organization
              </h3>
              <div className="space-y-0.5">
                {[
                  { label: 'Companies', value: stats.totalCompanies, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', href: '/companies' },
                  { label: 'Departments', value: stats.totalDepartments, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/departments' },
                  { label: 'Employees', value: stats.totalEmployees, icon: UserCircle, color: 'text-teal-600', bg: 'bg-teal-50', href: '/employees' },
                  { label: 'Projects', value: stats.totalProjects, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/projects' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`rounded-md ${item.bg} p-1.5`}>
                          <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                        </div>
                        <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{item.value}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
