"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  Plus, Search, Edit, Trash2, ExternalLink, Filter, 
  Download, CheckCircle2, 
  ShieldCheck, Info, Star, MoreVertical, Upload,
  FileSpreadsheet, Loader2, X, AlertTriangle,
  Mail, FileX, FileText, FileDown, Tags
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, writeBatch, setDoc, updateDoc, query, where } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supplierService } from "@/services/supplier-service";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={cn("h-2.5 w-2.5", i <= Math.round(rating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
    ))}
  </div>
);

const IMPORT_TEMPLATE_HEADERS = [
  "Company Name", "Email", "Country", "Nature of Business", "Website", "Phone", 
  "Specialized Products", "Price Tier", "Record Status", "Compliance", 
  "Completeness", "Owner", "Department"
];

const IMPORT_EXAMPLE_ROW = [
  "Example Supplier Ltd", "sales@example.com", "UAE", "Manufacturer", 
  "www.examplesupplier.com", "+971500000000", "Chocolate, Skincare products", "Premium", 
  "Active - Verified", "Valid", "90", "Alex Johnson", "Chocolate"
];

const PRIORITY_KEYS = ["Company Name", "Email", "Country", "Nature of Business", "Record Status"];

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [tierFilter, setPriceTier] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [natureFilter, setNatureFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [marketAssignTarget, setMarketAssignTarget] = useState<any>(null);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const assignedMarkets = formData.getAll('markets') as string[];
    const newDoc = doc(collection(db, "suppliers"));
    try {
      await setDoc(newDoc, {
        name: formData.get('name') as string,
        country: formData.get('country') as string,
        natureOfBusiness: formData.get('natureOfBusiness') as string,
        pricing: { tier: formData.get('tier') as string },
        markets: assignedMarkets,
        departments: assignedMarkets.map(m => m.split('_')[0]),
        recordStatus: 'Active - Verified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsAddModalOpen(false);
      toast({ title: "Supplier Added", description: "Successfully created." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to add" });
    }
  };

  const handleAssignMarkets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketAssignTarget?.id) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const assignedMarkets = formData.getAll('markets') as string[];
    try {
      const docRef = doc(db, "suppliers", marketAssignTarget.id);
      // use setDoc+merge so it works whether the doc exists in Firestore or not
      await setDoc(docRef, {
        markets: assignedMarkets,
        departments: assignedMarkets.map((m: string) => m.split('_')[0]),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setMarketAssignTarget(null);
      toast({ title: "Markets Assigned", description: "Updated successfully." });
    } catch (err: any) {
      console.error("Market assign error:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to assign. Ensure Firestore rules are deployed." });
    }
  };

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "importing" | "success">("upload");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fullValidData, setFullValidData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{row: number, message: string}[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip");
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, failed: 0, updated: 0, invalid: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const db = useFirestore();
  const { user } = useUser();
  const suppliersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "suppliers");
  }, [db, user]);
  const { data: suppliers = [], isLoading: loading } = useCollection(suppliersQuery);

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    return suppliers.filter(s => {
      const matchesSearch = (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (s.contacts?.sales?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === "all" || s.country === countryFilter;
      const matchesTier = tierFilter === "all" || s.pricing?.tier === tierFilter;
      const matchesStatus = statusFilter === "all" || s.recordStatus === statusFilter;
      const matchesNature = natureFilter === "all" || s.natureOfBusiness === natureFilter;
      return matchesSearch && matchesCountry && matchesTier && matchesStatus && matchesNature;
    });
  }, [suppliers, searchTerm, countryFilter, tierFilter, statusFilter, natureFilter]);

  const countries = Array.from(new Set(suppliers?.map(s => s.country) || [])).sort();
  const natures = Array.from(new Set(suppliers?.map(s => s.natureOfBusiness) || [])).sort();
  const tiers = ['Budget', 'Mid-Range', 'Premium', 'Luxury'];
  const statuses = Array.from(new Set(suppliers?.map(s => s.recordStatus) || [])).sort();

  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredSuppliers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `suppliers-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    if (file.name.endsWith('.csv')) {
      // Read file text first to detect delimiter
      const textReader = new FileReader();
      textReader.onload = (ev) => {
        const text = ev.target?.result as string;
        const firstLine = text.split('\n')[0] || '';
        const delimiter = firstLine.includes(';') ? ';' : ',';
        Papa.parse(file, {
          header: true,
          delimiter,
          skipEmptyLines: true,
          complete: (results) => {
            validateAndPreview(results.data);
          }
        });
      };
      textReader.readAsText(file);
    } else if (file.name.endsWith('.json')) {
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          validateAndPreview(Array.isArray(json) ? json : [json]);
        } catch (err) {
          toast({ variant: "destructive", title: "Invalid JSON", description: "Could not parse JSON file." });
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        validateAndPreview(json);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const validateAndPreview = (data: any[]) => {
    const errors: {row: number, message: string}[] = [];
    const validData = data.filter((row, idx) => {
      const companyName = row["Company Name"] || row["name"] || row["title"];
      if (companyName === "Example Supplier Ltd") return false;
      if (!companyName) {
        errors.push({ row: idx + 1, message: "Missing Company Name (Required)" });
        return false;
      }
      return true;
    });

    const processedPreview = validData.slice(0, 15).map(row => {
      const reordered: any = {};
      PRIORITY_KEYS.forEach(k => {
        if (row[k] !== undefined) reordered[k] = row[k];
      });
      Object.keys(row).forEach(k => {
        if (!PRIORITY_KEYS.includes(k)) reordered[k] = row[k];
      });
      return reordered;
    });

    setValidationErrors(errors);
    setPreviewData(processedPreview);
    setFullValidData(validData);
    setImportStep("preview");
  };

  const executeImport = async () => {
    setImportStep("importing");
    
    let success = 0;
    let updates = 0;
    let failed = 0;

    const savedUser = localStorage.getItem("demoUser");
    const manager = savedUser ? JSON.parse(savedUser) : { name: "System", department: "all" };
    const currentDept = manager.department || "all";

    const BATCH_SIZE = 500;
    for (let i = 0; i < fullValidData.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = fullValidData.slice(i, i + BATCH_SIZE);

      for (const row of chunk) {
        const name = row["Company Name"] || row["name"] || row["title"];
        const email = (row["Email"] || row["email"] || row["Support - Customer Service Email"] || "").toString().toLowerCase().trim();

        const existingByEmail = email ? suppliers?.find(s => (s.email || "").toLowerCase().trim() === email) : null;
        const existingByName = name ? suppliers?.find(s => (s.name || "").toLowerCase().trim() === name.toLowerCase().trim()) : null;
        const existing = existingByEmail || existingByName;

        const specializedProducts = (row["Specialized Products"] || row["products"] || "").toString().split(",").map((s: string) => s.trim()).filter(Boolean);
        const topProducts = (row["Top 5 Best-Selling Products"] || "").toString().split(",").map((s: string) => s.trim()).filter(Boolean);

        const supplierData = {
          name,
          companyName: name,
          email: email || null,
          country: row["Country"] || row["country"] || null,
          natureOfBusiness: row["Nature of Business"] || row["natureOfBusiness"] || "Manufacturing",
          website: row["Website"] || row["website"] || null,
          specializedProducts,
          topProducts,
          products: specializedProducts,
          markets: [] as string[],
          departments: [row["Department"] || currentDept],
          socialFacebook: row["Social Media - Facebook"] || null,
          socialInstagram: row["Social Media - Instagram"] || null,
          socialLinkedin: row["Social Media - Linkedin"] || null,
          overview: row["Company Overview"] || null,
          certifications: row["Organic / Halal Certifications"] || null,
          strategicNotes: row["Strategic Notes (GCC/KSA)"] || null,
          pricing: {
            tier: row["Price Tier"] || "Mid-Range",
            paymentTerms: (row["Payment Terms"] || "").toString().split(",").map((s: string) => s.trim()).filter(Boolean),
            leadTime: parseInt(row["Lead Time"]) || 7,
            currency: "USD",
            moq: row["MOQ"] || "100 units",
            mov: parseFloat(row["MOV"]) || 1000
          },
          contacts: {
            sales: {
              name: row["Sales Manager"] || row["Owner"] || "Main Contact",
              email: email || null,
              phone: row["Phone"] || null,
              whatsapp: row["WhatsApp"] || null
            },
            export: {
              name: row["Export Manager"] || null,
              email: null, phone: null, whatsapp: null
            },
            support: {
              phone: row["Support - Customer Service Number"] || null,
              email: row["Support - Customer Service Email"] || null,
              hours: "9-5",
              language: "English"
            }
          },
          recordStatus: row["Record Status"] || "Active - Verified",
          priorityLevel: "Medium",
          dataCompleteness: parseInt(row["Completeness"]) || 60,
          internalRating: 3,
          lastUpdatedBy: manager.name,
          lastUpdatedDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (existing && existing.id) {
          if (duplicateMode === "update") {
            const docRef = doc(db, "suppliers", existing.id);
            batch.update(docRef, supplierData);
            updates++;
          }
        } else {
          const newDocRef = doc(collection(db, "suppliers"));
          batch.set(newDocRef, supplierData);
          success++;
        }
      }

      try {
        await batch.commit();
        setImportProgress(Math.min(100, Math.round(((i + chunk.length) / fullValidData.length) * 100)));
      } catch (e) {
        failed += chunk.length;
      }
    }

    setImportResults({ success, failed, updated: updates, invalid: validationErrors.length });
    setImportStep("success");
    toast({ title: "Import Complete", description: `Synchronized ${fullValidData.length} records.` });
  };

  const handleUpdateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const assignedMarkets = formData.getAll('markets') as string[];
    const data = {
      name: formData.get('name'),
      country: formData.get('country'),
      natureOfBusiness: formData.get('natureOfBusiness'),
      markets: assignedMarkets,
      departments: assignedMarkets.map(m => m.split('_')[0]),
      pricing: {
        ...editingSupplier.pricing,
        tier: formData.get('tier')
      }
    };

    supplierService.updateSupplier(db, editingSupplier.id, data);
    setEditingSupplier(null);
    toast({ title: "Record Updated", description: `${data.name} profile has been modified.` });
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    if (confirm(`Are you sure you want to archive ${name}? This will remove it from the active directory.`)) {
      supplierService.deleteSupplier(db, id);
      toast({ title: "Supplier Archived", description: `${name} has been removed from live registry.` });
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportStep("upload");
    setPreviewData([]);
    setFullValidData([]);
    setValidationErrors([]);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Global Supplier Directory</h1>
          <p className="text-muted-foreground">Consolidated database of verified manufacturing and trading partners.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          
          <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" /> Import Suppliers
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-[90vw]">
              <DialogHeader>
                <DialogTitle>Bulk Supplier Import</DialogTitle>
                <DialogDescription>Synchronize your database with external spreadsheets.</DialogDescription>
              </DialogHeader>

              {importStep === "upload" && (
                <div className="space-y-6">
                  <div className="bg-secondary/20 p-6 rounded-xl border border-dashed border-primary/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <FileDown className="h-4 w-4 text-primary" /> Download Import Templates
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">Required: <span className="text-primary font-bold">Company Name</span>. All other fields are optional.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => resetImport()}>
                          <FileText className="mr-2 h-3 w-3" /> CSV Template
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div
                    className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-16 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-base font-medium">Click or drag & drop to upload</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.json" onChange={handleFileChange} />
                  </div>
                </div>
              )}

              {importStep === "preview" && (
                <div className="space-y-6">
                  <div className="max-h-[400px] overflow-x-auto overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm" style={{ minWidth: 'max-content' }}>
                      <thead className="sticky top-0 bg-background border-b z-10">
                        <tr>
                          {previewData.length > 0 && Object.keys(previewData[0] || {}).map(k => (
                            <th key={k} className="text-[10px] uppercase whitespace-nowrap font-semibold text-muted-foreground px-4 py-3 text-left">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="text-[11px] whitespace-nowrap px-4 py-2.5 max-w-[200px] truncate">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-primary">{fullValidData.length} Valid Records Ready</p>
                      {validationErrors.length > 0 && <p className="text-xs text-destructive">{validationErrors.length} invalid rows will be skipped.</p>}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => { resetImport(); }}>Cancel</Button>
                      <Button className="bg-[#0E7A96] hover:bg-[#0B5E75]" onClick={executeImport}>
                        Import {fullValidData.length} Suppliers
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {importStep === "importing" && (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <Progress value={importProgress} className="w-full max-w-xs h-2" />
                  <p className="text-sm">Importing {Math.max(1, Math.round((importProgress / 100) * fullValidData.length))} of {fullValidData.length}...</p>
                </div>
              )}

              {importStep === "success" && (
                <div className="py-12 text-center space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-bold">Import Complete</h3>
                  <p className="text-sm text-muted-foreground">
                    Successfully imported {importResults.success} of {importResults.success + importResults.failed} suppliers.
                    {importResults.updated > 0 && ` ${importResults.updated} existing records updated.`}
                    {importResults.failed > 0 && ` ${importResults.failed} failed.`}
                  </p>
                  <Button onClick={() => { setIsImportModalOpen(false); resetImport(); }}>Return to Hub</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Button size="sm" className="bg-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleCreateSupplier}>
                <DialogHeader>
                  <DialogTitle>Register New Supplier</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Company Name</label>
                    <Input name="name" required placeholder="e.g. Global Trade LLC" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Nature of Business</label>
                    <Select name="natureOfBusiness" defaultValue="Manufacturer">
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                        <SelectItem value="Trader">Trading Company</SelectItem>
                        <SelectItem value="Distributor">Distributor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Country</label>
                    <Select name="country">
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        {countries.length > 0 ? countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>) : <SelectItem value="Global">Global</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Price Tier</label>
                    <Select name="tier" defaultValue="Mid-Range">
                      <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                      <SelectContent>
                        {tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2 pt-2 border-t mt-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Assign Markets</label>
                    <div className="flex gap-4">
                      {['chocolate_market', 'cosmetics_market', 'detergents_market'].map(m => (
                        <label key={m} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="markets" value={m} className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary" />
                          <span className="text-sm capitalize">{m.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Supplier</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-secondary/10 border-none shadow-none">
        <CardContent className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search companies..." 
              className="pl-9 h-9" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="All Countries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={setPriceTier}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Price Tier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Record Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={natureFilter} onValueChange={setNatureFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Nature of Biz" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Natures</SelectItem>
              {natures.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Company Name</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Markets</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Price Tier</TableHead>
              <TableHead>Record Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading suppliers...</p>
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id} className="group">
                <TableCell>
                  <div>
                    <Link href={`/suppliers/${supplier.id}`} className="font-bold hover:text-primary flex items-center gap-2 group/link">
                      <span className="text-lg">{supplier.flag || '🏭'}</span>
                      {supplier.name}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </Link>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="font-bold">{supplier.contacts?.sales?.name || 'No Contact'}</span>
                      <span>•</span>
                      <span>{supplier.country || "Global"}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs">{supplier.natureOfBusiness}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {Array.isArray(supplier.markets) && supplier.markets.map((m: string) => (
                      <Badge 
                        key={m} 
                        variant="outline" 
                        className="text-[8px] h-4 capitalize"
                        style={{
                          color: m === 'chocolate_market' ? '#7B3F00' : m === 'cosmetics_market' ? '#C2185B' : m === 'detergents_market' ? '#0B5E75' : 'inherit',
                          backgroundColor: m === 'chocolate_market' ? '#7B3F0015' : m === 'cosmetics_market' ? '#C2185B15' : m === 'detergents_market' ? '#0B5E7515' : 'transparent',
                          borderColor: m === 'chocolate_market' ? '#7B3F0040' : m === 'cosmetics_market' ? '#C2185B40' : m === 'detergents_market' ? '#0B5E7540' : 'inherit'
                        }}
                      >
                        {m.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {Array.isArray(supplier.specializedProducts) && supplier.specializedProducts.slice(0, 2).map((p: string) => (
                      <Badge key={p} variant="secondary" className="text-[8px] h-4">{p}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-bold",
                    supplier.pricing?.tier === 'Luxury' && "border-primary text-primary",
                    supplier.pricing?.tier === 'Premium' && "border-blue-500 text-blue-500",
                    supplier.pricing?.tier === 'Mid-Range' && "border-green-500 text-green-500"
                  )}>
                    {supplier.pricing?.tier || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[9px] capitalize",
                    supplier.recordStatus?.includes('Verified') && "bg-green-500",
                    supplier.recordStatus === 'Blacklisted' && "bg-destructive",
                    supplier.recordStatus === 'Checking Data' && "bg-orange-500"
                  )}>
                    {supplier.recordStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setMarketAssignTarget(supplier)} title="Assign Market">
                      <Tags className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/suppliers/${supplier.id}`}><ExternalLink className="mr-2 h-4 w-4" /> Full Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setEditingSupplier(supplier)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Record
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleDeleteSupplier(supplier.id, supplier.name)} className="text-destructive font-bold">
                        <Trash2 className="mr-2 h-4 w-4" /> Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Supplier Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdateSupplier}>
            <DialogHeader>
              <DialogTitle>Edit Supplier Profile</DialogTitle>
              <DialogDescription>Modify core partner information for the global directory.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Company Name</label>
                <Input name="name" defaultValue={editingSupplier?.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Nature of Business</label>
                <Select name="natureOfBusiness" defaultValue={editingSupplier?.natureOfBusiness}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="Trader">Trading Company</SelectItem>
                    <SelectItem value="Distributor">Distributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Base Country</label>
                <Input name="country" defaultValue={editingSupplier?.country} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Price Tier</label>
                <Select name="tier" defaultValue={editingSupplier?.pricing?.tier}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2 pt-2 border-t mt-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Assign Markets</label>
                <div className="flex gap-4">
                  {['chocolate_market', 'cosmetics_market', 'detergents_market'].map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="markets" value={m} defaultChecked={editingSupplier?.markets?.includes(m)} className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary" />
                      <span className="text-sm capitalize">{m.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingSupplier(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!marketAssignTarget} onOpenChange={(open) => !open && setMarketAssignTarget(null)}>
        <DialogContent>
          <form onSubmit={handleAssignMarkets}>
            <DialogHeader>
              <DialogTitle>Assign Markets</DialogTitle>
              <DialogDescription>Select the target markets for {marketAssignTarget?.name}</DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              {['chocolate_market', 'cosmetics_market', 'detergents_market'].map(m => (
                <label key={m} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="markets" 
                    value={m} 
                    defaultChecked={marketAssignTarget?.markets?.includes(m)}
                    className="h-5 w-5 rounded border-primary/20 text-primary" 
                  />
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
