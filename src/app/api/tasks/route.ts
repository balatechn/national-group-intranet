import { NextRequest, NextResponse } from 'next/server';
import { getTasks } from '@/actions/tasks';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const assigneeId = searchParams.get('assigneeId') || undefined;
    const creatorId = searchParams.get('creatorId') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

    const result = await getTasks({
      status,
      priority,
      assigneeId,
      creatorId,
      departmentId,
      projectId,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
