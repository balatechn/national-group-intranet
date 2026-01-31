'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from '@/components/ui';
import { getInitials, getStatusColor } from '@/lib/utils';

interface Subtask {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
  _count: {
    subtasks: number;
  };
}

interface TaskSubtasksProps {
  subtasks: Subtask[];
  taskId: string;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'IN_PROGRESS':
      return <Clock className="h-4 w-4 text-primary" />;
    default:
      return <Circle className="h-4 w-4 text-text-muted" />;
  }
}

export function TaskSubtasks({ subtasks, taskId }: TaskSubtasksProps) {
  if (subtasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {subtasks.map((subtask) => (
        <Link
          key={subtask.id}
          href={`/tasks/${subtask.id}`}
          className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {getStatusIcon(subtask.status)}
            <span className={`text-sm ${subtask.status === 'COMPLETED' ? 'line-through text-text-muted' : ''}`}>
              {subtask.title}
            </span>
            {subtask._count.subtasks > 0 && (
              <Badge variant="secondary" className="text-xs">
                {subtask._count.subtasks} subtasks
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(subtask.status)} variant="outline">
              {subtask.status.replace('_', ' ')}
            </Badge>
            {subtask.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={subtask.assignee.avatar || ''} />
                <AvatarFallback className="text-xs">
                  {getInitials(`${subtask.assignee.firstName} ${subtask.assignee.lastName}`)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
