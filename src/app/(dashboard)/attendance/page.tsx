'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getMonthlyAttendance,
  MonthlyAttendanceSummary,
} from '@/actions/attendance';
import {
  Clock,
  Calendar,
  TrendingUp,
  Coffee,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatTime(date: Date | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function getLocationBadge(location: string) {
  const colors: Record<string, string> = {
    OFFICE: 'bg-blue-100 text-blue-800',
    REMOTE: 'bg-green-100 text-green-800',
    HYBRID: 'bg-purple-100 text-purple-800',
    FIELD: 'bg-orange-100 text-orange-800',
  };
  return colors[location] || 'bg-gray-100 text-gray-800';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'CHECKED_IN':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case 'CHECKED_OUT':
      return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
    case 'ON_BREAK':
      return <Badge className="bg-yellow-100 text-yellow-800">On Break</Badge>;
    case 'ABSENT':
      return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function AttendancePage() {
  const [data, setData] = useState<MonthlyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadAttendance();
  }, [selectedMonth, selectedYear]);

  async function loadAttendance() {
    setLoading(true);
    try {
      const result = await getMonthlyAttendance(selectedMonth, selectedYear);
      setData(result);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  }

  function previousMonth() {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }

  function nextMonth() {
    const now = new Date();
    // Don't allow future months
    if (
      selectedYear > now.getFullYear() ||
      (selectedYear === now.getFullYear() && selectedMonth >= now.getMonth())
    ) {
      return;
    }
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">
            Track your monthly attendance and work hours
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            disabled={
              selectedYear === new Date().getFullYear() &&
              selectedMonth >= new Date().getMonth()
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Days</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.presentDays || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {data?.totalDays || 0} working days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.absentDays || 0}</div>
            <p className="text-xs text-muted-foreground">days missed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.lateDays || 0}</div>
            <p className="text-xs text-muted-foreground">
              after 9:15 AM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalWorkHours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              avg {data?.averageWorkHours || 0}h/day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Break Time</CardTitle>
            <Coffee className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalBreakHours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              total break hours this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalOvertimeHours || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              extra hours worked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data && data.totalDays > 0
                ? Math.round((data.presentDays / data.totalDays) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              of working days present
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance - {MONTHS[selectedMonth]} {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.attendances && data.attendances.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>First In</TableHead>
                  <TableHead>Last Out</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.attendances.map((att) => {
                  const date = new Date(att.date);
                  const dayName = date.toLocaleDateString('en-US', {
                    weekday: 'short',
                  });
                  const dateStr = date.toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                  });

                  return (
                    <TableRow key={att.id}>
                      <TableCell className="font-medium">{dateStr}</TableCell>
                      <TableCell>{dayName}</TableCell>
                      <TableCell>
                        <span
                          className={
                            att.isLate ? 'text-red-600 font-medium' : ''
                          }
                        >
                          {formatTime(att.firstCheckIn)}
                        </span>
                        {att.isLate && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-red-600 border-red-200"
                          >
                            Late
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatTime(att.lastCheckOut)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          {att.sessionCount || 1}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDuration(att.workMinutes)}</TableCell>
                      <TableCell>
                        <Badge className={getLocationBadge(att.locationType)}>
                          <MapPin className="h-3 w-3 mr-1" />
                          {att.locationType}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(att.status)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records for {MONTHS[selectedMonth]} {selectedYear}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
