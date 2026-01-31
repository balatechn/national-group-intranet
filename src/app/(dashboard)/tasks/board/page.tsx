'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  GripVertical,
  Calendar,
  User,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pause,
  XCircle,
  Paperclip,
  MessageSquare,
  ListTodo,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { getTasks, updateTaskStatus, bulkUpdateTaskStatus } from '@/actions/tasks';
import { formatDate, getInitials, getPriorityColor } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  assignee: { id: string; firstName: string; lastName: string; avatar: string | null } | null;
  project: { id: string; name: string } | null;
  _count: { subtasks: number; comments: number; attachments: number };
}

const columns = [
  { id: 'TODO', title: 'To Do', icon: ListTodo, color: 'bg-gray-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', icon: Clock, color: 'bg-blue-500' },
  { id: 'ON_HOLD', title: 'On Hold', icon: Pause, color: 'bg-yellow-500' },
  { id: 'COMPLETED', title: 'Completed', icon: CheckCircle2, color: 'bg-green-500' },
  { id: 'CANCELLED', title: 'Cancelled', icon: XCircle, color: 'bg-red-500' },
];

function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (status: string) => void }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  return (
    <Card className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
            <Link href={`/tasks/${task.id}`} className="font-medium text-sm hover:text-primary line-clamp-2">
              {task.title}
            </Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() => onStatusChange(col.id)}
                  className={task.status === col.id ? 'bg-primary-50' : ''}
                >
                  <col.icon className="mr-2 h-4 w-4" />
                  Move to {col.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="mt-2 text-xs text-text-muted line-clamp-2">{task.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className={getPriorityColor(task.priority)} variant="outline">
            {task.priority}
          </Badge>

          {task.project && (
            <Badge variant="secondary" className="text-xs">
              {task.project.name}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-danger' : 'text-text-muted'}`}>
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task._count.attachments > 0 && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Paperclip className="h-3 w-3" />
                {task._count.attachments}
              </div>
            )}
            {task._count.comments > 0 && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <MessageSquare className="h-3 w-3" />
                {task._count.comments}
              </div>
            )}
            {task._count.subtasks > 0 && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <ListTodo className="h-3 w-3" />
                {task._count.subtasks}
              </div>
            )}
          </div>
        </div>

        {task.assignee && (
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar || ''} />
              <AvatarFallback className="text-xs">
                {getInitials(`${task.assignee.firstName} ${task.assignee.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-text-muted">
              {task.assignee.firstName} {task.assignee.lastName}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanColumn({
  column,
  tasks,
  onStatusChange,
  onDragOver,
  onDrop,
}: {
  column: typeof columns[0];
  tasks: Task[];
  onStatusChange: (taskId: string, status: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
}) {
  return (
    <div
      className="flex flex-col min-w-[280px] max-w-[320px] flex-1"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${column.color}`} />
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg bg-gray-50 p-2 min-h-[500px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('taskId', task.id);
              e.dataTransfer.setData('currentStatus', task.status);
            }}
          >
            <TaskCard task={task} onStatusChange={(status) => onStatusChange(task.id, status)} />
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="flex h-32 items-center justify-center text-sm text-text-muted">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const { tasks } = await getTasks({ limit: 100 });
      setTasks(tasks as any);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
      loadTasks(); // Revert on error
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const currentStatus = e.dataTransfer.getData('currentStatus');

    if (currentStatus !== newStatus) {
      await handleStatusChange(taskId, newStatus);
    }
  }

  const tasksByStatus = columns.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {} as Record<string, Task[]>);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-text-muted">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Board</h1>
          <p className="page-description">Drag and drop tasks to update status</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/tasks">List View</Link>
          </Button>
          <Button asChild>
            <Link href="/tasks/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id] || []}
              onStatusChange={handleStatusChange}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
