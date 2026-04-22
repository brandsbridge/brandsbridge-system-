"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo, useState } from "react";
import {
  CalendarCheck,
  Plus,
  Loader2,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, setDoc, query, where, orderBy, Timestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: number;
  status: string;
  lateMinutes: number;
  overtimeHours: number;
  notes: string;
  createdAt?: any;
}

const WORK_START = "08:00";
const STANDARD_HOURS = 7;

function calcAttendance(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return { hoursWorked: 0, status: "absent", lateMinutes: 0, overtimeHours: 0 };
  const [inH, inM] = checkIn.split(":").map(Number);
  const [outH, outM] = checkOut.split(":").map(Number);
  const hoursWorked = Math.max(0, (outH + outM / 60) - (inH + inM / 60));
  const [startH, startM] = WORK_START.split(":").map(Number);
  const startMin = startH * 60 + startM;
  const inMin = inH * 60 + inM;
  const lateMinutes = Math.max(0, inMin - startMin);
  let status = "present";
  if (hoursWorked === 0) status = "absent";
  else if (hoursWorked < 6) status = "late";
  const overtimeHours = Math.max(0, hoursWorked - STANDARD_HOURS);
  return { hoursWorked: Math.round(hoursWorked * 100) / 100, status, lateMinutes, overtimeHours: Math.round(overtimeHours * 100) / 100 };
}

export default function AttendancePage() {
  const db = useFirestore();
  const { user } = useUser();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formEmployee, setFormEmployee] = useState("");
  const [formDate, setFormDate] = useState(now.toISOString().split("T")[0]);
  const [formCheckIn, setFormCheckIn] = useState("08:00");
  const [formCheckOut, setFormCheckOut] = useState("16:00");
  const [formNotes, setFormNotes] = useState("");

  // Load employees (only active, regular type for attendance)
  const empQuery = useMemoFirebase(() => (user ? collection(db, "employees") : null), [db, user]);
  const { data: allEmployees } = useCollection(empQuery);
  const activeEmployees = useMemo(() => (allEmployees || []).filter((e: any) => e.isActive !== false), [allEmployees]);

  // Load attendance for selected month
  const monthStart = `${selectedMonth}-01`;
  const [y, m] = selectedMonth.split("-").map(Number);
  const monthEnd = `${selectedMonth}-${new Date(y, m, 0).getDate()}`;

  const attendanceQuery = useMemoFirebase(
    () => (user ? query(collection(db, "attendance"), where("date", ">=", monthStart), where("date", "<=", monthEnd), orderBy("date", "desc")) : null),
    [db, user, monthStart, monthEnd]
  );
  const { data: attendanceData, isLoading } = useCollection(attendanceQuery);
  const records = useMemo<AttendanceRecord[]>(() => (attendanceData as any) || [], [attendanceData]);

  // Summary
  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const lateCount = records.filter((r) => r.status === "late" || r.lateMinutes > 0).length;
  const totalOvertime = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployee) {
      toast({ variant: "destructive", title: "Select Employee" });
      return;
    }
    const emp = activeEmployees.find((e: any) => e.id === formEmployee);
    if (!emp) return;
    const calc = calcAttendance(formCheckIn, formCheckOut);
    try {
      const ref = doc(collection(db, "attendance"));
      await setDoc(ref, {
        employeeId: formEmployee,
        employeeName: (emp as any).name,
        date: formDate,
        checkIn: formCheckIn,
        checkOut: formCheckOut,
        ...calc,
        notes: formNotes.trim(),
        createdAt: Timestamp.now(),
      });
      toast({ title: "Attendance Recorded" });
      setIsFormOpen(false);
      setFormNotes("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "present": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><UserCheck className="h-3 w-3 mr-1" />Present</Badge>;
      case "absent": return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><UserX className="h-3 w-3 mr-1" />Absent</Badge>;
      case "late": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Late</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calendar grid: rows = employees, cols = days
  const daysInMonth = new Date(y, m, 0).getDate();
  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarData = useMemo(() => {
    const map: Record<string, Record<number, string>> = {};
    for (const r of records) {
      if (!map[r.employeeId]) map[r.employeeId] = {};
      const day = parseInt(r.date.split("-")[2]);
      map[r.employeeId][day] = r.status;
    }
    return map;
  }, [records]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Attendance Tracking</h1>
          <p className="text-muted-foreground">Track employee attendance, late arrivals, and overtime.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            id="month-picker"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-44"
          />
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Record Attendance
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription className="text-[10px] uppercase font-bold tracking-widest">Present</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{presentCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription className="text-[10px] uppercase font-bold tracking-widest">Absent</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-500">{absentCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription className="text-[10px] uppercase font-bold tracking-widest">Late Arrivals</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-500">{lateCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription className="text-[10px] uppercase font-bold tracking-widest">Total Overtime (hrs)</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-500">{totalOvertime.toFixed(1)}</div></CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Calendar</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : activeEmployees.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground italic">No active employees found.</p>
          ) : (
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 border border-border sticky left-0 bg-background z-10 min-w-[140px]">Employee</th>
                  {dayHeaders.map((d) => (
                    <th key={d} className="p-1 border border-border text-center min-w-[28px]">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeEmployees.map((emp: any) => (
                  <tr key={emp.id}>
                    <td className="p-2 border border-border font-medium sticky left-0 bg-background z-10">{emp.name}</td>
                    {dayHeaders.map((d) => {
                      const status = calendarData[emp.id]?.[d];
                      let bg = "";
                      if (status === "present") bg = "bg-green-500/30";
                      else if (status === "absent") bg = "bg-red-500/30";
                      else if (status === "late") bg = "bg-yellow-500/30";
                      return <td key={d} className={`p-1 border border-border text-center ${bg}`}>{status ? status[0].toUpperCase() : ""}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Detailed Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attendance Records</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Late (min)</TableHead>
                <TableHead>Overtime (hrs)</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.date}</TableCell>
                  <TableCell>{r.employeeName}</TableCell>
                  <TableCell>{r.checkIn || "-"}</TableCell>
                  <TableCell>{r.checkOut || "-"}</TableCell>
                  <TableCell>{r.hoursWorked?.toFixed(1)}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell>{r.lateMinutes > 0 ? <span className="text-yellow-500">{r.lateMinutes}</span> : "-"}</TableCell>
                  <TableCell>{r.overtimeHours > 0 ? <span className="text-blue-500">{r.overtimeHours.toFixed(1)}</span> : "-"}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{r.notes || "-"}</TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground italic">
                    No attendance records for this month.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Record Attendance Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Record Attendance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Employee</Label>
                <Select value={formEmployee} onValueChange={setFormEmployee}>
                  <SelectTrigger id="att-employee"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Date</Label>
                <Input id="att-date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Check In</Label>
                  <Input id="att-checkin" type="time" value={formCheckIn} onChange={(e) => setFormCheckIn(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Check Out</Label>
                  <Input id="att-checkout" type="time" value={formCheckOut} onChange={(e) => setFormCheckOut(e.target.value)} />
                </div>
              </div>
              {formCheckIn && formCheckOut && (() => {
                const c = calcAttendance(formCheckIn, formCheckOut);
                return (
                  <div className="rounded-md border p-3 space-y-1 text-sm bg-muted/30">
                    <div className="flex justify-between"><span className="text-muted-foreground">Hours Worked:</span><span className="font-bold">{c.hoursWorked.toFixed(1)}h</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className="font-bold capitalize">{c.status}</span></div>
                    {c.lateMinutes > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Late:</span><span className="font-bold text-yellow-500">{c.lateMinutes} min</span></div>}
                    {c.overtimeHours > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Overtime:</span><span className="font-bold text-blue-500">{c.overtimeHours.toFixed(1)}h</span></div>}
                  </div>
                );
              })()}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Notes (optional)</Label>
                <Input id="att-notes" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="e.g. Doctor appointment" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
