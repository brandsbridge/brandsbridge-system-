"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo, useState } from "react";
import {
  Plus,
  Loader2,
  MoreVertical,
  Pencil,
  Eye,
  DollarSign,
  Handshake,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Banknote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { auditService } from "@/services/audit-service";
import { notificationService } from "@/services/notification-service";

type DealStatus = "lead" | "negotiation" | "active" | "fully_paid" | "cancelled";
type CommissionStatus = "pending" | "earned" | "pending_approval" | "approved" | "paid";

interface LinkedEmployee {
  employeeId: string;
  employeeName: string;
  commissionAmount: number;
  commissionStatus: CommissionStatus;
}

interface DealPayment {
  amount: number;
  date: string;
  notes: string;
  recordedAt: any;
}

interface Deal {
  id: string;
  dealName: string;
  clientId: string;
  clientName: string;
  totalValue: number;
  currency: string;
  status: DealStatus;
  salesEmployeeId: string;
  salesEmployeeName: string;
  salesCommissionPercentage: number;
  salesCommissionAmount: number;
  salesCommissionStatus: CommissionStatus;
  linkedRegularEmployees: LinkedEmployee[];
  clientOwnerId: string;
  clientOwnerName: string;
  referralCommissionPercentage: number;
  referralCommissionAmount: number;
  referralCommissionStatus: CommissionStatus;
  totalPaid: number;
  firstPaymentReceived: boolean;
  fullyPaid: boolean;
  payments: DealPayment[];
  createdAt?: any;
  updatedAt?: any;
}

const STATUS_CONFIG: Record<DealStatus, { label: string; color: string }> = {
  lead: { label: "Lead", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  negotiation: { label: "Negotiation", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  active: { label: "Active", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  fully_paid: { label: "Fully Paid", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const PIPELINE_STAGES: DealStatus[] = ["lead", "negotiation", "active", "fully_paid"];

export default function DealsPage() {
  const db = useFirestore();
  const { user } = useUser();

  // State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDealId, setPaymentDealId] = useState<string | null>(null);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [commissionDeal, setCommissionDeal] = useState<Deal | null>(null);

  // Form fields
  const [fDealName, setFDealName] = useState("");
  const [fClientId, setFClientId] = useState("");
  const [fTotalValue, setFTotalValue] = useState("");
  const [fCurrency, setFCurrency] = useState("QAR");
  const [fSalesEmployeeId, setFSalesEmployeeId] = useState("");
  const [fLinkedEmployees, setFLinkedEmployees] = useState<{ id: string; name: string; amount: number }[]>([]);
  const [fStatus, setFStatus] = useState<DealStatus>("lead");

  // Payment form
  const [pAmount, setPAmount] = useState("");
  const [pDate, setPDate] = useState(new Date().toISOString().split("T")[0]);
  const [pNotes, setPNotes] = useState("");

  // Commission form
  const [cSalesPercent, setCSalesPercent] = useState("");
  const [cReferralPercent, setCReferralPercent] = useState("");

  // Data
  const dealsQuery = useMemoFirebase(
    () => (user ? query(collection(db, "deals"), orderBy("createdAt", "desc")) : null),
    [db, user]
  );
  const { data: dealsData, isLoading } = useCollection(dealsQuery);
  const deals = useMemo<Deal[]>(() => (dealsData as any) || [], [dealsData]);

  const empQuery = useMemoFirebase(() => (user ? collection(db, "employees") : null), [db, user]);
  const { data: empData } = useCollection(empQuery);
  const allEmployees = useMemo(() => (empData || []) as any[], [empData]);
  const salesEmployees = useMemo(() => allEmployees.filter((e) => e.employeeType === "sales" && e.isActive !== false), [allEmployees]);
  const regularEmployees = useMemo(() => allEmployees.filter((e) => e.employeeType === "regular" && e.isActive !== false), [allEmployees]);

  const custQuery = useMemoFirebase(() => (user ? collection(db, "customers") : null), [db, user]);
  const { data: custData } = useCollection(custQuery);
  const customers = useMemo(() => (custData || []) as any[], [custData]);

  const resetForm = () => {
    setEditingId(null);
    setFDealName("");
    setFClientId("");
    setFTotalValue("");
    setFCurrency("QAR");
    setFSalesEmployeeId("");
    setFLinkedEmployees([]);
    setFStatus("lead");
  };

  const openEdit = (deal: Deal) => {
    setEditingId(deal.id);
    setFDealName(deal.dealName || "");
    setFClientId(deal.clientId || "");
    setFTotalValue(deal.totalValue?.toString() || "");
    setFCurrency(deal.currency || "QAR");
    setFSalesEmployeeId(deal.salesEmployeeId || "");
    setFLinkedEmployees(
      (deal.linkedRegularEmployees || []).map((le) => ({
        id: le.employeeId,
        name: le.employeeName,
        amount: le.commissionAmount,
      }))
    );
    setFStatus(deal.status || "lead");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fDealName.trim() || !fClientId || !fSalesEmployeeId) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Deal name, client, and sales employee are required." });
      return;
    }
    const salesEmp = salesEmployees.find((e: any) => e.id === fSalesEmployeeId);
    const client = customers.find((c: any) => c.id === fClientId);
    const linkedRegularEmployees: LinkedEmployee[] = fLinkedEmployees.map((le) => ({
      employeeId: le.id,
      employeeName: le.name,
      commissionAmount: le.amount || 0,
      commissionStatus: "pending" as CommissionStatus,
    }));

    const payload: any = {
      dealName: fDealName.trim(),
      clientId: fClientId,
      clientName: client?.name || client?.companyName || "",
      totalValue: parseFloat(fTotalValue) || 0,
      currency: fCurrency,
      status: fStatus,
      salesEmployeeId: fSalesEmployeeId,
      salesEmployeeName: salesEmp?.name || "",
      linkedRegularEmployees,
      clientOwnerId: salesEmp?.id || "",
      clientOwnerName: salesEmp?.name || "",
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "deals", editingId), { ...payload, updatedAt: Timestamp.now() });
        auditService.log(db, "update", "deals", editingId, `Deal "${fDealName}" updated`);
        toast({ title: "Deal Updated" });
      } else {
        payload.salesCommissionPercentage = 0;
        payload.salesCommissionAmount = 0;
        payload.salesCommissionStatus = "pending";
        payload.referralCommissionPercentage = 0;
        payload.referralCommissionAmount = 0;
        payload.referralCommissionStatus = "pending";
        payload.totalPaid = 0;
        payload.firstPaymentReceived = false;
        payload.fullyPaid = false;
        payload.payments = [];
        payload.createdAt = Timestamp.now();
        payload.updatedAt = Timestamp.now();
        const ref = doc(collection(db, "deals"));
        await setDoc(ref, payload);
        auditService.log(db, "create", "deals", ref.id, `Deal "${fDealName}" created`);
        toast({ title: "Deal Created" });
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDealId) return;
    const deal = deals.find((d) => d.id === paymentDealId);
    if (!deal) return;
    const amount = parseFloat(pAmount) || 0;
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount" });
      return;
    }

    const newTotalPaid = (deal.totalPaid || 0) + amount;
    const isFirstPayment = !deal.firstPaymentReceived;
    const isFullyPaid = newTotalPaid >= deal.totalValue;

    const newPayment: DealPayment = { amount, date: pDate, notes: pNotes.trim(), recordedAt: Timestamp.now() };
    const payments = [...(deal.payments || []), newPayment];

    const update: any = {
      totalPaid: newTotalPaid,
      payments,
      firstPaymentReceived: true,
      updatedAt: Timestamp.now(),
    };

    // If first payment → regular employee commissions become "earned"
    if (isFirstPayment && deal.linkedRegularEmployees?.length) {
      update.linkedRegularEmployees = deal.linkedRegularEmployees.map((le) => ({
        ...le,
        commissionStatus: "earned",
      }));
      // Create commission records for each linked regular employee
      for (const le of deal.linkedRegularEmployees) {
        const cRef = doc(collection(db, "commissions"));
        await setDoc(cRef, {
          employeeId: le.employeeId,
          employeeName: le.employeeName,
          dealId: deal.id,
          dealName: deal.dealName,
          type: "regular",
          amount: le.commissionAmount,
          status: "earned",
          earnedAt: Timestamp.now(),
          month: pDate.substring(0, 7),
          createdAt: Timestamp.now(),
        });
        notificationService.create(db, le.employeeId, "commission_earned", "Commission Earned", `You earned a commission of ${le.commissionAmount} ${deal.currency} from deal "${deal.dealName}"`, "/hr/commissions");
      }
    }

    if (isFullyPaid) {
      update.fullyPaid = true;
      update.status = "fully_paid";
      // Notify admin
      if (user?.uid) {
        notificationService.create(db, user.uid, "deal_fully_paid", "Deal Fully Paid", `Deal "${deal.dealName}" is now fully paid. Set commission percentages.`, "/hr/deals");
      }
    }

    try {
      await updateDoc(doc(db, "deals", paymentDealId), update);
      auditService.log(db, "payment", "deals", paymentDealId, `Payment of ${amount} ${deal.currency} recorded for "${deal.dealName}"`);
      toast({ title: "Payment Recorded", description: isFullyPaid ? "Deal is now fully paid!" : `${newTotalPaid} / ${deal.totalValue} paid` });
      setIsPaymentOpen(false);
      setPAmount("");
      setPNotes("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Payment Failed", description: err.message });
    }
  };

  const handleSetCommissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissionDeal) return;
    const deal = commissionDeal;
    const salesPct = parseFloat(cSalesPercent) || 0;
    const referralPct = parseFloat(cReferralPercent) || 0;
    const salesAmount = (deal.totalValue * salesPct) / 100;
    const referralAmount = (deal.totalValue * referralPct) / 100;

    try {
      await updateDoc(doc(db, "deals", deal.id), {
        salesCommissionPercentage: salesPct,
        salesCommissionAmount: salesAmount,
        salesCommissionStatus: "earned",
        referralCommissionPercentage: referralPct,
        referralCommissionAmount: referralAmount,
        referralCommissionStatus: referralAmount > 0 ? "earned" : "pending",
        updatedAt: Timestamp.now(),
      });

      // Create sales commission record
      if (salesAmount > 0) {
        const scRef = doc(collection(db, "commissions"));
        await setDoc(scRef, {
          employeeId: deal.salesEmployeeId,
          employeeName: deal.salesEmployeeName,
          dealId: deal.id,
          dealName: deal.dealName,
          type: "sales",
          amount: salesAmount,
          status: "earned",
          earnedAt: Timestamp.now(),
          month: new Date().toISOString().substring(0, 7),
          createdAt: Timestamp.now(),
        });
        notificationService.create(db, deal.salesEmployeeId, "commission_earned", "Sales Commission Earned", `You earned ${salesAmount.toFixed(2)} ${deal.currency} commission from deal "${deal.dealName}"`, "/hr/commissions");
      }

      // Create referral commission record
      if (referralAmount > 0 && deal.clientOwnerId) {
        const rrRef = doc(collection(db, "commissions"));
        await setDoc(rrRef, {
          employeeId: deal.clientOwnerId,
          employeeName: deal.clientOwnerName,
          dealId: deal.id,
          dealName: deal.dealName,
          type: "referral",
          amount: referralAmount,
          status: "earned",
          earnedAt: Timestamp.now(),
          month: new Date().toISOString().substring(0, 7),
          createdAt: Timestamp.now(),
        });
        notificationService.create(db, deal.clientOwnerId, "commission_earned", "Referral Commission Earned", `You earned ${referralAmount.toFixed(2)} ${deal.currency} referral commission from deal "${deal.dealName}"`, "/hr/commissions");
      }

      auditService.log(db, "set_commission", "deals", deal.id, `Commissions set: sales ${salesPct}%, referral ${referralPct}%`);
      toast({ title: "Commissions Set" });
      setIsCommissionOpen(false);
      setCommissionDeal(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message });
    }
  };

  const toggleLinkedEmployee = (empId: string, empName: string, checked: boolean) => {
    if (checked) {
      setFLinkedEmployees((prev) => [...prev, { id: empId, name: empName, amount: 0 }]);
    } else {
      setFLinkedEmployees((prev) => prev.filter((e) => e.id !== empId));
    }
  };

  const updateLinkedAmount = (empId: string, amount: number) => {
    setFLinkedEmployees((prev) => prev.map((e) => (e.id === empId ? { ...e, amount } : e)));
  };

  // Pipeline columns
  const pipeline = useMemo(() => {
    const cols: Record<DealStatus, Deal[]> = { lead: [], negotiation: [], active: [], fully_paid: [], cancelled: [] };
    for (const d of deals) {
      if (cols[d.status]) cols[d.status].push(d);
    }
    return cols;
  }, [deals]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Deal Pipeline</h1>
          <p className="text-muted-foreground">Track deals, record payments, and manage commissions.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Deal
        </Button>
      </div>

      {/* Pipeline Kanban */}
      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {PIPELINE_STAGES.map((stage) => (
            <Card key={stage} className="min-h-[300px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">{STATUS_CONFIG[stage].label}</CardTitle>
                  <Badge variant="outline" className="text-xs">{pipeline[stage].length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pipeline[stage].map((deal) => (
                  <div key={deal.id} className="rounded-lg border p-3 space-y-2 bg-card hover:border-primary/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{deal.dealName}</p>
                        <p className="text-xs text-muted-foreground truncate">{deal.clientName}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onCloseAutoFocus={(ev) => ev.preventDefault()}>
                          <DropdownMenuItem onSelect={() => setTimeout(() => setViewingDeal(deal), 0)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setTimeout(() => openEdit(deal), 0)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {deal.status !== "fully_paid" && deal.status !== "cancelled" && (
                            <DropdownMenuItem onSelect={() => setTimeout(() => { setPaymentDealId(deal.id); setIsPaymentOpen(true); }, 0)}>
                              <Banknote className="mr-2 h-4 w-4" /> Record Payment
                            </DropdownMenuItem>
                          )}
                          {deal.fullyPaid && (
                            <DropdownMenuItem onSelect={() => setTimeout(() => { setCommissionDeal(deal); setCSalesPercent(deal.salesCommissionPercentage?.toString() || ""); setCReferralPercent(deal.referralCommissionPercentage?.toString() || ""); setIsCommissionOpen(true); }, 0)}>
                              <DollarSign className="mr-2 h-4 w-4" /> Set Commissions
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{deal.salesEmployeeName}</span>
                      <span className="font-bold">{deal.totalValue?.toLocaleString()} {deal.currency}</span>
                    </div>
                    {deal.totalPaid > 0 && (
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (deal.totalPaid / deal.totalValue) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                ))}
                {pipeline[stage].length === 0 && (
                  <p className="text-center text-xs text-muted-foreground italic py-8">No deals</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New / Edit Deal Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Deal" : "New Deal"}</DialogTitle>
              <DialogDescription>Create or modify a deal in the pipeline.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Deal Name</Label>
                <Input id="deal-name" value={fDealName} onChange={(e) => setFDealName(e.target.value)} required placeholder="e.g. Q2 Wholesale Contract" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Client</Label>
                <Select value={fClientId} onValueChange={setFClientId}>
                  <SelectTrigger id="deal-client"><SelectValue placeholder="Select client..." /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name || c.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Total Value</Label>
                  <Input id="deal-value" type="number" step="0.01" value={fTotalValue} onChange={(e) => setFTotalValue(e.target.value)} required placeholder="50000" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Currency</Label>
                  <Select value={fCurrency} onValueChange={setFCurrency}>
                    <SelectTrigger id="deal-currency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QAR">QAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="SAR">SAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Sales Employee</Label>
                  <Select value={fSalesEmployeeId} onValueChange={setFSalesEmployeeId}>
                    <SelectTrigger id="deal-sales-emp"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {salesEmployees.map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editingId && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Status</Label>
                    <Select value={fStatus} onValueChange={(v: any) => setFStatus(v)}>
                      <SelectTrigger id="deal-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="fully_paid">Fully Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {/* Linked Regular Employees */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Link Regular Employees</Label>
                <div className="rounded-md border p-3 space-y-2 max-h-[200px] overflow-y-auto">
                  {regularEmployees.length === 0 && <p className="text-xs text-muted-foreground">No regular employees available</p>}
                  {regularEmployees.map((emp: any) => {
                    const isLinked = fLinkedEmployees.some((le) => le.id === emp.id);
                    return (
                      <div key={emp.id} className="flex items-center gap-3">
                        <Checkbox
                          checked={isLinked}
                          onCheckedChange={(checked) => toggleLinkedEmployee(emp.id, emp.name, !!checked)}
                        />
                        <span className="text-sm flex-1">{emp.name}</span>
                        {isLinked && (
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28 h-8 text-xs"
                            placeholder="Commission"
                            value={fLinkedEmployees.find((le) => le.id === emp.id)?.amount || ""}
                            onChange={(e) => updateLinkedAmount(emp.id, parseFloat(e.target.value) || 0)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingId ? "Save Changes" : "Create Deal"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={(open) => { setIsPaymentOpen(open); if (!open) setPaymentDealId(null); }}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleRecordPayment}>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                {paymentDealId && (() => {
                  const d = deals.find((d) => d.id === paymentDealId);
                  return d ? `${d.dealName} — Paid: ${d.totalPaid?.toLocaleString()} / ${d.totalValue?.toLocaleString()} ${d.currency}` : "";
                })()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Amount</Label>
                <Input id="pay-amount" type="number" step="0.01" value={pAmount} onChange={(e) => setPAmount(e.target.value)} required placeholder="10000" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Date</Label>
                <Input id="pay-date" type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Notes</Label>
                <Input id="pay-notes" value={pNotes} onChange={(e) => setPNotes(e.target.value)} placeholder="Wire transfer ref #123" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Commissions Dialog */}
      <Dialog open={isCommissionOpen} onOpenChange={(open) => { setIsCommissionOpen(open); if (!open) setCommissionDeal(null); }}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleSetCommissions}>
            <DialogHeader>
              <DialogTitle>Set Commissions</DialogTitle>
              <DialogDescription>
                {commissionDeal ? `${commissionDeal.dealName} — Total: ${commissionDeal.totalValue?.toLocaleString()} ${commissionDeal.currency}` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Sales Commission %</Label>
                <Input id="comm-sales" type="number" step="0.01" value={cSalesPercent} onChange={(e) => setCSalesPercent(e.target.value)} placeholder="e.g. 5" />
                {commissionDeal && cSalesPercent && (
                  <p className="text-xs text-muted-foreground">= {((commissionDeal.totalValue * parseFloat(cSalesPercent)) / 100).toFixed(2)} {commissionDeal.currency}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Referral Commission %</Label>
                <Input id="comm-referral" type="number" step="0.01" value={cReferralPercent} onChange={(e) => setCReferralPercent(e.target.value)} placeholder="e.g. 2" />
                {commissionDeal && cReferralPercent && (
                  <p className="text-xs text-muted-foreground">= {((commissionDeal.totalValue * parseFloat(cReferralPercent)) / 100).toFixed(2)} {commissionDeal.currency} (to {commissionDeal.clientOwnerName || "N/A"})</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCommissionOpen(false)}>Cancel</Button>
              <Button type="submit">Save Commissions</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Sheet */}
      <Sheet open={!!viewingDeal} onOpenChange={(open) => { if (!open) setViewingDeal(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {viewingDeal && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{viewingDeal.dealName}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Status">
                    <Badge variant="outline" className={STATUS_CONFIG[viewingDeal.status]?.color}>{STATUS_CONFIG[viewingDeal.status]?.label}</Badge>
                  </DetailField>
                  <DetailField label="Currency">{viewingDeal.currency}</DetailField>
                  <DetailField label="Total Value">{viewingDeal.totalValue?.toLocaleString()} {viewingDeal.currency}</DetailField>
                  <DetailField label="Total Paid">{viewingDeal.totalPaid?.toLocaleString()} {viewingDeal.currency}</DetailField>
                  <DetailField label="Client">{viewingDeal.clientName}</DetailField>
                  <DetailField label="Sales Agent">{viewingDeal.salesEmployeeName}</DetailField>
                  <DetailField label="Client Owner">{viewingDeal.clientOwnerName || "N/A"}</DetailField>
                </div>

                {/* Commissions */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sales Commission</h4>
                  <div className="rounded-md border p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span>Percentage:</span><span className="font-bold">{viewingDeal.salesCommissionPercentage || 0}%</span></div>
                    <div className="flex justify-between"><span>Amount:</span><span className="font-bold">{viewingDeal.salesCommissionAmount?.toLocaleString() || 0} {viewingDeal.currency}</span></div>
                    <div className="flex justify-between"><span>Status:</span><Badge variant="outline" className="text-xs capitalize">{viewingDeal.salesCommissionStatus || "pending"}</Badge></div>
                  </div>
                </div>

                {viewingDeal.referralCommissionAmount > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Referral Commission</h4>
                    <div className="rounded-md border p-3 text-sm space-y-1">
                      <div className="flex justify-between"><span>To:</span><span className="font-bold">{viewingDeal.clientOwnerName}</span></div>
                      <div className="flex justify-between"><span>Percentage:</span><span className="font-bold">{viewingDeal.referralCommissionPercentage}%</span></div>
                      <div className="flex justify-between"><span>Amount:</span><span className="font-bold">{viewingDeal.referralCommissionAmount?.toLocaleString()} {viewingDeal.currency}</span></div>
                    </div>
                  </div>
                )}

                {/* Linked Employees */}
                {viewingDeal.linkedRegularEmployees?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Linked Employees</h4>
                    <div className="space-y-2">
                      {viewingDeal.linkedRegularEmployees.map((le, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md border p-2 text-sm">
                          <span>{le.employeeName}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{le.commissionAmount?.toLocaleString()} {viewingDeal.currency}</span>
                            <Badge variant="outline" className="text-xs capitalize">{le.commissionStatus}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment History */}
                {viewingDeal.payments?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment History</h4>
                    <div className="space-y-2">
                      {viewingDeal.payments.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between rounded-md border p-2 text-sm">
                          <span className="text-muted-foreground">{p.date}</span>
                          <span className="font-bold">{p.amount?.toLocaleString()} {viewingDeal.currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => { setViewingDeal(null); setTimeout(() => openEdit(viewingDeal), 150); }}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  {viewingDeal.status !== "fully_paid" && viewingDeal.status !== "cancelled" && (
                    <Button className="flex-1" onClick={() => { setViewingDeal(null); setTimeout(() => { setPaymentDealId(viewingDeal.id); setIsPaymentOpen(true); }, 150); }}>
                      <Banknote className="mr-2 h-4 w-4" /> Record Payment
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}
