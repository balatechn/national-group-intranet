import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Timer,
  Paperclip,
  Link2,
  Bell,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui';
import { getTaskById } from '@/actions/tasks';
import { formatDate, getInitials, getStatusColor, getPriorityColor } from '@/lib/utils';
import { TaskComments } from './components/TaskComments';
import { TaskTimeTracking } from './components/TaskTimeTracking';
import { TaskAttachments } from './components/TaskAttachments';
import { TaskDependencies } from './components/TaskDependencies';
import { TaskSubtasks } from './components/TaskSubtasks';
import { TaskActions } from './components/TaskActions';

export const revalidate = 30;

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const task = await getTaskById(params.id);

  if (!task) {
    notFound();
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter((s) => s.status === 'COMPLETED').length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const totalTimeLogged = task.timeEntries.reduce((acc, entry) => acc + entry.hours, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tasks">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="page-title">{task.title}</h1>
              <Badge className={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
            </div>
            <p className="page-description">
              Created {formatDate(task.createdAt)} by {task.creator.firstName} {task.creator.lastName}
            </p>
          </div>
        </div>
        <TaskActions task={task} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{task.description}</p>
                </div>
              ) : (
                <p className="text-text-muted italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Subtasks Progress */}
          {totalSubtasks > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Subtasks</span>
                  <span className="text-sm font-normal text-text-muted">
                    {completedSubtasks}/{totalSubtasks} completed
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success transition-all duration-300"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-muted text-right">{Math.round(subtaskProgress)}%</p>
                </div>
                <TaskSubtasks subtasks={task.subtasks} taskId={task.id} />
              </CardContent>
            </Card>
          )}

          {/* Dependencies */}
          {(task.dependsOn.length > 0 || task.blockedTasks.length > 0) && (
            <TaskDependencies 
              taskId={task.id}
              dependsOn={task.dependsOn}
              blockedTasks={task.blockedTasks}
            />
          )}

          {/* Time Tracking */}
          <TaskTimeTracking 
            taskId={task.id}
            timeEntries={task.timeEntries}
            estimatedHours={task.estimatedHours}
            actualHours={task.actualHours}
          />

          {/* Attachments */}
          <TaskAttachments taskId={task.id} attachments={task.attachments} />

          {/* Comments */}
          <TaskComments taskId={task.id} comments={task.comments} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignee */}
              <div>
                <p className="text-xs font-medium text-text-muted mb-1">Assignee</p>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.assignee.avatar || ''} />
                      <AvatarFallback>
                        {getInitials(`${task.assignee.firstName} ${task.assignee.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {task.assignee.firstName} {task.assignee.lastName}
                      </p>
                      <p className="text-xs text-text-muted">{task.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">Unassigned</p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <p className="text-xs font-medium text-text-muted mb-1">Due Date</p>
                {task.dueDate ? (
                  <div className={`flex items-center gap-2 ${isOverdue ? 'text-danger' : ''}`}>
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{formatDate(task.dueDate)}</span>
                    {isOverdue && <AlertCircle className="h-4 w-4" />}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No due date</p>
                )}
              </div>

              {/* Reminder */}
              {task.reminderDate && (
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Reminder</p>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-warning" />
                    <span className="text-sm">{formatDate(task.reminderDate)}</span>
                    {task.reminderSent && (
                      <Badge variant="secondary" className="text-xs">Sent</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Time Estimate */}
              <div>
                <p className="text-xs font-medium text-text-muted mb-1">Time</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-text-muted" />
                    <span className="text-sm">
                      Est: {task.estimatedHours || 0}h
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      Logged: {totalTimeLogged.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Project */}
              {task.project && (
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Project</p>
                  <Link href={`/projects/${task.project.id}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm">{task.project.name}</span>
                  </Link>
                </div>
              )}

              {/* Department */}
              {task.department && (
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Department</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-text-muted" />
                    <span className="text-sm">{task.department.name}</span>
                  </div>
                </div>
              )}

              {/* Parent Task */}
              {task.parent && (
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Parent Task</p>
                  <Link href={`/tasks/${task.parent.id}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Link2 className="h-4 w-4" />
                    <span className="text-sm">{task.parent.title}</span>
                  </Link>
                </div>
              )}

              {/* Template */}
              {task.template && (
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Template</p>
                  <Badge variant="secondary">{task.template.name}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Comments</span>
                <span className="font-medium">{task.comments.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Attachments</span>
                <span className="font-medium">{task.attachments.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Time Entries</span>
                <span className="font-medium">{task.timeEntries.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Subtasks</span>
                <span className="font-medium">{totalSubtasks}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recurring Info */}
          {task.isRecurring && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Recurring Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Frequency</span>
                  <span>{task.recurrenceType}</span>
                </div>
                {task.nextOccurrence && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Next</span>
                    <span>{formatDate(task.nextOccurrence)}</span>
                  </div>
                )}
                {task.recurrenceEnd && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Ends</span>
                    <span>{formatDate(task.recurrenceEnd)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
