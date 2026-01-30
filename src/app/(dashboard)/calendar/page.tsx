'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

// Revalidate every 60 seconds
export const revalidate = 60;

// Mock data for demonstration - in production, fetch from API
const mockEvents = [
  {
    id: '1',
    title: 'Board Meeting',
    description: 'Quarterly board meeting for all group companies',
    startDate: new Date(2024, 2, 15, 10, 0),
    endDate: new Date(2024, 2, 15, 12, 0),
    location: 'Conference Room A',
    eventType: 'MEETING',
    isAllDay: false,
    company: { name: 'National Group' },
  },
  {
    id: '2',
    title: 'Annual Town Hall',
    description: 'Company-wide town hall meeting',
    startDate: new Date(2024, 2, 20, 14, 0),
    endDate: new Date(2024, 2, 20, 16, 0),
    location: 'Auditorium',
    eventType: 'TOWNHALL',
    isAllDay: false,
    company: { name: 'National Group' },
  },
  {
    id: '3',
    title: 'Holi Celebration',
    description: 'Holi festival celebration',
    startDate: new Date(2024, 2, 25),
    endDate: new Date(2024, 2, 25),
    location: 'Office Premises',
    eventType: 'HOLIDAY',
    isAllDay: true,
    company: { name: 'National Group' },
  },
];

const eventTypeColors: Record<string, string> = {
  MEETING: 'bg-blue-100 text-blue-800 border-blue-200',
  TOWNHALL: 'bg-purple-100 text-purple-800 border-purple-200',
  HOLIDAY: 'bg-green-100 text-green-800 border-green-200',
  TRAINING: 'bg-orange-100 text-orange-800 border-orange-200',
  EVENT: 'bg-pink-100 text-pink-800 border-pink-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if a date has events
  const getEventsForDate = (day: number) => {
    return mockEvents.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-description">View and manage events and meetings</p>
        </div>
        <Button asChild>
          <Link href="/calendar/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <h2 className="text-xl font-semibold">
                  {MONTHS[month]} {year}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Select value={view} onValueChange={(v: 'month' | 'week' | 'day') => setView(v)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden">
              {/* Day Headers */}
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="bg-surface-secondary p-3 text-center text-sm font-medium text-text-secondary"
                >
                  {day}
                </div>
              ))}
              {/* Calendar Days */}
              {calendarDays.map((day, index) => {
                const events = day ? getEventsForDate(day) : [];
                const today = day ? isToday(day) : false;
                
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] bg-background p-2 ${
                      day ? 'cursor-pointer hover:bg-surface-secondary' : ''
                    }`}
                    onClick={() => day && setSelectedDate(new Date(year, month, day))}
                  >
                    {day && (
                      <>
                        <div
                          className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                            today
                              ? 'bg-primary text-white'
                              : 'text-text-primary'
                          }`}
                        >
                          {day}
                        </div>
                        <div className="space-y-1">
                          {events.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`truncate rounded px-1 py-0.5 text-xs ${
                                eventTypeColors[event.eventType]
                              }`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <div className="text-xs text-text-muted">
                              +{events.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Upcoming Events */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border p-3 hover:bg-surface-secondary transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-text-primary">{event.title}</h4>
                    <Badge className={eventTypeColors[event.eventType]} variant="outline">
                      {event.eventType}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {event.isAllDay
                          ? 'All Day'
                          : `${event.startDate.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} - ${event.endDate.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Event Types Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Event Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(eventTypeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded ${color}`} />
                    <span className="text-sm text-text-secondary capitalize">
                      {type.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
