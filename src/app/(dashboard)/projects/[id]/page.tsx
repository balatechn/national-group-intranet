'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Timer,
  User,
  IndianRupee,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { getInitials } from '@/lib/utils';

interface ProjectDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  company: { id: string; name: string; shortName: string | null };
  department: { id: string; name: string } | null;
  owner: { firstName: string; lastName: string; avatar: string | null };
  _count: { members: number; tasks: number };
}

interface HoursData {
  project: { id: string; name: string; budget: number | null };
  summary: {
    totalHours: number;
    totalCost: number;
    totalEstimatedHours: number;
    budgetRemaining: number | null;
    budgetUtilization: number | null;
    hoursVariance: number | null;
  };
  byUser: Array<{
    userId: string;
    name: string;
    hours: number;
    cost: number;
    hourlyRate: number;
  }>;
  byTask: Array<{
    taskId: string;
    title: string;
    estimatedHours: number;
    actualHours: number;
    cost: number;
  }>;
  recentEntries: Array<{
    id: string;
    hours: number;
    cost: number;
    date: string;
    description: string | null;
    user: { firstName: string; lastName: string };
    task: { id: string; title: string };
  }>;
}

const statusColors: Record<string, string> = {
  PLANNED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-yellow-100 text-yellow-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const formatCurrency = (val: number) =>
  '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [hours, setHours] = useState<HoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoursLoading, setHoursLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) {
          setError(res.status === 404 ? 'Project not found' : 'Failed to load project');
          return;
        }
        const data = await res.json();
        setProject(data.project || data);
      } catch {
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    async function fetchHours() {
      try {
        const res = await fetch(`/api/projects/hours?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setHours(data);
        }
      } catch {
        console.error('Failed to fetch hours data');
      } finally {
        setHoursLoading(false);
      }
    }
    fetchHours();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-warning mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error || 'Project not found'}</h2>
        <Button asChild>
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'COMPLETED' && project.status !== 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="page-title">{project.name}</h1>
              <Badge className={statusColors[project.status] || ''}>
                {project.status.replace(/_/g, ' ')}
              </Badge>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-700">Overdue</Badge>
              )}
            </div>
            <p className="page-description">
              {project.code} — {project.company.shortName || project.company.name}
              {project.department ? ` / ${project.department.name}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-950 p-2.5">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Members</p>
                <p className="text-xl font-bold">{project._count.members}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-950 p-2.5">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Tasks</p>
                <p className="text-xl font-bold">{project._count.tasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 dark:bg-green-950 p-2.5">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Timeline</p>
                <p className="text-sm font-medium">
                  {project.startDate
                    ? format(new Date(project.startDate), 'MMM d')
                    : '—'}
                  {project.endDate && (
                    <> → {format(new Date(project.endDate), 'MMM d, yy')}</>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 dark:bg-amber-950 p-2.5">
                <IndianRupee className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Budget</p>
                <p className="text-xl font-bold">
                  {project.budget ? formatCurrency(project.budget) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hours & Cost Summary */}
      {hoursLoading ? (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </CardContent>
        </Card>
      ) : hours ? (
        <>
          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                Manpower Hours & Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
                  <p className="text-xs text-text-muted mb-1">Total Hours</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {hours.summary.totalHours.toFixed(1)}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
                  <p className="text-xs text-text-muted mb-1">Total Cost</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(hours.summary.totalCost)}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 text-center">
                  <p className="text-xs text-text-muted mb-1">Estimated Hours</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {hours.summary.totalEstimatedHours.toFixed(1)}
                  </p>
                </div>
                <div className={`rounded-lg p-4 text-center ${
                  hours.summary.hoursVariance && hours.summary.hoursVariance > 0
                    ? 'bg-red-50 dark:bg-red-950/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/30'
                }`}>
                  <p className="text-xs text-text-muted mb-1">Hours Variance</p>
                  <p className={`text-2xl font-bold ${
                    hours.summary.hoursVariance && hours.summary.hoursVariance > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {hours.summary.hoursVariance
                      ? `${hours.summary.hoursVariance > 0 ? '+' : ''}${hours.summary.hoursVariance.toFixed(1)}`
                      : '—'}
                  </p>
                </div>
                {hours.summary.budgetRemaining !== null && (
                  <>
                    <div className={`rounded-lg p-4 text-center ${
                      hours.summary.budgetRemaining < 0
                        ? 'bg-red-50 dark:bg-red-950/30'
                        : 'bg-amber-50 dark:bg-amber-950/30'
                    }`}>
                      <p className="text-xs text-text-muted mb-1">Budget Remaining</p>
                      <p className={`text-2xl font-bold ${
                        hours.summary.budgetRemaining < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        {formatCurrency(hours.summary.budgetRemaining)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 text-center">
                      <p className="text-xs text-text-muted mb-1">Budget Used</p>
                      <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {hours.summary.budgetUtilization}%
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Budget progress bar */}
              {hours.summary.budgetUtilization !== null && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-muted">Budget Utilization</span>
                    <span className="text-text-muted">{hours.summary.budgetUtilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        hours.summary.budgetUtilization > 100
                          ? 'bg-red-500'
                          : hours.summary.budgetUtilization > 80
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(hours.summary.budgetUtilization, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manpower Breakdown & Task Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* By User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Manpower Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hours.byUser.length === 0 ? (
                  <p className="text-center text-text-muted py-6">No time logged yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team Member</TableHead>
                          <TableHead className="text-right">Rate (₹/hr)</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                          <TableHead className="text-right">Cost (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hours.byUser.map((u) => (
                          <TableRow key={u.userId}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell className="text-right text-text-secondary">
                              {u.hourlyRate ? formatCurrency(u.hourlyRate) : '—'}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-blue-700 dark:text-blue-400">
                              {u.hours.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-700 dark:text-green-400">
                              {formatCurrency(u.cost)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-surface-secondary font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell />
                          <TableCell className="text-right text-blue-700 dark:text-blue-400">
                            {hours.summary.totalHours.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right text-green-700 dark:text-green-400">
                            {formatCurrency(hours.summary.totalCost)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Task */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Task-wise Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hours.byTask.length === 0 ? (
                  <p className="text-center text-text-muted py-6">No tasks in this project</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead className="text-right">Est.</TableHead>
                          <TableHead className="text-right">Actual</TableHead>
                          <TableHead className="text-right">Cost (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hours.byTask.map((t) => {
                          const over = t.estimatedHours > 0 && t.actualHours > t.estimatedHours;
                          return (
                            <TableRow key={t.taskId}>
                              <TableCell>
                                <Link
                                  href={`/tasks/${t.taskId}`}
                                  className="text-primary hover:underline font-medium text-sm line-clamp-1"
                                >
                                  {t.title}
                                </Link>
                              </TableCell>
                              <TableCell className="text-right text-text-secondary">
                                {t.estimatedHours > 0 ? `${t.estimatedHours}h` : '—'}
                              </TableCell>
                              <TableCell className={`text-right font-semibold ${over ? 'text-red-600 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                {t.actualHours > 0 ? `${t.actualHours.toFixed(1)}h` : '—'}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-700 dark:text-green-400">
                                {t.cost > 0 ? formatCurrency(t.cost) : '—'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-surface-secondary font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">
                            {hours.summary.totalEstimatedHours > 0 ? `${hours.summary.totalEstimatedHours.toFixed(1)}h` : '—'}
                          </TableCell>
                          <TableCell className="text-right text-blue-700 dark:text-blue-400">
                            {hours.summary.totalHours.toFixed(1)}h
                          </TableCell>
                          <TableCell className="text-right text-green-700 dark:text-green-400">
                            {formatCurrency(hours.summary.totalCost)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Time Entries */}
          {hours.recentEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Time Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead className="text-right">Cost (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hours.recentEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm text-text-secondary whitespace-nowrap">
                            {format(new Date(entry.date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {entry.user.firstName} {entry.user.lastName}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/tasks/${entry.task.id}`}
                              className="text-primary hover:underline text-sm line-clamp-1"
                            >
                              {entry.task.title}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm text-text-secondary max-w-[200px] truncate">
                            {entry.description || '—'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-700 dark:text-blue-400">
                            {entry.hours}h
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-700 dark:text-green-400">
                            {entry.cost > 0 ? formatCurrency(entry.cost) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      {/* Description */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
