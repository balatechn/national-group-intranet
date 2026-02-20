'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/workos-auth';
import { AttendanceStatus, BreakType, WorkLocationType } from '@prisma/client';

// ==========================================
// TYPES
// ==========================================

export interface AttendanceSession {
  id: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  locationType: WorkLocationType;
  location: string | null;
  durationMinutes: number;
}

export interface AttendanceWithSessions {
  id: string;
  userId: string;
  date: Date;
  firstCheckIn: Date;
  lastCheckOut: Date | null;
  isCurrentlyIn: boolean;
  status: AttendanceStatus;
  locationType: WorkLocationType;
  checkInLocation: string | null;
  totalMinutes: number;
  breakMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
  notes: string | null;
  sessions: AttendanceSession[];
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
  attendance: AttendanceWithSessions | null;
  currentSession: AttendanceSession | null;
  currentBreak: {
    id: string;
    breakType: BreakType;
    startTime: Date;
  } | null;
  todayHours: number;
  todayMinutes: number;
  weekHours: number;
  activeTasksCount: number;
  sessionCount: number;
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
// CHECK-IN / CHECK-OUT (Multi-Session)
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
  const now = new Date();

  // Check for existing attendance record today
  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
    include: {
      sessions: { orderBy: { checkInAt: 'desc' } },
      breaks: true,
    },
  });

  // If already checked in (has active session), return error
  if (existingAttendance?.isCurrentlyIn) {
    return { success: false, error: 'Already checked in' };
  }

  const locationType = options?.locationType || 'OFFICE';

  if (existingAttendance) {
    // Create new session for existing attendance record
    const newSession = await prisma.attendanceSession.create({
      data: {
        attendanceId: existingAttendance.id,
        checkInAt: now,
        locationType,
        location: options?.location || null,
        notes: options?.notes || null,
      },
    });

    // Update attendance record
    const attendance = await prisma.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        isCurrentlyIn: true,
        status: 'CHECKED_IN',
        // Keep firstCheckIn as is, don't update location for subsequent check-ins
      },
      include: {
        sessions: { orderBy: { checkInAt: 'desc' } },
        breaks: { orderBy: { startTime: 'desc' } },
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    revalidatePath('/dashboard');
    return { success: true, attendance, session: newSession };
  }

  // Create new attendance record with first session
  const attendance = await prisma.attendance.create({
    data: {
      userId: user.id,
      date: today,
      firstCheckIn: now,
      isCurrentlyIn: true,
      status: 'CHECKED_IN',
      locationType,
      checkInLocation: options?.location || null,
      notes: options?.notes || null,
      sessions: {
        create: {
          checkInAt: now,
          locationType,
          location: options?.location || null,
          notes: options?.notes || null,
        },
      },
    },
    include: {
      sessions: { orderBy: { checkInAt: 'desc' } },
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
  const now = new Date();

  // Get today's attendance with sessions
  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
    include: {
      sessions: { orderBy: { checkInAt: 'desc' } },
      breaks: true,
    },
  });

  if (!attendance) {
    return { success: false, error: 'Not checked in today' };
  }

  if (!attendance.isCurrentlyIn) {
    return { success: false, error: 'Already checked out' };
  }

  // Find the active session (no checkOutAt)
  const activeSession = attendance.sessions.find((s) => !s.checkOutAt);
  if (!activeSession) {
    return { success: false, error: 'No active session found' };
  }

  // Calculate session duration
  const sessionDuration = calculateMinutes(activeSession.checkInAt, now);

  // End any active breaks
  const activeBreak = attendance.breaks.find((b) => !b.endTime);
  if (activeBreak) {
    await prisma.attendanceBreak.update({
      where: { id: activeBreak.id },
      data: {
        endTime: now,
        duration: calculateMinutes(activeBreak.startTime, now),
      },
    });
  }

  // Update the active session
  await prisma.attendanceSession.update({
    where: { id: activeSession.id },
    data: {
      checkOutAt: now,
      durationMinutes: sessionDuration,
    },
  });

  // Get all sessions to calculate total time
  const allSessions = await prisma.attendanceSession.findMany({
    where: { attendanceId: attendance.id },
  });

  // Calculate total work time from all sessions
  const totalSessionMinutes = allSessions.reduce((sum, s) => {
    if (s.checkOutAt) {
      return sum + s.durationMinutes;
    } else {
      // This is the current session being closed
      return sum + sessionDuration;
    }
  }, 0);

  // Get all breaks
  const breaks = await prisma.attendanceBreak.findMany({
    where: { attendanceId: attendance.id },
  });
  const breakMinutes = breaks.reduce((sum, b) => sum + b.duration, 0);
  const workMinutes = totalSessionMinutes - breakMinutes;

  // Calculate overtime (assuming 8 hour workday = 480 minutes)
  const standardMinutes = 480;
  const overtimeMinutes = Math.max(0, workMinutes - standardMinutes);

  // Update attendance record
  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      lastCheckOut: now,
      isCurrentlyIn: false,
      status: 'CHECKED_OUT',
      totalMinutes: totalSessionMinutes,
      breakMinutes,
      workMinutes,
      overtimeMinutes,
      notes: notes || attendance.notes,
    },
    include: {
      sessions: { orderBy: { checkInAt: 'desc' } },
      breaks: { orderBy: { startTime: 'desc' } },
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

  if (!attendance || !attendance.isCurrentlyIn) {
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

  if (!attendance || !attendance.isCurrentlyIn) {
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
      currentSession: null,
      currentBreak: null,
      todayHours: 0,
      todayMinutes: 0,
      weekHours: 0,
      activeTasksCount: 0,
      sessionCount: 0,
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
        sessions: {
          orderBy: { checkInAt: 'desc' },
        },
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

  const isCheckedIn = attendance?.isCurrentlyIn === true;
  const isOnBreak = attendance?.status === 'ON_BREAK';
  const currentBreak = attendance?.breaks.find((b) => !b.endTime) || null;
  const currentSession = attendance?.sessions.find((s) => !s.checkOutAt) || null;

  // Calculate today's total accumulated time
  let todayMinutes = 0;
  
  if (attendance) {
    // Add up all completed sessions
    const completedSessionMinutes = (attendance.sessions || [])
      .filter((s) => s.checkOutAt)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    
    todayMinutes = completedSessionMinutes;

    // If currently in a session, add the active session time
    if (currentSession && isCheckedIn) {
      const now = new Date();
      const activeSessionMinutes = calculateMinutes(currentSession.checkInAt, now);
      
      // Subtract active break time if on break
      const activeBreakMinutes = currentBreak
        ? calculateMinutes(currentBreak.startTime, now)
        : 0;
      
      todayMinutes += activeSessionMinutes - activeBreakMinutes;
    }

    // Subtract completed break minutes
    const completedBreakMinutes = (attendance.breaks || [])
      .filter((b) => b.endTime)
      .reduce((sum, b) => sum + b.duration, 0);
    
    todayMinutes -= completedBreakMinutes;
  }

  const weekMinutes = weekAttendances.reduce((sum, a) => sum + a.workMinutes, 0);

  return {
    isCheckedIn,
    isOnBreak,
    attendance: attendance as unknown as AttendanceWithSessions | null,
    currentSession: currentSession as AttendanceSession | null,
    currentBreak: currentBreak
      ? {
          id: currentBreak.id,
          breakType: currentBreak.breakType,
          startTime: currentBreak.startTime,
        }
      : null,
    todayHours: Math.floor(Math.max(0, todayMinutes) / 60),
    todayMinutes: Math.max(0, todayMinutes) % 60,
    weekHours: Math.round((weekMinutes / 60) * 10) / 10,
    activeTasksCount: activeTasks,
    sessionCount: attendance?.sessions?.length || 0,
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
      sessions: true,
      breaks: true,
    },
    orderBy: { firstCheckIn: 'asc' },
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
    const now = new Date();
    attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        date: today,
        firstCheckIn: now,
        isCurrentlyIn: false, // Not an active session, just logging time
        status: 'CHECKED_OUT',
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

// ==========================================
// MONTHLY ATTENDANCE
// ==========================================

export interface MonthlyAttendanceSummary {
  month: number;
  year: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalWorkHours: number;
  averageWorkHours: number;
  totalBreakHours: number;
  totalOvertimeHours: number;
  attendances: {
    id: string;
    date: Date;
    firstCheckIn: Date;
    lastCheckOut: Date | null;
    status: AttendanceStatus;
    locationType: WorkLocationType;
    workMinutes: number;
    breakMinutes: number;
    overtimeMinutes: number;
    sessionCount: number;
    isLate: boolean;
  }[];
}

export async function getMonthlyAttendance(
  month?: number,
  year?: number,
  userId?: string
): Promise<MonthlyAttendanceSummary | null> {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  const targetUserId = userId || user.id;
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  // Get first and last day of the month
  const firstDay = new Date(targetYear, targetMonth, 1);
  const lastDay = new Date(targetYear, targetMonth + 1, 0);

  // Get all attendances for the month with sessions
  const attendances = await prisma.attendance.findMany({
    where: {
      userId: targetUserId,
      date: {
        gte: firstDay,
        lte: lastDay,
      },
    },
    include: {
      sessions: true,
    },
    orderBy: { date: 'asc' },
  });

  // Calculate working days (excluding weekends)
  let workingDays = 0;
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  // Standard working hours start time (9:00 AM)
  const STANDARD_START_HOUR = 9;
  const STANDARD_START_MINUTE = 0;

  const processedAttendances = attendances.map((att) => {
    const checkInTime = new Date(att.firstCheckIn);
    const isLate =
      checkInTime.getHours() > STANDARD_START_HOUR ||
      (checkInTime.getHours() === STANDARD_START_HOUR &&
        checkInTime.getMinutes() > STANDARD_START_MINUTE + 15); // 15 min grace period

    return {
      id: att.id,
      date: att.date,
      firstCheckIn: att.firstCheckIn,
      lastCheckOut: att.lastCheckOut,
      status: att.status,
      locationType: att.locationType,
      workMinutes: att.workMinutes,
      breakMinutes: att.breakMinutes,
      overtimeMinutes: att.overtimeMinutes,
      sessionCount: att.sessions?.length || 1,
      isLate,
    };
  });

  const presentDays = attendances.filter(
    (a) => a.status === 'CHECKED_OUT' || a.status === 'CHECKED_IN'
  ).length;

  const lateDays = processedAttendances.filter((a) => a.isLate).length;

  const totalWorkMinutes = attendances.reduce((sum, a) => sum + a.workMinutes, 0);
  const totalBreakMinutes = attendances.reduce((sum, a) => sum + a.breakMinutes, 0);
  const totalOvertimeMinutes = attendances.reduce(
    (sum, a) => sum + a.overtimeMinutes,
    0
  );

  // Count days up to today for absent calculation
  const today = new Date();
  const countUntil = today < lastDay ? today : lastDay;
  let workingDaysUntilToday = 0;
  for (
    let d = new Date(firstDay);
    d <= countUntil;
    d.setDate(d.getDate() + 1)
  ) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDaysUntilToday++;
    }
  }

  const absentDays = Math.max(0, workingDaysUntilToday - presentDays);

  return {
    month: targetMonth,
    year: targetYear,
    totalDays: workingDays,
    presentDays,
    absentDays,
    lateDays,
    totalWorkHours: Math.round((totalWorkMinutes / 60) * 10) / 10,
    averageWorkHours:
      presentDays > 0
        ? Math.round((totalWorkMinutes / 60 / presentDays) * 10) / 10
        : 0,
    totalBreakHours: Math.round((totalBreakMinutes / 60) * 10) / 10,
    totalOvertimeHours: Math.round((totalOvertimeMinutes / 60) * 10) / 10,
    attendances: processedAttendances,
  };
}

export async function getAttendanceHistory(
  startDate: Date,
  endDate: Date,
  userId?: string
) {
  const user = await getSessionUser();
  if (!user) {
    return [];
  }

  const targetUserId = userId || user.id;

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: targetUserId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      breaks: true,
    },
    orderBy: { date: 'desc' },
  });

  return attendances;
}
