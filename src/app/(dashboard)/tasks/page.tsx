import Link from 'next/link';
import { Plus, Search, CheckSquare, Filter, Calendar, User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { getTasks } from '@/actions/tasks';
import { formatDate, getInitials, getStatusColor, getPriorityColor } from '@/lib/utils';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { status?: string; priority?: string; page?: string };
}) {
  const { tasks, pagination } = await getTasks({
    status: searchParams.status,
    priority: searchParams.priority,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-description">Manage and track all tasks</p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Tasks</p>
                <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">In Progress</p>
                <p className="mt-1 text-2xl font-bold">
                  {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <div className="rounded-lg bg-warning-light p-3">
                <CheckSquare className="h-6 w-6 text-warning-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Completed</p>
                <p className="mt-1 text-2xl font-bold">
                  {tasks.filter((t) => t.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="rounded-lg bg-success-light p-3">
                <CheckSquare className="h-6 w-6 text-success-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Overdue</p>
                <p className="mt-1 text-2xl font-bold">
                  {tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length}
                </p>
              </div>
              <div className="rounded-lg bg-danger-light p-3">
                <CheckSquare className="h-6 w-6 text-danger-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input placeholder="Search tasks..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.status || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={searchParams.priority || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Project</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-medium text-text-primary hover:text-primary"
                    >
                      {task.title}
                    </Link>
                    {task._count.subtasks > 0 && (
                      <span className="ml-2 text-xs text-text-muted">
                        ({task._count.subtasks} subtasks)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={task.assignee.avatar || ''} />
                          <AvatarFallback>
                            {getInitials(`${task.assignee.firstName} ${task.assignee.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {task.assignee.firstName} {task.assignee.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-muted">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-text-muted" />
                        <span
                          className={
                            new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
                              ? 'text-danger'
                              : ''
                          }
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-muted">No due date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.project ? (
                      <Link
                        href={`/projects/${task.project.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {task.project.name}
                      </Link>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {tasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No tasks found</h3>
            <p className="mt-2 text-text-secondary">Create your first task to get started.</p>
            <Button className="mt-4" asChild>
              <Link href="/tasks/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
