import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  Building2,
  Users,
  CheckSquare,
  Calendar,
  FolderOpen,
  ChevronRight,
  Briefcase,
  Settings,
  BookOpen,
  Globe,
  Zap,
  Activity,
  Sparkles,
  UserCircle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  MapPin,
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

// Quick Access Apps
const quickAccessApps = [
  { title: 'Companies', href: '/companies', icon: Building2, gradient: 'from-purple-500 to-violet-600' },
  { title: 'Departments', href: '/departments', icon: Users, gradient: 'from-blue-500 to-cyan-600' },
  { title: 'Employees', href: '/employees', icon: UserCircle, gradient: 'from-teal-500 to-emerald-600' },
  { title: 'Projects', href: '/projects', icon: Briefcase, gradient: 'from-indigo-500 to-blue-600' },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare, gradient: 'from-green-500 to-emerald-600' },
  { title: 'Calendar', href: '/calendar', icon: Calendar, gradient: 'from-orange-500 to-amber-600' },
  { title: 'Drives', href: '/drives', icon: FolderOpen, gradient: 'from-yellow-500 to-orange-600' },
  { title: 'Policies', href: '/policies', icon: BookOpen, gradient: 'from-rose-500 to-pink-600' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getStatusBadge(status: string) {
  const map: Record<string, { bg: string; text: string }> = {
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700' },
    TODO: { bg: 'bg-slate-100', text: 'text-slate-600' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-700' },
  };
  return map[status] || { bg: 'bg-slate-100', text: 'text-slate-600' };
}

function getPriorityDot(priority: string) {
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-500 shadow-red-500/30',
    HIGH: 'bg-orange-500 shadow-orange-500/30',
    MEDIUM: 'bg-amber-500 shadow-amber-500/30',
    LOW: 'bg-emerald-500 shadow-emerald-500/30',
  };
  return map[priority] || 'bg-slate-400';
}

export default async function DashboardPage() {
  const [session, stats] = await Promise.all([
    getServerSession(authOptions),
    getDashboardStats(),
  ]);

  const firstName = session?.user?.firstName || session?.user?.name?.split(' ')[0] || 'User';
  const greeting = getGreeting();
  const today = new Date();

  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const userInitials = (session?.user?.firstName?.[0] || '') + (session?.user?.lastName?.[0] || session?.user?.name?.[0] || 'U');

  return (
    <div className="min-h-screen -m-6 p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Subtle ambient decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-100/40 blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-100/30 blur-[120px]" />
      </div>

      <div className="space-y-6 relative z-10">
        {/* ── Top Section: Hero + Profile ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Hero / Greeting */}
          <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-8">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br from-[#DAA520]/15 to-orange-400/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(184,134,11,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>
            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/national-logo.png"
                  alt="National Group"
                  width={40}
                  height={40}
                  className="rounded-xl border border-gray-200 bg-white p-1 shadow-sm"
                />
                <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">{dateStr}</span>
              </div>

              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {greeting}, <span className="bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] bg-clip-text text-transparent">{firstName}</span>
                  <Sparkles className="inline-block ml-2 h-6 w-6 text-amber-500/70" />
                </h1>
                <p className="text-gray-500 text-base max-w-lg">
                  Welcome to National Group Intranet — your central hub for collaboration and productivity.
                </p>
              </div>

              {/* Stat Chips */}
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/employees" className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-sm shadow-sm transition-all hover:shadow-md hover:border-gray-300">
                  <div className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" />
                  <span className="text-gray-500">Employees</span>
                  <span className="font-bold text-gray-900">{stats.activeEmployees}</span>
                </Link>
                <Link href="/companies" className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-sm shadow-sm transition-all hover:shadow-md hover:border-gray-300">
                  <div className="h-2 w-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/30" />
                  <span className="text-gray-500">Companies</span>
                  <span className="font-bold text-gray-900">{stats.totalCompanies}</span>
                </Link>
                <Link href="/departments" className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-sm shadow-sm transition-all hover:shadow-md hover:border-gray-300">
                  <div className="h-2 w-2 rounded-full bg-teal-500 shadow-sm shadow-teal-500/30" />
                  <span className="text-gray-500">Departments</span>
                  <span className="font-bold text-gray-900">{stats.totalDepartments}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#DAA520] to-[#FFD700] opacity-20 blur-sm" />
              {(session?.user as any)?.avatar ? (
                <Image
                  src={(session!.user as any).avatar}
                  alt={firstName}
                  width={72}
                  height={72}
                  className="relative rounded-full border-2 border-[#DAA520]/30 object-cover shadow-md"
                />
              ) : (
                <div className="relative h-[72px] w-[72px] rounded-full bg-gradient-to-br from-[#DAA520] to-[#B8860B] flex items-center justify-center text-2xl font-bold text-white border-2 border-[#DAA520]/30 shadow-md">
                  {userInitials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-0.5">{session?.user?.name || firstName}</h3>
            <p className="text-xs text-gray-400 mb-5">{(session?.user as any)?.role?.replace('_', ' ') || 'EMPLOYEE'}</p>

            {/* Quick Action Icons */}
            <div className="grid grid-cols-4 gap-3 w-full mb-5">
              {[
                { icon: CheckSquare, label: 'Tasks', href: '/tasks', gradient: 'from-green-500 to-emerald-600' },
                { icon: Briefcase, label: 'Projects', href: '/projects', gradient: 'from-indigo-500 to-blue-600' },
                { icon: Calendar, label: 'Calendar', href: '/calendar', gradient: 'from-orange-500 to-amber-600' },
                { icon: FolderOpen, label: 'Drives', href: '/drives', gradient: 'from-yellow-500 to-orange-600' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className={`rounded-xl bg-gradient-to-br ${action.gradient} p-2.5 transition-transform group-hover:scale-110 shadow-md`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[10px] text-gray-400 group-hover:text-gray-600 transition-colors">{action.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mini Stats Card */}
            <div className="w-full rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#B8860B] font-medium">My Productivity</span>
                <TrendingUp className="h-3.5 w-3.5 text-[#B8860B]" />
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-gray-900">{stats.taskCompletionRate}%</span>
                <span className="text-xs text-emerald-600 mb-1 ml-1">tasks done</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Access Grid ── */}
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-gray-200/80 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#B8860B]" />
            Quick Access
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
            {quickAccessApps.map((app) => {
              const Icon = app.icon;
              return (
                <Link
                  key={app.href}
                  href={app.href}
                  className="group flex flex-col items-center gap-2.5"
                >
                  <div className={`rounded-2xl bg-gradient-to-br ${app.gradient} p-3 text-white transition-all group-hover:scale-110 group-hover:shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-gray-700 transition-colors font-medium">{app.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Stat Cards Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Employees', value: stats.activeEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', href: '/employees' },
            { label: 'Active Projects', value: stats.activeProjects, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', href: '/projects' },
            { label: 'Tasks In Progress', value: stats.inProgressTasks, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', href: '/tasks' },
            { label: 'Completion Rate', value: `${stats.taskCompletionRate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', href: '/tasks' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className={`group rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 ${stat.border} p-5 shadow-sm transition-all hover:shadow-md hover:border-gray-300 hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`rounded-xl ${stat.bg} p-2.5`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              </Link>
            );
          })}
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Tasks */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-500" />
                  My Tasks
                </h3>
                <Link href="/tasks" className="text-xs text-[#B8860B] hover:text-[#DAA520] transition-colors flex items-center gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-4">
                {stats.recentTasks.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckSquare className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm text-gray-400">No tasks assigned yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {stats.recentTasks.map((task) => {
                      const statusStyle = getStatusBadge(task.status);
                      return (
                        <Link
                          key={task.id}
                          href={`/tasks/${task.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                        >
                          <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm ${getPriorityDot(task.priority)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {task.assignee && (
                                <span className="text-xs text-gray-400">
                                  {task.assignee.firstName} {task.assignee.lastName}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="text-xs text-gray-400">
                                  • {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Upcoming Events
                </h3>
                <Link href="/calendar" className="text-xs text-[#B8860B] hover:text-[#DAA520] transition-colors flex items-center gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-4">
                {stats.upcomingEvents.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm text-gray-400">No upcoming events.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {stats.upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-medium text-orange-500/70 leading-none">
                            {new Date(event.startDate).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className="text-lg font-bold text-orange-600 leading-tight">
                            {new Date(event.startDate).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{event.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="h-3 w-3 text-gray-300" />
                            <span className="text-xs text-gray-400">
                              {event.isAllDay ? 'All Day' : new Date(event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.location && (
                              <>
                                <MapPin className="h-3 w-3 text-gray-300" />
                                <span className="text-xs text-gray-400 truncate">{event.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-600">
                          {event.type.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Productivity Ring */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#B8860B]" />
                My Goals
              </h3>
              <div className="flex items-center justify-center gap-6 mb-5">
                {/* Task Completion Ring */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="url(#goldGrad)"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={`${stats.taskCompletionRate * 2.51} 251`}
                      />
                      <defs>
                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#B8860B" />
                          <stop offset="100%" stopColor="#DAA520" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute text-lg font-bold text-gray-900">{stats.taskCompletionRate}%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Tasks Done</p>
                </div>

                {/* Project Progress Ring */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="url(#blueGrad)"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={`${stats.totalProjects > 0 ? Math.round((stats.activeProjects / stats.totalProjects) * 100) * 2.51 : 0} 251`}
                      />
                      <defs>
                        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#60A5FA" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute text-lg font-bold text-gray-900">
                      {stats.totalProjects > 0 ? Math.round((stats.activeProjects / stats.totalProjects) * 100) : 0}%
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Projects Active</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                  <p className="text-lg font-bold text-emerald-600">{stats.completedTasks}</p>
                  <p className="text-[10px] text-emerald-500/70">Completed</p>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                  <p className="text-lg font-bold text-blue-600">{stats.inProgressTasks}</p>
                  <p className="text-[10px] text-blue-500/70">In Progress</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
                  <p className="text-lg font-bold text-red-600">{stats.overdueTasks}</p>
                  <p className="text-[10px] text-red-500/70">Overdue</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
                  <p className="text-lg font-bold text-gray-700">{stats.totalTasks}</p>
                  <p className="text-[10px] text-gray-400">Total Tasks</p>
                </div>
              </div>
            </div>

            {/* Active Projects */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-500" />
                  Active Projects
                </h3>
                <Link href="/projects" className="text-xs text-[#B8860B] hover:text-[#DAA520] transition-colors flex items-center gap-1">
                  See all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-4">
                {stats.recentProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm text-gray-400">No active projects.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {stats.recentProjects.map((project) => (
                      <Link
                        key={project.id}
                        href="/projects"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                      >
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-50 border border-indigo-200/60 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                          {project.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                            {project.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {project.owner.firstName} {project.owner.lastName} • {project._count.members} members
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Organization */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#B8860B]" />
                Organization
              </h3>
              <div className="space-y-1">
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
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg ${item.bg} p-2`}>
                          <Icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{item.value}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Links ── */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200/60">
          {[
            { label: 'Our Companies', href: '/companies', icon: Building2 },
            { label: 'Policies', href: '/policies', icon: BookOpen },
            { label: 'Settings', href: '/settings', icon: Settings },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 p-4 rounded-xl hover:bg-white/80 transition-colors"
              >
                <Icon className="h-4 w-4 text-[#B8860B]/60" />
                <span className="text-sm text-gray-400 hover:text-gray-600">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
