"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Wallet,
  Plus,
  Loader2,
  MoreVertical,
  Banknote,
  Download,
  Link as LinkIcon,
  Unlink,
  Search,
  Filter,
  FileSpreadsheet,
  ArrowRight,
  Upload,
  X,
  FileText as FileIcon,
  Eye,
  CheckCircle
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, updateDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { paymentService } from "@/services/payment-service";
import { accountingService } from "@/services/accounting-service";
import { currencyService, SUPPORTED_CURRENCIES, type CurrencyCode, type ExchangeRates } from "@/services/currency-service";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";

export default function PaymentsPage() {
  const { user } = useUser();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkingModalOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<CurrencyCode>('USD');
  const [paymentAmount, setPaymentAmount] = useState<string>('0');

  // Linking State
  const [linkingAdvanceId, setLinkingAdvanceId] = useState<string | null>(null);
  const [linkingCustomerName, setLinkingCustomerName] = useState<string | null>(null);

  // Staff Advance State
  const [isStaffAdvanceModalOpen, setIsStaffAdvanceModalOpen] = useState(false);
  const [staffAdvanceDate, setStaffAdvanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [staffReceiptFile, setStaffReceiptFile] = useState<File | null>(null);
  const [staffReceiptPreview, setStaffReceiptPreview] = useState<string | null>(null);
  const [staffUploadProgress, setStaffUploadProgress] = useState<number | null>(null);
  const [staffReceiptFileName, setStaffReceiptFileName] = useState<string | null>(null);
  const staffFileInputRef = useRef<HTMLInputElement>(null);

  // Log Filter State
  const [logTypeFilter, setLogTypeFilter] = useState("all");
  const [logNameFilter, setLogNameFilter] = useState("all");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
    currencyService.fetchLatestRates(db).then(setExchangeRates);
  }, []);

  // --- Fetch Data ---
  const paymentsQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "payments");
    return currentUser.department === 'all' 
      ? colRef 
      : query(colRef, where("department", "==", currentUser.department));
  }, [user, currentUser]);

  const advancesQuery = useMemoFirebase(() => user ? collection(db, "customer_advances") : null, [user]);
  const invoicesQuery = useMemoFirebase(() => user ? collection(db, "invoices") : null, [user]);
  const creditsQuery = useMemoFirebase(() => user ? collection(db, "credit_notes") : null, [user]);
  const customersQuery = useMemoFirebase(() => user ? collection(db, "customers") : null, [user]);
  const suppliersQuery = useMemoFirebase(() => user ? collection(db, "suppliers") : null, [user]);
  const employeesQuery = useMemoFirebase(() => user ? collection(db, "employees") : null, [user]);
  const staffAdvancesQuery = useMemoFirebase(() => user ? collection(db, "staff_advances") : null, [user]);

  const { data: paymentsData, isLoading: loadingPayments } = useCollection(paymentsQuery);
  const { data: advancesData, isLoading: loadingAdvances } = useCollection(advancesQuery);
  const { data: invoicesData } = useCollection(invoicesQuery);
  const { data: creditsData } = useCollection(creditsQuery);
  const { data: customers } = useCollection(customersQuery);
  const { data: suppliers } = useCollection(suppliersQuery);
  const { data: employeesData } = useCollection(employeesQuery);
  const { data: staffAdvancesData, isLoading: loadingStaffAdvances } = useCollection(staffAdvancesQuery);

  const employees = employeesData || [];
  const staffAdvances = staffAdvancesData || [];

  const payments = paymentsData || [];
  const advances = advancesData || [];
  const invoices = invoicesData || [];
  const credits = creditsData || [];

  // --- Handlers ---
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = parseFloat(paymentAmount) || 0;
    const rate = exchangeRates?.rates[paymentCurrency] || 1;
    
    const data = {
      userId: user?.uid,
      partyName: formData.get('partyName'),
      amount: amount,
      currency: paymentCurrency,
      exchangeRateAtPayment: rate,
      totalUSD: amount / rate,
      type: formData.get('type'),
      method: formData.get('method'),
      reference: formData.get('reference') || `REF-${Date.now().toString().slice(-4)}`,
      department: currentUser?.department || 'all',
      date: new Date().toISOString()
    };

    paymentService.createPayment(db, data);
    setIsPaymentModalOpen(false);
    toast({ title: "Payment Recorded", description: `Settlement of ${paymentCurrency} ${amount} saved.` });
  };

  const handleRecordAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      userId: user?.uid,
      customerName: formData.get('customerName'),
      amount: parseFloat(formData.get('amount') as string),
      reference: formData.get('reference'),
      paymentMethod: formData.get('method'),
      date: new Date().toISOString()
    };

    accountingService.recordAdvance(db, data);
    setIsAdvanceModalOpen(false);
    toast({ title: "Advance Recorded", description: `Pre-payment from ${data.customerName} saved.` });
  };

  const handleLinkToInvoice = async (invoiceId: string) => {
    if (!linkingAdvanceId) return;
    try {
      const docRef = doc(db, "customer_advances", linkingAdvanceId);
      await updateDoc(docRef, { invoiceId, updatedAt: new Date().toISOString() });
      setIsLinkingModalOpen(false);
      setLinkingAdvanceId(null);
      toast({ title: "Advance Linked", description: "Payment has been allocated to the invoice." });
    } catch (e) {
      toast({ variant: "destructive", title: "Linking Failed" });
    }
  };

  const handleUnlink = async (advanceId: string) => {
    try {
      const docRef = doc(db, "customer_advances", advanceId);
      await updateDoc(docRef, { invoiceId: null, updatedAt: new Date().toISOString() });
      toast({ title: "Advance Unlinked", description: "Payment is now available for new allocation." });
    } catch (e) {
      toast({ variant: "destructive", title: "Unlinking Failed" });
    }
  };

  // --- Staff Advance Handlers ---
  const handleStaffReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Only JPG, PNG, and PDF files are accepted." });
      return;
    }
    setStaffReceiptFile(file);
    setStaffReceiptFileName(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setStaffReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setStaffReceiptPreview(null);
    }
  };

  const removeStaffReceipt = () => {
    setStaffReceiptFile(null);
    setStaffReceiptPreview(null);
    setStaffReceiptFileName(null);
    setStaffUploadProgress(null);
    if (staffFileInputRef.current) staffFileInputRef.current.value = '';
  };

  const handleRecordStaffAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const advanceId = doc(collection(db, "staff_advances")).id;

    let receiptUrl: string | null = null;
    if (staffReceiptFile) {
      try {
        receiptUrl = await new Promise<string>((resolve, reject) => {
          const storageRef = ref(storage, `staff-advances/${advanceId}/receipt`);
          const uploadTask = uploadBytesResumable(storageRef, staffReceiptFile);
          uploadTask.on('state_changed',
            (snapshot) => setStaffUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
            (error) => { toast({ variant: "destructive", title: "Upload failed", description: error.message }); reject(error); },
            async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); resolve(url); }
          );
        });
      } catch { return; }
    }

    const employeeId = formData.get('employeeId') as string;
    const employeeName = employees.find((emp: any) => emp.id === employeeId)?.name || '';

    const data: any = {
      employeeId,
      employeeName,
      date: Timestamp.fromDate(new Date(staffAdvanceDate)),
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') || 'USD',
      purpose: formData.get('purpose'),
      category: formData.get('category'),
      paidThrough: formData.get('paidThrough'),
      notes: formData.get('notes') || '',
      status: 'pending',
      reimbursedDate: null,
      createdAt: Timestamp.now(),
    };
    if (receiptUrl) {
      data.receiptUrl = receiptUrl;
      data.receiptFileName = staffReceiptFileName;
    }

    await setDoc(doc(db, "staff_advances", advanceId), data);
    setIsStaffAdvanceModalOpen(false);
    toast({ title: "Staff Advance Recorded", description: `Advance for ${employeeName} saved.` });
  };

  const handleMarkReimbursed = async (id: string) => {
    try {
      await updateDoc(doc(db, "staff_advances", id), {
        status: 'reimbursed',
        reimbursedDate: Timestamp.now(),
      });
      toast({ title: "Status Updated", description: "Advance marked as reimbursed." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err.message });
    }
  };

  // Reset staff advance form on modal toggle
  useEffect(() => {
    if (isStaffAdvanceModalOpen) {
      setStaffAdvanceDate(new Date().toISOString().split('T')[0]);
      setStaffReceiptFile(null);
      setStaffReceiptPreview(null);
      setStaffReceiptFileName(null);
      setStaffUploadProgress(null);
    }
  }, [isStaffAdvanceModalOpen]);

  const handleExportCSV = () => {
    if (filteredLog.length === 0) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    const data = filteredLog.map(l => ({
      Date: new Date(l.date).toLocaleDateString(),
      Party: l.name,
      Type: l.type,
      Amount: l.amount,
      Currency: l.currency,
      Status: l.status,
      Reference: l.invoice || '-'
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `payment_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Log Exported", description: "CSV file has been generated." });
  };

  // --- Filtered Data ---
  const usdPreview = useMemo(() => {
    if (!exchangeRates) return 0;
    return parseFloat(paymentAmount) / (exchangeRates.rates[paymentCurrency] || 1);
  }, [paymentAmount, paymentCurrency, exchangeRates]);

  const availableInvoicesForLinking = useMemo(() => {
    if (!linkingCustomerName) return [];
    return invoices.filter(i => 
      i.customerName === linkingCustomerName && 
      i.status !== 'paid' &&
      !advances.some(a => a.invoiceId === i.id)
    );
  }, [invoices, linkingCustomerName, advances]);

  const combinedLog = useMemo(() => {
    const p = payments.map(pay => ({
      id: pay.id,
      date: pay.date,
      name: pay.partyName,
      type: pay.type === 'received' ? 'Inward Payment' : 'Outward Settlement',
      amount: pay.amount,
      currency: pay.currency || 'USD',
      status: 'Settled',
      invoice: pay.reference,
      category: pay.type === 'received' ? 'customer' : 'supplier'
    }));

    const a = advances.map(adv => ({
      id: adv.id,
      date: adv.date,
      name: adv.customerName,
      type: 'Customer Advance',
      amount: adv.amount,
      currency: 'USD',
      status: adv.invoiceId ? 'Applied' : 'Available',
      invoice: adv.invoiceId ? invoices.find(i => i.id === adv.invoiceId)?.number : '-',
      category: 'customer'
    }));

    const c = credits.map(cred => ({
      id: cred.id,
      date: cred.date,
      name: cred.customerName,
      type: 'Credit Note',
      amount: cred.amount,
      currency: 'USD',
      status: cred.status,
      invoice: cred.invoiceId,
      category: 'customer'
    }));

    return [...p, ...a, ...c].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
  }, [payments, advances, credits, invoices]);

  const filteredLog = useMemo(() => {
    return combinedLog.filter(l => {
      const matchesType = logTypeFilter === 'all' || l.category === logTypeFilter;
      const matchesName = logNameFilter === 'all' || l.name === logNameFilter;
      const matchesStatus = logStatusFilter === 'all' || l.status.toLowerCase() === logStatusFilter.toLowerCase();
      const itemDate = new Date(l.date);
      const matchesStart = !logStartDate || itemDate >= new Date(logStartDate);
      const matchesEnd = !logEndDate || itemDate <= new Date(logEndDate);
      return matchesType && matchesName && matchesStatus && matchesStart && matchesEnd;
    });
  }, [combinedLog, logTypeFilter, logNameFilter, logStatusFilter, logStartDate, logEndDate]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Payments & Advances</h1>
          <p className="text-muted-foreground">Manage multi-currency bank transfers, pre-payments, and audit logs.</p>
        </div>
      </div>

      <Tabs defaultValue="ledger" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px] h-12">
          <TabsTrigger value="ledger">Settlement Ledger</TabsTrigger>
          <TabsTrigger value="advances">Customer Advances</TabsTrigger>
          <TabsTrigger value="log">Audit Log</TabsTrigger>
          <TabsTrigger value="staff-advances">Staff Advances</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-6 pt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Record Settlement</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <form onSubmit={handleRecordPayment}>
                  <DialogHeader>
                    <DialogTitle>Financial Settlement</DialogTitle>
                    <DialogDescription>Record inward customer payments or outward supplier settlements.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Payment Type</Label>
                        <Select name="type" defaultValue="received">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="received">Inward (Customer Pay)</SelectItem>
                            <SelectItem value="made">Outward (Exp/Supplier)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Currency</Label>
                        <Select value={paymentCurrency} onValueChange={(v: any) => setPaymentCurrency(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Amount ({paymentCurrency})</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          required 
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">USD Equivalent</Label>
                        <div className="h-10 px-3 py-2 bg-muted/50 rounded-md border flex items-center text-sm font-bold text-muted-foreground">
                          ≈ USD {usdPreview.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Contact / Party Name</Label>
                      <Input name="partyName" required placeholder="Who is this payment with?" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Payment Method</Label>
                        <Select name="method" defaultValue="Bank Transfer">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Check">Check</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Reference #</Label>
                        <Input name="reference" placeholder="e.g. Bank Ref" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Finalize Record</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            {loadingPayments ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Original Currency</TableHead>
                    <TableHead className="text-right">USD Equivalent</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(pay => (
                    <TableRow key={pay.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(pay.date)}</TableCell>
                      <TableCell className="font-medium">{pay.partyName}</TableCell>
                      <TableCell>
                        <div className="font-bold text-xs">{pay.currency || 'USD'} {pay.amount?.toLocaleString()}</div>
                        <div className="text-[8px] text-muted-foreground">Rate: {pay.exchangeRateAtPayment?.toFixed(4) || '1.0000'}</div>
                      </TableCell>
                      <TableCell className={cn("text-right font-bold", pay.type === 'received' ? "text-green-500" : "text-red-500")}>
                        {pay.type === 'received' ? '+' : '-'}${ (pay.totalUSD || pay.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={pay.type === 'received' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                          {pay.type === 'received' ? 'Inward' : 'Outward'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No payments recorded.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="advances" className="space-y-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Customer Advances</h3>
              <p className="text-xs text-muted-foreground">Manage and allocate pre-payments.</p>
            </div>
            <Dialog open={isAdvanceModalOpen} onOpenChange={setIsAdvanceModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Record Advance</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleRecordAdvance}>
                  <DialogHeader>
                    <DialogTitle>Record New Deposit</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Customer Name</Label>
                      <Input name="customerName" required placeholder="Emirates Distribution Co" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Advance Amount ($)</Label>
                        <Input name="amount" type="number" step="0.01" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Payment Reference</Label>
                        <Input name="reference" placeholder="TT-9942-DXB" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Method</Label>
                      <Select name="method" defaultValue="Bank Transfer">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Check">Post-Dated Check</SelectItem>
                          <SelectItem value="Cash">Cash Deposit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Finalize Record</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            {loadingAdvances ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Invoice</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.map(a => {
                    const linkedInvoice = invoices.find(i => i.id === a.invoiceId);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(a.date)}</TableCell>
                        <TableCell className="font-medium">{a.customerName}</TableCell>
                        <TableCell>
                          <Badge variant={a.invoiceId ? "default" : "outline"} className={a.invoiceId ? "bg-green-500" : ""}>
                            {a.invoiceId ? 'Allocated' : 'Available'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {linkedInvoice ? (
                            <div className="space-y-1">
                              <p className="text-xs font-bold">{linkedInvoice.number}</p>
                              <p className="text-[10px] text-muted-foreground">${linkedInvoice.totalUSD?.toLocaleString()} • {linkedInvoice.dateIssue}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Unallocated</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-green-500 text-right">${a.remainingAmount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {a.invoiceId ? (
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleUnlink(a.id)}>
                              <Unlink className="h-3 w-3 mr-1" /> Unlink
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => {
                              setLinkingAdvanceId(a.id);
                              setLinkingCustomerName(a.customerName);
                              setIsLinkingModalOpen(true);
                            }}>
                              <LinkIcon className="h-3 w-3 mr-1" /> Link
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="log" className="space-y-6 pt-6">
          <Card className="bg-secondary/10 border-none shadow-none">
            <CardContent className="p-4 grid gap-4 md:grid-cols-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Entity Type</Label>
                <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Participants</SelectItem>
                    <SelectItem value="customer">Customers Only</SelectItem>
                    <SelectItem value="supplier">Suppliers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Select Name</Label>
                <Select value={logNameFilter} onValueChange={setLogNameFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Names</SelectItem>
                    {[...(customers || []), ...(suppliers || [])].map(e => (
                      <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Date Range</Label>
                <div className="flex gap-2">
                  <Input type="date" className="h-9 text-xs" value={logStartDate} onChange={e => setLogStartDate(e.target.value)} />
                  <Input type="date" className="h-9 text-xs" value={logEndDate} onChange={e => setLogEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Status</Label>
                <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Settled">Settled</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Open">Open Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full h-9" onClick={handleExportCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Transaction Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLog.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(l.date)}</TableCell>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {l.currency} {l.amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px]",
                        l.status === 'Settled' && "bg-green-500",
                        l.status === 'Applied' && "bg-primary",
                        l.status === 'Available' && "bg-yellow-500",
                        l.status === 'Open' && "bg-blue-500"
                      )}>
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{l.invoice}</TableCell>
                  </TableRow>
                ))}
                {filteredLog.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">No transactions found for the selected filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="staff-advances" className="space-y-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Staff Advances</h3>
              <p className="text-xs text-muted-foreground">Track employee out-of-pocket expenses and reimbursements.</p>
            </div>
            <Dialog open={isStaffAdvanceModalOpen} onOpenChange={setIsStaffAdvanceModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Record Staff Advance</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleRecordStaffAdvance}>
                  <DialogHeader>
                    <DialogTitle>Record Staff Advance</DialogTitle>
                    <DialogDescription>Log an employee out-of-pocket expense for reimbursement tracking.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-6 py-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Paid By</Label>
                        <Select name="employeeId" required>
                          <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
                          <SelectContent>
                            {employees.map((emp: any) => (
                              <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Date</Label>
                        <Input type="date" value={staffAdvanceDate} onChange={(e) => setStaffAdvanceDate(e.target.value)} required />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Amount</Label>
                          <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Currency</Label>
                          <Select name="currency" defaultValue="USD">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="AED">AED (د.إ)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Purpose</Label>
                        <Input name="purpose" required placeholder='e.g. "Vercel subscription", "Office printer paper"' />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Category</Label>
                        <Select name="category" required>
                          <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Software & Subscriptions">Software & Subscriptions</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Transport">Transport</SelectItem>
                            <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Professional Services">Professional Services</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Paid Through</Label>
                        <Input name="paidThrough" placeholder='e.g. "Personal credit card"' />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Receipt Attachment</Label>
                        <input ref={staffFileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleStaffReceiptSelect} />
                        {!staffReceiptFile ? (
                          <button type="button" onClick={() => staffFileInputRef.current?.click()} className="w-full border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer">
                            <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Click to upload JPG, PNG, or PDF</p>
                          </button>
                        ) : (
                          <div className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                {staffReceiptPreview ? (
                                  <img src={staffReceiptPreview} alt="Receipt" className="h-10 w-10 object-cover rounded" />
                                ) : (
                                  <div className="h-10 w-10 bg-red-500/10 rounded flex items-center justify-center"><FileIcon className="h-5 w-5 text-red-500" /></div>
                                )}
                                <span className="text-xs truncate">{staffReceiptFileName}</span>
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={removeStaffReceipt}><X className="h-4 w-4" /></Button>
                            </div>
                            {staffUploadProgress !== null && staffUploadProgress < 100 && (
                              <div className="w-full bg-secondary rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${staffUploadProgress}%` }} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Notes</Label>
                        <Textarea name="notes" className="h-16" placeholder="Optional notes..." />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsStaffAdvanceModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={staffUploadProgress !== null && staffUploadProgress < 100}>
                      {staffUploadProgress !== null && staffUploadProgress < 100 ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                      ) : 'Record Advance'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            {loadingStaffAdvances ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffAdvances.map((sa: any) => (
                    <TableRow key={sa.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(sa.date)}</TableCell>
                      <TableCell className="font-medium">{sa.employeeName}</TableCell>
                      <TableCell className="text-sm">{sa.purpose}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{sa.category}</Badge></TableCell>
                      <TableCell className="text-right font-bold">
                        {sa.currency === 'AED' ? 'د.إ' : sa.currency === 'EUR' ? '€' : '$'}{sa.amount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[9px]",
                          sa.status === 'pending' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                          sa.status === 'reimbursed' && "bg-green-500/10 text-green-500 border-green-500/20",
                          sa.status === 'partial' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                        )}>
                          {sa.status === 'pending' ? 'Pending Reimbursement' : sa.status === 'reimbursed' ? 'Reimbursed' : 'Partially Reimbursed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {sa.status !== 'reimbursed' && (
                              <DropdownMenuItem onClick={() => handleMarkReimbursed(sa.id)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Mark as Reimbursed
                              </DropdownMenuItem>
                            )}
                            {sa.receiptUrl && (
                              <DropdownMenuItem onClick={() => window.open(sa.receiptUrl, '_blank')}>
                                <Eye className="mr-2 h-4 w-4" /> View Receipt
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {staffAdvances.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">No staff advances recorded.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Linking Dialog */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkingModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Allocate Advance Payment</DialogTitle>
            <DialogDescription>Link pre-payment from **{linkingCustomerName}** to an outstanding invoice.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount (USD)</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableInvoicesForLinking.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-bold">{inv.number}</TableCell>
                    <TableCell className="text-xs">{inv.dateIssue}</TableCell>
                    <TableCell className="text-right font-bold">${inv.totalUSD?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleLinkToInvoice(inv.id)}>
                        Allocate <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {availableInvoicesForLinking.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">No outstanding invoices found for this customer.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLinkingModalOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}