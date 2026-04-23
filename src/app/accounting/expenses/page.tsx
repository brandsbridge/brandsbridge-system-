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
  FileText as FileIcon,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Pencil,
  ExternalLink,
  Trash2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, doc, setDoc, getDocs, orderBy, Timestamp, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { expenseService } from "@/services/expense-service";
import { accountingService } from "@/services/accounting-service";
import { CHART_OF_ACCOUNTS } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";
import { app, storage } from "@/lib/firebase";

const BUILTIN_COST_CENTERS = [
  "Marketing", "Operations", "Sales", "Administration",
  "Rent & Facilities", "Human Resources", "Technology & IT",
  "Logistics & Shipping", "Other",
];

// Format a Firestore timestamp / Date / string to DD/MM/YYYY.
function formatDateDMY(timestamp: any): string {
  if (!timestamp) return "N/A";
  let d: Date;
  if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
    d = timestamp.toDate();
  } else if (typeof timestamp === 'object' && timestamp.seconds !== undefined) {
    d = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    d = timestamp;
  } else {
    d = new Date(timestamp);
  }
  if (isNaN(d.getTime())) return "N/A";
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Safely coerce any value to a string for rendering in JSX.
// Guards against React error #185 when legacy rows stored objects in text fields.
function safeText(value: any, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    // Common object shapes saved by older versions of the form
    if (typeof value.name === 'string') return value.name;
    if (typeof value.label === 'string') return value.label;
    if (typeof value.value === 'string') return value.value;
    return fallback;
  }
  return fallback;
}

function safeAmount(value: any): string {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(n)) return '0.00';
  return n.toLocaleString();
}

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
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const vendorRef = useRef<HTMLDivElement>(null);

  // Custom expense accounts state
  const [customAccounts, setCustomAccounts] = useState<{ code: string; name: string }[]>([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [selectedAccountCode, setSelectedAccountCode] = useState('');

  // Cost center state
  const [customCostCenters, setCustomCostCenters] = useState<string[]>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [isAddingCostCenter, setIsAddingCostCenter] = useState(false);
  const [newCostCenterName, setNewCostCenterName] = useState('');
  const [costCenterFilter, setCostCenterFilter] = useState('all');

  const allCostCenters = useMemo(() => {
    const merged = [...BUILTIN_COST_CENTERS, ...customCostCenters];
    return [...new Set(merged)];
  }, [customCostCenters]);

  // Document type options for attachments
  const DOCUMENT_TYPES = [
    { value: "invoice", label: "Invoice" },
    { value: "receipt", label: "Receipt" },
    { value: "bill_of_lading", label: "Bill of Lading" },
    { value: "packing_list", label: "Packing List" },
    { value: "other", label: "Other" },
  ] as const;
  type DocumentType = typeof DOCUMENT_TYPES[number]["value"];

  // Multi-file attachment state
  interface AttachmentItem {
    id: string;
    file?: File;
    fileName: string;
    fileType: "image" | "pdf";
    documentType: DocumentType;
    preview?: string | null;
    progress: number;
    url?: string;
    error?: string;
    uploadedAt?: string;
    existing?: boolean;
  }
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit mode state
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // View details state
  const [viewingExpense, setViewingExpense] = useState<any>(null);

  // Delete confirmation state
  const [deletingExpense, setDeletingExpense] = useState<any>(null);

  // Edit pre-fill states for uncontrolled fields
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editReference, setEditReference] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editIsBillable, setEditIsBillable] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState('');

  // All accounts = built-in + custom
  const allExpenseAccounts = useMemo(() => {
    return [...BUILTIN_EXPENSE_ACCOUNTS, ...customAccounts.map(c => ({ ...c, group: 'Expenses' }))];
  }, [customAccounts]);

  // Load custom accounts and cost centers from Firestore
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
    const loadCostCenters = async () => {
      try {
        const snap = await getDocs(collection(db, "costCenters"));
        const centers = snap.docs.map(d => d.data().name as string).filter(Boolean);
        setCustomCostCenters(centers);
      } catch (err) {
        console.error("Failed to load cost centers:", err);
      }
    };
    loadCustomAccounts();
    loadCostCenters();
  }, [db]);

  // Fetch Suppliers and Customers for dropdowns
  const suppliersQuery = useMemoFirebase(() => user ? collection(db, "suppliers") : null, [db, user]);
  const customersQuery = useMemoFirebase(() => user ? collection(db, "customers") : null, [db, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "expenses"), orderBy("createdAt", "desc"));
  }, [db, user]);

  const recurringQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "recurring_invoices");
  }, [db, user]);

  const { data: suppliersData } = useCollection(suppliersQuery);
  const { data: customersData } = useCollection(customersQuery);
  const { data: expensesData, isLoading: loadingExpenses } = useCollection(expensesQuery);
  const { data: templatesData, isLoading: loadingTemplates } = useCollection(recurringQuery);

  // Payment accounts for "Paid From" dropdown
  const paymentAccountsQuery = useMemoFirebase(
    () => (user ? collection(db, "paymentAccounts") : null),
    [db, user]
  );
  const { data: paymentAccountsData } = useCollection(paymentAccountsQuery);
  const activePaymentAccounts = useMemo(
    () => (paymentAccountsData || []).filter((a: any) => a.isActive !== false),
    [paymentAccountsData]
  );
  const [paidFromAccount, setPaidFromAccount] = useState<string>("");

  // Memoize derived collections so their reference is stable across renders.
  // Using `x || []` inline in render creates a fresh array every render, which
  // causes any effect/memo depending on it to fire in a loop (React error #185).
  const suppliers = useMemo(() => suppliersData || [], [suppliersData]);
  const customers = useMemo(() => customersData || [], [customersData]);
  const expenses = useMemo(() => expensesData || [], [expensesData]);
  const templates = useMemo(() => templatesData || [], [templatesData]);

  // Vendor autocomplete: derive filtered suggestions with useMemo instead of
  // useState+useEffect. This avoids the render→setState→render infinite loop.
  const vendorSuggestions = useMemo(() => {
    const input = vendorInput.trim().toLowerCase();
    if (!input) return [];
    return suppliers
      .filter((s: any) => typeof s?.name === 'string' && s.name.toLowerCase().includes(input))
      .slice(0, 8);
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

  const MAX_ATTACHMENTS = 10;

  // Handle multi-file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAttachmentError(null);
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const currentCount = attachments.length;
    const newFiles = Array.from(files);

    if (currentCount + newFiles.length > MAX_ATTACHMENTS) {
      setAttachmentError(`Maximum ${MAX_ATTACHMENTS} files allowed per expense. You have ${currentCount}, tried to add ${newFiles.length}.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const invalidFiles = newFiles.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      setAttachmentError(`Invalid file type: ${invalidFiles.map(f => f.name).join(', ')}. Only JPG, PNG, and PDF are accepted.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newAttachments: AttachmentItem[] = newFiles.map(file => {
      const item: AttachmentItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        fileName: file.name,
        fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
        documentType: 'invoice',
        progress: 0,
        preview: null,
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAttachments(prev => prev.map(a =>
            a.id === item.id ? { ...a, preview: ev.target?.result as string } : a
          ));
        };
        reader.readAsDataURL(file);
      }

      return item;
    });

    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove a single attachment
  const removeAttachment = async (id: string) => {
    const item = attachments.find(a => a.id === id);
    // If it's an existing attachment from Firestore, delete from Storage
    if (item?.existing && item.url && editingExpenseId) {
      try {
        const storageRef = ref(storage, `expenses/${editingExpenseId}/attachments/${item.fileName}`);
        await deleteObject(storageRef);
      } catch (err) {
        console.warn("Could not delete from storage:", err);
      }
    }
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Upload all pending attachments to Firebase Storage
  const uploadAttachments = async (expenseId: string): Promise<AttachmentItem[]> => {
    const pendingFiles = attachments.filter(a => a.file && !a.url);
    if (pendingFiles.length === 0) return attachments.filter(a => a.url); // return existing ones

    const uploadPromises = pendingFiles.map(item => {
      return new Promise<AttachmentItem>((resolve, reject) => {
        if (!item.file) return reject(new Error('No file'));

        const storageRef = ref(storage, `expenses/${expenseId}/attachments/${item.fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, item.file);

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setAttachments(prev => prev.map(a =>
              a.id === item.id ? { ...a, progress } : a
            ));
          },
          (error) => {
            setAttachments(prev => prev.map(a =>
              a.id === item.id ? { ...a, error: error.message, progress: 0 } : a
            ));
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            const uploaded: AttachmentItem = {
              ...item,
              url,
              progress: 100,
              uploadedAt: new Date().toISOString(),
            };
            setAttachments(prev => prev.map(a =>
              a.id === item.id ? uploaded : a
            ));
            resolve(uploaded);
          }
        );
      });
    });

    const results = await Promise.allSettled(uploadPromises);
    const successful = results
      .filter((r): r is PromiseFulfilledResult<AttachmentItem> => r.status === 'fulfilled')
      .map(r => r.value);

    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      toast({ variant: "destructive", title: "Upload Error", description: `${failed} file(s) failed to upload. You can retry them.` });
    }

    // Combine existing (already uploaded) + newly uploaded
    const existingUploaded = attachments.filter(a => a.url && !a.file);
    return [...existingUploaded, ...successful];
  };

  // Retry a failed upload
  const retryUpload = (id: string) => {
    setAttachments(prev => prev.map(a =>
      a.id === id ? { ...a, error: undefined, progress: 0 } : a
    ));
    // The retry will happen on form submit
  };

  // Open edit mode for an existing expense
  const openEditExpense = (expense: any) => {
    setEditingExpenseId(expense.id);
    setExpenseDate(expense.date ? (typeof expense.date.toDate === 'function' ? expense.date.toDate().toISOString().split('T')[0] : new Date(expense.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]);
    setVendorInput(expense.vendorName || '');
    setSelectedAccountCode(expense.accountCode || '');
    setSelectedCostCenter(expense.costCenter || '');
    setPaidFromAccount(expense.paidFromAccount || expense.paidThrough || '');
    setEditAmount(expense.amount != null ? String(expense.amount) : '');
    setEditCurrency(expense.currency || 'USD');
    setEditReference(expense.reference || '');
    setEditNotes(expense.notes || '');
    setEditIsBillable(!!expense.isBillable);
    setEditCustomerId(expense.customerId || '');

    // Load existing attachments
    const existing: AttachmentItem[] = (expense.attachments || []).map((att: any, i: number) => ({
      id: `existing-${i}-${Date.now()}`,
      fileName: att.fileName,
      fileType: att.fileType || (att.fileName?.match(/\.pdf$/i) ? 'pdf' : 'image'),
      documentType: att.documentType || 'invoice',
      url: att.url,
      progress: 100,
      uploadedAt: att.uploadedAt,
      existing: true,
    }));

    // Also handle legacy single invoiceUrl
    if (expense.invoiceUrl && existing.length === 0) {
      existing.push({
        id: `legacy-${Date.now()}`,
        fileName: expense.invoiceFileName || 'invoice',
        fileType: expense.invoiceFileName?.match(/\.pdf$/i) ? 'pdf' : 'image',
        documentType: 'invoice',
        url: expense.invoiceUrl,
        progress: 100,
        existing: true,
      });
    }

    setAttachments(existing);
    setAttachmentError(null);
    setIsAddModalOpen(true);
  };

  // Delete expense + its storage attachments
  const handleDeleteExpense = async (expense: any) => {
    try {
      // Delete attachments from Storage
      const atts: any[] = Array.isArray(expense.attachments) ? expense.attachments : [];
      for (const att of atts) {
        try {
          const storageRef = ref(storage, `expenses/${expense.id}/attachments/${att.fileName}`);
          await deleteObject(storageRef);
        } catch {
          // file may already be gone
        }
      }
      // Delete legacy single attachment
      if (expense.invoiceUrl) {
        try {
          const storageRef = ref(storage, `expenses/${expense.id}/attachments/${expense.invoiceFileName || 'invoice'}`);
          await deleteObject(storageRef);
        } catch {
          // ignore
        }
      }
      await deleteDoc(doc(db, "expenses", expense.id));
      toast({ title: "Expense deleted successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete failed", description: err.message });
    }
    setDeletingExpense(null);
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

  // Reset form state when modal closes (not when it opens — edit mode sets state before opening)
  useEffect(() => {
    if (!isAddModalOpen) {
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setVendorInput('');
      setSelectedAccountCode('');
      setSelectedCostCenter('');
      setIsAddingCostCenter(false);
      setNewCostCenterName('');
      setAttachments([]);
      setAttachmentError(null);
      setIsAddingAccount(false);
      setNewAccountName('');
      setEditingExpenseId(null);
      setPaidFromAccount('');
      setEditAmount('');
      setEditCurrency('USD');
      setEditReference('');
      setEditNotes('');
      setEditIsBillable(false);
      setEditCustomerId('');
    }
  }, [isAddModalOpen]);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    const accountCode = selectedAccountCode;
    const matchedAccount = allExpenseAccounts.find(a => a.code === accountCode);

    const expenseId = editingExpenseId || doc(collection(db, "expenses")).id;

    // Upload all pending attachments
    let uploadedAttachments: AttachmentItem[] = [];
    const pendingFiles = attachments.filter(a => a.file && !a.url && !a.error);
    if (pendingFiles.length > 0 || attachments.some(a => a.url)) {
      try {
        uploadedAttachments = await uploadAttachments(expenseId);
      } catch {
        return; // upload failed, toast already shown
      }
    }

    // Check if any files failed
    const failedFiles = attachments.filter(a => a.error);
    if (failedFiles.length > 0) {
      toast({ variant: "destructive", title: "Upload incomplete", description: `${failedFiles.length} file(s) failed. Please retry or remove them.` });
      return;
    }

    const attachmentData = [...uploadedAttachments, ...attachments.filter(a => a.existing && a.url)].reduce((acc, a) => {
      // Deduplicate by url
      if (!acc.find((x: any) => x.url === a.url)) {
        acc.push({
          fileName: a.fileName,
          fileType: a.fileType,
          documentType: a.documentType || 'invoice',
          url: a.url!,
          uploadedAt: a.uploadedAt || new Date().toISOString(),
        });
      }
      return acc;
    }, [] as any[]);

    const data: any = {
      accountCode,
      accountName: matchedAccount?.name || accountCode,
      paidThrough: paidFromAccount || null,
      paidFromAccount: paidFromAccount || null,
      amount: parseFloat(editAmount) || 0,
      currency: editCurrency || 'USD',
      vendorName: vendorInput.trim() || null,
      reference: editReference || null,
      notes: editNotes || null,
      customerId: editCustomerId || null,
      customerName: safeText(customers?.find((c: any) => c.id === editCustomerId)?.name) || null,
      isBillable: editIsBillable,
      costCenter: selectedCostCenter || null,
      date: Timestamp.fromDate(new Date(expenseDate)),
      department: 'all',
      createdBy: user?.profile?.name || 'System',
      attachments: attachmentData,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingExpenseId) {
        await setDoc(doc(db, "expenses", expenseId), data, { merge: true });
        toast({ title: "Expense Updated", description: "The expense record has been updated." });
      } else {
        data.createdAt = new Date().toISOString();
        await setDoc(doc(db, "expenses", expenseId), data);
        toast({ title: "Expense Recorded", description: "The transaction has been logged." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save failed", description: err.message });
    }

    setIsAddModalOpen(false);
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
            <div className="flex items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="search-expenses" name="search" placeholder="Search expenses..." className="pl-9 h-9" />
              </div>
              <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="All Cost Centers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cost Centers</SelectItem>
                  {allCostCenters.map(cc => (
                    <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                      <DialogTitle>{editingExpenseId ? 'Edit Expense' : 'Expense Entry'}</DialogTitle>
                      <DialogDescription>{editingExpenseId ? 'Update this expense record and its attachments.' : 'Record outgoing business costs and map them to the correct ledger account.'}</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-6">
                      <div className="space-y-4">
                        {/* DATE FIELD */}
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Date</Label>
                          <Input
                            id="expenseDate"
                            name="expenseDate"
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
                                id="newAccountName"
                                name="newAccountName"
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
                          <Select value={paidFromAccount || "_none_"} onValueChange={(v) => setPaidFromAccount(v === "_none_" ? "" : v)}>
                            <SelectTrigger><SelectValue placeholder="Select payment account..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none_">Select Account</SelectItem>
                              {activePaymentAccounts.map((acc: any) => (
                                <SelectItem key={acc.id} value={acc.accountName}>
                                  {acc.accountName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* COST CENTER */}
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Cost Center</Label>
                          {!isAddingCostCenter ? (
                            <Select value={selectedCostCenter || '_none_'} onValueChange={(val) => {
                              if (val === '__add_new_cc__') {
                                setIsAddingCostCenter(true);
                              } else {
                                setSelectedCostCenter(val === '_none_' ? '' : val);
                              }
                            }}>
                              <SelectTrigger><SelectValue placeholder="Select cost center..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none_">None</SelectItem>
                                {allCostCenters.map(cc => (
                                  <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                                ))}
                                <SelectItem value="__add_new_cc__" className="text-primary font-semibold border-t mt-1 pt-2">
                                  + Add New Cost Center
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                id="newCostCenter"
                                name="newCostCenter"
                                value={newCostCenterName}
                                onChange={(e) => setNewCostCenterName(e.target.value)}
                                placeholder="New cost center..."
                                autoFocus
                              />
                              <Button type="button" size="sm" onClick={async () => {
                                const name = newCostCenterName.trim();
                                if (!name) return;
                                try {
                                  const docRef = doc(collection(db, "costCenters"));
                                  await setDoc(docRef, { name, createdAt: new Date().toISOString() });
                                  setCustomCostCenters(prev => [...prev, name]);
                                  setSelectedCostCenter(name);
                                  setNewCostCenterName('');
                                  setIsAddingCostCenter(false);
                                  toast({ title: "Cost Center Added", description: `${name} is now available.` });
                                } catch (err: any) {
                                  toast({ variant: "destructive", title: "Error", description: err.message });
                                }
                              }}>Save</Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => { setIsAddingCostCenter(false); setNewCostCenterName(''); }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* VENDOR / SUPPLIER AUTOCOMPLETE */}
                        <div className="space-y-2" ref={vendorRef}>
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Vendor / Supplier</Label>
                          <div className="relative">
                            <Input
                              id="vendor"
                              name="vendor"
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
                                {vendorSuggestions.map((s: any) => {
                                  const supplierName = safeText(s.name);
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                                      onClick={() => {
                                        setVendorInput(supplierName);
                                        setShowVendorSuggestions(false);
                                      }}
                                    >
                                      {supplierName}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest">Amount</Label>
                            <Input name="amount" type="number" step="0.01" required placeholder="0.00" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest">Currency</Label>
                            <Select value={editCurrency} onValueChange={setEditCurrency}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="QAR">QAR (ر.ق)</SelectItem>
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
                          <Input name="reference" placeholder="Receipt or Invoice #" value={editReference} onChange={(e) => setEditReference(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">Notes</Label>
                          <Textarea name="notes" className="h-20" placeholder="Purpose of this expense..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                        </div>

                        {/* MULTI-FILE ATTACHMENTS */}
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest">
                            Attachments ({attachments.length}/{MAX_ATTACHMENTS})
                          </Label>
                          <input
                            ref={fileInputRef}
                            id="attachments"
                            name="attachments"
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="hidden"
                            onChange={handleFileSelect}
                          />

                          {/* Error message */}
                          {attachmentError && (
                            <div className="text-xs text-destructive bg-destructive/10 rounded-md p-2">
                              {attachmentError}
                            </div>
                          )}

                          {/* Upload drop zone */}
                          {attachments.length < MAX_ATTACHMENTS && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full border-2 border-dashed rounded-lg p-3 text-center hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer"
                            >
                              <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Click to upload JPG, PNG, or PDF (max {MAX_ATTACHMENTS})</p>
                            </button>
                          )}

                          {/* Attachment list */}
                          {attachments.length > 0 && (
                            <div className="space-y-2 max-h-[240px] overflow-y-auto">
                              {attachments.map(att => (
                                <div key={att.id} className="border rounded-lg p-2 space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    {/* Thumbnail / icon */}
                                    {att.fileType === 'image' && (att.preview || att.url) ? (
                                      <a href={att.url || att.preview || '#'} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                        <img src={att.preview || att.url} alt={att.fileName} className="h-10 w-10 object-cover rounded cursor-pointer hover:opacity-80" />
                                      </a>
                                    ) : (
                                      <a href={att.url || '#'} target={att.url ? "_blank" : undefined} rel="noopener noreferrer" className="shrink-0">
                                        <div className="h-10 w-10 bg-red-500/10 rounded flex items-center justify-center">
                                          <FileIcon className="h-5 w-5 text-red-500" />
                                        </div>
                                      </a>
                                    )}

                                    {/* File name + document type + status */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs truncate font-medium">{att.fileName}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <select
                                          id={`docType-${att.id}`}
                                          name="documentType"
                                          className="text-[10px] bg-secondary/50 border rounded px-1 py-0.5 cursor-pointer"
                                          value={att.documentType}
                                          onChange={(e) => setAttachments(prev => prev.map(a =>
                                            a.id === att.id ? { ...a, documentType: e.target.value as DocumentType } : a
                                          ))}
                                        >
                                          {DOCUMENT_TYPES.map(dt => (
                                            <option key={dt.value} value={dt.value}>{dt.label}</option>
                                          ))}
                                        </select>
                                        {att.error ? (
                                          <span className="text-[10px] text-destructive flex items-center gap-0.5">
                                            <XCircle className="h-3 w-3" /> Failed
                                          </span>
                                        ) : att.progress === 100 || att.url ? (
                                          <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                                            <CheckCircle2 className="h-3 w-3" />
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      {att.url && (
                                        <a href={att.url} target="_blank" rel="noopener noreferrer">
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                                            <Eye className="h-3.5 w-3.5" />
                                          </Button>
                                        </a>
                                      )}
                                      {att.error && (
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-orange-500" onClick={() => retryUpload(att.id)}>
                                          <RefreshCw className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAttachment(att.id)}>
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  {att.progress > 0 && att.progress < 100 && !att.error && (
                                    <div className="w-full bg-secondary rounded-full h-1.5">
                                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${att.progress}%` }} />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-secondary/30 rounded-lg border space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold uppercase">Bill to Customer</Label>
                            <Switch checked={editIsBillable} onCheckedChange={setEditIsBillable} />
                          </div>
                          <div className="space-y-2">
                            <Select value={editCustomerId || "_none_"} onValueChange={(v) => setEditCustomerId(v === "_none_" ? "" : v)}>
                              <SelectTrigger><SelectValue placeholder="Choose customer..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none_">None</SelectItem>
                                {customers?.map((c: any) => (
                                  <SelectItem key={c.id} value={c.id}>{safeText(c.name)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={attachments.some(a => a.progress > 0 && a.progress < 100)}>
                        {attachments.some(a => a.progress > 0 && a.progress < 100) ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                        ) : editingExpenseId ? (
                          'Update Record'
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
                    <TableHead>Cost Center</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses
                    .filter((e: any) => {
                      const cc = safeText(e.costCenter);
                      return costCenterFilter === 'all' || cc === costCenterFilter;
                    })
                    .map((e: any) => {
                      const costCenterText = safeText(e.costCenter);
                      const vendorText = safeText(e.vendorName, 'General Expense');
                      const accountText = safeText(e.accountName);
                      const referenceText = safeText(e.reference, '-');
                      const attachmentCount = Array.isArray(e.attachments) ? e.attachments.length : 0;
                      const hasAttachment = attachmentCount > 0 || !!e.invoiceUrl;
                      const currencySymbol = e.currency === 'QAR' ? 'ر.ق' : e.currency === 'AED' ? 'د.إ' : e.currency === 'EUR' ? '€' : '$';
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs text-muted-foreground">{formatDateDMY(e.date)}</TableCell>
                          <TableCell>
                            <div className="font-bold text-sm">{vendorText}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{accountText}</div>
                          </TableCell>
                          <TableCell>
                            {costCenterText ? (
                              <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/20">{costCenterText}</Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-1">
                              {referenceText}
                              {hasAttachment && (
                                <span className="text-primary flex items-center gap-0.5">
                                  <Paperclip className="h-3 w-3" />
                                  {attachmentCount > 1 && <span className="text-[10px]">{attachmentCount}</span>}
                                </span>
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
                            {currencySymbol}{safeAmount(e.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onCloseAutoFocus={(ev) => ev.preventDefault()}>
                                <DropdownMenuItem onSelect={() => setTimeout(() => setViewingExpense(e), 0)}>
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setTimeout(() => openEditExpense(e), 0)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setTimeout(() => setDeletingExpense(e), 0)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">No expense records found.</TableCell>
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
                  {templates.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{safeText(t.templateName)}</TableCell>
                      <TableCell>{safeText(t.customerName)}</TableCell>
                      <TableCell className="capitalize"><Badge variant="outline">{safeText(t.frequency)}</Badge></TableCell>
                      <TableCell>
                        <Badge className={t.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>{safeText(t.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">${safeAmount(t.amount)}</TableCell>
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

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deletingExpense} onOpenChange={(open) => { if (!open) setDeletingExpense(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingExpense(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (deletingExpense) handleDeleteExpense(deletingExpense);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* VIEW DETAILS SHEET */}
      <Sheet open={!!viewingExpense} onOpenChange={(open) => { if (!open) setViewingExpense(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Expense Details</SheetTitle>
            <SheetDescription>Full record of this expense entry.</SheetDescription>
          </SheetHeader>
          {viewingExpense && (() => {
            const exp = viewingExpense;
            const dateStr = formatDateDMY(exp.date);
            const createdAtStr = formatDateDMY(exp.createdAt);
            const atts: any[] = Array.isArray(exp.attachments) ? exp.attachments : [];
            // Include legacy single attachment
            if (exp.invoiceUrl && atts.length === 0) {
              atts.push({ fileName: exp.invoiceFileName || 'Invoice', url: exp.invoiceUrl, fileType: exp.invoiceFileName?.match(/\.pdf$/i) ? 'pdf' : 'image' });
            }

            return (
              <div className="space-y-6 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Date" value={dateStr} />
                  <DetailField label="Expense Account" value={safeText(exp.accountName) || safeText(exp.accountCode) || '-'} />
                  <DetailField label="Paid Through" value={safeText(exp.paidThrough) || safeText(exp.paidFromAccount) || '-'} />
                  <DetailField label="Cost Center" value={safeText(exp.costCenter) || '-'} />
                  <DetailField label="Vendor / Supplier" value={safeText(exp.vendorName) || '-'} />
                  <DetailField label="Reference #" value={safeText(exp.reference) || '-'} />
                  <DetailField label="Amount" value={`${exp.currency === 'QAR' ? 'ر.ق' : exp.currency === 'AED' ? 'د.إ' : exp.currency === 'EUR' ? '€' : '$'}${safeAmount(exp.amount)} ${exp.currency || 'USD'}`} />
                  <DetailField label="Status" value={exp.isBillable ? 'Billable' : 'Non-Billable'} badge badgeClass={exp.isBillable ? 'bg-blue-500/10 text-blue-500' : ''} />
                  {exp.customerName && <DetailField label="Customer" value={safeText(exp.customerName)} />}
                  <DetailField label="Created By" value={safeText(exp.createdBy) || '-'} />
                  <DetailField label="Created At" value={createdAtStr} />
                </div>

                {safeText(exp.notes) && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap bg-secondary/30 rounded-lg p-3">{safeText(exp.notes)}</p>
                  </div>
                )}

                {atts.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Attachments ({atts.length})</p>
                    <div className="space-y-2">
                      {atts.map((att: any, i: number) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          {att.fileType === 'image' ? (
                            <img src={att.url} alt={att.fileName} className="h-12 w-12 object-cover rounded" />
                          ) : (
                            <div className="h-12 w-12 bg-red-500/10 rounded flex items-center justify-center">
                              <FileIcon className="h-6 w-6 text-red-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.fileName}</p>
                            {att.documentType && <p className="text-[10px] text-muted-foreground capitalize">{att.documentType}</p>}
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { const e = exp; setViewingExpense(null); setTimeout(() => openEditExpense(e), 150); }}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit This Expense
                  </Button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailField({ label, value, badge, badgeClass }: { label: string; value: string; badge?: boolean; badgeClass?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      {badge ? (
        <Badge variant="secondary" className={badgeClass}>{value}</Badge>
      ) : (
        <p className="text-sm font-medium mt-0.5">{value}</p>
      )}
    </div>
  );
}
