'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Pause,
  XCircle,
  Bell,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { updateTaskStatus, deleteTask, setTaskReminder } from '@/actions/tasks';

interface Task {
  id: string;
  title: string;
  status: string;
}

interface TaskActionsProps {
  task: Task;
}

const statuses = [
  { value: 'TODO', label: 'To Do', icon: Clock },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: Clock },
  { value: 'ON_HOLD', label: 'On Hold', icon: Pause },
  { value: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
  { value: 'CANCELLED', label: 'Cancelled', icon: XCircle },
];

export function TaskActions({ task }: TaskActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleStatusChange(status: string) {
    try {
      await updateTaskStatus(task.id, status);
      router.refresh();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;

    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      router.push('/tasks');
    } catch (error) {
      console.error('Failed to delete task:', error);
      setIsDeleting(false);
    }
  }

  async function handleSetReminder() {
    const reminderDate = prompt('Set reminder date (YYYY-MM-DD):');
    if (!reminderDate) return;

    try {
      await setTaskReminder(task.id, new Date(reminderDate));
      router.refresh();
    } catch (error) {
      console.error('Failed to set reminder:', error);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/tasks/${task.id}`);
  }

  return (
    <div className="flex items-center gap-2">
      {/* Quick Status Change */}
      {task.status !== 'COMPLETED' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange('COMPLETED')}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark Complete
        </Button>
      )}

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/tasks/${task.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Task
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSetReminder}>
            <Bell className="mr-2 h-4 w-4" />
            Set Reminder
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          {/* Status Options */}
          {statuses.map((status) => (
            <DropdownMenuItem
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              className={task.status === status.value ? 'bg-primary-50' : ''}
            >
              <status.icon className="mr-2 h-4 w-4" />
              {status.label}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-danger focus:text-danger"
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
