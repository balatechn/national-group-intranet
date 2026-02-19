import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/workos-auth';

export const dynamic = 'force-dynamic';

// GET - Fetch time entries for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await prisma.taskTimeEntry.findMany({
      where: { taskId: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);

    return NextResponse.json({ entries, totalHours, totalCost });
  } catch (error) {
    console.error('Failed to fetch time entries:', error);
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
  }
}

// POST - Create a new time entry
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { hours, description, date, userId } = body;

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'Hours must be greater than 0' }, { status: 400 });
    }

    if (hours > 24) {
      return NextResponse.json({ error: 'Hours cannot exceed 24 per entry' }, { status: 400 });
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: { id: true, projectId: true },
    });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Determine the user logging time (admins can log for others)
    const logUserId = userId || sessionUser.id;

    // Get user's hourly rate
    const logUser = await prisma.user.findUnique({
      where: { id: logUserId },
      select: { id: true, hourlyRate: true, firstName: true, lastName: true },
    });

    if (!logUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hourlyRate = logUser.hourlyRate || 0;
    const cost = hours * hourlyRate;

    const entry = await prisma.taskTimeEntry.create({
      data: {
        hours,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        hourlyRate,
        cost,
        taskId: params.id,
        userId: logUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            hourlyRate: true,
          },
        },
      },
    });

    // Update task's actualHours
    const totalHours = await prisma.taskTimeEntry.aggregate({
      where: { taskId: params.id },
      _sum: { hours: true },
    });

    await prisma.task.update({
      where: { id: params.id },
      data: { actualHours: totalHours._sum.hours || 0 },
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error('Failed to create time entry:', error);
    return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 });
  }
}

// DELETE - Delete a time entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Verify entry exists and belongs to this task
    const entry = await prisma.taskTimeEntry.findFirst({
      where: { id: entryId, taskId: params.id },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    // Only the user who logged it or admins can delete
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];
    if (entry.userId !== sessionUser.id && !adminRoles.includes(sessionUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.taskTimeEntry.delete({ where: { id: entryId } });

    // Update task's actualHours
    const totalHours = await prisma.taskTimeEntry.aggregate({
      where: { taskId: params.id },
      _sum: { hours: true },
    });

    await prisma.task.update({
      where: { id: params.id },
      data: { actualHours: totalHours._sum.hours || 0 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete time entry:', error);
    return NextResponse.json({ error: 'Failed to delete time entry' }, { status: 500 });
  }
}
