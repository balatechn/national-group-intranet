'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Users,
  MapPin,
  Shield,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Timer,
  TrendingUp,
  FolderKanban,
  CircleDot,
  ArrowUpRight,
  Loader2,
  Monitor,
  Smartphone,
  IndianRupee,
  Target,
  Zap,
  PauseCircle,
  XCircle,
  BarChart3,
} from 'lucide-react';

interface EmployeeStats {
  employee: any;
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    onHold: number;
    completed: number;
    cancelled: number;
    overdue: number;
    completionRate: number;
  };
  pendingTasks: any[];
  recentCompleted: any[];
  projects: any[];
  timeStats: {
    totalHours: number;
    totalCost: number;
    totalHoursWeek: number;
    totalHoursMonth: number;
    totalCostMonth: number;
    weeklyHours: { day: string; date: string; hours: number }[];
    last4Weeks: { label: string; hours: number; cost: number }[];
    avgHoursPerDay: number;
    totalEstimated: number;
    totalActual: number;
  };
  performance: {
    completionRate: number;
    onTimeCompleted: number;
    overdueCompleted: number;
    totalCompleted: number;
    onTimeRate: number;
    hoursUtilization: number;
  };
  recentTimeEntries: any[];
}

export default function EmployeeDetailClient({ employeeId }: { employeeId: string }) {
  const [data, setData] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/employees/${employeeId}/stats`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Loading employee dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data?.employee) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-secondary">Employee not found</p>
      </div>
    );
  }

  const { employee, taskStats, pendingTasks, recentCompleted, projects, timeStats, performance, recentTimeEntries } = data;
  const fullName = employee.displayName || `${employee.firstName} ${employee.lastName}`;
  const maxWeeklyHours = Math.max(...timeStats.weeklyHours.map(d => d.hours), 1);
  const maxLast4Weeks = Math.max(...timeStats.last4Weeks.map(w => w.hours), 1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-400';
      case 'INACTIVE': return 'bg-gray-400';
      case 'SUSPENDED': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700';
      case 'LOW': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'IN_PROGRESS': return <Timer className="w-4 h-4 text-blue-500" />;
      case 'ON_HOLD': return <PauseCircle className="w-4 h-4 text-amber-500" />;
      case 'TODO': return <CircleDot className="w-4 h-4 text-gray-400" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <CircleDot className="w-4 h-4 text-gray-400" />;
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
      case 'PLANNED': return 'bg-blue-100 text-blue-700';
      case 'ON_HOLD': return 'bg-amber-100 text-amber-700';
      case 'COMPLETED': return 'bg-gray-100 text-gray-600';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    return dueDate && new Date(dueDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(status);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/employees" className="hover:text-primary transition-colors">Employees</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-text-primary font-medium">{fullName}</span>
        </div>
        <Link href="/employees" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Employee Master
        </Link>
      </div>

      {/* ===== HERO ROW: Profile Card + Progress + Time Tracker ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Profile Hero Card */}
        <div className="lg:col-span-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white min-h-[220px] flex flex-col justify-end p-5">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4 z-10">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(employee.status)} ring-2 ring-white`} />
          </div>
          <div className="relative z-10">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-2xl font-bold shrink-0">
                {employee.firstName[0]}{employee.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{fullName}</h1>
                <p className="text-white/80 text-sm truncate">{employee.jobTitle || 'No Job Title'}</p>
                <p className="text-white/60 text-xs mt-0.5">ID: {employee.employeeId}</p>
              </div>
            </div>
            {employee.hourlyRate && (
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold/90 text-white text-sm font-semibold">
                <IndianRupee className="w-3.5 h-3.5" />
                {employee.hourlyRate.toLocaleString('en-IN')}<span className="font-normal text-white/80 text-xs">/hr</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Card - Weekly Hours Bar Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-surface-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-text-primary">Progress</h3>
            <Link href={`/tasks?assignee=${employeeId}`} className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors">
              <ArrowUpRight className="w-4 h-4 text-text-secondary" />
            </Link>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-text-primary">{timeStats.totalHoursWeek}h</span>
            <span className="text-sm text-text-secondary">Work Time<br />this week</span>
          </div>
          {/* Weekly bar chart */}
          <div className="flex items-end justify-between gap-1.5 flex-1 min-h-[80px]">
            {timeStats.weeklyHours.map((d, i) => {
              const height = maxWeeklyHours > 0 ? (d.hours / maxWeeklyHours) * 100 : 0;
              const isToday = new Date(d.date).toDateString() === new Date().toDateString();
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  {d.hours > 0 && (
                    <span className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                      {d.hours}h
                    </span>
                  )}
                  <div className="w-full flex items-end justify-center" style={{ height: '70px' }}>
                    <div
                      className={`w-full max-w-[28px] rounded-t-md transition-all ${
                        isToday
                          ? 'bg-primary'
                          : d.hours > 0
                            ? 'bg-primary-800'
                            : 'bg-surface-200'
                      }`}
                      style={{ height: `${Math.max(height, 6)}%` }}
                    />
                  </div>
                  <span className={`text-[11px] ${isToday ? 'text-primary font-semibold' : 'text-text-muted'}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Tracker Card - Circular Ring */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-surface-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-text-primary">Time Tracker</h3>
            <span className="text-xs text-text-muted">All Time</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Circular progress ring */}
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E8E8E8" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="#B8860B"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - Math.min(performance.hoursUtilization, 100) / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-text-primary">{timeStats.totalHours}</span>
                <span className="text-xs text-text-secondary">Total Hrs</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 w-full text-center">
              <div>
                <p className="text-sm font-semibold text-text-primary">{timeStats.avgHoursPerDay}h</p>
                <p className="text-[10px] text-text-muted">Avg/Day</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{timeStats.totalHoursMonth}h</p>
                <p className="text-[10px] text-text-muted">This Month</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">{formatCurrency(timeStats.totalCost)}</p>
                <p className="text-[10px] text-text-muted">Total Cost</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATS BAR ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {[
          { label: 'Total Tasks', value: taskStats.total, icon: Target, color: 'text-primary' },
          { label: 'In Progress', value: taskStats.inProgress, icon: Timer, color: 'text-blue-600' },
          { label: 'Completed', value: taskStats.completed, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Overdue', value: taskStats.overdue, icon: AlertCircle, color: 'text-red-600' },
          { label: 'Projects', value: projects.length, icon: FolderKanban, color: 'text-violet-600' },
          { label: 'Completion', value: `${taskStats.completionRate}%`, icon: TrendingUp, color: 'text-primary' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-surface-200 p-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{stat.value}</p>
              <p className="text-[11px] text-text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== MAIN CONTENT ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Task Overview - Dark Card (like Crextio's Onboarding Task) */}
        <div className="lg:col-span-4 bg-primary-900 rounded-2xl p-5 text-white flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white/90">Active Tasks</h3>
            <span className="text-xl font-bold">{taskStats.todo + taskStats.inProgress}/{taskStats.total}</span>
          </div>
          
          {/* Task completion donut mini */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                <circle
                  cx="22" cy="22" r="18"
                  fill="none" stroke="#DAA520" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - taskStats.completionRate / 100)}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{taskStats.completionRate}%</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs flex-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-white/70">To Do: {taskStats.todo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-white/70">Active: {taskStats.inProgress}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-white/70">On Hold: {taskStats.onHold}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white/70">Done: {taskStats.completed}</span>
              </div>
            </div>
          </div>

          {/* Pending Task List */}
          <div className="flex-1 space-y-1 overflow-y-auto max-h-[280px] scrollbar-thin">
            {pendingTasks.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-6">No pending tasks</p>
            ) : (
              pendingTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  {getTaskStatusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate group-hover:text-white">{task.title}</p>
                    <p className="text-[10px] text-white/50">
                      {task.project?.name || 'No Project'}
                      {task.dueDate && (
                        <span className={isOverdue(task.dueDate, task.status) ? ' text-red-400' : ''}>
                          {' '}· {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getPriorityStyle(task.priority)}`}>
                    {task.priority}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Projects Involvement */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-surface-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <FolderKanban className="w-4.5 h-4.5 text-primary" />
              Projects
            </h3>
            <span className="text-xs text-text-muted">{projects.length} total</span>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px]">
            {projects.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-6">Not part of any projects</p>
            ) : (
              projects.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  className="block p-3 rounded-xl border border-surface-200 hover:border-primary/30 hover:shadow-card transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-text-primary truncate group-hover:text-primary transition-colors">{proj.name}</p>
                      <p className="text-[11px] text-text-muted">{proj.code} · {proj.role || 'Member'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getProjectStatusColor(proj.status)}`}>
                      {proj.status}
                    </span>
                  </div>
                  {/* Task progress bar */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${proj.myTaskCompletionRate}%` }} />
                    </div>
                    <span className="text-[10px] text-text-muted font-medium">{proj.myCompletedTasks}/{proj.myTasks}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{proj.myActualHours}h logged</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{proj.totalMembers}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Sidebar: Employee Info + Performance */}
        <div className="lg:col-span-4 space-y-4">
          {/* Contact Info Card */}
          <div className="bg-white rounded-2xl border border-surface-200 p-5">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-primary" />
              Information
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-text-muted shrink-0" />
                <a href={`mailto:${employee.email}`} className="text-primary hover:underline truncate">{employee.email}</a>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-text-muted shrink-0" />
                  <a href={`tel:${employee.phone}`} className="text-text-primary hover:text-primary">{employee.phone}</a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-text-muted shrink-0" />
                <Link href={`/companies/${employee.company?.id}`} className="text-primary hover:underline">
                  {employee.company?.shortName || employee.company?.name || 'Not Assigned'}
                </Link>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="w-4 h-4 text-text-muted shrink-0" />
                <Link href={`/departments/${employee.department?.id}`} className="text-primary hover:underline">
                  {employee.department?.name || 'Not Assigned'}
                </Link>
              </div>
              {employee.manager && (
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-text-muted shrink-0" />
                  <Link href={`/employees/${employee.manager.id}`} className="text-primary hover:underline">
                    {employee.manager.firstName} {employee.manager.lastName}
                  </Link>
                  <span className="text-text-muted text-xs">(Manager)</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                <span className="text-text-primary">Joined {new Date(employee.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {employee.lastLoginAt && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="text-text-secondary text-xs">Last login: {new Date(employee.lastLoginAt).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Performance Snapshot */}
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl border border-primary-200 p-5">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-primary" />
              Performance
            </h3>
            <div className="space-y-3">
              {/* Completion Rate */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-secondary">Task Completion</span>
                  <span className="font-semibold text-text-primary">{performance.completionRate}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${performance.completionRate}%` }} />
                </div>
              </div>
              {/* On-Time Rate */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-secondary">On-Time Delivery</span>
                  <span className="font-semibold text-text-primary">{performance.onTimeRate}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${performance.onTimeRate}%` }} />
                </div>
              </div>
              {/* Hours Utilization */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-secondary">Hours Utilization</span>
                  <span className="font-semibold text-text-primary">{performance.hoursUtilization}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      performance.hoursUtilization > 120 ? 'bg-red-500' :
                      performance.hoursUtilization > 100 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(performance.hoursUtilization, 100)}%` }}
                  />
                </div>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-primary-200">
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{performance.onTimeCompleted}</p>
                  <p className="text-[10px] text-text-muted">On Time</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">{performance.overdueCompleted}</p>
                  <p className="text-[10px] text-text-muted">Late</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-text-primary">{performance.totalCompleted}</p>
                  <p className="text-[10px] text-text-muted">Total Done</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM ROW: Recent Time Entries + Direct Reports + Devices ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Last 4 Weeks Trend */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-surface-200 p-5">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-primary" />
            Last 4 Weeks
          </h3>
          <div className="space-y-3">
            {timeStats.last4Weeks.map((week, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-secondary text-xs">{week.label}</span>
                  <span className="text-xs font-medium text-text-primary">{week.hours}h · {formatCurrency(week.cost)}</span>
                </div>
                <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary rounded-full transition-all"
                    style={{ width: `${maxLast4Weeks > 0 ? (week.hours / maxLast4Weeks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-surface-200 grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-sm font-bold text-text-primary">{timeStats.totalEstimated}h</p>
              <p className="text-[10px] text-text-muted">Estimated</p>
            </div>
            <div>
              <p className="text-sm font-bold text-primary">{timeStats.totalActual}h</p>
              <p className="text-[10px] text-text-muted">Actual</p>
            </div>
          </div>
        </div>

        {/* Recent Time Entries */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-surface-200 p-5">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-primary" />
            Recent Time Entries
          </h3>
          <div className="space-y-1.5 overflow-y-auto max-h-[260px]">
            {recentTimeEntries.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-6">No time entries yet</p>
            ) : (
              recentTimeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <Timer className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{entry.task?.title || 'Task'}</p>
                    <p className="text-[10px] text-text-muted">
                      {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {entry.task?.project?.name && ` · ${entry.task.project.name}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-text-primary">{entry.hours}h</p>
                    <p className="text-[10px] text-text-muted">{formatCurrency(entry.cost)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Direct Reports + Devices */}
        <div className="lg:col-span-4 space-y-4">
          {/* Direct Reports */}
          {employee.subordinates.length > 0 && (
            <div className="bg-white rounded-2xl border border-surface-200 p-5">
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-primary" />
                Direct Reports ({employee.subordinates.length})
              </h3>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {employee.subordinates.map((sub: any) => (
                  <Link
                    key={sub.id}
                    href={`/employees/${sub.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                      {sub.firstName[0]}{sub.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {sub.displayName || `${sub.firstName} ${sub.lastName}`}
                      </p>
                      <p className="text-[10px] text-text-muted truncate">{sub.jobTitle || 'No Title'}</p>
                    </div>
                    {sub._count?.subordinates > 0 && (
                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{sub._count.subordinates}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Devices */}
          {(employee.assignedSystems.length > 0 || employee.assignedMobiles.length > 0) && (
            <div className="bg-white rounded-2xl border border-surface-200 p-5">
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Monitor className="w-4.5 h-4.5 text-primary" />
                Devices
              </h3>
              <div className="space-y-2">
                {employee.assignedSystems.map((sys: any) => (
                  <div key={sys.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-100">
                    <Monitor className="w-5 h-5 text-text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{sys.brand} {sys.model || ''}</p>
                      <p className="text-[10px] text-text-muted">{sys.assetType} · {sys.serialNumber || 'No SN'}</p>
                    </div>
                  </div>
                ))}
                {employee.assignedMobiles.map((mob: any) => (
                  <div key={mob.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-100">
                    <Smartphone className="w-5 h-5 text-text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{mob.brand} {mob.model || ''}</p>
                      <p className="text-[10px] text-text-muted">{mob.mobileNumber || 'No Number'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Completed */}
          {recentCompleted.length > 0 && (
            <div className="bg-white rounded-2xl border border-surface-200 p-5">
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                Recently Completed
              </h3>
              <div className="space-y-1.5  max-h-[140px] overflow-y-auto">
                {recentCompleted.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{task.title}</p>
                      <p className="text-[10px] text-text-muted">
                        {task.completedAt && new Date(task.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
