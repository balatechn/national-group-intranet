'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock,
  Play,
  MapPin,
  Building2,
  Home,
  Briefcase,
  LogIn,
  LogOut,
  CheckSquare,
  Calendar,
  FolderOpen,
  IndianRupee,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfilePhotoUpload from './ProfilePhotoUpload';

interface AttendanceData {
  isCheckedIn: boolean;
  isOnBreak: boolean;
  hasCheckedOutToday?: boolean;
  attendance: {
    id: string;
    locationType: string;
    lastCheckOut?: string | null;
    sessions: Array<{ checkInAt: string; checkOutAt: string | null; durationMinutes: number }>;
    breaks: Array<{ id: string; endTime: string | null; duration: number }>;
  } | null;
  currentSession: { checkInAt: string } | null;
  currentBreak: { startTime: string } | null;
  todayHours: number;
  todayMinutes: number;
  weekHours: number;
}

interface ProfileTimeCardProps {
  userName: string;
  userRole: string;
  userInitials: string;
  hasAvatar: boolean;
  hourlyRate: number;
  loginStreak: number;
}

const locationIcons = {
  OFFICE: Building2,
  REMOTE: Home,
  FIELD: MapPin,
};

const locationLabels = {
  OFFICE: 'Office',
  REMOTE: 'Remote',
  FIELD: 'Field',
};

export function ProfileTimeCard({
  userName,
  userRole,
  userInitials,
  hasAvatar,
  hourlyRate,
  loginStreak,
}: ProfileTimeCardProps) {
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
      if (!res.ok) {
        // Don't show error for auth issues - user might not be fully logged in yet
        if (res.status === 401) {
          setData(null);
          return;
        }
        throw new Error('Failed to fetch');
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      // Silent fail - just show default state
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 60000);
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  // Live timer effect
  useEffect(() => {
    const updateTimer = () => {
      if (!data?.attendance) {
        setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const now = new Date();
      const completedSessionMs = (data.attendance.sessions || [])
        .filter((s) => s.checkOutAt)
        .reduce((sum, s) => sum + s.durationMinutes * 60 * 1000, 0);
      let activeSessionMs = 0;
      if (data.isCheckedIn && data.currentSession) {
        activeSessionMs = now.getTime() - new Date(data.currentSession.checkInAt).getTime();
      }
      const completedBreakMs = (data.attendance.breaks || [])
        .filter((b) => b.endTime)
        .reduce((sum, b) => sum + b.duration * 60 * 1000, 0);
      let currentBreakMs = 0;
      if (data.isOnBreak && data.currentBreak) {
        currentBreakMs = now.getTime() - new Date(data.currentBreak.startTime).getTime();
      }
      const totalWorkMs = completedSessionMs + activeSessionMs - completedBreakMs - currentBreakMs;
      const totalSeconds = Math.max(0, Math.floor(totalWorkMs / 1000));
      setElapsedTime({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const handleCheckIn = async () => {
    setActionLoading('checkin');
    try {
      // Capture geolocation
      let location: string | undefined;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          });
          location = `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`;
        } catch {
          // Geolocation failed, continue without it
          console.log('Geolocation not available');
        }
      }

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkin', locationType: selectedLocation, location }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      await fetchAttendance();
      setShowLocationSelect(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Check-out failed');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (h: number, m: number, s?: number) => {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return s !== undefined ? `${hh}:${mm}:${String(s).padStart(2, '0')}` : `${hh}:${mm}`;
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50/80 via-[#fdf3d7] to-orange-50/60 border border-amber-200/40 shadow-sm p-4 flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(184,134,11,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />
      <div className="relative z-10 flex flex-col w-full">
        {/* Top Row: Profile + Timer */}
        <div className="flex items-start gap-3 mb-3">
          {/* Left: Avatar + Name */}
          <div className="flex flex-col items-center">
            <ProfilePhotoUpload
              currentAvatar={hasAvatar ? '/api/profile/avatar' : null}
              userInitials={userInitials}
              userName={userName}
            />
            <h3 className="text-sm font-semibold text-gray-900 mt-1 text-center">{userName}</h3>
            <p className="text-[10px] text-gray-500">{userRole}</p>
          </div>

          {/* Right: Timer + Status */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {loading ? (
              <div className="animate-pulse h-8 w-24 bg-amber-200/50 rounded" />
            ) : (
              <>
                <div className={`text-2xl font-mono font-bold ${data?.isOnBreak ? 'text-amber-600' : 'text-gray-900'}`}>
                  {formatTime(elapsedTime.hours, elapsedTime.minutes, elapsedTime.seconds)}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      data?.isCheckedIn ? (data.isOnBreak ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-gray-300'
                    } animate-pulse`}
                  />
                  <span className="text-[10px] text-gray-500">
                    {data?.isCheckedIn ? (data.isOnBreak ? 'On Break' : 'Working') : 'Not checked in'}
                  </span>
                </div>
              </>
            )}
            {/* Rate Badge */}
            {hourlyRate > 0 && (
              <div className="inline-flex items-center gap-1 rounded-full bg-white/90 border border-amber-300/60 px-2 py-0.5 mt-1.5 shadow-sm">
                <IndianRupee className="h-2.5 w-2.5 text-[#B8860B]" />
                <span className="text-xs font-bold text-gray-900">{hourlyRate.toLocaleString('en-IN')}/h</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-1.5 mb-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[10px] flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-1">
              ×
            </button>
          </div>
        )}

        {/* Location Selection */}
        {showLocationSelect && !data?.isCheckedIn && (
          <div className="space-y-2 p-2 bg-white/60 rounded-xl mb-2">
            <p className="text-[10px] font-medium text-gray-700">Select location:</p>
            <div className="grid grid-cols-4 gap-1">
              {Object.entries(locationLabels).map(([key, label]) => {
                const Icon = locationIcons[key as keyof typeof locationIcons];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedLocation(key)}
                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all text-[9px] ${
                      selectedLocation === key
                        ? 'border-[#DAA520] bg-amber-50 text-[#B8860B]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5 mt-1.5">
              <Button
                onClick={handleCheckIn}
                disabled={actionLoading === 'checkin'}
                size="sm"
                className="flex-1 h-7 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-[10px]"
              >
                {actionLoading === 'checkin' ? '...' : <><LogIn className="h-3 w-3 mr-1" />Check In</>}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowLocationSelect(false)} className="h-7 text-[10px]">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showLocationSelect && !loading && (
          <div className="mb-3">
            {data?.attendance?.lastCheckOut && !data?.isCheckedIn ? (
              // Already checked out - show regularization link
              <div className="text-center space-y-1.5">
                <p className="text-[10px] text-gray-500">Checked out for today</p>
                <Link
                  href="/attendance?tab=regularization"
                  className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Clock className="h-3 w-3" />
                  Request Regularization
                </Link>
              </div>
            ) : !data?.isCheckedIn ? (
              <Button
                onClick={() => setShowLocationSelect(true)}
                size="sm"
                className="w-full h-8 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm text-xs"
              >
                <Play className="h-3.5 w-3.5 mr-1" />
                Check In
              </Button>
            ) : (
              <Button
                onClick={handleCheckOut}
                disabled={actionLoading === 'checkout'}
                size="sm"
                className="w-full h-8 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs"
              >
                {actionLoading === 'checkout' ? '...' : <><LogOut className="h-3.5 w-3.5 mr-1" />Check Out</>}
              </Button>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {[
            { icon: CheckSquare, label: 'Tasks', href: '/tasks', bg: 'bg-[#4CAF50]' },
            { icon: Briefcase, label: 'Projects', href: '/projects', bg: 'bg-[#2196F3]' },
            { icon: Calendar, label: 'Calendar', href: '/calendar', bg: 'bg-[#26A69A]' },
            { icon: FolderOpen, label: 'Drives', href: '/drives', bg: 'bg-[#F97316]' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="flex flex-col items-center gap-1 group">
                <div className={`${action.bg} rounded-lg p-2 transition-transform group-hover:scale-110 shadow-sm`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[8px] text-gray-400 group-hover:text-gray-600 transition-colors">{action.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer: Streak + Stats */}
        <div className="w-full flex items-center justify-between text-[9px] text-gray-400 pt-2 border-t border-amber-200/40">
          {loginStreak > 0 ? (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {loginStreak}-day streak
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-400" />
              {data?.weekHours || 0}h this week
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
      </div>
    </div>
  );
}
