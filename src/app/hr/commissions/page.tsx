"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo, useState } from "react";
import {
  Coins,
  Loader2,
  CheckCircle2,
  Clock,
  Banknote,
  Filter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import {
  collection,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { auditService } from "@/services/audit-service";
import { notificationService } from "@/services/notification-service";

type CommissionType = "regular" | "sales" | "referral";
type CommissionStatusType = "earned" | "pending_approval" | "approved" | "paid";

interface Commission {
  id: string;
  employeeId: string;
  employeeName: string;
  dealId: string;
  dealName: string;
  type: CommissionType;
  amount: number;
  status: CommissionStatusType;
  earnedAt?: any;
  approvedAt?: any;
  approvedBy?: string;
  paidAt?: any;
  month: string;
  createdAt?: any;
}

const STATUS_BADGE: Record<CommissionStatusType, { label: string; color: string; icon: any }> = {
  earned: { label: "Earned", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Coins },
  pending_approval: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  paid: { label: "Paid", color: "bg-teal-500/10 text-teal-500 border-teal-500/20", icon: Banknote },
};

const TYPE_BADGE: Record<CommissionType, string> = {
  regular: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  sales: "bg-green-500/10 text-green-500 border-green-500/20",
  referral: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export default function CommissionsPage() {
  const db = useFirestore();
  const { user } = useUser();

  const now = new Date();
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterMonth, setFilterMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const commissionsQuery = useMemoFirebase(
    () => (user ? query(collection(db, "commissions"), orderBy("createdAt", "desc")) : null),
    [db, user]
  );
  const { data: commissionsData, isLoading } = useCollection(commissionsQuery);
  const allCommissions = useMemo<Commission[]>(() => (commissionsData as any) || [], [commissionsData]);

  const empQuery = useMemoFirebase(() => (user ? collection(db, "employees") : null), [db, user]);
  const { data: empData } = useCollection(empQuery);
  const employees = useMemo(() => (empData || []) as any[], [empData]);

  // Apply filters
  const filtered = useMemo(() => {
    return allCommissions.filter((c) => {
      if (filterEmployee !== "all" && c.employeeId !== filterEmployee) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterType !== "all" && c.type !== filterType) return false;
      if (filterMonth && c.month !== filterMonth) return false;
      return true;
    });
  }, [allCommissions, filterEmployee, filterStatus, filterType, filterMonth]);

  // Summary for current month
  const monthCommissions = useMemo(() => allCommissions.filter((c) => c.month === filterMonth), [allCommissions, filterMonth]);
  const totalEarned = monthCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalApproved = monthCommissions.filter((c) => c.status === "approved" || c.status === "paid").reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPaid = monthCommissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + (c.amount || 0), 0);

  const handleApprove = async (comm: Commission) => {
    try {
      await updateDoc(doc(db, "commissions", comm.id), {
        status: "approved",
        approvedAt: Timestamp.now(),
        approvedBy: user?.email || user?.uid || "admin",
      });
      auditService.log(db, "approve_commission", "commissions", comm.id, `Commission of ${comm.amount} for ${comm.employeeName} approved`);
      notificationService.create(db, comm.employeeId, "commission_approved", "Commission Approved", `Your ${comm.type} commission of ${comm.amount} from deal "${comm.dealName}" has been approved.`, "/hr/commissions");
      toast({ title: "Commission Approved" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Approve Failed", description: err.message });
    }
  };

  const handleMarkPaid = async (comm: Commission) => {
    if (comm.status !== "approved") {
      toast({ variant: "destructive", title: "Cannot Pay", description: "Commission must be approved before marking as paid." });
      return;
    }
    try {
      await updateDoc(doc(db, "commissions", comm.id), {
        status: "paid",
        paidAt: Timestamp.now(),
      });
      auditService.log(db, "pay_commission", "commissions", comm.id, `Commission of ${comm.amount} paid to ${comm.employeeName}`);
      toast({ title: "Commission Marked as Paid" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Commission Management</h1>
          <p className="text-muted-foreground">Review, approve, and pay employee commissions.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardDescription className="text-[10px] uppercase font-bold tracking-widest">Total Earned (Month)</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-500">{totalEarned.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription className="text-[10px] uppercase font-bold tracking-widest">Total Approved</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{totalApproved.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription className="text-[10px] uppercase font-bold tracking-widest">Total Paid</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-teal-500">{totalPaid.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest">Month</Label>
              <Input id="comm-month" type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest">Employee</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger id="comm-emp-filter" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="comm-status-filter" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="comm-type-filter" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Commissions</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Deal</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((comm) => {
                const sConfig = STATUS_BADGE[comm.status] || STATUS_BADGE.earned;
                const Icon = sConfig.icon;
                return (
                  <TableRow key={comm.id}>
                    <TableCell className="font-medium">{comm.month}</TableCell>
                    <TableCell>{comm.employeeName}</TableCell>
                    <TableCell className="text-muted-foreground">{comm.dealName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] uppercase ${TYPE_BADGE[comm.type]}`}>{comm.type}</Badge>
                    </TableCell>
                    <TableCell className="font-bold">{comm.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={sConfig.color}>
                        <Icon className="h-3 w-3 mr-1" />{sConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(comm.status === "earned" || comm.status === "pending_approval") && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-green-500 border-green-500/30" onClick={() => handleApprove(comm)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        )}
                        {comm.status === "approved" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-teal-500 border-teal-500/30" onClick={() => handleMarkPaid(comm)}>
                            <Banknote className="h-3 w-3 mr-1" /> Mark Paid
                          </Button>
                        )}
                        {comm.status === "paid" && (
                          <span className="text-xs text-muted-foreground italic">Completed</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                    No commissions found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
