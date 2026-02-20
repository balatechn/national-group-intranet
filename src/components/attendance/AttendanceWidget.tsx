'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Play,
  Square,
  Coffee,
  MapPin,
  CheckCircle2,
  Timer,
  Activity,
  Building2,
  Home,
  Briefcase,
  TrendingUp,
  Pause,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttendanceData {
  isCheckedIn: boolean;
  isOnBreak: boolean;
  attendance: {
    id: string;
    checkInAt: string;
    checkOutAt: string | null;
    status: string;
    locationType: string;
    checkInLocation: string | null;
    totalMinutes: number;
    breakMinutes: number;
    workMinutes: number;
    breaks: Array<{
      id: string;
      breakType: string;
      startTime: string;
      endTime: string | null;
      duration: number;
    }>;
  } | null;
  currentBreak: {
    id: string;
    breakType: string;
    startTime: string;
  } | null;
  todayHours: number;
  todayMinutes: number;
  weekHours: number;
  activeTasksCount: number;
}

const locationIcons = {
  OFFICE: Building2,
  REMOTE: Home,
  HYBRID: Briefcase,
  FIELD: MapPin,
};

const locationLabels = {
  OFFICE: 'Office',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  FIELD: 'Field',
};

export function AttendanceWidget() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('OFFICE');
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  // Live timer effect
  useEffect(() => {
    if (!data?.isCheckedIn || !data?.attendance?.checkInAt) return;

    const updateTimer = () => {
      const checkInTime = new Date(data.attendance!.checkInAt);
      const now = new Date();
      const diffMs = now.getTime() - checkInTime.getTime();
      
      // Subtract completed breaks
      const completedBreakMs = (data.attendance!.breaks || [])
        .filter(b => b.endTime)
        .reduce((sum, b) => sum + b.duration * 60 * 1000, 0);
      
      // Subtract current break if on break
      let currentBreakMs = 0;
      if (data.isOnBreak && data.currentBreak) {
        const breakStart = new Date(data.currentBreak.startTime);
        currentBreakMs = now.getTime() - breakStart.getTime();
      }

      const workMs = diffMs - completedBreakMs - currentBreakMs;
      const totalSeconds = Math.floor(workMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setElapsedTime({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data?.isCheckedIn, data?.attendance?.checkInAt, data?.isOnBreak, data?.currentBreak, data?.attendance?.breaks]);

  const handleCheckIn = async () => {
    setActionLoading('checkin');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          locationType: selectedLocation,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      await fetchAttendance();
      setShowLocationSelect(false);
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading('checkout');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      await fetchAttendance();
    } catch (err: any) {
      setError(err.message || 'Check-out failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartBreak = async (breakType: string = 'SHORT_BREAK') => {
    setActionLoading('break');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_break', breakType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      await fetchAttendance();
    } catch (err: any) {
      setError(err.message || 'Start break failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndBreak = async () => {
    setActionLoading('break');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end_break' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      await fetchAttendance();
    } catch (err: any) {
      setError(err.message || 'End break failed');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (hours: number, minutes: number, seconds?: number) => {
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    if (seconds !== undefined) {
      const s = String(seconds).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }
    return `${h}:${m}`;
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const LocationIcon = data?.attendance?.locationType
    ? locationIcons[data.attendance.locationType as keyof typeof locationIcons]
    : Building2;

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-[#DAA520] to-[#B8860B] rounded-lg">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Time Tracking</h3>
          </div>
          {data?.isCheckedIn && (
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${data.isOnBreak ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
              <span className="text-xs text-gray-600">
                {data.isOnBreak ? 'On Break' : 'Working'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-3">
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">×</button>
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center py-2">
          {data?.isCheckedIn ? (
            <>
              <div className={`text-3xl font-mono font-bold ${data.isOnBreak ? 'text-amber-600' : 'text-gray-900'}`}>
                {formatTime(elapsedTime.hours, elapsedTime.minutes, elapsedTime.seconds)}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {data.isOnBreak ? 'Break Time' : 'Work Time'}
              </p>
            </>
          ) : (
            <>
              <div className="text-3xl font-mono font-bold text-gray-300">
                00:00:00
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Not checked in</p>
            </>
          )}
        </div>

        {/* Location Selection (when checking in) */}
        {showLocationSelect && !data?.isCheckedIn && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-700">Select work location:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(locationLabels).map(([key, label]) => {
                const Icon = locationIcons[key as keyof typeof locationIcons];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedLocation(key)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border transition-all text-xs ${
                      selectedLocation === key
                        ? 'border-[#DAA520] bg-amber-50 text-[#B8860B]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleCheckIn}
                disabled={actionLoading === 'checkin'}
                size="sm"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs"
              >
                {actionLoading === 'checkin' ? (
                  <span className="animate-spin mr-1">⏳</span>
                ) : (
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                )}
                Confirm Check-In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLocationSelect(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showLocationSelect && (
          <div className="space-y-2">
            {!data?.isCheckedIn ? (
              <Button
                onClick={() => setShowLocationSelect(true)}
                size="sm"
                className="w-full h-9 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md text-sm"
              >
                <Play className="h-4 w-4 mr-1.5" />
                Check In
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {data.isOnBreak ? (
                  <Button
                    onClick={handleEndBreak}
                    disabled={actionLoading === 'break'}
                    size="sm"
                    className="col-span-2 h-9 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-sm"
                  >
                    {actionLoading === 'break' ? (
                      <span className="animate-spin mr-1">⏳</span>
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Resume Work
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => handleStartBreak('LUNCH')}
                      disabled={actionLoading === 'break'}
                      variant="outline"
                      size="sm"
                      className="h-9 border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
                    >
                      <Coffee className="h-3.5 w-3.5 mr-1" />
                      Lunch
                    </Button>
                    <Button
                      onClick={() => handleStartBreak('SHORT_BREAK')}
                      disabled={actionLoading === 'break'}
                      variant="outline"
                      size="sm"
                      className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                    >
                      <Pause className="h-3.5 w-3.5 mr-1" />
                      Break
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleCheckOut}
                  disabled={actionLoading === 'checkout'}
                  size="sm"
                  className="col-span-2 h-9 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm"
                >
                  {actionLoading === 'checkout' ? (
                    <span className="animate-spin mr-1">⏳</span>
                  ) : (
                    <LogOut className="h-4 w-4 mr-1" />
                  )}
                  Check Out
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Stats Row - Compact */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm font-bold text-gray-900">{data?.weekHours || 0}h</div>
            <div className="text-[10px] text-gray-500">Week</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm font-bold text-gray-900">{data?.activeTasksCount || 0}</div>
            <div className="text-[10px] text-gray-500">Tasks</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm font-bold text-gray-900">
              {formatTime(data?.todayHours || 0, data?.todayMinutes || 0)}
            </div>
            <div className="text-[10px] text-gray-500">Today</div>
          </div>
        </div>
      </div>
    </div>
  );
}
