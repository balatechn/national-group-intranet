import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  Target,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
} from '@/components/ui';
import { getTaskStats, getTaskTrends } from '@/actions/tasks';
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils';

export const revalidate = 60;

export default async function TaskReportsPage() {
  const [stats, trends] = await Promise.all([
    getTaskStats(),
    getTaskTrends({ days: 30 }),
  ]);

  const statusOrder = ['TODO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
  const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Reports</h1>
          <p className="page-description">Analytics and insights for task management</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-muted">Total Tasks</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-muted">Completion Rate</p>
                <p className="text-3xl font-bold">{stats.completionRate}%</p>
              </div>
              <div className="rounded-lg bg-success/10 p-3">
                <Target className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-muted">Overdue</p>
                <p className="text-3xl font-bold text-danger">{stats.overdue}</p>
              </div>
              <div className="rounded-lg bg-danger/10 p-3">
                <AlertCircle className="h-6 w-6 text-danger" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-muted">Avg Time</p>
                <p className="text-3xl font-bold">{stats.avgCompletionTime.toFixed(1)}h</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-3">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>Distribution of tasks across different statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusOrder.map((status) => {
                const count = (stats.byStatus as Record<string, number>)[status] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(status)}>
                        {status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          status === 'COMPLETED' ? 'bg-success' :
                          status === 'IN_PROGRESS' ? 'bg-primary' :
                          status === 'ON_HOLD' ? 'bg-warning' :
                          status === 'CANCELLED' ? 'bg-danger' : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Distribution of tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityOrder.map((priority) => {
                const count = (stats.byPriority as Record<string, number>)[priority] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={priority} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getPriorityColor(priority)}>
                        {priority}
                      </Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          priority === 'CRITICAL' ? 'bg-danger' :
                          priority === 'HIGH' ? 'bg-orange-500' :
                          priority === 'MEDIUM' ? 'bg-primary' : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            30-Day Trends
          </CardTitle>
          <CardDescription>Tasks created and completed over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1">
            {trends.map((day, index) => {
              const maxValue = Math.max(...trends.map(t => Math.max(t.created, t.completed)), 1);
              const createdHeight = (day.created / maxValue) * 100;
              const completedHeight = (day.completed / maxValue) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1" title={day.date}>
                  <div className="flex-1 w-full flex items-end gap-0.5">
                    <div 
                      className="flex-1 bg-primary/60 rounded-t transition-all duration-300"
                      style={{ height: `${createdHeight}%`, minHeight: day.created > 0 ? '4px' : '0' }}
                    />
                    <div 
                      className="flex-1 bg-success rounded-t transition-all duration-300"
                      style={{ height: `${completedHeight}%`, minHeight: day.completed > 0 ? '4px' : '0' }}
                    />
                  </div>
                  {index % 5 === 0 && (
                    <span className="text-[10px] text-text-muted rotate-45 origin-left whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-primary/60" />
              <span className="text-sm text-text-muted">Created</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-success" />
              <span className="text-sm text-text-muted">Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest task updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.map((task) => (
              <div key={task.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(task.status)} variant="outline">
                    {task.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm font-medium">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  {task.assignee && (
                    <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                  )}
                  <span>•</span>
                  <span>{formatDate(task.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
