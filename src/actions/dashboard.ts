'use server';

import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/workos-auth';

// ==========================================
// TYPES
// ==========================================

export interface DashboardOrgStats {
  totalEmployees: number;
  activeEmployees: number;
  totalCompanies: number;
  totalDepartments: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalProjects: number;
  activeProjects: number;
  taskCompletionRate: number;
}

export interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  updatedAt: Date;
  assignee: { firstName: string; lastName: string; avatar: string | null } | null;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date | null;
  type: string;
  location: string | null;
  isAllDay: boolean;
}

export interface WeeklyHour {
  day: string;
  date: string;
  hours: number;
}

export interface PendingTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  project: { id: string; name: string; code: string } | null;
}

export interface UserProject {
  id: string;
  name: string;
  code: string;
  status: string;
  role: string | null;
  totalTasks: number;
  totalMembers: number;}

export interface PersonalStats {
  hourlyRate: number;
  lastLoginAt: Date | null;
  hasAvatar: boolean;
  loginStreak: number;
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
  pendingTasks: PendingTask[];
  projects: UserProject[];
  timeStats: {
    totalHours: number;
    totalCost: number;
    totalHoursWeek: number;
    totalHoursMonth: number;
    weeklyHours: WeeklyHour[];
  };
  performance: {
    completionRate: number;
    onTimeRate: number;
    hoursUtilization: number;
    totalEstimated: number;
    totalActual: number;
  };
  recentTimeEntries: {
    id: string;
    hours: number;
    cost: number | null;
    date: Date;
    description: string | null;
    task: { id: string; title: string; project: { name: string } | null } | null;
  }[];
}

export interface DashboardData {
  orgStats: DashboardOrgStats;
  recentTasks: RecentTask[];
  upcomingEvents: UpcomingEvent[];
  weekEvents: UpcomingEvent[];
}

// ==========================================
// ORG STATS (Lightweight - just counts)
// ==========================================

export async function getDashboardOrgStats(): Promise<DashboardOrgStats> {
  try {
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
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.company.count(),
      prisma.department.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.task.count({
        where: { status: { notIn: ['COMPLETED', 'CANCELLED'] }, dueDate: { lt: new Date() } },
      }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
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
    };
  } catch (error) {
    console.error('getDashboardOrgStats error:', error);
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
    };
  }
}

// ==========================================
// RECENT TASKS (Separate query)
// ==========================================

export async function getDashboardRecentTasks(): Promise<RecentTask[]> {
  try {
    return await prisma.task.findMany({
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
    });
  } catch (error) {
    console.error('getDashboardRecentTasks error:', error);
    return [];
  }
}

// ==========================================
// UPCOMING EVENTS (Separate query)
// ==========================================

export async function getDashboardEvents(): Promise<{ upcoming: UpcomingEvent[]; week: UpcomingEvent[] }> {
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

    const [upcoming, week] = await Promise.all([
      prisma.event.findMany({
        where: { startDate: { gte: today }, isPublic: true },
        take: 5,
        orderBy: { startDate: 'asc' },
        select: { id: true, title: true, startDate: true, endDate: true, type: true, location: true, isAllDay: true },
      }),
      prisma.event.findMany({
        where: { startDate: { gte: calStart, lte: calEnd } },
        take: 20,
        orderBy: { startDate: 'asc' },
        select: { id: true, title: true, startDate: true, endDate: true, type: true, location: true, isAllDay: true },
      }),
    ]);

    return { upcoming, week };
  } catch (error) {
    console.error('getDashboardEvents error:', error);
    return { upcoming: [], week: [] };
  }
}

// ==========================================
// PERSONAL STATS (User-specific)
// ==========================================

export async function getDashboardPersonalStats(): Promise<PersonalStats | null> {
  const user = await getSessionUser();
  if (!user?.id) return null;

  try {
    const now = new Date();

    // Calculate week boundaries
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries for user data
    const [userInfo, taskData, projectMembers, weekTimeEntries, monthTimeEntries] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { hourlyRate: true, lastLoginAt: true, avatar: true },
      }),
      prisma.task.findMany({
        where: { assigneeId: user.id },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          completedAt: true,
          estimatedHours: true,
          actualHours: true,
          project: { select: { id: true, name: true, code: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.projectMember.findMany({
        where: { userId: user.id },
        take: 10,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
              _count: { select: { tasks: true, members: true } },
            },
          },
        },
      }),
      prisma.taskTimeEntry.findMany({
        where: { userId: user.id, date: { gte: weekStart, lte: weekEnd } },
        select: { hours: true, cost: true, date: true, description: true, id: true, task: { select: { id: true, title: true, project: { select: { name: true } } } } },
        orderBy: { date: 'desc' },
      }),
      prisma.taskTimeEntry.aggregate({
        where: { userId: user.id, date: { gte: monthStart } },
        _sum: { hours: true, cost: true },
      }),
    ]);

    // Task stats
    const taskStats = {
      total: taskData.length,
      todo: taskData.filter(t => t.status === 'TODO').length,
      inProgress: taskData.filter(t => t.status === 'IN_PROGRESS').length,
      onHold: taskData.filter(t => t.status === 'ON_HOLD').length,
      completed: taskData.filter(t => t.status === 'COMPLETED').length,
      cancelled: taskData.filter(t => t.status === 'CANCELLED').length,
      overdue: taskData.filter(t =>
        t.dueDate && new Date(t.dueDate) < now && !['COMPLETED', 'CANCELLED'].includes(t.status)
      ).length,
      completionRate: taskData.length > 0
        ? Math.round((taskData.filter(t => t.status === 'COMPLETED').length / taskData.length) * 100)
        : 0,
    };

    const pendingTasks = taskData
      .filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status))
      .slice(0, 8)
      .map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        project: t.project,
      }));

    // Weekly hours calculation
    const weeklyHours: WeeklyHour[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dateStr = date.toDateString();
      const dayEntries = weekTimeEntries.filter(e => new Date(e.date).toDateString() === dateStr);
      return {
        day,
        date: date.toISOString(),
        hours: Math.round(dayEntries.reduce((sum, e) => sum + e.hours, 0) * 100) / 100,
      };
    });

    const totalHoursWeek = weekTimeEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalHoursMonth = monthTimeEntries._sum.hours || 0;
    const totalCostMonth = monthTimeEntries._sum.cost || 0;

    // Performance stats
    const completedTasksList = taskData.filter(t => t.status === 'COMPLETED');
    const onTimeCompleted = completedTasksList.filter(t =>
      !t.dueDate || (t.completedAt && new Date(t.completedAt) <= new Date(t.dueDate))
    ).length;
    const totalEstimated = taskData.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = taskData.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    return {
      hourlyRate: userInfo?.hourlyRate || 0,
      lastLoginAt: userInfo?.lastLoginAt || null,
      hasAvatar: !!userInfo?.avatar,
      loginStreak: weeklyHours.filter(d => d.hours > 0).length,
      taskStats,
      pendingTasks,
      projects: projectMembers.map(pm => ({
        id: pm.project.id,
        name: pm.project.name,
        code: pm.project.code,
        status: pm.project.status,
        role: pm.role,
        totalTasks: pm.project._count.tasks,
        totalMembers: pm.project._count.members,
      })),
      timeStats: {
        totalHours: Math.round(totalHoursMonth * 100) / 100,
        totalCost: Math.round(totalCostMonth * 100) / 100,
        totalHoursWeek: Math.round(totalHoursWeek * 100) / 100,
        totalHoursMonth: Math.round(totalHoursMonth * 100) / 100,
        weeklyHours,
      },
      performance: {
        completionRate: taskStats.completionRate,
        onTimeRate: completedTasksList.length > 0
          ? Math.round((onTimeCompleted / completedTasksList.length) * 100)
          : 0,
        hoursUtilization: totalEstimated > 0
          ? Math.round((totalActual / totalEstimated) * 100)
          : 0,
        totalEstimated: Math.round(totalEstimated * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
      },
      recentTimeEntries: weekTimeEntries.slice(0, 5),
    };
  } catch (error) {
    console.error('getDashboardPersonalStats error:', error);
    return null;
  }
}

// ==========================================
// CURRENT USER INFO (Minimal)
// ==========================================

export async function getDashboardUser() {
  const user = await getSessionUser();
  return user;
}
