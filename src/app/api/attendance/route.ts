import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/workos-auth';
import {
  getTodayAttendance,
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  getWeeklyAttendance,
  getTeamAttendanceToday,
} from '@/actions/attendance';
import { WorkLocationType, BreakType } from '@prisma/client';

// GET - Get today's attendance or weekly summary
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'today';
    const userId = searchParams.get('userId');
    const departmentId = searchParams.get('departmentId');

    if (type === 'weekly') {
      const weeklyData = await getWeeklyAttendance(userId || undefined);
      return NextResponse.json({ attendance: weeklyData });
    }

    if (type === 'team') {
      const teamData = await getTeamAttendanceToday(departmentId || undefined);
      return NextResponse.json({ attendance: teamData });
    }

    const todayData = await getTodayAttendance();
    return NextResponse.json(todayData);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST - Check in, check out, start break, end break
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, locationType, location, notes, breakType } = body;

    switch (action) {
      case 'checkin': {
        const result = await checkIn({
          locationType: locationType as WorkLocationType,
          location,
          notes,
        });
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'checkout': {
        const result = await checkOut(notes);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'start_break': {
        const result = await startBreak(breakType as BreakType, notes);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'end_break': {
        const result = await endBreak();
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Attendance action error:', error);
    return NextResponse.json(
      { error: 'Failed to process attendance action' },
      { status: 500 }
    );
  }
}
