"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Plus,
  Search,
  Download,
  MoreVertical,
  Loader2,
  Paperclip,
  Repeat,
  Receipt,
  Upload,
  X,
  FileText as FileIcon
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, doc, setDoc, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { expenseService } from "@/services/expense-service";
import { accountingService } from "@/services/accounting-service";
import { CHART_OF_ACCOUNTS } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { toast } from "@/hooks/use-toast";
import { app, storage } from "@/lib/firebase";

// Built-in expense accounts
const BUILTIN_EXPENSE_ACCOUNTS = [
  ...CHART_OF_ACCOUNTS.filter(a => a.group === 'Expenses'),
  { code: '6200', name: 'Software & Subscriptions', group: 'Expenses' },
  { code: '6300', name: 'Marketing & Advertising', group: 'Expenses' },
  { code: '6400', name: 'Transportation & Logistics', group: 'Expenses' },
  { code: '6500', name: 'Office Supplies', group: 'Expenses' },
  { code: '6600', name: 'Travel & Accommodation', group: 'Expenses' },
  { code: '6700', name: 'Communication & Internet', group: 'Expenses' },
  { code: '6800', name: 'Professional Services', group: 'Expenses' },
];

export default function ExpensesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Date field state
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Vendor autocomplete state
  const [vendorInput, setVendorInput] = useState('');
  const [vendorSuggestions, setVendorSuggestions] = useState<any[]>([]);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const vendorRef = useRef<HTMLDivElement>(null);

  // Custom expense accounts state
  const [customAccounts, setCustomAccounts] = useState<{ code: string; name: string }[]>([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [selectedAccountCode, setSelectedAccountCode] = useState('');

  // Invoice attachment state
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // All accounts = built-in + custom
  const allExpenseAccounts = useMemo(() => {
    return [...BUILTIN_EXPENSE_ACCOUNTS, ...customAccounts.map(c => ({ ...c, group: 'Expenses' }))];
  }, [customAccounts]);

  // Load custom accounts from Firestore
  useEffect(() => {
    if (!db) return;
    const loadCustomAccounts = async () => {
      try {
        const snap = await getDocs(collection(db, "expenseAccounts"));
        const accs = snap.docs.map(d => ({ code: d.data().code, name: d.data().name }));
        setCustomAccounts(accs);
      } catch (err) {
        console.error("Failed to load custom accounts:", err);
      }
    };
    loadCustomAccounts();
  }, [db]);

  // Fetch Suppliers and Customers for dropdowns
  const suppliersQuery = useMemoFirebase(() => user ? collection(db, "suppliers") : null, [db, user]);
  const customersQuery = useMemoFirebase(() => user ? collection(db, "customers") : null, [db, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "expenses");
  }, [db, user]);

  const recurringQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "recurring_invoices");
  }, [db, user]);

  const { data: suppliersData } = useCollection(suppliersQuery);
  const { data: customersData } = useCollection(customersQuery);
  const { data: expensesData, isLoading: loadingExpenses } = useCollection(expensesQuery);
  const { data: templatesData, isLoading: loadingTemplates } = useCollection(recurringQuery);

  const suppliers = suppliersData || [];
  const customers = customersData || [];
  const expenses = expensesData || [];
  const templates = templatesData || [];

  // Vendor autocomplete: filter suppliers client-side
  useEffect(() => {
    if (!vendorInput.trim()) {
      setVendorSuggestions([]);
      return;
    }
    const lower = vendorInput.toLowerCase();
    const matches = suppliers.filter((s: any) =>
      s.name?.toLowerCase().includes(lower)
    ).slice(0, 8);
    setVendorSuggestions(matches);
  }, [vendorInput, suppliers]);

  // Close vendor suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (vendorRef.current && !vendorRef.current.contains(e.target as Node)) {
        setShowVendorSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Handle invoice file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Only JPG, PNG, and PDF files are accepted." });
      return;
    }

    setInvoiceFile(file);
    setInvoiceFileName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setInvoicePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setInvoicePreview(null);
    }
  };

  const removeInvoice = () => {
    setInvoiceFile(null);
    setInvoicePreview(null);
    setInvoiceUrl(null);
    setInvoiceFileName(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload invoice to Firebase Storage and return download URL
  const uploadInvoice = async (expenseId: string): Promise<{ url: string; fileName: string } | null> => {
    if (!invoiceFile) return null;

    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `expenses/${expenseId}/invoice`);
      const uploadTask = uploadBytesResumable(storageRef, invoiceFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          toast({ variant: "destructive", title: "Upload failed", description: error.message });
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, fileName: invoiceFile.name });
        }
      );
    });
  };

  // Handle adding a new custom expense account
  const handleAddCustomAccount = async () => {
    if (!newAccountName.trim()) return;

    // Generate a code: find max custom code and increment
    const existingCodes = allExpenseAccounts.map(a => parseInt(a.code)).filter(n => !isNaN(n));
    const nextCode = String(Math.max(...existingCodes, 6800) + 100);

    const newAccount = {
      code: nextCode,
      name: newAccountName.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(collection(db, "expenseAccounts"));
      await setDoc(docRef, newAccount);
      setCustomAccounts(prev => [...prev, { code: nextCode, name: newAccountName.trim() }]);
      setSelectedAccountCode(nextCode);
      setNewAccountName('');
      setIsAddingAccount(false);
      toast({ title: "Account Added", description: `${newAccountName.trim()} has been added.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (isAddModalOpen) {
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setVendorInput('');
      setSelectedAccountCode('');
      setInvoiceFile(null);
      setInvoicePreview(null);
      setInvoiceUrl(null);
      setInvoiceFileName(null);
      setUploadProgress(null);
      setIsAddingAccount(false);
      setNewAccountName('');
    }
  }, [isAddModalOpen]);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const accountCode = selectedAccountCode;
    const matchedAccount = allExpenseAccounts.find(a => a.code === accountCode);

    const expenseId = doc(collection(db, "expenses")).id;

    // Upload invoice if present
    let invoiceData: { url: string; fileName: string } | null = null;
    if (invoiceFile) {
      try {
        invoiceData = await uploadInvoice(expenseId);
      } catch {
        return; // upload failed, toast already shown
      }
    }

    const data: any = {
      accountCode,
      accountName: matchedAccount?.name || accountCode,
      paidThrough: formData.get('paidThrough'),
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') || 'USD',
      vendorName: vendorInput.trim() || null,
      reference: formData.get('reference'),
      notes: formData.get('notes'),
      customerId: formData.get('customerId'),
      customerName: customers?.find(c => c.id === formData.get('customerId'))?.name,
      isBillable: formData.get('isBillable') === 'on',
      date: Timestamp.fromDate(new Date(expenseDate)),
      department: 'all',
      createdBy: user?.profile?.name || 'System',
    };

    if (invoiceData) {
      data.invoiceUrl = invoiceData.url;
      data.invoiceFileName = invoiceData.fileName;
    }

    await setDoc(doc(db, "expenses", expenseId), data);
    setIsAddModalOpen(false);
    toast({ title: "Expense Recorded", description: "The transaction has been logged." });
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      templateName: formData.get('templateName'),
      customerName: formData.get('customerName'),
      frequency: formData.get('frequency'),
      amount: parseFloat(formData.get('amount') as string),
      startDate: formData.get('startDate'),
      autoSend: formData.get('autoSend') === 'true',
      createdAt: new Date().toISOString()
    };

    accountingService.createRecurringTemplate(db, data);
    setIsTemplateModalOpen(false);
    toast({ title: "Template Created", description: `Recurring billing for ${data.customerName} initiated.` });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Expenditure & Billing</h1>
          <p className="text-muted-foreground">Track departmental spending and manage recurring business outlays.</p>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-12">
          <TabsTrigger value="expenses">Operational Expenses</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search expenses..." className="pl-9 h-9" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Record New Expense</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleRecordExpense}>
                    <DialogHeader>
                      <DialogTitle>Expense Entry</DialogTitle>
                      <DialogDescription>Record outgoing business costs and map them to the correct ledger account.</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-6">
                      <div className="space-y-4">
                        {/* DATE FIELD */}
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Date</Label>
                          <Input
                            type="date"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            required
                          />
                        </div>

                        {/* EXPENSE ACCOUNT DROPDOWN */}
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Expense Account</Label>
                          {!isAddingAccount ? (
                            <Select value={selectedAccountCode} onValueChange={(val) => {
                              if (val === '__add_new__') {
                                setIsAddingAccount(true);
                              } else {
                                setSelectedAccountCode(val);
                              }
                            }}>
                              <SelectTrigger><SelectValue placeholder="Choose account..." /></SelectTrigger>
                              <SelectContent>
                                {allExpenseAccounts.map(acc => (
                                  <SelectItem key={acc.code} value={acc.code}>{acc.code} - {acc.name}</SelectItem>
                                ))}
                                <SelectItem value="__add_new__" className="text-primary font-semibold border-t mt-1 pt-2">
                                  + Add New Account
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                value={newAccountName}
                                onChange={(e) => setNewAccountName(e.target.value)}
                                placeholder="New account name..."
                                autoFocus
                              />
                              <Button type="button" size="sm" onClick={handleAddCustomAccount}>Save</Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => { setIsAddingAccount(false); setNewAccountName(''); }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Paid Through</Label>
                          <Select name="paidThrough" defaultValue="Cash">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">Petty Cash</SelectItem>
                              <SelectItem value="Bank Account">Corporate Bank Account</SelectItem>
                              <SelectItem value="Credit Card">Business Credit Card</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* VENDOR / SUPPLIER AUTOCOMPLETE */}
                        <div className="space-y-2" ref={vendorRef}>
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Vendor / Supplier</Label>
                          <div className="relative">
                            <Input
                              value={vendorInput}
                              onChange={(e) => {
                                setVendorInput(e.target.value);
                                setShowVendorSuggestions(true);
                              }}
                              onFocus={() => vendorInput.trim() && setShowVendorSuggestions(true)}
                              placeholder="Type vendor name..."
                            />
                            {showVendorSuggestions && vendorSuggestions.length > 0 && (
                              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {vendorSuggestions.map((s: any) => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                                    onClick={() => {
                                      setVendorInput(s.name);
                                      setShowVendorSuggestions(false);
                                    }}
                                  >
                                    {s.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
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
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Reference #</Label>
                          <Input name="reference" placeholder="Receipt or Invoice #" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Notes</Label>
                          <Textarea name="notes" className="h-20" placeholder="Purpose of this expense..." />
                        </div>

                        {/* INVOICE ATTACHMENT */}
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Invoice / Receipt Attachment</Label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                          {!invoiceFile ? (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer"
                            >
                              <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Click to upload JPG, PNG, or PDF</p>
                            </button>
                          ) : (
                            <div className="border rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  {invoicePreview ? (
                                    <img src={invoicePreview} alt="Invoice" className="h-10 w-10 object-cover rounded" />
                                  ) : (
                                    <div className="h-10 w-10 bg-red-500/10 rounded flex items-center justify-center">
                                      <FileIcon className="h-5 w-5 text-red-500" />
                                    </div>
                                  )}
                                  <span className="text-xs truncate">{invoiceFileName}</span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={removeInvoice}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              {uploadProgress !== null && uploadProgress < 100 && (
                                <div className="w-full bg-secondary rounded-full h-1.5">
                                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-secondary/30 rounded-lg border space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold uppercase">Bill to Customer</Label>
                            <Switch name="isBillable" />
                          </div>
                          <div className="space-y-2">
                            <Select name="customerId">
                              <SelectTrigger><SelectValue placeholder="Choose customer..." /></SelectTrigger>
                              <SelectContent>
                                {customers?.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={uploadProgress !== null && uploadProgress < 100}>
                        {uploadProgress !== null && uploadProgress < 100 ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                        ) : (
                          'Finalize Record'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            {loadingExpenses ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor / Account</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(e.date)}</TableCell>
                      <TableCell>
                        <div className="font-bold text-sm">{e.vendorName || 'General Expense'}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{e.accountName}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-1">
                          {e.reference || '-'}
                          {e.invoiceUrl && (
                            <a href={e.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                              <Paperclip className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {e.isBillable ? (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-[10px]">Billable</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Non-Billable</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {e.currency === 'AED' ? 'د.إ' : '$'}{e.amount?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">No expense records found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Recurring Billing Schedules</h3>
              <p className="text-xs text-muted-foreground">Automate subscription-based trading cycles.</p>
            </div>
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Template</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateTemplate}>
                  <DialogHeader>
                    <DialogTitle>Configure Recurring Schedule</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Template Name</label>
                      <Input name="templateName" required placeholder="e.g. Monthly Retainer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Customer Name</label>
                      <Input name="customerName" required placeholder="Search customer..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Frequency</label>
                        <Select name="frequency" defaultValue="monthly">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Amount</label>
                        <Input name="amount" type="number" step="0.01" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Start Date</label>
                      <Input name="startDate" type="date" required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Activate Template</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            {loadingTemplates ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.templateName}</TableCell>
                      <TableCell>{t.customerName}</TableCell>
                      <TableCell className="capitalize"><Badge variant="outline">{t.frequency}</Badge></TableCell>
                      <TableCell>
                        <Badge className={t.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>{t.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">${t.amount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">No recurring templates defined.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
