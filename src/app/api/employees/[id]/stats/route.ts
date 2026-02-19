import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/workos-auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Get employee basic info
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: { select: { id: true, name: true, shortName: true, code: true } },
        department: {
          select: {
            id: true, name: true, code: true,
            head: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        manager: {
          select: {
            id: true, firstName: true, lastName: true, jobTitle: true,
            company: { select: { name: true, shortName: true } },
          },
        },
        subordinates: {
          select: {
            id: true, firstName: true, lastName: true, jobTitle: true, avatar: true, status: true,
            department: { select: { name: true } },
            _count: { select: { subordinates: true } },
          },
          orderBy: { firstName: 'asc' },
        },
        assignedSystems: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        assignedMobiles: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Task stats - all tasks
    const allTasks = await prisma.task.findMany({
      where: { assigneeId: userId },
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
        createdAt: true,
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
        t.dueDate && new Date(t.dueDate) < new Date() &&
        !['COMPLETED', 'CANCELLED'].includes(t.status)
      ).length,
      completionRate: allTasks.length > 0
        ? Math.round((allTasks.filter(t => t.status === 'COMPLETED').length / allTasks.length) * 100)
        : 0,
    };

    // Recent/active tasks for the list
    const pendingTasks = allTasks
      .filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status))
      .slice(0, 10);

    const recentCompleted = allTasks
      .filter(t => t.status === 'COMPLETED')
      .slice(0, 5);

    // Project involvement
    const projectMemberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } },
            tasks: {
              where: { assigneeId: userId },
              select: { status: true, estimatedHours: true, actualHours: true },
            },
          },
        },
      },
    });

    const projects = projectMemberships.map(pm => {
      const tasks = pm.project.tasks;
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
      return {
        id: pm.project.id,
        name: pm.project.name,
        code: pm.project.code,
        status: pm.project.status,
        role: pm.role,
        startDate: pm.project.startDate,
        endDate: pm.project.endDate,
        totalMembers: pm.project._count.members,
        totalProjectTasks: pm.project._count.tasks,
        myTasks: tasks.length,
        myCompletedTasks: completedTasks,
        myTaskCompletionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
        myEstimatedHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
        myActualHours: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
      };
    });

    // Time entries - all time
    const allTimeEntries = await prisma.taskTimeEntry.findMany({
      where: { userId },
      select: {
        id: true,
        hours: true,
        cost: true,
        date: true,
        description: true,
        hourlyRate: true,
        task: { select: { id: true, title: true, project: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
    });

    const totalHours = allTimeEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalCost = allTimeEntries.reduce((sum, e) => sum + e.cost, 0);

    // Weekly hours (current week Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
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

    const weeklyHours = totalHoursThisWeek(thisWeekEntries, weekStart);
    const totalHoursWeek = thisWeekEntries.reduce((sum, e) => sum + e.hours, 0);

    // Monthly hours (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const thisMonthEntries = allTimeEntries.filter(e => {
      const d = new Date(e.date);
      return d >= monthStart && d <= monthEnd;
    });
    const totalHoursMonth = thisMonthEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalCostMonth = thisMonthEntries.reduce((sum, e) => sum + e.cost, 0);

    // Last 4 weeks breakdown
    const last4Weeks = [];
    for (let i = 3; i >= 0; i--) {
      const wStart = new Date(weekStart);
      wStart.setDate(wStart.getDate() - (i * 7));
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);
      wEnd.setHours(23, 59, 59, 999);

      const weekEntries = allTimeEntries.filter(e => {
        const d = new Date(e.date);
        return d >= wStart && d <= wEnd;
      });

      last4Weeks.push({
        weekStart: wStart.toISOString(),
        weekEnd: wEnd.toISOString(),
        label: `${wStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        hours: weekEntries.reduce((sum, e) => sum + e.hours, 0),
        cost: weekEntries.reduce((sum, e) => sum + e.cost, 0),
      });
    }

    // Performance: on-time vs overdue completed tasks
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED');
    const onTimeCompleted = completedTasks.filter(t =>
      !t.dueDate || (t.completedAt && new Date(t.completedAt) <= new Date(t.dueDate))
    ).length;
    const overdueCompleted = completedTasks.filter(t =>
      t.dueDate && t.completedAt && new Date(t.completedAt) > new Date(t.dueDate)
    ).length;

    // Total estimated vs actual
    const totalEstimated = allTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = allTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    // Recent time entries (last 10)
    const recentTimeEntries = allTimeEntries.slice(0, 10);

    // Average hours per working day (assuming entries on distinct days)
    const uniqueDays = new Set(allTimeEntries.map(e => new Date(e.date).toDateString())).size;
    const avgHoursPerDay = uniqueDays > 0 ? Math.round((totalHours / uniqueDays) * 10) / 10 : 0;

    return NextResponse.json({
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        displayName: employee.displayName,
        email: employee.email,
        phone: employee.phone,
        avatar: employee.avatar,
        jobTitle: employee.jobTitle,
        hourlyRate: employee.hourlyRate,
        role: employee.role,
        status: employee.status,
        createdAt: employee.createdAt,
        lastLoginAt: employee.lastLoginAt,
        company: employee.company,
        department: employee.department,
        manager: employee.manager,
        subordinates: employee.subordinates,
        assignedSystems: employee.assignedSystems,
        assignedMobiles: employee.assignedMobiles,
      },
      taskStats,
      pendingTasks,
      recentCompleted,
      projects,
      timeStats: {
        totalHours: Math.round(totalHours * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalHoursWeek: Math.round(totalHoursWeek * 100) / 100,
        totalHoursMonth: Math.round(totalHoursMonth * 100) / 100,
        totalCostMonth: Math.round(totalCostMonth * 100) / 100,
        weeklyHours,
        last4Weeks,
        avgHoursPerDay,
        totalEstimated: Math.round(totalEstimated * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
      },
      performance: {
        completionRate: taskStats.completionRate,
        onTimeCompleted,
        overdueCompleted,
        totalCompleted: completedTasks.length,
        onTimeRate: completedTasks.length > 0
          ? Math.round((onTimeCompleted / completedTasks.length) * 100)
          : 0,
        hoursUtilization: totalEstimated > 0
          ? Math.round((totalActual / totalEstimated) * 100)
          : 0,
      },
      recentTimeEntries,
    });
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee stats' },
      { status: 500 }
    );
  }
}

function totalHoursThisWeek(entries: any[], weekStart: Date) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const result = days.map((day, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateStr = date.toDateString();

    const dayEntries = entries.filter(e => new Date(e.date).toDateString() === dateStr);
    const hours = dayEntries.reduce((sum: number, e: any) => sum + e.hours, 0);

    return {
      day,
      date: date.toISOString(),
      hours: Math.round(hours * 100) / 100,
    };
  });

  return result;
}
