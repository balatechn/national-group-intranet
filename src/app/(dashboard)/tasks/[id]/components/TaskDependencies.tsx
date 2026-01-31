'use client';

import Link from 'next/link';
import { Link2, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui';
import { getStatusColor } from '@/lib/utils';

interface Dependency {
  blockingTask: {
    id: string;
    title: string;
    status: string;
  };
}

interface BlockedTask {
  dependentTask: {
    id: string;
    title: string;
    status: string;
  };
}

interface TaskDependenciesProps {
  taskId: string;
  dependsOn: Dependency[];
  blockedTasks: BlockedTask[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'IN_PROGRESS':
      return <Clock className="h-4 w-4 text-primary" />;
    default:
      return <AlertCircle className="h-4 w-4 text-warning" />;
  }
}

export function TaskDependencies({ taskId, dependsOn, blockedTasks }: TaskDependenciesProps) {
  const hasBlockers = dependsOn.some((d) => d.blockingTask.status !== 'COMPLETED');

  return (
    <Card className={hasBlockers ? 'border-warning/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Dependencies
          {hasBlockers && (
            <Badge variant="outline" className="text-warning border-warning">
              Blocked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Depends On */}
        {dependsOn.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-text-muted mb-2">Blocked By</h4>
            <div className="space-y-2">
              {dependsOn.map((dep) => (
                <Link
                  key={dep.blockingTask.id}
                  href={`/tasks/${dep.blockingTask.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(dep.blockingTask.status)}
                    <span className="text-sm">{dep.blockingTask.title}</span>
                  </div>
                  <Badge className={getStatusColor(dep.blockingTask.status)} variant="outline">
                    {dep.blockingTask.status.replace('_', ' ')}
                  </Badge>
                </Link>
              ))}
            </div>
            {hasBlockers && (
              <p className="mt-2 text-xs text-warning flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Complete blocking tasks to unblock this task
              </p>
            )}
          </div>
        )}

        {/* Blocks */}
        {blockedTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-text-muted mb-2">Blocking</h4>
            <div className="space-y-2">
              {blockedTasks.map((dep) => (
                <Link
                  key={dep.dependentTask.id}
                  href={`/tasks/${dep.dependentTask.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-text-muted" />
                    <span className="text-sm">{dep.dependentTask.title}</span>
                  </div>
                  <Badge className={getStatusColor(dep.dependentTask.status)} variant="outline">
                    {dep.dependentTask.status.replace('_', ' ')}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
