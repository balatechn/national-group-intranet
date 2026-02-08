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
  Ticket,
  Monitor,
  FileText,
  FolderOpen,
  Clock,
  AlertTriangle,
  Bell,
  ArrowRight,
  Plus,
  ChevronRight,
  Megaphone,
  Briefcase,
  Settings,
  BookOpen,
  BarChart3,
  Globe,
  Search,
  Star,
  TrendingUp,
  Zap,
  Activity,
  Target,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@/components/ui';

// Revalidate every 60 seconds for fresh data
export const revalidate = 60;

// Fetch real dashboard stats
async function getDashboardStats() {
  const [
    totalEmployees,
    activeEmployees,
    totalCompanies,
    totalDepartments,
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    openTickets,
    totalTickets,
    totalProjects,
    activeProjects,
    pendingRequests,
    recentTasks,
    recentTickets,
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
    prisma.iTTicket.count({ where: { status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    prisma.iTTicket.count(),
    prisma.project.count(),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.iTRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.task.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,
        assignee: { select: { firstName: true, lastName: true, avatar: true } },
      },
    }),
    prisma.iTTicket.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        updatedAt: true,
        creator: { select: { firstName: true, lastName: true } },
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
    openTickets,
    totalTickets,
    totalProjects,
    activeProjects,
    pendingRequests,
    taskCompletionRate,
    recentTasks,
    recentTickets,
  };
}

// Quick Access Apps
const quickAccessApps = [
  { title: 'IT Helpdesk', href: '/it', icon: Monitor, color: 'bg-blue-500', description: 'Tickets & Requests' },
  { title: 'Projects', href: '/projects', icon: Briefcase, color: 'bg-purple-500', description: 'Manage Projects' },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare, color: 'bg-green-500', description: 'My Tasks' },
  { title: 'Calendar', href: '/calendar', icon: Calendar, color: 'bg-orange-500', description: 'Events & Meetings' },
  { title: 'Documents', href: '/drives', icon: FolderOpen, color: 'bg-yellow-500', description: 'Company Drives' },
  { title: 'Policies', href: '/policies', icon: BookOpen, color: 'bg-red-500', description: 'HR & IT Policies' },
  { title: 'Directory', href: '/departments', icon: Users, color: 'bg-teal-500', description: 'Find People' },
  { title: 'Reports', href: '/it/reports', icon: BarChart3, color: 'bg-indigo-500', description: 'Analytics' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    TODO: 'bg-gray-100 text-gray-700',
    OPEN: 'bg-blue-100 text-blue-700',
    RESOLVED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-green-500',
  };
  return colors[priority] || 'bg-gray-500';
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const [session, stats] = await Promise.all([
    getServerSession(authOptions),
    getDashboardStats(),
  ]);

  const firstName = session?.user?.firstName || session?.user?.name?.split(' ')[0] || 'User';
  const role = session?.user?.role || 'EMPLOYEE';
  const greeting = getGreeting();

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 -mt-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-8 text-white">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-blue-500/20 to-primary/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Left: Greeting & Actions */}
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <Image
                  src="/national-logo.png"
                  alt="National Group"
                  width={44}
                  height={44}
                  className="rounded-lg border border-white/20 bg-white/10 p-1"
                />
                <div>
                  <p className="text-sm text-white/60 font-medium tracking-wide uppercase">{dateStr}</p>
                </div>
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                  {greeting}, <span className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] bg-clip-text text-transparent">{firstName}</span> 
                  <Sparkles className="inline-block ml-2 h-7 w-7 text-yellow-400" />
                </h1>
                <p className="text-white/70 text-lg">
                  Welcome to National Group Intranet — your central hub for collaboration and productivity.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-lg shadow-primary/25 border-0" asChild>
                  <Link href="/tasks/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                  </Link>
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm" asChild>
                  <Link href="/it/tickets/new">
                    <Ticket className="mr-2 h-4 w-4" />
                    Raise Ticket
                  </Link>
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm" asChild>
                  <Link href="/it/requests/new">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    IT Request
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: Live Stats Grid */}
            <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
              <Link href="/employees" className="group rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10 p-4 text-center transition-all hover:bg-white/[0.15] hover:border-white/20 hover:scale-[1.02]">
                <div className="flex items-center justify-center mb-2">
                  <div className="rounded-lg bg-blue-500/20 p-2">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold">{stats.activeEmployees}</p>
                <p className="text-xs text-white/60 mt-1">Active Employees</p>
              </Link>
              <Link href="/companies" className="group rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10 p-4 text-center transition-all hover:bg-white/[0.15] hover:border-white/20 hover:scale-[1.02]">
                <div className="flex items-center justify-center mb-2">
                  <div className="rounded-lg bg-purple-500/20 p-2">
                    <Building2 className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold">{stats.totalCompanies}</p>
                <p className="text-xs text-white/60 mt-1">Companies</p>
              </Link>
              <Link href="/tasks" className="group rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10 p-4 text-center transition-all hover:bg-white/[0.15] hover:border-white/20 hover:scale-[1.02]">
                <div className="flex items-center justify-center mb-2">
                  <div className="rounded-lg bg-green-500/20 p-2">
                    <CheckSquare className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold">{stats.inProgressTasks}</p>
                <p className="text-xs text-white/60 mt-1">Active Tasks</p>
              </Link>
              <Link href="/it/tickets" className="group rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10 p-4 text-center transition-all hover:bg-white/[0.15] hover:border-white/20 hover:scale-[1.02]">
                <div className="flex items-center justify-center mb-2">
                  <div className="rounded-lg bg-orange-500/20 p-2">
                    <Ticket className="h-5 w-5 text-orange-400" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold">{stats.openTickets}</p>
                <p className="text-xs text-white/60 mt-1">Open Tickets</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.totalDepartments}</p>
                <p className="text-xs text-text-muted mt-1">Departments</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2.5">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.completedTasks}</p>
                <p className="text-xs text-text-muted mt-1">Completed Tasks</p>
              </div>
              <div className="rounded-lg bg-green-50 p-2.5">
                <Target className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.overdueTasks}</p>
                <p className="text-xs text-text-muted mt-1">Overdue Tasks</p>
              </div>
              <div className="rounded-lg bg-red-50 p-2.5">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.activeProjects}</p>
                <p className="text-xs text-text-muted mt-1">Active Projects</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-2.5">
                <Briefcase className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.pendingRequests}</p>
                <p className="text-xs text-text-muted mt-1">Pending Requests</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2.5">
                <ClipboardList className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.taskCompletionRate}%</p>
                <p className="text-xs text-text-muted mt-1">Completion Rate</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-2.5">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Access Apps */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Access
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {quickAccessApps.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.href}
                href={app.href}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-4 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
              >
                <div className={`${app.color} rounded-xl p-3 text-white transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">{app.title}</p>
                  <p className="text-xs text-text-muted hidden sm:block">{app.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Tasks & Tickets */}
        <section className="lg:col-span-2 space-y-6">
          {/* Recent Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-green-500" />
                  Recent Tasks
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/tasks/new" className="text-primary">
                      <Plus className="h-4 w-4 mr-1" /> New
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/tasks" className="text-primary">
                      View all <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stats.recentTasks.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tasks yet. Create your first task!</p>
                  <Button size="sm" className="mt-3" asChild>
                    <Link href="/tasks/new"><Plus className="h-4 w-4 mr-1" /> Create Task</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-100 hover:border-primary/20 transition-all group"
                    >
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.assignee && (
                            <span className="text-xs text-text-muted">
                              {task.assignee.firstName} {task.assignee.lastName}
                            </span>
                          )}
                          <span className="text-xs text-text-muted">• {timeAgo(task.updatedAt)}</span>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent IT Tickets */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-orange-500" />
                  Recent IT Tickets
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/it/tickets/new" className="text-primary">
                      <Plus className="h-4 w-4 mr-1" /> New
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/it/tickets" className="text-primary">
                      View all <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stats.recentTickets.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <Ticket className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tickets yet. Need IT help?</p>
                  <Button size="sm" className="mt-3" asChild>
                    <Link href="/it/tickets/new"><Plus className="h-4 w-4 mr-1" /> Raise Ticket</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-100 hover:border-primary/20 transition-all"
                    >
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getPriorityColor(ticket.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-text-muted">{ticket.ticketNumber}</span>
                        </div>
                        <p className="text-sm font-medium text-text-primary truncate mt-0.5">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          by {ticket.creator.firstName} {ticket.creator.lastName} • {timeAgo(ticket.updatedAt)}
                        </p>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          {/* Task Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Task Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="#B8860B"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${stats.taskCompletionRate * 2.51} 251`}
                    />
                  </svg>
                  <span className="absolute text-xl font-bold text-text-primary">{stats.taskCompletionRate}%</span>
                </div>
                <p className="text-sm text-text-muted mt-2">Overall Completion</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50">
                  <p className="text-lg font-bold text-green-600">{stats.completedTasks}</p>
                  <p className="text-xs text-green-600/70">Completed</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50">
                  <p className="text-lg font-bold text-blue-600">{stats.inProgressTasks}</p>
                  <p className="text-xs text-blue-600/70">In Progress</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50">
                  <p className="text-lg font-bold text-red-600">{stats.overdueTasks}</p>
                  <p className="text-xs text-red-600/70">Overdue</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-lg font-bold text-gray-600">{stats.totalTasks}</p>
                  <p className="text-xs text-gray-600/70">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IT Alerts */}
          {(stats.overdueTasks > 0 || stats.openTickets > 0 || stats.pendingRequests > 0) && (
            <Card className="border-l-4 border-l-warning">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Attention Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.overdueTasks > 0 && (
                  <Link href="/tasks" className="flex items-center gap-3 p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                    <Clock className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700">{stats.overdueTasks} Overdue Task{stats.overdueTasks !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-red-500">Needs immediate attention</p>
                    </div>
                  </Link>
                )}
                {stats.openTickets > 0 && (
                  <Link href="/it/tickets" className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                    <Ticket className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-700">{stats.openTickets} Open Ticket{stats.openTickets !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-orange-500">Awaiting resolution</p>
                    </div>
                  </Link>
                )}
                {stats.pendingRequests > 0 && (
                  <Link href="/it/requests" className="flex items-center gap-3 p-3 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors">
                    <Bell className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-primary">{stats.pendingRequests} Pending Request{stats.pendingRequests !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-primary/70">Review pending IT requests</p>
                    </div>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <Link href="/it/tickets/new">
                    <Ticket className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">New Ticket</span>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <Link href="/it/requests/new">
                    <Plus className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">IT Request</span>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <Link href="/tasks/new">
                    <CheckSquare className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">New Task</span>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <Link href="/projects/new">
                    <Briefcase className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">New Project</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Organization Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/companies" className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-50 p-2">
                      <Building2 className="h-4 w-4 text-purple-500" />
                    </div>
                    <span className="text-sm font-medium">Companies</span>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{stats.totalCompanies}</span>
                </Link>
                <Link href="/departments" className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2">
                      <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="text-sm font-medium">Departments</span>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{stats.totalDepartments}</span>
                </Link>
                <Link href="/employees" className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-teal-50 p-2">
                      <Users className="h-4 w-4 text-teal-500" />
                    </div>
                    <span className="text-sm font-medium">Employees</span>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{stats.totalEmployees}</span>
                </Link>
                <Link href="/projects" className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2">
                      <Briefcase className="h-4 w-4 text-indigo-500" />
                    </div>
                    <span className="text-sm font-medium">Projects</span>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{stats.totalProjects}</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Footer Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
        <Link href="/about" className="flex items-center gap-2 p-4 rounded-lg hover:bg-surface-100 transition-colors">
          <Globe className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">About Us</span>
        </Link>
        <Link href="/departments" className="flex items-center gap-2 p-4 rounded-lg hover:bg-surface-100 transition-colors">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Our Companies</span>
        </Link>
        <Link href="/policies" className="flex items-center gap-2 p-4 rounded-lg hover:bg-surface-100 transition-colors">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Policies</span>
        </Link>
        <Link href="/it" className="flex items-center gap-2 p-4 rounded-lg hover:bg-surface-100 transition-colors">
          <Settings className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">IT Support</span>
        </Link>
      </div>
    </div>
  );
}
