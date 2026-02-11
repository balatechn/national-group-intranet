'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/session-context';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckSquare,
  Calendar,
  User,
  Clock,
  Tag,
  Edit2,
  Trash2,
  Send,
  MessageSquare,
  Briefcase,
  Users,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Pause,
  XCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { getInitials } from '@/lib/utils';
import { updateTaskStatus, addTaskComment, deleteTask } from '@/actions/tasks';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  } | null;
  project: {
    id: string;
    name: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string | Date;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  TODO: { label: 'To Do', color: 'bg-gray-100 text-gray-700', icon: Circle },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  ON_HOLD: { label: 'On Hold', color: 'bg-yellow-100 text-yellow-700', icon: Pause },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700' },
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch task details
  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Task not found');
          } else {
            setError('Failed to load task');
          }
          return;
        }
        const data = await res.json();
        setTask(data);
        // Comments are included in the task response
        if (data.comments) {
          setComments(data.comments);
        }
      } catch (err) {
        setError('Failed to load task');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTask();
  }, [taskId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;
    
    try {
      await updateTaskStatus(task.id, newStatus);
      setTask({ ...task, status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user?.id) return;

    setIsSubmittingComment(true);
    try {
      const result = await addTaskComment(taskId, newComment.trim(), session.user.id);
      if (result && result.comment) {
        setComments([...comments, result.comment as Comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTask(taskId);
      router.push('/tasks');
    } catch (err) {
      console.error('Failed to delete task:', err);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-text-muted">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-warning mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error || 'Task not found'}</h2>
        <Button asChild>
          <Link href="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  const StatusIcon = statusConfig[task.status]?.icon || Circle;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';

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
            <div className="flex items-center gap-3 mb-1">
              <h1 className="page-title">{task.title}</h1>
              <Badge className={priorityConfig[task.priority]?.color || ''}>
                {priorityConfig[task.priority]?.label || task.priority}
              </Badge>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-700">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            <p className="page-description">
              Created by {task.creator.firstName} {task.creator.lastName} on {format(new Date(task.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/tasks/${task.id}/edit`}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-text-secondary">{task.description}</p>
                </div>
              ) : (
                <p className="text-text-muted italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-text-muted text-center py-4">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 pb-4 border-b border-border last:border-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.avatar || ''} />
                        <AvatarFallback className="text-xs">
                          {getInitials(`${comment.author.firstName} ${comment.author.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.author.firstName} {comment.author.lastName}
                          </span>
                          <span className="text-xs text-text-muted">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-3 pt-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.avatar || ''} />
                    <AvatarFallback className="text-xs">
                      {getInitials(session?.user?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button type="submit" size="sm" disabled={!newComment.trim()} isLoading={isSubmittingComment}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <span>{statusConfig[task.status]?.label || task.status}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([value, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignee */}
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-text-muted mt-1" />
                <div>
                  <p className="text-xs text-text-muted mb-1">Assignee</p>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar || ''} />
                        <AvatarFallback className="text-xs">
                          {getInitials(`${task.assignee.firstName} ${task.assignee.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.firstName} {task.assignee.lastName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-text-muted">Unassigned</span>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-text-muted mt-1" />
                <div>
                  <p className="text-xs text-text-muted mb-1">Due Date</p>
                  <span className={`text-sm ${isOverdue ? 'text-danger font-medium' : ''}`}>
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
                  </span>
                </div>
              </div>

              {/* Estimated Hours */}
              {task.estimatedHours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-text-muted mt-1" />
                  <div>
                    <p className="text-xs text-text-muted mb-1">Estimated</p>
                    <span className="text-sm">{task.estimatedHours} hours</span>
                  </div>
                </div>
              )}

              {/* Project */}
              {task.project && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-text-muted mt-1" />
                  <div>
                    <p className="text-xs text-text-muted mb-1">Project</p>
                    <Link href={`/projects/${task.project.id}`} className="text-sm text-primary hover:underline">
                      {task.project.name}
                    </Link>
                  </div>
                </div>
              )}

              {/* Department */}
              {task.department && (
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-text-muted mt-1" />
                  <div>
                    <p className="text-xs text-text-muted mb-1">Department</p>
                    <Link href={`/departments/${task.department.id}`} className="text-sm text-primary hover:underline">
                      {task.department.name}
                    </Link>
                  </div>
                </div>
              )}

              {/* Priority */}
              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 text-text-muted mt-1" />
                <div>
                  <p className="text-xs text-text-muted mb-1">Priority</p>
                  <Badge className={priorityConfig[task.priority]?.color || ''}>
                    {priorityConfig[task.priority]?.label || task.priority}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-text-secondary space-y-2">
              <p>Created: {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}</p>
              <p>Updated: {format(new Date(task.updatedAt), 'MMM d, yyyy h:mm a')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
