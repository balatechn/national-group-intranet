import Link from 'next/link';
import { getSessionUser } from '@/lib/workos-auth';
import {
  getDashboardOrgStats,
  getDashboardPersonalStats,
  getDashboardEvents,
  getDashboardRecentTasks,
} from '@/actions/dashboard';
import {
  Building2,
  Users,
  CheckSquare,
  Calendar,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  UserCircle,
  Clock,
  Target,
  FolderKanban,
  Globe,
  Zap,
  AlertTriangle,
  Monitor,
  FileText,
  Shield,
} from 'lucide-react';

export async function BottomSection() {
  const [orgStats, personalStats, events, recentTasks] = await Promise.all([
    getDashboardOrgStats(),
    getDashboardPersonalStats(),
    getDashboardEvents(),
    getDashboardRecentTasks(),
  ]);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  // Calendar helpers
  const calDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOff + i);
    return d;
  });
  const calDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calMonthLabel = today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const prevMonthLabel = new Date(today.getFullYear(), today.getMonth() - 1).toLocaleDateString('en-IN', { month: 'long' });
  const nextMonthLabel = new Date(today.getFullYear(), today.getMonth() + 1).toLocaleDateString('en-IN', { month: 'long' });
  const calTimeSlots = ['8:00 am', '9:00 am', '10:00 am', '11:00 am'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Accordion Panels ── */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm overflow-hidden divide-y divide-gray-100">
        {/* Pending Reviews */}
        <details className="group">
          <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-700">Pending Reviews</span>
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-4 space-y-2">
            {personalStats && personalStats.taskStats.overdue > 0 ? (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                {personalStats.taskStats.overdue} overdue item{personalStats.taskStats.overdue > 1 ? 's' : ''} need attention
              </p>
            ) : (
              <p className="text-xs text-gray-400">No pending reviews.</p>
            )}
            {personalStats?.pendingTasks.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH').slice(0, 3).map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-xs"
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.priority === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}`} />
                <span className="text-gray-700 truncate flex-1">{task.title}</span>
                <span className="text-gray-400 text-[10px]">{task.priority}</span>
              </Link>
            ))}
          </div>
        </details>

        {/* My Projects */}
        <details open className="group">
          <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-700">My Projects</span>
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-4 space-y-1.5">
            {personalStats && personalStats.projects.length > 0 ? (
              personalStats.projects.slice(0, 4).map((proj) => (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group/proj"
                >
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-100 to-purple-50 border border-violet-200/60 flex items-center justify-center text-[10px] font-bold text-violet-600 shrink-0">
                    {proj.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate group-hover/proj:text-gray-900">{proj.name}</p>
                    <p className="text-[10px] text-gray-400">{proj.code} · {proj.totalTasks} tasks</p>
                  </div>
                  <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                    proj.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                    proj.status === 'PLANNED' ? 'bg-blue-50 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{proj.status}</span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-2">No projects yet.</p>
            )}
          </div>
        </details>

        {/* Quick Links */}
        <details className="group">
          <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-700">Quick Links</span>
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-4 grid grid-cols-2 gap-2">
            {[
              { icon: FolderOpen, label: 'Drives', href: '/drives', color: 'text-orange-600' },
              { icon: Monitor, label: 'IT Portal', href: '/it', color: 'text-blue-600' },
              { icon: FileText, label: 'Policies', href: '/policies', color: 'text-violet-600' },
              { icon: Shield, label: 'Settings', href: '/settings', color: 'text-gray-600' },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon className={`h-3.5 w-3.5 ${link.color}`} />
                  <span className="text-xs text-gray-600">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </details>

        {/* Organization */}
        <details className="group">
          <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-700">Organization</span>
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-4 space-y-2">
            {[
              { label: 'Companies', value: orgStats.totalCompanies, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', href: '/companies' },
              { label: 'Departments', value: orgStats.totalDepartments, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/departments' },
              { label: 'Employees', value: orgStats.totalEmployees, icon: UserCircle, color: 'text-teal-600', bg: 'bg-teal-50', href: '/employees' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-md ${item.bg} p-1.5`}>
                      <Icon className={`h-3 w-3 ${item.color}`} />
                    </div>
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{item.value}</span>
                </Link>
              );
            })}
          </div>
        </details>
      </div>

      {/* ── Weekly Calendar Schedule ── */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-xs text-gray-400">{prevMonthLabel}</span>
          <h3 className="text-sm font-semibold text-gray-800">{calMonthLabel}</h3>
          <span className="text-xs text-gray-400">{nextMonthLabel}</span>
        </div>

        <div className="flex">
          <div className="w-16 shrink-0 pt-12 border-r border-gray-50">
            {calTimeSlots.map((t) => (
              <div key={t} className="h-16 flex items-start justify-end pr-2 pt-0.5">
                <span className="text-[10px] text-gray-400">{t}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-6">
            {calDays.map((day, di) => {
              const isToday = day.toDateString() === today.toDateString();
              const dayEvents = (events.week || []).filter((e) =>
                new Date(e.startDate).toDateString() === day.toDateString()
              );
              return (
                <div key={di} className={`border-r border-gray-50 last:border-r-0 ${isToday ? 'bg-amber-50/30' : ''}`}>
                  <div className={`text-center py-2 border-b border-gray-50 ${isToday ? 'bg-amber-50/50' : ''}`}>
                    <p className={`text-[10px] ${isToday ? 'text-[#B8860B]' : 'text-gray-400'}`}>{calDayNames[di]}</p>
                    <p className={`text-lg font-bold leading-tight ${isToday ? 'text-[#B8860B]' : 'text-gray-800'}`}>
                      {day.getDate()}
                    </p>
                  </div>
                  {calTimeSlots.map((t, ti) => {
                    const hour = 8 + ti;
                    const slotEvents = dayEvents.filter((e) => {
                      const h = new Date(e.startDate).getHours();
                      return h >= hour && h < hour + 1;
                    });
                    return (
                      <div key={ti} className="h-16 border-b border-gray-50 p-0.5 relative">
                        {slotEvents.map((e) => (
                          <div
                            key={e.id}
                            className="rounded-md bg-amber-100/80 border-l-2 border-[#B8860B] p-1 h-full"
                          >
                            <p className="text-[8px] font-semibold text-gray-700 truncate leading-tight">{e.title}</p>
                            <p className="text-[7px] text-gray-500 truncate">{e.location || ''}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {events.week.length === 0 && events.upcoming.length > 0 && (
          <div className="p-4 border-t border-gray-100 space-y-2">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Upcoming</p>
            {events.upcoming.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[7px] font-bold text-orange-500/70 leading-none">
                    {new Date(event.startDate).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-orange-600 leading-tight">{new Date(event.startDate).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{event.title}</p>
                  <p className="text-[10px] text-gray-400">
                    {event.isAllDay ? 'All Day' : new Date(event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {events.week.length === 0 && events.upcoming.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-8 w-8 text-gray-200 mb-2" />
            <p className="text-xs text-gray-400">No events this week</p>
          </div>
        )}
      </div>

      {/* ── Active Tasks Card ── */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-50/40 via-white/80 to-orange-50/30 backdrop-blur-xl border border-amber-200/50 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B]" />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-[#B8860B]" />
              Active Tasks
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#B8860B]">
                {personalStats?.taskStats.completed || 0}
              </span>
              <span className="text-gray-400 text-sm">/</span>
              <span className="text-lg text-gray-400">{personalStats?.taskStats.total || 0}</span>
            </div>
          </div>

          <div className="space-y-1 max-h-[340px] overflow-y-auto scrollbar-thin">
            {personalStats && personalStats.pendingTasks.length > 0 ? (
              personalStats.pendingTasks.map((task, idx) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < today;
                const statusColor = task.status === 'IN_PROGRESS' ? 'bg-blue-500'
                  : task.status === 'ON_HOLD' ? 'bg-amber-500' : 'bg-gray-400';
                const typeIcon = idx % 5 === 0 ? Target : idx % 5 === 1 ? Zap : idx % 5 === 2 ? Clock : idx % 5 === 3 ? Globe : FolderKanban;
                const TypeIcon = typeIcon;
                const iconBg = idx % 5 === 0 ? 'bg-violet-100 text-violet-600'
                  : idx % 5 === 1 ? 'bg-blue-100 text-blue-600'
                  : idx % 5 === 2 ? 'bg-amber-100 text-amber-600'
                  : idx % 5 === 3 ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-pink-100 text-pink-600';

                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors group ${
                      isOverdue ? 'bg-red-50 hover:bg-red-100/60 border border-red-200/40' : 'hover:bg-amber-50/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                      <TypeIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate group-hover:text-gray-900">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.project && (
                          <span className="text-[9px] text-gray-400 truncate">{task.project.name}</span>
                        )}
                        {task.dueDate && (
                          <span className={`text-[9px] ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            {new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${statusColor} shrink-0`} />
                  </Link>
                );
              })
            ) : (
              <>
                {recentTasks.filter((t) => t.status === 'COMPLETED').slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl opacity-60">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-400 truncate line-through">{task.title}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckSquare className="w-3 h-3 text-emerald-600" />
                    </div>
                  </div>
                ))}
                {recentTasks.length === 0 && (
                  <div className="text-center py-12">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                    <p className="text-xs text-gray-400">No tasks assigned yet</p>
                  </div>
                )}
              </>
            )}
          </div>

          {personalStats && personalStats.pendingTasks.length > 0 && (
            <Link
              href="/tasks"
              className="mt-3 pt-3 border-t border-amber-200/40 flex items-center justify-center gap-1.5 text-[11px] text-[#B8860B] hover:text-[#DAA520] transition-colors"
            >
              View all tasks <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
