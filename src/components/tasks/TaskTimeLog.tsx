'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Clock,
  Plus,
  Trash2,
  DollarSign,
  Timer,
  Loader2,
  Calendar as CalendarIcon,
  TrendingUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui';
import { getInitials } from '@/lib/utils';

interface TimeEntry {
  id: string;
  hours: number;
  description: string | null;
  date: string;
  hourlyRate: number;
  cost: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    hourlyRate: number | null;
  };
  createdAt: string;
}

interface TaskTimeLogProps {
  taskId: string;
  estimatedHours: number | null;
  currentUserId: string;
}

export default function TaskTimeLog({ taskId, estimatedHours, currentUserId }: TaskTimeLogProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/time-entries`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setTotalHours(data.totalHours);
        setTotalCost(data.totalCost);
      }
    } catch (err) {
      console.error('Failed to fetch time entries:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) {
      setError('Please enter valid hours');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/tasks/${taskId}/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: parseFloat(hours),
          description: description.trim() || undefined,
          date: date || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to log time');
        return;
      }

      // Reset form
      setHours('');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setShowForm(false);
      fetchEntries();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this time entry?')) return;

    setDeleting(entryId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/time-entries?entryId=${entryId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchEntries();
      }
    } catch (err) {
      console.error('Failed to delete time entry:', err);
    } finally {
      setDeleting(null);
    }
  };

  const hoursVariance = estimatedHours ? totalHours - estimatedHours : null;
  const progressPercent = estimatedHours ? Math.min(Math.round((totalHours / estimatedHours) * 100), 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Time Log
          </CardTitle>
          <Button
            variant={showForm ? 'outline' : 'default'}
            size="sm"
            onClick={() => { setShowForm(!showForm); setError(''); }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Log Hours
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
            <p className="text-xs text-text-muted mb-1">Total Hours</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
            <p className="text-xs text-text-muted mb-1">Total Cost</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">
              ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          {estimatedHours ? (
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 text-center">
              <p className="text-xs text-text-muted mb-1">Estimated</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{estimatedHours}h</p>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 text-center">
              <p className="text-xs text-text-muted mb-1">Estimated</p>
              <p className="text-sm text-text-muted">Not set</p>
            </div>
          )}
          <div className={`rounded-lg p-3 text-center ${
            hoursVariance !== null && hoursVariance > 0 
              ? 'bg-red-50 dark:bg-red-950/30' 
              : 'bg-emerald-50 dark:bg-emerald-950/30'
          }`}>
            <p className="text-xs text-text-muted mb-1">Variance</p>
            {hoursVariance !== null ? (
              <p className={`text-xl font-bold ${
                hoursVariance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {hoursVariance > 0 ? '+' : ''}{hoursVariance.toFixed(1)}h
              </p>
            ) : (
              <p className="text-sm text-text-muted">—</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {estimatedHours ? (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-muted">Progress</span>
              <span className="text-text-muted">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  progressPercent > 100 
                    ? 'bg-red-500' 
                    : progressPercent > 80 
                      ? 'bg-yellow-500' 
                      : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Log Hours Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-4 bg-surface-secondary">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <Label htmlFor="hours" className="text-xs mb-1 block">Hours *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  placeholder="e.g. 2.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date" className="text-xs mb-1 block">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-xs mb-1 block">Description</Label>
                <Input
                  id="description"
                  placeholder="What did you work on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-sm text-danger mb-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                Log Time
              </Button>
            </div>
          </form>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-6 text-text-muted">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No time logged yet</p>
            <p className="text-xs mt-1">Click &quot;Log Hours&quot; to start tracking time</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-surface hover:bg-surface-secondary transition-colors"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={entry.user.avatar || ''} />
                  <AvatarFallback className="text-xs">
                    {getInitials(`${entry.user.firstName} ${entry.user.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {entry.user.firstName} {entry.user.lastName}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="text-xs text-text-secondary mt-0.5 truncate">{entry.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{entry.hours}h</p>
                    {entry.cost > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ₹{entry.cost.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  {(entry.user.id === currentUserId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-text-muted hover:text-danger"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                    >
                      {deleting === entry.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
