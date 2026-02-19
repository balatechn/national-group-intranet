import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/workos-auth';

export const dynamic = 'force-dynamic';

// GET - Get hours and cost summary for a project
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, budget: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all task IDs in this project
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        estimatedHours: true,
        actualHours: true,
        status: true,
      },
    });

    const taskIds = tasks.map((t) => t.id);

    // Get all time entries for these tasks
    const timeEntries = await prisma.taskTimeEntry.findMany({
      where: { taskId: { in: taskIds } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            hourlyRate: true,
          },
        },
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals
    const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalCost = timeEntries.reduce((sum, e) => sum + e.cost, 0);
    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    // Group by user (manpower breakdown)
    const byUser: Record<string, { 
      userId: string; 
      name: string; 
      hours: number; 
      cost: number; 
      hourlyRate: number;
    }> = {};

    timeEntries.forEach((entry) => {
      if (!byUser[entry.userId]) {
        byUser[entry.userId] = {
          userId: entry.userId,
          name: `${entry.user.firstName} ${entry.user.lastName}`,
          hours: 0,
          cost: 0,
          hourlyRate: entry.user.hourlyRate || 0,
        };
      }
      byUser[entry.userId].hours += entry.hours;
      byUser[entry.userId].cost += entry.cost;
    });

    // Group by task
    const byTask: Record<string, {
      taskId: string;
      title: string;
      estimatedHours: number;
      actualHours: number;
      cost: number;
    }> = {};

    tasks.forEach((task) => {
      byTask[task.id] = {
        taskId: task.id,
        title: task.title,
        estimatedHours: task.estimatedHours || 0,
        actualHours: 0,
        cost: 0,
      };
    });

    timeEntries.forEach((entry) => {
      if (byTask[entry.taskId]) {
        byTask[entry.taskId].actualHours += entry.hours;
        byTask[entry.taskId].cost += entry.cost;
      }
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        budget: project.budget,
      },
      summary: {
        totalHours,
        totalCost,
        totalEstimatedHours,
        budgetRemaining: project.budget ? project.budget - totalCost : null,
        budgetUtilization: project.budget ? Math.round((totalCost / project.budget) * 100) : null,
        hoursVariance: totalEstimatedHours ? totalHours - totalEstimatedHours : null,
      },
      byUser: Object.values(byUser).sort((a, b) => b.hours - a.hours),
      byTask: Object.values(byTask).sort((a, b) => b.actualHours - a.actualHours),
      recentEntries: timeEntries.slice(0, 20),
    });
  } catch (error) {
    console.error('Failed to fetch project hours:', error);
    return NextResponse.json({ error: 'Failed to fetch project hours' }, { status: 500 });
  }
}
