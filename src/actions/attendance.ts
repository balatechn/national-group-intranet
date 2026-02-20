'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/workos-auth';
import { AttendanceStatus, BreakType, WorkLocationType } from '@prisma/client';

// ==========================================
// TYPES
// ==========================================

export interface AttendanceWithBreaks {
  id: string;
  userId: string;
  date: Date;
  checkInAt: Date;
  checkOutAt: Date | null;
  status: AttendanceStatus;
  locationType: WorkLocationType;
  checkInLocation: string | null;
  totalMinutes: number;
  breakMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
  notes: string | null;
  breaks: {
    id: string;
    breakType: BreakType;
    startTime: Date;
    endTime: Date | null;
    duration: number;
    notes: string | null;
  }[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export interface TodayAttendanceSummary {
  isCheckedIn: boolean;
  isOnBreak: boolean;
  attendance: AttendanceWithBreaks | null;
  currentBreak: {
    id: string;
    breakType: BreakType;
    startTime: Date;
  } | null;
  todayHours: number;
  todayMinutes: number;
  weekHours: number;
  activeTasksCount: number;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff);
}

function calculateMinutes(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

// ==========================================
// CHECK-IN / CHECK-OUT
// ==========================================

export async function checkIn(options?: {
  locationType?: WorkLocationType;
  location?: string;
  notes?: string;
}) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const today = getTodayDate();

  // Check if already checked in today
  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
  });

  if (existingAttendance && existingAttendance.status !== 'CHECKED_OUT') {
    return { success: false, error: 'Already checked in today' };
  }

  // Create new attendance record
  const attendance = await prisma.attendance.create({
    data: {
      userId: user.id,
      date: today,
      checkInAt: new Date(),
      status: 'CHECKED_IN',
      locationType: options?.locationType || 'OFFICE',
      checkInLocation: options?.location || null,
      checkInIp: null, // Could be captured from request headers
      notes: options?.notes || null,
    },
    include: {
      breaks: true,
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  });

  revalidatePath('/dashboard');
  return { success: true, attendance };
}

export async function checkOut(notes?: string) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const today = getTodayDate();

  // Get today's attendance
  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
    include: { breaks: true },
  });

  if (!attendance) {
    return { success: false, error: 'Not checked in today' };
  }

  if (attendance.status === 'CHECKED_OUT') {
    return { success: false, error: 'Already checked out' };
  }

  // End any active breaks
  const activeBreak = attendance.breaks.find((b) => !b.endTime);
  if (activeBreak) {
    await prisma.attendanceBreak.update({
      where: { id: activeBreak.id },
      data: {
        endTime: new Date(),
        duration: calculateMinutes(activeBreak.startTime, new Date()),
      },
    });
  }

  const now = new Date();
  const totalMinutes = calculateMinutes(attendance.checkInAt, now);
  
  // Calculate total break minutes
  const breaks = await prisma.attendanceBreak.findMany({
    where: { attendanceId: attendance.id },
  });
  const breakMinutes = breaks.reduce((sum, b) => sum + b.duration, 0);
  const workMinutes = totalMinutes - breakMinutes;

  // Calculate overtime (assuming 8 hour workday = 480 minutes)
  const standardMinutes = 480;
  const overtimeMinutes = Math.max(0, workMinutes - standardMinutes);

  // Update attendance
  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutAt: now,
      status: 'CHECKED_OUT',
      totalMinutes,
      breakMinutes,
      workMinutes,
      overtimeMinutes,
      notes: notes || attendance.notes,
    },
    include: {
      breaks: true,
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  });

  // Auto-distribute time to active tasks
  await distributeTimeToTasks(attendance.id, user.id, workMinutes);

  revalidatePath('/dashboard');
  return { success: true, attendance: updatedAttendance };
}

// ==========================================
// BREAK MANAGEMENT
// ==========================================

export async function startBreak(breakType: BreakType = 'SHORT_BREAK', notes?: string) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const today = getTodayDate();

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
    include: { breaks: true },
  });

  if (!attendance || attendance.status === 'CHECKED_OUT') {
    return { success: false, error: 'Not checked in' };
  }

  // Check for active break
  const activeBreak = attendance.breaks.find((b) => !b.endTime);
  if (activeBreak) {
    return { success: false, error: 'Already on a break' };
  }

  const newBreak = await prisma.attendanceBreak.create({
    data: {
      attendanceId: attendance.id,
      breakType,
      startTime: new Date(),
      notes,
    },
  });

  // Update attendance status
  await prisma.attendance.update({
    where: { id: attendance.id },
    data: { status: 'ON_BREAK' },
  });

  revalidatePath('/dashboard');
  return { success: true, break: newBreak };
}

export async function endBreak() {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const today = getTodayDate();

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
    include: { breaks: true },
  });

  if (!attendance) {
    return { success: false, error: 'Not checked in' };
  }

  const activeBreak = attendance.breaks.find((b) => !b.endTime);
  if (!activeBreak) {
    return { success: false, error: 'No active break' };
  }

  const now = new Date();
  const duration = calculateMinutes(activeBreak.startTime, now);

  await prisma.attendanceBreak.update({
    where: { id: activeBreak.id },
    data: {
      endTime: now,
      duration,
    },
  });

  // Update attendance status back to checked in
  await prisma.attendance.update({
    where: { id: attendance.id },
    data: { status: 'CHECKED_IN' },
  });

  revalidatePath('/dashboard');
  return { success: true, duration };
}

// ==========================================
// TIME DISTRIBUTION TO TASKS
// ==========================================

async function distributeTimeToTasks(attendanceId: string, userId: string, workMinutes: number) {
  // Get active tasks for the user (IN_PROGRESS status)
  const activeTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: 'IN_PROGRESS',
    },
    select: { id: true, title: true, estimatedHours: true },
  });

  if (activeTasks.length === 0) {
    return;
  }

  // Distribute time proportionally based on estimated hours
  // If no estimates, distribute equally
  const totalEstimatedHours = activeTasks.reduce(
    (sum, task) => sum + (task.estimatedHours || 1),
    0
  );

  for (const task of activeTasks) {
    const taskWeight = (task.estimatedHours || 1) / totalEstimatedHours;
    const taskMinutes = Math.round(workMinutes * taskWeight);

    await prisma.taskTimeLog.create({
      data: {
        attendanceId,
        taskId: task.id,
        userId,
        minutes: taskMinutes,
        isAutoAllocated: true,
        description: 'Auto-allocated from daily attendance',
      },
    });

    // Update task actual hours
    const totalTaskMinutes = await prisma.taskTimeLog.aggregate({
      where: { taskId: task.id },
      _sum: { minutes: true },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: {
        actualHours: (totalTaskMinutes._sum.minutes || 0) / 60,
      },
    });
  }
}

// ==========================================
// QUERIES
// ==========================================

export async function getTodayAttendance(): Promise<TodayAttendanceSummary> {
  const user = await getSessionUser();
  if (!user) {
    return {
      isCheckedIn: false,
      isOnBreak: false,
      attendance: null,
      currentBreak: null,
      todayHours: 0,
      todayMinutes: 0,
      weekHours: 0,
      activeTasksCount: 0,
    };
  }

  const today = getTodayDate();
  const weekStart = getWeekStart();

  const [attendance, weekAttendances, activeTasks] = await Promise.all([
    prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      include: {
        breaks: {
          orderBy: { startTime: 'desc' },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    }),
    prisma.attendance.findMany({
      where: {
        userId: user.id,
        date: { gte: weekStart },
      },
      select: { workMinutes: true },
    }),
    prisma.task.count({
      where: {
        assigneeId: user.id,
        status: 'IN_PROGRESS',
      },
    }),
  ]);

  const isCheckedIn = attendance?.status === 'CHECKED_IN' || attendance?.status === 'ON_BREAK';
  const isOnBreak = attendance?.status === 'ON_BREAK';
  const currentBreak = attendance?.breaks.find((b) => !b.endTime) || null;

  // Calculate today's current time
  let todayMinutes = 0;
  if (attendance && !attendance.checkOutAt) {
    const now = new Date();
    const elapsed = calculateMinutes(attendance.checkInAt, now);
    const activeBreakMinutes = currentBreak
      ? calculateMinutes(currentBreak.startTime, now)
      : 0;
    const completedBreakMinutes = attendance.breaks
      .filter((b) => b.endTime)
      .reduce((sum, b) => sum + b.duration, 0);
    todayMinutes = elapsed - completedBreakMinutes - activeBreakMinutes;
  } else if (attendance) {
    todayMinutes = attendance.workMinutes;
  }

  const weekMinutes = weekAttendances.reduce((sum, a) => sum + a.workMinutes, 0);

  return {
    isCheckedIn,
    isOnBreak,
    attendance: attendance as AttendanceWithBreaks | null,
    currentBreak: currentBreak
      ? {
          id: currentBreak.id,
          breakType: currentBreak.breakType,
          startTime: currentBreak.startTime,
        }
      : null,
    todayHours: Math.floor(todayMinutes / 60),
    todayMinutes: todayMinutes % 60,
    weekHours: Math.round((weekMinutes / 60) * 10) / 10,
    activeTasksCount: activeTasks,
  };
}

export async function getWeeklyAttendance(userId?: string) {
  const user = await getSessionUser();
  if (!user) {
    return [];
  }

  const targetUserId = userId || user.id;
  const weekStart = getWeekStart();

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: targetUserId,
      date: { gte: weekStart },
    },
    include: {
      breaks: true,
    },
    orderBy: { date: 'asc' },
  });

  return attendances;
}

export async function getTeamAttendanceToday(departmentId?: string) {
  const user = await getSessionUser();
  if (!user) {
    return [];
  }

  // Check if user is manager or admin
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'MANAGER'];
  if (!allowedRoles.includes(user.role)) {
    return [];
  }

  const today = getTodayDate();

  const whereClause: any = {
    date: today,
  };

  if (departmentId) {
    whereClause.user = { departmentId };
  }

  const attendances = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          jobTitle: true,
          department: { select: { name: true } },
        },
      },
      breaks: true,
    },
    orderBy: { checkInAt: 'asc' },
  });

  return attendances;
}

// ==========================================
// TASK TIME LOG MANAGEMENT
// ==========================================

export async function logTaskTime(
  taskId: string,
  minutes: number,
  description?: string
) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const today = getTodayDate();

  // Get or create today's attendance
  let attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
  });

  if (!attendance) {
    // Auto check-in if logging time without attendance
    attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        date: today,
        checkInAt: new Date(),
        status: 'CHECKED_IN',
        locationType: 'REMOTE',
      },
    });
  }

  const timeLog = await prisma.taskTimeLog.create({
    data: {
      attendanceId: attendance.id,
      taskId,
      userId: user.id,
      minutes,
      isAutoAllocated: false,
      description,
    },
  });

  // Update task actual hours
  const totalTaskMinutes = await prisma.taskTimeLog.aggregate({
    where: { taskId },
    _sum: { minutes: true },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: {
      actualHours: (totalTaskMinutes._sum.minutes || 0) / 60,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/tasks');
  return { success: true, timeLog };
}

export async function getTaskTimeLogs(taskId: string) {
  const logs = await prisma.taskTimeLog.findMany({
    where: { taskId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return logs;
}
