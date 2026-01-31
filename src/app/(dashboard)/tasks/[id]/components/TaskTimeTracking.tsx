'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Timer, Plus, Trash2, Clock, Calendar } from 'lucide-react';
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
import { logTaskTime, deleteTaskTimeEntry } from '@/actions/tasks';
import { formatDate, getInitials } from '@/lib/utils';

interface TimeEntry {
  id: string;
  hours: number;
  description: string | null;
  date: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface TaskTimeTrackingProps {
  taskId: string;
  timeEntries: TimeEntry[];
  estimatedHours: number | null;
  actualHours: number | null;
}

export function TaskTimeTracking({ taskId, timeEntries, estimatedHours, actualHours }: TaskTimeTrackingProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalLogged = timeEntries.reduce((acc, entry) => acc + entry.hours, 0);
  const progress = estimatedHours ? Math.min((totalLogged / estimatedHours) * 100, 100) : 0;
  const overBudget = estimatedHours && totalLogged > estimatedHours;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hours || !session?.user?.id) return;

    setIsSubmitting(true);
    try {
      await logTaskTime(taskId, session.user.id, parseFloat(hours), description || undefined, new Date(date));
      setHours('');
      setDescription('');
      setShowForm(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to log time:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(entryId: string) {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      await deleteTaskTimeEntry(entryId, taskId);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete time entry:', error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Time Tracking
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Log Time
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Time Progress</span>
            <span className={`text-sm font-medium ${overBudget ? 'text-danger' : ''}`}>
              {totalLogged.toFixed(1)}h / {estimatedHours || 0}h
            </span>
          </div>
          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${overBudget ? 'bg-danger' : 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {overBudget && (
            <p className="mt-2 text-xs text-danger">
              ⚠️ Over budget by {(totalLogged - (estimatedHours || 0)).toFixed(1)} hours
            </p>
          )}
        </div>

        {/* Log Time Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="hours" required>Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  placeholder="e.g., 2.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What did you work on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!hours || isSubmitting}>
                {isSubmitting ? 'Logging...' : 'Log Time'}
              </Button>
            </div>
          </form>
        )}

        {/* Time Entries List */}
        <div className="space-y-3">
          {timeEntries.length === 0 ? (
            <p className="text-center text-sm text-text-muted py-4">
              No time logged yet
            </p>
          ) : (
            timeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.user.avatar || ''} />
                    <AvatarFallback>
                      {getInitials(`${entry.user.firstName} ${entry.user.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {entry.user.firstName} {entry.user.lastName}
                      </span>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-xs text-text-muted mt-0.5">{entry.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <Clock className="h-4 w-4" />
                    {entry.hours}h
                  </div>
                  {session?.user?.id === entry.user.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-text-muted hover:text-danger"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
