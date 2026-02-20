import Link from 'next/link';
import {
  getDashboardPersonalStats,
  getDashboardEvents,
  getDashboardRecentTasks,
} from '@/actions/dashboard';
import {
  CheckSquare,
  Calendar,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  FolderKanban,
} from 'lucide-react';

export async function BottomSection() {
  const [personalStats, events, recentTasks] = await Promise.all([
    getDashboardPersonalStats(),
    getDashboardEvents(),
    getDashboardRecentTasks(),
  ]);

  const today = new Date();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── My Projects + Pending Reviews ── */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {/* My Projects */}
        <details open className="group">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-gray-50">
            <span className="text-sm font-medium text-gray-700">My Projects</span>
            <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="px-4 pb-3 space-y-1">
            {personalStats && personalStats.projects.length > 0 ? (
              personalStats.projects.slice(0, 4).map((proj) => (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600 shrink-0">
                      {proj.name.charAt(0)}
                    </div>
                    <span className="text-gray-700 truncate">{proj.name}</span>
                  </div>
                  <span className="text-gray-400 shrink-0">{proj.totalTasks} tasks</span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-2">No projects yet.</p>
            )}
          </div>
        </details>

        {/* Pending Reviews */}
        <details className="group">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Pending Reviews</span>
            <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="px-4 pb-3 space-y-1">
            {personalStats && personalStats.taskStats.overdue > 0 ? (
              <>
                <p className="text-xs text-red-600 flex items-center gap-1 mb-2">
                  <AlertTriangle className="h-3 w-3" />
                  {personalStats.taskStats.overdue} overdue
                </p>
                {personalStats.pendingTasks
                  .filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH')
                  .slice(0, 3)
                  .map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-xs"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}`} />
                      <span className="text-gray-700 truncate flex-1">{task.title}</span>
                    </Link>
                  ))}
              </>
            ) : (
              <p className="text-xs text-gray-400 py-2">No pending reviews.</p>
            )}
          </div>
        </details>
      </div>

      {/* ── Upcoming Events ── */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            Upcoming Events
          </h3>
          <Link href="/calendar" className="text-xs text-[#B8860B] hover:text-[#DAA520]">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {events.upcoming.length > 0 ? (
            events.upcoming.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[8px] font-bold text-amber-600/70 leading-none">
                    {new Date(event.startDate).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-amber-700 leading-tight">
                    {new Date(event.startDate).getDate()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 truncate">{event.title}</p>
                  <p className="text-[10px] text-gray-400">
                    {event.isAllDay ? 'All Day' : new Date(event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No upcoming events</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Active Tasks ── */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[#B8860B]" />
            Active Tasks
          </h3>
          <div className="flex items-baseline gap-1 text-sm">
            <span className="font-bold text-[#B8860B]">{personalStats?.taskStats.completed || 0}</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-400">{personalStats?.taskStats.total || 0}</span>
          </div>
        </div>
        <div className="space-y-1 max-h-[280px] overflow-y-auto">
          {personalStats && personalStats.pendingTasks.length > 0 ? (
            personalStats.pendingTasks.slice(0, 6).map((task) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < today;
              const statusColor = task.status === 'IN_PROGRESS' ? 'bg-blue-500' : task.status === 'ON_HOLD' ? 'bg-amber-500' : 'bg-gray-400';
              return (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
                >
                  <FolderKanban className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{task.title}</p>
                    {task.project && <p className="text-[10px] text-gray-400 truncate">{task.project.name}</p>}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${statusColor} shrink-0`} />
                </Link>
              );
            })
          ) : recentTasks.length > 0 ? (
            recentTasks.filter((t) => t.status === 'COMPLETED').slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg opacity-50">
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-sm text-gray-400 truncate line-through">{task.title}</p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckSquare className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No tasks assigned</p>
            </div>
          )}
        </div>
        {personalStats && personalStats.pendingTasks.length > 0 && (
          <Link
            href="/tasks"
            className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1 text-xs text-[#B8860B] hover:text-[#DAA520]"
          >
            View all tasks <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
