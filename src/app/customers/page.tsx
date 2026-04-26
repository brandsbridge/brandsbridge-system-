"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Search, Trash2, ExternalLink,
  Download, Star, HeartPulse,
  FileText, Upload, CheckCircle2, Loader2, FileSpreadsheet,
  FileDown, AlertTriangle, X, FileX, Tags,
  MoreVertical, Eye,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, writeBatch, doc, setDoc, deleteDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { MOCK_CUSTOMERS } from "@/lib/mock-data";
import Papa from "papaparse";
import * as XLSX from "xlsx";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={cn(
        size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5",
        i <= Math.round(rating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
      )} />
    ))}
  </div>
);

const healthBadge = (h: string) => {
  const v = (h || "healthy").toLowerCase();
  if (v === "healthy") return <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[9px]">Healthy</Badge>;
  if (v === "warning" || v === "at risk") return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-[9px]">Warning</Badge>;
  if (v === "critical" || v === "churned" || v === "dormant") return <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-[9px]">Critical</Badge>;
  return <Badge variant="outline" className="text-[9px] capitalize">{h}</Badge>;
};

const activeBadge = (active: any) => {
  const isActive = active === true || active === "active" || active === "Active" || active === "yes";
  return (
    <Badge className={cn("text-[9px]", isActive ? "bg-green-500 text-white border-none" : "bg-gray-500/20 text-gray-400 border-gray-500/30")}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
};

// ═══════════════════════════════════════════════════════════════
// IMPORT COLUMN MAPPING
// ═══════════════════════════════════════════════════════════════

const IMPORT_COLUMN_MAP: Record<string, string> = {
  "#": "__skip__",
  "company name": "name",
  "country": "country",
  "active": "active",
  "nature of business": "natureOfBusiness",
  "specialized products": "specializedProducts",
  "health": "accountHealth",
  "rating": "internalRating",
  "total revenue": "totalRevenue",
  "markets": "markets",
  "interests": "interests",
  "best product price by ai from n8n": "bestProductPriceAI",
  "notes from n8n": "notesFromAI",
  "notes from stuff": "notesFromStaff",
  "notes from staff": "notesFromStaff",
  "governorate / city": "governorateCity",
  "governorate/city": "governorateCity",
  "website": "website",
  "social media - facebook": "socialFacebook",
  "social media - instagram": "socialInstagram",
  "social media - linkedin": "socialLinkedin",
  "whatsapp": "whatsapp",
  "sales manager": "salesManager",
  "export manager": "exportManager",
  "support - customer service number": "customerServiceNumber",
  "support - customer service email": "customerServiceEmail",
  "company overview": "companyOverview",
  "company docs": "companyDocs",
  "consinee": "consignee",
  "consignee": "consignee",
  "cotact person": "contactPerson",
  "contact person": "contactPerson",
  "specific notes / priority": "specificNotes",
  "specific notes": "specificNotes",
  "email": "email",
  "phone": "phone",
  "city": "city",
  "account status": "accountStatus",
  "department": "department",
  "owner": "assignedManager",
  "completeness": "dataCompleteness",
  "compliance": "compliance",
  "price tier": "priceTier",
};

const normalizeMarketId = (input: string): string | null => {
  const n = input.trim().toLowerCase();
  if (n.includes('cosmetic')) return 'cosmetics_market';
  if (n.includes('chocolate')) return 'chocolate_market';
  if (n.includes('detergent')) return 'detergents_market';
  return null;
};

const MARKET_DISPLAY: Record<string, string> = {
  cosmetics_market: "Cosmetics Market",
  chocolate_market: "Chocolate Market",
  detergents_market: "Detergents Market",
};

const IMPORT_TEMPLATE_HEADERS = [
  "Company Name", "Country", "Active", "Nature of Business", "Specialized Products",
  "Health", "Rating", "Total Revenue", "Markets", "Interests",
  "best product price by AI from n8n", "notes from n8n", "notes from stuff",
  "Governorate / City", "Website",
  "Social Media - Facebook", "Social Media - Instagram", "Social Media - Linkedin",
  "WhatsApp", "Sales Manager", "Export Manager",
  "support - Customer Service number", "support - Customer Service email",
  "Company Overview", "Company docs", "consignee", "contact person",
  "Specific Notes / Priority",
];

const IMPORT_EXAMPLE_ROW = [
  "Example Customer Ltd", "Qatar", "Active", "Wholesaler", "Confectionery, Snacks",
  "Healthy", "4", "50000", "Chocolate, Cosmetics", "Chocolate, Premium",
  "$5.50/kg", "High potential client", "Met at trade show",
  "Doha", "www.example.com",
  "facebook.com/example", "instagram.com/example", "linkedin.com/in/example",
  "+97450000000", "John Doe", "Jane Smith",
  "+97440000000", "cs@example.com",
  "Leading wholesaler in Qatar region", "", "Ali Transport LLC", "Mohammed Ahmed",
  "Priority: Follow up on Q2 order",
];

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [marketAssignTarget, setMarketAssignTarget] = useState<any>(null);

  // Delete state
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "importing" | "success">("upload");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fullValidData, setFullValidData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{row: number, message: string}[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip");
  const [importProgress, setImportProgress] = useState(0);
  const [importProgressLabel, setImportProgressLabel] = useState("");
  const [importResults, setImportResults] = useState({ success: 0, failed: 0, updated: 0, invalid: 0 });
  const [showAllColumns, setShowAllColumns] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const db = useFirestore();
  const { user } = useUser();
  const customersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "customers");
  }, [db, user]);

  const { data: firestoreCustomers, isLoading: loading } = useCollection(customersQuery);

  const customers = useMemo(() => {
    if (firestoreCustomers && firestoreCustomers.length > 0) return firestoreCustomers;
    return MOCK_CUSTOMERS;
  }, [firestoreCustomers]);

  const countries = Array.from(new Set(customers.map((c: any) => c.country).filter(Boolean))).sort();

  const filteredCustomers = useMemo(() => {
    return customers.filter((c: any) => {
      const matchesSearch = (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (c.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (c.natureOfBusiness || c.companyType || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === "all" || c.country === countryFilter;
      const curStatus = c.accountStatus || (c.active === true || c.active === "active" || c.active === "Active" ? "active" : "inactive");
      const matchesStatus = statusFilter === "all" || curStatus === statusFilter;
      const curHealth = (c.accountHealth || "healthy").toLowerCase();
      const matchesHealth = healthFilter === "all" || curHealth === healthFilter ||
        (healthFilter === "warning" && curHealth === "at risk") ||
        (healthFilter === "critical" && (curHealth === "dormant" || curHealth === "churned"));
      return matchesSearch && matchesCountry && matchesStatus && matchesHealth;
    });
  }, [customers, searchTerm, countryFilter, statusFilter, healthFilter]);

  // ─── CREATE ────────────────────────────────────────────────
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const assignedMarkets = fd.getAll('markets') as string[];
    const newDocRef = doc(collection(db, "customers"));
    try {
      await setDoc(newDocRef, {
        name: fd.get('name') as string,
        country: fd.get('country') as string,
        active: fd.get('active') === "active",
        accountStatus: fd.get('active') as string || "active",
        natureOfBusiness: fd.get('natureOfBusiness') as string,
        specializedProducts: fd.get('specializedProducts') as string,
        accountHealth: fd.get('health') as string || "healthy",
        internalRating: Number(fd.get('rating')) || 0,
        totalRevenue: Number(fd.get('totalRevenue')) || 0,
        markets: assignedMarkets,
        interests: fd.get('interests') as string,
        bestProductPriceAI: fd.get('bestProductPriceAI') as string || "",
        notesFromAI: fd.get('notesFromAI') as string || "",
        notesFromStaff: fd.get('notesFromStaff') as string || "",
        governorateCity: fd.get('governorateCity') as string || "",
        website: fd.get('website') as string || "",
        socialFacebook: fd.get('socialFacebook') as string || "",
        socialInstagram: fd.get('socialInstagram') as string || "",
        socialLinkedin: fd.get('socialLinkedin') as string || "",
        whatsapp: fd.get('whatsapp') as string || "",
        salesManager: fd.get('salesManager') as string || "",
        exportManager: fd.get('exportManager') as string || "",
        customerServiceNumber: fd.get('customerServiceNumber') as string || "",
        customerServiceEmail: fd.get('customerServiceEmail') as string || "",
        contactPerson: fd.get('contactPerson') as string || "",
        consignee: fd.get('consignee') as string || "",
        companyOverview: fd.get('companyOverview') as string || "",
        companyDocs: [],
        specificNotes: fd.get('specificNotes') as string || "",
        departments: assignedMarkets.map(m => m.split('_')[0]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsAddModalOpen(false);
      toast({ title: "Customer Registered", description: "Successfully added." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to add" });
    }
  };

  // ─── ASSIGN MARKETS ───────────────────────────────────────
  const handleAssignMarkets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketAssignTarget?.id) {
      toast({ variant: "destructive", title: "Error", description: "Invalid customer ID" });
      return;
    }
    const fd = new FormData(e.target as HTMLFormElement);
    const assignedMarkets = fd.getAll('markets') as string[];
    try {
      const docRef = doc(db, "customers", marketAssignTarget.id);
      await setDoc(docRef, {
        markets: assignedMarkets,
        departments: assignedMarkets.map((m: string) => m.split('_')[0]),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setMarketAssignTarget(null);
      toast({ title: "Markets Assigned", description: "Updated successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to assign." });
    }
  };

  // ─── DELETE ────────────────────────────────────────────────
  const handleDeleteCustomer = async (customer: any) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "customers", customer.id));
      toast({ title: "Customer Deleted", description: `${customer.name || 'Customer'} has been removed.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
    setIsDeleting(false);
    setDeletingCustomer(null);
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    let deleted = 0;
    try {
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "customers", id));
        deleted++;
      }
      toast({ title: "Customers Deleted", description: `${deleted} customer(s) removed.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Bulk Delete Failed", description: `${deleted} deleted before error: ${err.message}` });
    }
    setIsDeleting(false);
    setIsBulkDeleteOpen(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map((c: any) => c.id)));
    }
  };

  // ─── EXPORT ────────────────────────────────────────────────
  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredCustomers.map((c: any) => ({
      "Company Name": c.name,
      Country: c.country,
      Active: c.active ? "Active" : "Inactive",
      "Nature of Business": c.natureOfBusiness || c.companyType || "",
      "Specialized Products": c.specializedProducts || "",
      Health: c.accountHealth || "healthy",
      Rating: c.internalRating || 0,
      "Total Revenue": c.totalRevenue || 0,
      Markets: Array.isArray(c.markets) ? c.markets.join(", ") : "",
      Interests: typeof c.interests === "string" ? c.interests : Array.isArray(c.interests?.products) ? c.interests.products.join(", ") : "",
      "Governorate / City": c.governorateCity || "",
      Website: c.website || "",
      WhatsApp: c.whatsapp || "",
      "Sales Manager": c.salesManager || "",
      "Export Manager": c.exportManager || "",
      "Contact Person": c.contactPerson || "",
      Consignee: c.consignee || "",
      "Specific Notes": c.specificNotes || "",
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `customers-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCustomers.map((c: any) => ({
      "Company Name": c.name,
      Country: c.country,
      Active: c.active ? "Active" : "Inactive",
      "Nature of Business": c.natureOfBusiness || c.companyType || "",
      "Specialized Products": c.specializedProducts || "",
      Health: c.accountHealth || "healthy",
      Rating: c.internalRating || 0,
      "Total Revenue": c.totalRevenue || 0,
      Markets: Array.isArray(c.markets) ? c.markets.join(", ") : "",
      Interests: typeof c.interests === "string" ? c.interests : Array.isArray(c.interests?.products) ? c.interests.products.join(", ") : "",
      "Governorate / City": c.governorateCity || "",
      Website: c.website || "",
      "Social Media - Facebook": c.socialFacebook || "",
      "Social Media - Instagram": c.socialInstagram || "",
      "Social Media - Linkedin": c.socialLinkedin || "",
      WhatsApp: c.whatsapp || "",
      "Sales Manager": c.salesManager || "",
      "Export Manager": c.exportManager || "",
      "Customer Service Number": c.customerServiceNumber || "",
      "Customer Service Email": c.customerServiceEmail || "",
      "Contact Person": c.contactPerson || "",
      Consignee: c.consignee || "",
      "Company Overview": c.companyOverview || "",
      "Specific Notes": c.specificNotes || "",
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `customers-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ─── IMPORT ────────────────────────────────────────────────
  const downloadTemplate = (type: "csv" | "xlsx") => {
    const data = [IMPORT_TEMPLATE_HEADERS, IMPORT_EXAMPLE_ROW];
    if (type === "csv") {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.setAttribute("download", "customer_import_template.csv");
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "customer_import_template.xlsx");
    }
    toast({ title: "Template Downloaded", description: "Use this file to structure your customer data." });
  };

  const downloadErrorReport = () => {
    if (validationErrors.length === 0) return;
    const csv = Papa.unparse(validationErrors.map(e => ({ Row: e.row, Error: e.message })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", `customer_import_errors.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const mapImportRow = (row: any): Record<string, any> => {
    const mapped: Record<string, any> = {};
    Object.entries(row).forEach(([key, val]) => {
      const normalizedKey = key.trim().toLowerCase();
      const fieldName = IMPORT_COLUMN_MAP[normalizedKey];
      if (fieldName) {
        mapped[fieldName] = val;
      } else {
        mapped[key] = val;
      }
    });
    return mapped;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const firstLine = text.split('\n')[0] || "";
        const commas = (firstLine.match(/,/g) || []).length;
        const semicolons = (firstLine.match(/;/g) || []).length;
        const delimiter = semicolons > commas ? ";" : ",";
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          delimiter,
          complete: (results) => validateAndPreview(results.data),
        });
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          validateAndPreview(Array.isArray(json) ? json : [json]);
        } catch { toast({ variant: "destructive", title: "Invalid JSON" }); }
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        validateAndPreview(json);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const PREVIEW_KEY_COLS = ["Company Name", "Country", "Active", "Nature of Business", "Specialized Products", "Markets"];
  const PREVIEW_ALL_COLS = [
    "Company Name", "Country", "Active", "Nature of Business", "Specialized Products",
    "Health", "Rating", "Total Revenue", "Markets", "Interests",
    "Best Product Price AI", "Notes from AI", "Notes from Staff",
    "Governorate / City", "Website", "Facebook", "Instagram", "LinkedIn",
    "WhatsApp", "Sales Manager", "Export Manager", "CS Number", "CS Email",
    "Company Overview", "Company Docs", "Consignee", "Contact Person", "Specific Notes",
  ];

  const MAPPED_DISPLAY: Record<string, string> = {
    name: "Company Name", country: "Country", active: "Active",
    natureOfBusiness: "Nature of Business", specializedProducts: "Specialized Products",
    accountHealth: "Health", internalRating: "Rating", totalRevenue: "Total Revenue",
    markets: "Markets", interests: "Interests", bestProductPriceAI: "Best Product Price AI",
    notesFromAI: "Notes from AI", notesFromStaff: "Notes from Staff",
    governorateCity: "Governorate / City", website: "Website",
    socialFacebook: "Facebook", socialInstagram: "Instagram", socialLinkedin: "LinkedIn",
    whatsapp: "WhatsApp", salesManager: "Sales Manager", exportManager: "Export Manager",
    customerServiceNumber: "CS Number", customerServiceEmail: "CS Email",
    companyOverview: "Company Overview", companyDocs: "Company Docs",
    consignee: "Consignee", contactPerson: "Contact Person", specificNotes: "Specific Notes",
  };

  const validateAndPreview = (data: any[]) => {
    const errors: {row: number, message: string}[] = [];
    const validRows: any[] = [];
    data.forEach((row, idx) => {
      const mapped = mapImportRow(row);
      const companyName = mapped.name || row["Company Name"] || row["name"] || row["title"];
      if (companyName === "Example Customer Ltd") return;
      if (!companyName) {
        errors.push({ row: idx + 1, message: "Missing Company Name (Required)" });
        return;
      }
      // Build a clean mapped row with display-friendly column names
      const clean: Record<string, string> = {};
      Object.entries(mapped).forEach(([k, v]) => {
        if (k === "__skip__" || k === "email" || k === "phone" || k === "city" ||
            k === "accountStatus" || k === "department" || k === "assignedManager" ||
            k === "dataCompleteness" || k === "compliance" || k === "priceTier") return;
        const displayName = MAPPED_DISPLAY[k];
        if (displayName) {
          let val = v != null ? String(v).trim() : "";
          // Normalize market values for preview
          if (k === "markets" && val) {
            const rawArr = val.split(/[,;]/).map((m: string) => m.trim()).filter(Boolean);
            const normalized: string[] = [];
            rawArr.forEach(m => {
              const id = normalizeMarketId(m);
              if (id) normalized.push(MARKET_DISPLAY[id]);
              else errors.push({ row: idx + 1, message: `Market "${m}" not recognized, will be skipped` });
            });
            val = normalized.join(", ");
          }
          clean[displayName] = val;
        }
      });
      // Ensure key cols exist even if empty
      PREVIEW_ALL_COLS.forEach(c => { if (!(c in clean)) clean[c] = ""; });
      validRows.push(clean);
    });

    setValidationErrors(errors);
    setPreviewData(validRows);
    setFullValidData(data.filter((row) => {
      const mapped = mapImportRow(row);
      const companyName = mapped.name || row["Company Name"] || row["name"] || row["title"];
      return companyName && companyName !== "Example Customer Ltd";
    }));
    setImportStep("preview");
    setShowAllColumns(false);
  };

  const executeImport = async () => {
    setImportStep("importing");
    setImportProgress(0);
    setImportProgressLabel("");
    let success = 0, updates = 0, failed = 0;

    const BATCH_SIZE = 500;
    for (let i = 0; i < fullValidData.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = fullValidData.slice(i, i + BATCH_SIZE);

      for (const row of chunk) {
        const mapped = mapImportRow(row);
        const name = mapped.name || row["Company Name"] || row["name"] || row["title"];
        const email = (mapped.email || row["Email"] || row["email"] || "").toString().toLowerCase().trim();

        const existingByEmail = email ? customers.find((c: any) => (c.email || "").toLowerCase().trim() === email) : null;
        const existingByName = name ? customers.find((c: any) => (c.name || "").toLowerCase().trim() === name.toLowerCase().trim()) : null;
        const existing = existingByEmail || existingByName;

        const marketsRaw = mapped.markets || row["Markets"] || "";
        const rawMarkets = typeof marketsRaw === "string" ? marketsRaw.split(/[,;]/).map((m: string) => m.trim()).filter(Boolean) : Array.isArray(marketsRaw) ? marketsRaw : [];
        const marketsArr = [...new Set(rawMarkets.map(m => normalizeMarketId(m)).filter(Boolean) as string[])];
        const interestsRaw = mapped.interests || row["Interests"] || "";
        const interestsStr = typeof interestsRaw === "string" ? interestsRaw : Array.isArray(interestsRaw) ? interestsRaw.join(", ") : "";

        const activeVal = mapped.active || mapped.accountStatus || row["Active"] || row["Account Status"] || "";
        const isActive = ["active", "yes", "true", "1"].includes(String(activeVal).toLowerCase().trim());

        const customerData: Record<string, any> = {
          name,
          country: mapped.country || row["Country"] || "",
          active: isActive,
          accountStatus: isActive ? "active" : "inactive",
          natureOfBusiness: mapped.natureOfBusiness || row["Nature of Business"] || "",
          specializedProducts: mapped.specializedProducts || row["Specialized Products"] || "",
          accountHealth: mapped.accountHealth || row["Health"] || "healthy",
          internalRating: parseFloat(mapped.internalRating || row["Rating"]) || 0,
          totalRevenue: parseFloat(mapped.totalRevenue || row["Total Revenue"]) || 0,
          markets: marketsArr,
          interests: interestsStr,
          bestProductPriceAI: mapped.bestProductPriceAI || "",
          notesFromAI: mapped.notesFromAI || "",
          notesFromStaff: mapped.notesFromStaff || "",
          governorateCity: mapped.governorateCity || "",
          website: mapped.website || "",
          socialFacebook: mapped.socialFacebook || "",
          socialInstagram: mapped.socialInstagram || "",
          socialLinkedin: mapped.socialLinkedin || "",
          whatsapp: mapped.whatsapp || "",
          salesManager: mapped.salesManager || "",
          exportManager: mapped.exportManager || "",
          customerServiceNumber: mapped.customerServiceNumber || "",
          customerServiceEmail: mapped.customerServiceEmail || "",
          contactPerson: mapped.contactPerson || "",
          consignee: mapped.consignee || "",
          companyOverview: mapped.companyOverview || "",
          companyDocsNotes: mapped.companyDocs || "",
          specificNotes: mapped.specificNotes || "",
          departments: marketsArr.map((m: string) => m.split('_')[0]),
          updatedAt: new Date().toISOString(),
        };
        if (email) customerData.email = email;

        try {
          if (existing && existing.id) {
            if (duplicateMode === "update") {
              batch.update(doc(db, "customers", existing.id), customerData);
              updates++;
            }
          } else {
            customerData.createdAt = new Date().toISOString();
            batch.set(doc(collection(db, "customers")), customerData);
            success++;
          }
        } catch { failed++; }
      }

      try {
        await batch.commit();
        const done = Math.min(i + chunk.length, fullValidData.length);
        setImportProgress(Math.min(100, Math.round((done / fullValidData.length) * 100)));
        setImportProgressLabel(`Importing customer ${done} of ${fullValidData.length}`);
      } catch { failed += chunk.length; }
    }

    setImportResults({ success, failed, updated: updates, invalid: validationErrors.length });
    setImportStep("success");
    toast({ title: "Import Processed", description: `Finished processing ${fullValidData.length} records.` });
  };

  const resetImport = () => {
    setImportFile(null); setImportStep("upload"); setPreviewData([]); setFullValidData([]);
    setValidationErrors([]); setImportProgress(0); setImportProgressLabel(""); setShowAllColumns(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Corporate Customers</h1>
          <p className="text-muted-foreground">Manage B2B relationships and track procurement dynamics.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>

          {/* Import Dialog */}
          <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" /> Import</Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>Bulk Customer Import</DialogTitle>
                <DialogDescription>Synchronize your database with external spreadsheets. Supports CSV (comma/semicolon), XLSX, and JSON.</DialogDescription>
              </DialogHeader>

              {importStep === "upload" && (
                <div className="space-y-6">
                  <div className="bg-secondary/20 p-6 rounded-xl border border-dashed border-primary/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-2"><FileDown className="h-4 w-4 text-primary" /> Download Import Templates</h4>
                        <p className="text-xs text-muted-foreground mt-1">Required: <span className="text-primary font-bold">Company Name</span>. All other fields are optional.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}><FileText className="mr-2 h-3 w-3" /> CSV</Button>
                        <Button variant="outline" size="sm" onClick={() => downloadTemplate("xlsx")}><FileSpreadsheet className="mr-2 h-3 w-3" /> Excel</Button>
                      </div>
                    </div>
                  </div>
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-16 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/5" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-base font-medium">Click or drag & drop to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">Accepts CSV (comma or semicolon), XLSX, and JSON</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.json" onChange={handleFileChange} />
                  </div>
                </div>
              )}

              {importStep === "preview" && (
                <div className="space-y-5">
                  {/* File info bar */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Preview
                      <span className="text-muted-foreground font-normal text-xs ml-1">(showing {Math.min(previewData.length, 10)} of {previewData.length} rows)</span>
                    </h3>
                    <div className="flex items-center gap-3">
                      <button className="text-xs text-primary hover:underline font-medium" onClick={() => setShowAllColumns(!showAllColumns)}>
                        {showAllColumns ? "Show key columns" : "Show all columns"}
                      </button>
                      <Badge variant="outline" className="font-mono text-[10px]">{importFile?.name}</Badge>
                    </div>
                  </div>

                  {/* Preview table */}
                  {(() => {
                    const cols = showAllColumns ? PREVIEW_ALL_COLS : PREVIEW_KEY_COLS;
                    const rows = previewData.slice(0, 10);
                    return (
                      <div className="max-h-[340px] overflow-auto border rounded-xl bg-card shadow-inner custom-scrollbar">
                        <Table className="w-full border-collapse">
                          <TableHeader className="sticky top-0 bg-secondary/95 backdrop-blur-sm z-20 shadow-sm">
                            <TableRow>
                              <TableHead className="text-[10px] whitespace-nowrap px-3 h-9 font-bold uppercase tracking-wider border-r w-10 text-center">#</TableHead>
                              {cols.map(col => (
                                <TableHead key={col} className={cn("text-[10px] whitespace-nowrap px-4 h-9 font-bold uppercase tracking-wider border-r last:border-r-0", col === "Company Name" && "text-primary bg-primary/5 sticky left-[40px] z-30")}>{col}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((row, i) => {
                              const hasName = !!(row["Company Name"] || "").trim();
                              return (
                                <TableRow key={i} className={cn("border-b", !hasName && "bg-destructive/5")}>
                                  <TableCell className="text-[10px] text-muted-foreground text-center px-3 border-r">{i + 1}</TableCell>
                                  {cols.map(col => {
                                    const val = (row[col] ?? "").toString().trim();
                                    return (
                                      <TableCell key={col} className={cn("text-[11px] px-4 py-2 border-r last:border-r-0", col === "Company Name" && "font-bold bg-primary/5 sticky left-[40px] z-20")}>
                                        <div className="max-w-[220px] truncate" title={val}>{val || <span className="text-muted-foreground/30">—</span>}</div>
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}

                  {/* Status cards */}
                  <div className="flex flex-col gap-3">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-bold">{fullValidData.length} Rows Ready</p>
                          <p className="text-[10px] text-muted-foreground">Missing columns will default to empty.</p>
                        </div>
                      </div>
                      <Badge className="bg-primary px-3 py-1">Ready</Badge>
                    </div>
                    {validationErrors.length > 0 && (
                      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-destructive">{validationErrors.length} rows have missing required fields</p>
                            <p className="text-[10px] text-muted-foreground">Missing "Company Name" — these rows will be skipped.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/20 h-8" onClick={downloadErrorReport}><FileX className="h-3 w-3 mr-2" /> Errors</Button>
                      </div>
                    )}
                  </div>

                  {/* Duplicate strategy */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Duplicate Strategy</label>
                    <Select value={duplicateMode} onValueChange={(v: any) => setDuplicateMode(v)}>
                      <SelectTrigger className="h-10 w-[300px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip Exact Duplicates</SelectItem>
                        <SelectItem value="update">Overwrite Existing Records</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Footer buttons */}
                  <DialogFooter className="gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={resetImport}>Cancel</Button>
                    <Button onClick={executeImport} disabled={fullValidData.length === 0} className="bg-[#0B5E75] hover:bg-[#094e63] text-white px-6">
                      Import {fullValidData.length} Customer{fullValidData.length !== 1 ? "s" : ""}
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {importStep === "importing" && (
                <div className="py-16 flex flex-col items-center justify-center space-y-6">
                  <Loader2 className="h-14 w-14 text-primary animate-spin" />
                  <div className="text-center space-y-3 w-full max-w-md">
                    <p className="font-bold text-lg">Importing Customers...</p>
                    <Progress value={importProgress} className="h-2.5" />
                    <p className="text-sm text-muted-foreground">{importProgressLabel || `${importProgress}%`}</p>
                  </div>
                </div>
              )}

              {importStep === "success" && (
                <div className="py-10 text-center space-y-6">
                  <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-500/5">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Import Complete</h3>
                    <p className="text-muted-foreground">Successfully imported {importResults.success} customer{importResults.success !== 1 ? "s" : ""}.</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                    {[
                      { label: "New", val: importResults.success, color: "text-green-500" },
                      { label: "Updated", val: importResults.updated, color: "text-blue-500" },
                      { label: "Skipped", val: importResults.invalid, color: "text-orange-500" },
                      { label: "Failed", val: importResults.failed, color: "text-destructive" },
                    ].map(r => (
                      <div key={r.label} className="p-4 bg-secondary/30 rounded-2xl border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{r.label}</p>
                        <p className={cn("text-2xl font-bold", r.color)}>{r.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button variant="outline" onClick={resetImport}><Upload className="mr-2 h-4 w-4" /> Import Another</Button>
                    <Button onClick={() => { setIsImportModalOpen(false); resetImport(); }}>View Records</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Register Customer Dialog */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Register Customer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <form onSubmit={handleCreateCustomer}>
                <DialogHeader>
                  <DialogTitle>Register New Customer</DialogTitle>
                  <DialogDescription>Fill in customer details across all tabs.</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="basic" className="mt-4">
                  <TabsList className="grid w-full grid-cols-5 h-10">
                    <TabsTrigger value="basic" className="text-xs">Basic Info</TabsTrigger>
                    <TabsTrigger value="ai" className="text-xs">AI & Notes</TabsTrigger>
                    <TabsTrigger value="location" className="text-xs">Location & Contact</TabsTrigger>
                    <TabsTrigger value="contacts" className="text-xs">Key Contacts</TabsTrigger>
                    <TabsTrigger value="company" className="text-xs">Company Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Company Name *</Label>
                        <Input name="name" required placeholder="e.g. Arab Food Logistics" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Country</Label>
                        <Input name="country" placeholder="e.g. Qatar" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Status</Label>
                        <Select name="active" defaultValue="active">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Nature of Business</Label>
                        <Input name="natureOfBusiness" placeholder="e.g. Wholesaler, Distributor" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Specialized Products</Label>
                        <Input name="specializedProducts" placeholder="e.g. Confectionery, Snacks" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Health</Label>
                        <Select name="health" defaultValue="healthy">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="healthy">Healthy</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Rating (1-5)</Label>
                        <Input name="rating" type="number" min="0" max="5" step="1" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Total Revenue</Label>
                        <Input name="totalRevenue" type="number" min="0" step="0.01" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Interests</Label>
                        <Input name="interests" placeholder="e.g. Chocolate, Premium Products" />
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t mt-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Assign Markets</Label>
                      <div className="flex gap-4">
                        {['chocolate_market', 'cosmetics_market', 'detergents_market'].map(m => (
                          <label key={m} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="markets" value={m} className="h-4 w-4 rounded border-primary/20 text-primary" />
                            <span className="text-sm capitalize">{m.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Best Product Price by AI (from n8n)</Label>
                      <Input name="bestProductPriceAI" placeholder="e.g. $5.50/kg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Notes from n8n</Label>
                      <Textarea name="notesFromAI" placeholder="AI-generated notes..." rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Notes from Staff</Label>
                      <Textarea name="notesFromStaff" placeholder="Staff notes..." rows={3} />
                    </div>
                  </TabsContent>

                  <TabsContent value="location" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Governorate / City</Label>
                        <Input name="governorateCity" placeholder="e.g. Doha" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Website</Label>
                        <Input name="website" placeholder="www.example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Facebook</Label>
                        <Input name="socialFacebook" placeholder="facebook.com/..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Instagram</Label>
                        <Input name="socialInstagram" placeholder="instagram.com/..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">LinkedIn</Label>
                        <Input name="socialLinkedin" placeholder="linkedin.com/in/..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">WhatsApp</Label>
                        <Input name="whatsapp" placeholder="+97450000000" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contacts" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Sales Manager</Label>
                        <Input name="salesManager" placeholder="Name" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Export Manager</Label>
                        <Input name="exportManager" placeholder="Name" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Customer Service Number</Label>
                        <Input name="customerServiceNumber" placeholder="+974..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Customer Service Email</Label>
                        <Input name="customerServiceEmail" placeholder="cs@..." type="email" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Contact Person</Label>
                        <Input name="contactPerson" placeholder="Name" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Consignee</Label>
                        <Input name="consignee" placeholder="Consignee name" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="company" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Company Overview</Label>
                      <Textarea name="companyOverview" placeholder="Description of the company..." rows={4} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Specific Notes / Priority</Label>
                      <Textarea name="specificNotes" placeholder="Any priority notes..." rows={3} className="border-yellow-500/30 bg-yellow-500/5" />
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Account</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-secondary/10 border-none shadow-none">
        <CardContent className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search company, business..." className="pl-9 h-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="All Countries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c: any) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Health" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3">
          <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.size})
          </Button>
          <button className="text-xs text-muted-foreground hover:underline" onClick={() => setSelectedIds(new Set())}>Clear selection</button>
        </div>
      )}

      {/* ═══ TABLE VIEW ═══ */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox checked={filteredCustomers.length > 0 && selectedIds.size === filteredCustomers.length} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Nature of Business</TableHead>
              <TableHead>Specialized Products</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead>Markets</TableHead>
              <TableHead>Interests</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading customers...</p>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.map((customer: any, idx: number) => {
              const interestsDisplay = typeof customer.interests === "string"
                ? customer.interests.split(",").map((s: string) => s.trim()).filter(Boolean)
                : Array.isArray(customer.interests?.products) ? customer.interests.products : [];
              return (
                <TableRow key={customer.id} className="group">
                  <TableCell>
                    <Checkbox checked={selectedIds.has(customer.id)} onCheckedChange={() => toggleSelect(customer.id)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                  <TableCell>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-bold hover:text-primary flex items-center gap-2 group/link text-left"
                    >
                      <div className="h-7 w-7 rounded bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                        {(customer.name || 'C')[0]}
                      </div>
                      <span className="truncate max-w-[180px]">{customer.name}</span>
                      <Eye className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity text-muted-foreground shrink-0" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{customer.country || "—"}</TableCell>
                  <TableCell>{activeBadge(customer.active ?? customer.accountStatus)}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{customer.natureOfBusiness || customer.companyType || "—"}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{customer.specializedProducts || "—"}</TableCell>
                  <TableCell>{healthBadge(customer.accountHealth || "healthy")}</TableCell>
                  <TableCell><StarRating rating={customer.internalRating || 0} /></TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs font-bold text-primary">${(customer.totalRevenue || 0).toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[130px]">
                      {Array.isArray(customer.markets) && customer.markets.map((m: string) => (
                        <Badge key={m} variant="outline" className="text-[8px] h-4 capitalize"
                          style={{
                            color: m.includes('chocolate') ? '#7B3F00' : m.includes('cosmetics') ? '#C2185B' : m.includes('detergent') ? '#0B5E75' : 'inherit',
                            backgroundColor: m.includes('chocolate') ? '#7B3F0015' : m.includes('cosmetics') ? '#C2185B15' : m.includes('detergent') ? '#0B5E7515' : 'transparent',
                            borderColor: m.includes('chocolate') ? '#7B3F0040' : m.includes('cosmetics') ? '#C2185B40' : m.includes('detergent') ? '#0B5E7540' : 'inherit'
                          }}
                        >{m.replace('_', ' ')}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {interestsDisplay.slice(0, 2).map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-[8px] h-4">{p}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onCloseAutoFocus={(ev) => ev.preventDefault()}>
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/${customer.id}`} className="cursor-pointer"><Eye className="mr-2 h-4 w-4" /> View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setTimeout(() => setMarketAssignTarget(customer), 0)}>
                          <Tags className="mr-2 h-4 w-4" /> Assign Markets
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setTimeout(() => setDeletingCustomer(customer), 0)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                  No customers found. Use the import tool to populate the database.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ═══ DIALOGS ═══ */}

      {/* Single Delete */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => { if (!open) setDeletingCustomer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-bold">{deletingCustomer?.name}</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" disabled={isDeleting} onClick={(e) => { e.preventDefault(); handleDeleteCustomer(deletingCustomer); }}>
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Customer{selectedIds.size > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" disabled={isDeleting} onClick={(e) => { e.preventDefault(); handleBulkDelete(); }}>
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : `Delete ${selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Markets */}
      <Dialog open={!!marketAssignTarget} onOpenChange={(open) => !open && setMarketAssignTarget(null)}>
        <DialogContent>
          <form onSubmit={handleAssignMarkets}>
            <DialogHeader>
              <DialogTitle>Assign Markets</DialogTitle>
              <DialogDescription>Select target markets for {marketAssignTarget?.name}</DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              {['chocolate_market', 'cosmetics_market', 'detergents_market'].map(m => (
                <label key={m} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <input type="checkbox" name="markets" value={m} defaultChecked={marketAssignTarget?.markets?.includes(m)} className="h-5 w-5 rounded border-primary/20 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold capitalize">{m.replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground">Enable access to this segment</span>
                  </div>
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMarketAssignTarget(null)}>Cancel</Button>
              <Button type="submit">Save Assignments</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
