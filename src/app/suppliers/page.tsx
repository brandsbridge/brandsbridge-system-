"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  Plus, Search, Edit, Trash2, ExternalLink, Filter, 
  Download, Printer, CheckCircle2, 
  ShieldCheck, Info, Star, MoreVertical, Upload,
  FileSpreadsheet, FileDown, Loader2, X, AlertTriangle,
  Mail, FileX, FileText
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
import { useCollection, useFirestore } from "@/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { MOCK_SUPPLIERS } from "@/lib/mock-data";
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
  const suppliersQuery = useMemo(() => collection(db, "suppliers"), [db]);
  const { data: firestoreSuppliers = [], loading } = useCollection(suppliersQuery);

  const suppliers = useMemo(() => {
    if (firestoreSuppliers.length > 0) return firestoreSuppliers;
    return MOCK_SUPPLIERS;
  }, [firestoreSuppliers]);

  const filteredSuppliers = useMemo(() => {
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

  const countries = Array.from(new Set(suppliers.map(s => s.country))).sort();
  const natures = Array.from(new Set(suppliers.map(s => s.natureOfBusiness))).sort();
  const tiers = ['Budget', 'Mid-Range', 'Premium', 'Luxury'];
  const statuses = Array.from(new Set(suppliers.map(s => s.recordStatus))).sort();

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

  const downloadTemplate = (type: "csv" | "xlsx") => {
    const data = [IMPORT_TEMPLATE_HEADERS, IMPORT_EXAMPLE_ROW];
    if (type === "csv") {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "supplier_import_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      XLSX.writeFile(workbook, "supplier_import_template.xlsx");
    }
    toast({ title: "Template Downloaded", description: "Use this file to structure your supplier data." });
  };

  const downloadErrorReport = () => {
    if (validationErrors.length === 0) return;
    const csvData = validationErrors.map(e => ({
      Row: e.row,
      Error: e.message
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `supplier_import_errors_${new Date().toISOString()}.csv`);
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
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          validateAndPreview(results.data);
        }
      });
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
      
      // Skip example row if it exists in the data
      if (companyName === "Example Supplier Ltd") return false;

      // Only Company Name is strictly required
      if (!companyName) {
        errors.push({ row: idx + 1, message: "Missing Company Name (Required)" });
        return false;
      }
      return true;
    });

    // Reorder keys for professional preview
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
        const email = (row["Email"] || row["email"] || "").toString().toLowerCase().trim();
        const name = row["Company Name"] || row["name"] || row["title"];
        
        // Flexible duplicate detection
        const existingByEmail = email ? suppliers.find(s => (s.email || "").toLowerCase().trim() === email) : null;
        const existingByName = name ? suppliers.find(s => (s.name || "").toLowerCase().trim() === name.toLowerCase().trim()) : null;
        const existing = existingByEmail || existingByName;
        
        // Map available fields, fill missing with null
        const supplierData = {
          name,
          email: email || null,
          country: row["Country"] || row["country"] || null,
          natureOfBusiness: row["Nature of Business"] || row["natureOfBusiness"] || "Manufacturing",
          website: row["Website"] || row["website"] || null,
          departments: [row["Department"] || currentDept],
          specializedProducts: (row["Specialized Products"] || "").split(",").map((s: string) => s.trim()).filter(Boolean),
          pricing: {
            tier: row["Price Tier"] || "Mid-Range",
            paymentTerms: (row["Payment Terms"] || "").split(",").map((s: string) => s.trim()).filter(Boolean),
            leadTime: parseInt(row["Lead Time"]) || 7,
            currency: "USD",
            moq: row["MOQ"] || "100 units",
            mov: parseFloat(row["MOV"]) || 1000
          },
          contacts: {
            sales: { 
              name: row["Owner"] || "Main Contact", 
              email: email || null, 
              phone: row["Phone"] || null, 
              whatsapp: row["WhatsApp"] || null 
            },
            export: { name: null, email: null, phone: null, whatsapp: null },
            support: { phone: null, email: null, hours: "9-5", language: "English" }
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

        try {
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
        } catch (e) {
          failed++;
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
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>Bulk Supplier Import</DialogTitle>
                <DialogDescription>Synchronize your database with external spreadsheets. Imports are additive and check for duplicates automatically.</DialogDescription>
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
                        <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}>
                          <FileText className="mr-2 h-3 w-3" /> CSV Template
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadTemplate("xlsx")}>
                          <FileSpreadsheet className="mr-2 h-3 w-3" /> Excel Template
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
                    <p className="text-xs text-muted-foreground mt-1">Accepts CSV, XLSX, and JSON formats</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".csv,.xlsx,.json" 
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              )}

              {importStep === "preview" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Professional Preview (Pinned Fields First)
                    </h3>
                    <Badge variant="outline" className="font-mono text-[10px]">{importFile?.name}</Badge>
                  </div>

                  <div className="max-h-[450px] overflow-x-auto border rounded-xl bg-card shadow-inner custom-scrollbar">
                    <Table className="min-w-max w-full border-collapse">
                      <TableHeader className="sticky top-0 bg-secondary/95 backdrop-blur-sm z-20 shadow-sm">
                        <TableRow className="border-b">
                          {previewData.length > 0 && Object.keys(previewData[0] || {}).map(k => (
                            <TableHead key={k} className={cn(
                              "text-[10px] whitespace-nowrap px-4 h-12 font-bold uppercase tracking-wider border-r last:border-r-0 max-w-[250px] overflow-hidden text-ellipsis",
                              k === "Company Name" && "text-primary bg-primary/5 sticky left-0 z-30"
                            )}>
                              {k}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, i) => (
                          <TableRow key={i} className="hover:bg-muted/30 transition-colors border-b last:border-b-0">
                            {Object.entries(row).map(([key, val]: [string, any], j) => (
                              <TableCell key={j} className={cn(
                                "text-[11px] px-4 py-3 border-r last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]",
                                key === "Company Name" && "font-bold text-foreground bg-primary/5 sticky left-0 z-20"
                              )}>
                                <span title={val ? String(val) : "null"}>
                                  {val ? String(val) : <span className="text-muted-foreground/30 italic">&lt;null&gt;</span>}
                                </span>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{fullValidData.length} Rows Validated for Sync</p>
                          <p className="text-[10px] text-muted-foreground">System will intelligently map available columns and handle missing data as null.</p>
                        </div>
                      </div>
                      <Badge className="bg-primary px-3 py-1">Verified</Badge>
                    </div>

                    {validationErrors.length > 0 && (
                      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-destructive">{validationErrors.length} Invalid Rows (Missing Company Name)</p>
                            <p className="text-[10px] text-muted-foreground">These rows will be ignored. Required fields must be populated.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/20 h-8" onClick={downloadErrorReport}>
                          <FileX className="h-3 w-3 mr-2" /> Download Error Report
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Import Behavior</label>
                      <Select value={duplicateMode} onValueChange={(v: any) => setDuplicateMode(v)}>
                        <SelectTrigger className="h-10 border-primary/20 focus:ring-primary/30"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Append Only (Skip Duplicates)</SelectItem>
                          <SelectItem value="update">Sync & Update Existing Records</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={resetImport} className="h-10">Cancel & Reset</Button>
                    <Button onClick={executeImport} disabled={fullValidData.length === 0} className="bg-primary h-10 px-8">
                      Sync {fullValidData.length} Suppliers to Firestore
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {importStep === "importing" && (
                <div className="py-20 flex flex-col items-center justify-center space-y-8">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-primary/50" />
                    </div>
                  </div>
                  <div className="text-center space-y-3 w-full max-w-sm">
                    <p className="font-bold text-lg">Updating Cloud Database...</p>
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground font-mono">{importProgress}% Processed</p>
                  </div>
                </div>
              )}

              {importStep === "success" && (
                <div className="py-12 text-center space-y-8">
                  <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-500/5">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Import Successful</h3>
                    <p className="text-muted-foreground">Supplier records have been committed to your dynamic Firestore backend.</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                    {[
                      { label: "Created", val: importResults.success, color: "text-green-500" },
                      { label: "Updated", val: importResults.updated, color: "text-blue-500" },
                      { label: "Invalid", val: importResults.invalid, color: "text-orange-500" },
                      { label: "Errors", val: importResults.failed, color: "text-destructive" }
                    ].map(res => (
                      <div key={res.label} className="p-4 bg-secondary/30 rounded-2xl border flex flex-col gap-1 shadow-sm">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{res.label}</p>
                        <p className={cn("text-2xl font-bold", res.color)}>{res.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button variant="outline" className="h-11 px-8" onClick={resetImport}>
                      <Upload className="mr-2 h-4 w-4" /> Import Another File
                    </Button>
                    <Button className="h-11 px-8" onClick={() => setIsImportModalOpen(false)}>
                      <ExternalLink className="mr-2 h-4 w-4" /> View Supplier Directory
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="mr-2 h-4 w-4" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register New Global Supplier</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Company Name</label>
                  <Input placeholder="e.g. Istanbul Industrial Group" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nature of Business</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select nature" /></SelectTrigger>
                    <SelectContent>
                      {natures.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Country</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Price Tier</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                    <SelectContent>
                      {tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddModalOpen(false)}>Initialize Profile</Button>
              </DialogFooter>
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
              <TableHead>Products</TableHead>
              <TableHead>Price Tier</TableHead>
              <TableHead>Record Status</TableHead>
              <TableHead className="w-[120px]">Completeness</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
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
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {Array.isArray(supplier.specializedProducts) && supplier.specializedProducts.slice(0, 2).map((p: string) => (
                      <Badge key={p} variant="secondary" className="text-[8px] h-4">{p}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-bold",
                    supplier.pricing?.tier === 'Luxury' && "border-purple-500 text-purple-500",
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
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold">
                      <span>{supplier.dataCompleteness}%</span>
                    </div>
                    <Progress 
                      value={supplier.dataCompleteness} 
                      className="h-1" 
                      indicatorClassName={cn(
                        supplier.dataCompleteness > 80 ? "bg-green-500" : supplier.dataCompleteness > 50 ? "bg-yellow-500" : "bg-destructive"
                      )}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {supplier.certifications?.halal?.has && <Badge className="h-4 w-4 p-0 flex items-center justify-center bg-green-500 rounded-full" title="Halal"><CheckCircle2 className="h-2.5 w-2.5 text-white" /></Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/suppliers/${supplier.id}`}><ExternalLink className="mr-2 h-4 w-4" /> Full Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit Record</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No suppliers found. Use the import tool to populate the database.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
