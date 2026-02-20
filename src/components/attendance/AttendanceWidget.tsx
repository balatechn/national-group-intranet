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
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
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
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-[#DAA520] to-[#B8860B] rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Time Tracking</h3>
          </div>
          {data?.isCheckedIn && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${data.isOnBreak ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
              <span className="text-xs font-medium text-gray-600">
                {data.isOnBreak ? 'On Break' : 'Working'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center py-4">
          {data?.isCheckedIn ? (
            <>
              <div className={`text-4xl font-mono font-bold ${data.isOnBreak ? 'text-amber-600' : 'text-gray-900'}`}>
                {formatTime(elapsedTime.hours, elapsedTime.minutes, elapsedTime.seconds)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {data.isOnBreak ? 'Break Time' : 'Today\'s Work Time'}
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl font-mono font-bold text-gray-300">
                00:00:00
              </div>
              <p className="text-sm text-gray-400 mt-1">Not checked in</p>
            </>
          )}
        </div>

        {/* Location Selection (when checking in) */}
        {showLocationSelect && !data?.isCheckedIn && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700">Select work location:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(locationLabels).map(([key, label]) => {
                const Icon = locationIcons[key as keyof typeof locationIcons];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedLocation(key)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      selectedLocation === key
                        ? 'border-[#DAA520] bg-amber-50 text-[#B8860B]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleCheckIn}
                disabled={actionLoading === 'checkin'}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
              >
                {actionLoading === 'checkin' ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                Confirm Check-In
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLocationSelect(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showLocationSelect && (
          <div className="space-y-3">
            {!data?.isCheckedIn ? (
              <Button
                onClick={() => setShowLocationSelect(true)}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
              >
                <Play className="h-5 w-5 mr-2" />
                Check In
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {data.isOnBreak ? (
                  <Button
                    onClick={handleEndBreak}
                    disabled={actionLoading === 'break'}
                    className="col-span-2 h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  >
                    {actionLoading === 'break' ? (
                      <span className="animate-spin mr-2">⏳</span>
                    ) : (
                      <Play className="h-5 w-5 mr-2" />
                    )}
                    Resume Work
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => handleStartBreak('LUNCH')}
                      disabled={actionLoading === 'break'}
                      variant="outline"
                      className="h-12 border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      <Coffee className="h-4 w-4 mr-2" />
                      Lunch Break
                    </Button>
                    <Button
                      onClick={() => handleStartBreak('SHORT_BREAK')}
                      disabled={actionLoading === 'break'}
                      variant="outline"
                      className="h-12 border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Short Break
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleCheckOut}
                  disabled={actionLoading === 'checkout'}
                  className="col-span-2 h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                >
                  {actionLoading === 'checkout' ? (
                    <span className="animate-spin mr-2">⏳</span>
                  ) : (
                    <LogOut className="h-5 w-5 mr-2" />
                  )}
                  Check Out
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Timer className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold text-gray-900">{data?.weekHours || 0}h</div>
            <div className="text-xs text-gray-500">This Week</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Activity className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <div className="text-lg font-bold text-gray-900">{data?.activeTasksCount || 0}</div>
            <div className="text-xs text-gray-500">Active Tasks</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-amber-600" />
            <div className="text-lg font-bold text-gray-900">
              {formatTime(data?.todayHours || 0, data?.todayMinutes || 0)}
            </div>
            <div className="text-xs text-gray-500">Today</div>
          </div>
        </div>

        {/* Current Location */}
        {data?.isCheckedIn && data?.attendance && (
          <div className="flex items-center justify-center gap-2 pt-2 text-sm text-gray-500">
            <LocationIcon className="h-4 w-4" />
            <span>
              {locationLabels[data.attendance.locationType as keyof typeof locationLabels] || 'Office'}
              {data.attendance.checkInLocation && ` • ${data.attendance.checkInLocation}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
