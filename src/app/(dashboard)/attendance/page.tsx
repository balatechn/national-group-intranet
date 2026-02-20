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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getMonthlyAttendance,
  MonthlyAttendanceSummary,
  getAllEmployeesForAdmin,
  getCurrentUserRole,
  requestRegularization,
  getPendingRegularizations,
  getMyRegularizations,
  approveRegularization,
  rejectRegularization,
  RegularizationRequest,
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
  Users,
  FileEdit,
  Check,
  X,
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

function getRegStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    case 'APPROVED':
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

interface EmployeeOption {
  id: string;
  name: string;
  employeeId: string;
  department: string;
}

export default function AttendancePage() {
  const [data, setData] = useState<MonthlyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Admin features
  const [userRole, setUserRole] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  // Regularization
  const [showRegModal, setShowRegModal] = useState(false);
  const [regDate, setRegDate] = useState<Date | null>(null);
  const [regCheckIn, setRegCheckIn] = useState('');
  const [regCheckOut, setRegCheckOut] = useState('');
  const [regReason, setRegReason] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  
  // Pending regularizations (for admin)
  const [pendingRegs, setPendingRegs] = useState<RegularizationRequest[]>([]);
  const [myRegs, setMyRegs] = useState<RegularizationRequest[]>([]);
  const [activeTab, setActiveTab] = useState('attendance');
  
  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingReg, setReviewingReg] = useState<RegularizationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const isAdmin = userRole && ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'MANAGER'].includes(userRole);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [selectedMonth, selectedYear, selectedEmployeeId]);

  async function loadInitialData() {
    const [role, emps] = await Promise.all([
      getCurrentUserRole(),
      getAllEmployeesForAdmin(),
    ]);
    setUserRole(role);
    setEmployees(emps);
    
    if (role && ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'MANAGER'].includes(role)) {
      loadPendingRegs();
    }
    
    loadMyRegs();
  }

  async function loadAttendance() {
    setLoading(true);
    try {
      const result = await getMonthlyAttendance(
        selectedMonth, 
        selectedYear, 
        selectedEmployeeId || undefined
      );
      setData(result);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingRegs() {
    const regs = await getPendingRegularizations();
    setPendingRegs(regs);
  }

  async function loadMyRegs() {
    const regs = await getMyRegularizations();
    setMyRegs(regs);
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

  function openRegModal(date: Date) {
    setRegDate(date);
    setRegCheckIn('09:00');
    setRegCheckOut('18:00');
    setRegReason('');
    setShowRegModal(true);
  }

  async function submitRegularization() {
    if (!regDate || !regReason.trim()) return;
    
    setRegSubmitting(true);
    try {
      // Combine date with times
      const requestDate = new Date(regDate);
      
      let requestedCheckIn: Date | undefined;
      let requestedCheckOut: Date | undefined;
      
      if (regCheckIn) {
        const [hours, minutes] = regCheckIn.split(':').map(Number);
        requestedCheckIn = new Date(requestDate);
        requestedCheckIn.setHours(hours, minutes, 0, 0);
      }
      
      if (regCheckOut) {
        const [hours, minutes] = regCheckOut.split(':').map(Number);
        requestedCheckOut = new Date(requestDate);
        requestedCheckOut.setHours(hours, minutes, 0, 0);
      }
      
      const result = await requestRegularization({
        requestDate,
        requestedCheckIn,
        requestedCheckOut,
        reason: regReason,
      });
      
      if (result.success) {
        setShowRegModal(false);
        loadMyRegs();
        alert('Regularization request submitted successfully! An email has been sent to your manager/admin.');
      } else {
        alert(result.error || 'Failed to submit regularization request');
      }
    } catch (error) {
      console.error('Error submitting regularization:', error);
      alert('Failed to submit regularization request');
    } finally {
      setRegSubmitting(false);
    }
  }

  function openReviewModal(reg: RegularizationRequest, action: 'approve' | 'reject') {
    setReviewingReg(reg);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  }

  async function submitReview() {
    if (!reviewingReg) return;
    
    setReviewSubmitting(true);
    try {
      const result = reviewAction === 'approve'
        ? await approveRegularization(reviewingReg.id, reviewNotes)
        : await rejectRegularization(reviewingReg.id, reviewNotes);
      
      if (result.success) {
        setShowReviewModal(false);
        loadPendingRegs();
        loadAttendance();
        alert(`Regularization ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully!`);
      } else {
        alert(result.error || 'Failed to process regularization');
      }
    } catch (error) {
      console.error('Error processing regularization:', error);
      alert('Failed to process regularization');
    } finally {
      setReviewSubmitting(false);
    }
  }

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">
            Track your monthly attendance and work hours
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin Employee Selector */}
          {isAdmin && employees.length > 0 && (
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger className="w-[220px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="My Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">My Attendance</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Month Selector */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="my-requests">
            My Requests
            {myRegs.filter(r => r.status === 'PENDING').length > 0 && (
              <Badge className="ml-2 bg-yellow-500">{myRegs.filter(r => r.status === 'PENDING').length}</Badge>
            )}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pending">
              Pending Approvals
              {pendingRegs.length > 0 && (
                <Badge className="ml-2 bg-red-500">{pendingRegs.length}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
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
                    <p className="text-xs text-muted-foreground">after 9:15 AM</p>
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
                    <p className="text-xs text-muted-foreground">extra hours worked</p>
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
                    <p className="text-xs text-muted-foreground">of working days present</p>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Daily Attendance - {MONTHS[selectedMonth]} {selectedYear}
                    {selectedEmployeeId && employees.find(e => e.id === selectedEmployeeId) && (
                      <span className="ml-2 text-muted-foreground font-normal text-base">
                        ({employees.find(e => e.id === selectedEmployeeId)?.name})
                      </span>
                    )}
                  </CardTitle>
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
                          {!selectedEmployeeId && <TableHead>Action</TableHead>}
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

                          const needsRegularization = !att.firstCheckIn || !att.lastCheckOut;

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
                              {!selectedEmployeeId && (
                                <TableCell>
                                  {needsRegularization && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openRegModal(new Date(att.date))}
                                    >
                                      <FileEdit className="h-3 w-3 mr-1" />
                                      Regularize
                                    </Button>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No attendance records for {MONTHS[selectedMonth]} {selectedYear}</p>
                      {!selectedEmployeeId && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            const today = new Date();
                            if (today.getMonth() === selectedMonth && today.getFullYear() === selectedYear) {
                              openRegModal(today);
                            }
                          }}
                        >
                          <FileEdit className="h-4 w-4 mr-2" />
                          Request Regularization
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Regularization Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {myRegs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Check-In</TableHead>
                      <TableHead>Check-Out</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reviewed By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myRegs.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">
                          {new Date(reg.requestDate).toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>{formatTime(reg.requestedCheckIn)}</TableCell>
                        <TableCell>{formatTime(reg.requestedCheckOut)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{reg.reason}</TableCell>
                        <TableCell>{getRegStatusBadge(reg.status)}</TableCell>
                        <TableCell>
                          {reg.reviewer ? `${reg.reviewer.firstName} ${reg.reviewer.lastName}` : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{reg.reviewNotes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No regularization requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Regularization Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRegs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Check-In</TableHead>
                        <TableHead>Check-Out</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRegs.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">
                            {reg.user.firstName} {reg.user.lastName}
                            <div className="text-xs text-muted-foreground">{reg.user.employeeId}</div>
                          </TableCell>
                          <TableCell>
                            {new Date(reg.requestDate).toLocaleDateString('en-US', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>{formatTime(reg.requestedCheckIn)}</TableCell>
                          <TableCell>{formatTime(reg.requestedCheckOut)}</TableCell>
                          <TableCell className="max-w-[200px]">{reg.reason}</TableCell>
                          <TableCell>
                            {new Date(reg.createdAt).toLocaleDateString('en-US', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => openReviewModal(reg, 'approve')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => openReviewModal(reg, 'reject')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending regularization requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Regularization Request Modal */}
      <Dialog open={showRegModal} onOpenChange={setShowRegModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Attendance Regularization</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="text" 
                value={regDate ? regDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                }) : ''} 
                disabled 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regCheckIn">Check-In Time</Label>
                <Input
                  id="regCheckIn"
                  type="time"
                  value={regCheckIn}
                  onChange={(e) => setRegCheckIn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regCheckOut">Check-Out Time</Label>
                <Input
                  id="regCheckOut"
                  type="time"
                  value={regCheckOut}
                  onChange={(e) => setRegCheckOut(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="regReason">Reason *</Label>
              <Textarea
                id="regReason"
                placeholder="Please explain why you need to regularize this attendance..."
                value={regReason}
                onChange={(e) => setRegReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitRegularization} 
              disabled={regSubmitting || !regReason.trim()}
            >
              {regSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Regularization
            </DialogTitle>
          </DialogHeader>
          
          {reviewingReg && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>Employee:</strong> {reviewingReg.user.firstName} {reviewingReg.user.lastName}</p>
                <p><strong>Date:</strong> {new Date(reviewingReg.requestDate).toLocaleDateString()}</p>
                <p><strong>Check-In:</strong> {formatTime(reviewingReg.requestedCheckIn)}</p>
                <p><strong>Check-Out:</strong> {formatTime(reviewingReg.requestedCheckOut)}</p>
                <p><strong>Reason:</strong> {reviewingReg.reason}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Notes (optional)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder={reviewAction === 'reject' ? 'Please provide a reason for rejection...' : 'Add any notes...'}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitReview} 
              disabled={reviewSubmitting}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {reviewSubmitting ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
