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
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.company.count(),
    prisma.department.count(),
    prisma.task.count(),
    prisma.task.count({ where: { status: 'COMPLETED' } }),
    prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.task.count({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.project.count(),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
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
    }),
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
    }),
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
    }),
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
    COMPLETED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    IN_PROGRESS: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    PENDING: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    TODO: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
    CANCELLED: { bg: 'bg-red-500/20', text: 'text-red-400' },
  };
  return map[status] || { bg: 'bg-slate-500/20', text: 'text-slate-400' };
}

function getPriorityDot(priority: string) {
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-500 shadow-red-500/50',
    HIGH: 'bg-orange-500 shadow-orange-500/50',
    MEDIUM: 'bg-amber-500 shadow-amber-500/50',
    LOW: 'bg-emerald-500 shadow-emerald-500/50',
  };
  return map[priority] || 'bg-slate-500';
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
    <div className="dark-dashboard min-h-screen -m-6 p-6 lg:p-8 bg-[#0f0f1a]">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#DAA520]/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/[0.03] blur-[100px]" />
      </div>

      <div className="space-y-6 relative z-10">
        {/* ── Top Section: Hero + Profile ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Hero / Greeting */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e]/90 to-[#0d0d1a]/90 backdrop-blur-xl border border-white/[0.06] p-8">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br from-[#DAA520]/20 to-orange-600/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, rgba(218,165,32,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>
            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/national-logo.png"
                  alt="National Group"
                  width={40}
                  height={40}
                  className="rounded-xl border border-white/10 bg-white/5 p-1"
                />
                <span className="text-xs text-white/40 font-medium tracking-widest uppercase">{dateStr}</span>
              </div>

              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {greeting}, <span className="bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">{firstName}</span>
                  <Sparkles className="inline-block ml-2 h-6 w-6 text-amber-400/80" />
                </h1>
                <p className="text-white/50 text-base max-w-lg">
                  Welcome to National Group Intranet — your central hub for collaboration and productivity.
                </p>
              </div>

              {/* Stat Chips */}
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/employees" className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] px-4 py-2 text-sm transition-all hover:bg-white/[0.12] hover:border-white/[0.15]">
                  <div className="h-2 w-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
                  <span className="text-white/70">Employees</span>
                  <span className="font-bold text-white">{stats.activeEmployees}</span>
                </Link>
                <Link href="/companies" className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] px-4 py-2 text-sm transition-all hover:bg-white/[0.12] hover:border-white/[0.15]">
                  <div className="h-2 w-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
                  <span className="text-white/70">Companies</span>
                  <span className="font-bold text-white">{stats.totalCompanies}</span>
                </Link>
                <Link href="/departments" className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] px-4 py-2 text-sm transition-all hover:bg-white/[0.12] hover:border-white/[0.15]">
                  <div className="h-2 w-2 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50" />
                  <span className="text-white/70">Departments</span>
                  <span className="font-bold text-white">{stats.totalDepartments}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="rounded-2xl bg-gradient-to-b from-[#1a1a2e]/90 to-[#12121f]/90 backdrop-blur-xl border border-white/[0.06] p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#DAA520] to-[#FFD700] opacity-30 blur-sm" />
              {(session?.user as any)?.avatar ? (
                <Image
                  src={(session!.user as any).avatar}
                  alt={firstName}
                  width={72}
                  height={72}
                  className="relative rounded-full border-2 border-[#DAA520]/40 object-cover"
                />
              ) : (
                <div className="relative h-[72px] w-[72px] rounded-full bg-gradient-to-br from-[#DAA520] to-[#B8860B] flex items-center justify-center text-2xl font-bold text-white border-2 border-[#DAA520]/40">
                  {userInitials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-[#12121f]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-0.5">{session?.user?.name || firstName}</h3>
            <p className="text-xs text-white/40 mb-5">{(session?.user as any)?.role?.replace('_', ' ') || 'EMPLOYEE'}</p>

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
                    <div className={`rounded-xl bg-gradient-to-br ${action.gradient} p-2.5 transition-transform group-hover:scale-110 shadow-lg`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors">{action.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mini Stats Card */}
            <div className="w-full rounded-xl bg-gradient-to-br from-[#DAA520]/20 to-orange-600/10 border border-[#DAA520]/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#DAA520]/70 font-medium">My Productivity</span>
                <TrendingUp className="h-3.5 w-3.5 text-[#DAA520]" />
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-white">{stats.taskCompletionRate}%</span>
                <span className="text-xs text-emerald-400 mb-1 ml-1">tasks done</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Employees', value: stats.activeEmployees, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', href: '/employees' },
            { label: 'Active Projects', value: stats.activeProjects, icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', href: '/projects' },
            { label: 'Tasks In Progress', value: stats.inProgressTasks, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', href: '/tasks' },
            { label: 'Completion Rate', value: `${stats.taskCompletionRate}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', href: '/tasks' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className={`group rounded-2xl bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/[0.06] ${stat.border} p-5 transition-all hover:bg-[#1a1a2e] hover:border-white/[0.12] hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`rounded-xl ${stat.bg} p-2.5`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </Link>
            );
          })}
        </div>

        {/* ── Quick Access Grid ── */}
        <div className="rounded-2xl bg-[#1a1a2e]/60 backdrop-blur-xl border border-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white/80 mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#DAA520]" />
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
                  <div className={`rounded-2xl bg-gradient-to-br ${app.gradient} p-3 text-white transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-white/5`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors font-medium">{app.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Tasks */}
            <div className="rounded-2xl bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                  My Tasks
                </h3>
                <Link href="/tasks" className="text-xs text-[#DAA520]/70 hover:text-[#DAA520] transition-colors flex items-center gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-4">
                {stats.recentTasks.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckSquare className="h-10 w-10 mx-auto mb-3 text-white/10" />
                    <p className="text-sm text-white/30">No tasks assigned yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.recentTasks.map((task) => {
                      const statusStyle = getStatusBadge(task.status);
                      return (
                        <Link
                          key={task.id}
                          href={`/tasks/${task.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all group"
                        >
                          <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm ${getPriorityDot(task.priority)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {task.assignee && (
                                <span className="text-xs text-white/30">
                                  {task.assignee.firstName} {task.assignee.lastName}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="text-xs text-white/30">
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
            <div className="rounded-2xl bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  Upcoming Events
                </h3>
                <Link href="/calendar" className="text-xs text-[#DAA520]/70 hover:text-[#DAA520] transition-colors flex items-center gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-4">
                {stats.upcomingEvents.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="h-10 w-10 mx-auto mb-3 text-white/10" />
                    <p className="text-sm text-white/30">No upcoming events.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-all"
                      >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-medium text-orange-400/70 leading-none">
                            {new Date(event.startDate).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className="text-lg font-bold text-orange-400 leading-tight">
                            {new Date(event.startDate).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate">{event.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="h-3 w-3 text-white/25" />
                            <span className="text-xs text-white/35">
                              {event.isAllDay ? 'All Day' : new Date(event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.location && (
                              <>
                                <MapPin className="h-3 w-3 text-white/25" />
                                <span className="text-xs text-white/35 truncate">{event.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400">
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
            <div className="rounded-2xl bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/[0.06] p-6">
              <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#DAA520]" />
                My Goals
              </h3>
              <div className="flex items-center justify-center gap-6 mb-5">
                {/* Task Completion Ring */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="url(#goldGrad)"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={`${stats.taskCompletionRate * 2.51} 251`}
                      />
                      <defs>
                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#DAA520" />
                          <stop offset="100%" stopColor="#FFD700" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute text-lg font-bold text-white">{stats.taskCompletionRate}%</span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-2">Tasks Done</p>
                </div>

                {/* Project Progress Ring */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
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
                    <span className="absolute text-lg font-bold text-white">
                      {stats.totalProjects > 0 ? Math.round((stats.activeProjects / stats.totalProjects) * 100) : 0}%
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-2">Projects Active</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/10 p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{stats.completedTasks}</p>
                  <p className="text-[10px] text-emerald-400/60">Completed</p>
                </div>
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/10 p-3 text-center">
                  <p className="text-lg font-bold text-blue-400">{stats.inProgressTasks}</p>
                  <p className="text-[10px] text-blue-400/60">In Progress</p>
                </div>
                <div className="rounded-xl bg-red-500/10 border border-red-500/10 p-3 text-center">
                  <p className="text-lg font-bold text-red-400">{stats.overdueTasks}</p>
                  <p className="text-[10px] text-red-400/60">Overdue</p>
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
                  <p className="text-lg font-bold text-white/80">{stats.totalTasks}</p>
                  <p className="text-[10px] text-white/30">Total Tasks</p>
                </div>
              </div>
            </div>

            {/* Active Projects */}
            <div className="rounded-2xl bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-400" />
                  Active Projects
                </h3>
                <Link href="/projects" className="text-xs text-[#DAA520]/70 hover:text-[#DAA520] transition-colors flex items-center gap-1">
                  See all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-4">
                {stats.recentProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 text-white/10" />
                    <p className="text-sm text-white/30">No active projects.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.recentProjects.map((project) => (
                      <Link
                        key={project.id}
                        href="/projects"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all group"
                      >
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 flex-shrink-0">
                          {project.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
                            {project.name}
                          </p>
                          <p className="text-xs text-white/30">
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
            <div className="rounded-2xl bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/[0.06] p-5">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#DAA520]" />
                Organization
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Companies', value: stats.totalCompanies, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10', href: '/companies' },
                  { label: 'Departments', value: stats.totalDepartments, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', href: '/departments' },
                  { label: 'Employees', value: stats.totalEmployees, icon: UserCircle, color: 'text-teal-400', bg: 'bg-teal-500/10', href: '/employees' },
                  { label: 'Projects', value: stats.totalProjects, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10', href: '/projects' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg ${item.bg} p-2`}>
                          <Icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-white/90">{item.value}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Links ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/[0.04]">
          {[
            { label: 'About Us', href: '/about', icon: Globe },
            { label: 'Our Companies', href: '/companies', icon: Building2 },
            { label: 'Policies', href: '/policies', icon: BookOpen },
            { label: 'Settings', href: '/settings', icon: Settings },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 p-4 rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                <Icon className="h-4 w-4 text-[#DAA520]/60" />
                <span className="text-sm text-white/40 hover:text-white/60">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
