"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  Plus, Search, Edit, Trash2, ExternalLink, Filter, 
  Download, Printer, CheckCircle2, 
  ShieldCheck, Info, Star, MoreVertical, Upload,
  FileSpreadsheet, FileDown, Loader2, X, AlertTriangle,
  Mail
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
  "Company Name", "Country", "Nature of Business", "Contact Person",
  "Email", "Phone", "WhatsApp", "Website", "Specialized Products",
  "Price Tier", "Payment Terms", "Lead Time", "Notes"
];

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
  const [importResults, setImportResults] = useState({ success: 0, failed: 0, updated: 0 });
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
    if (type === "csv") {
      const csv = Papa.unparse([IMPORT_TEMPLATE_HEADERS]);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "supplier_import_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const worksheet = XLSX.utils.aoa_to_sheet([IMPORT_TEMPLATE_HEADERS]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      XLSX.writeFile(workbook, "supplier_import_template.xlsx");
    }
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
      const companyName = row["Company Name"] || row["name"];
      const email = row["Email"] || row["email"];
      
      if (!companyName || !email) {
        errors.push({ row: idx + 1, message: "Missing Company Name or Email" });
        return false;
      }
      return true;
    });

    setValidationErrors(errors);
    setPreviewData(validData.slice(0, 10));
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

    const batch = writeBatch(db);

    for (let i = 0; i < fullValidData.length; i++) {
      const row = fullValidData[i];
      const email = row["Email"] || row["email"];
      const name = row["Company Name"] || row["name"];
      
      const existing = suppliers.find(s => (s.email || "").toLowerCase() === (email || "").toLowerCase());
      
      const supplierData = {
        name,
        email,
        country: row["Country"] || "Unknown",
        natureOfBusiness: row["Nature of Business"] || "Trading Company",
        website: row["Website"] || "",
        departments: [currentDept],
        specializedProducts: (row["Specialized Products"] || "").split(",").map((s: string) => s.trim()),
        pricing: {
          tier: row["Price Tier"] || "Mid-Range",
          paymentTerms: (row["Payment Terms"] || "").split(",").map((s: string) => s.trim()),
          leadTime: parseInt(row["Lead Time"]) || 7,
          currency: "USD",
          moq: "100 units",
          mov: 1000
        },
        contacts: {
          sales: { name: row["Contact Person"] || "Unknown", email, phone: row["Phone"] || "", whatsapp: row["WhatsApp"] || "" },
          export: { name: "", email: "", phone: "", whatsapp: "" },
          support: { phone: "", email: "", hours: "9-5", language: "English" }
        },
        recordStatus: "Active - Pending Verification",
        priorityLevel: "Medium",
        dataCompleteness: 60,
        internalRating: 3,
        lastUpdatedBy: manager.name,
        lastUpdatedDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
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

      if ((i + 1) % 50 === 0 || i === fullValidData.length - 1) {
        setImportProgress(Math.round(((i + 1) / fullValidData.length) * 100));
      }
    }

    try {
      await batch.commit();
      setImportResults({ success, failed, updated: updates });
      setImportStep("success");
      toast({ title: "Import Complete", description: `Processed ${fullValidData.length} records.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Import Failed", description: "Database error during save." });
      setImportStep("preview");
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportStep("upload");
    setPreviewData([]);
    setFullValidData([]);
    setValidationErrors([]);
    setImportProgress(0);
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
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Import Suppliers</DialogTitle>
                <DialogDescription>Bulk upload supplier profiles from CSV or Excel files.</DialogDescription>
              </DialogHeader>

              {importStep === "upload" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-lg border border-dashed border-primary/20">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Step 1: Download Templates</p>
                      <p className="text-xs text-muted-foreground">Use our standardized headers for a smooth import.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}>
                        <FileDown className="mr-2 h-3 w-3" /> CSV Template
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadTemplate("xlsx")}>
                        <FileSpreadsheet className="mr-2 h-3 w-3" /> Excel Template
                      </Button>
                    </div>
                  </div>

                  <div 
                    className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-sm font-medium">Click or drag & drop to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports .csv and .xlsx up to 10MB</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".csv,.xlsx" 
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              )}

              {importStep === "preview" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Data Preview (First 10 Rows)
                    </h3>
                    <Badge variant="outline">{importFile?.name}</Badge>
                  </div>

                  <div className="max-h-[300px] overflow-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {previewData.length > 0 && Object.keys(previewData[0] || {}).map(k => (
                            <TableHead key={k} className="text-[10px] whitespace-nowrap">{k}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((val: any, j) => (
                              <TableCell key={j} className="text-[10px] whitespace-nowrap">{String(val)}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3 items-start">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-destructive">Validation Errors Found</p>
                        <p className="text-xs text-muted-foreground">Errors in {validationErrors.length} rows. Please fix these in your file and re-upload.</p>
                        <ul className="mt-2 space-y-1">
                          {validationErrors.slice(0, 3).map((err, i) => (
                            <li key={i} className="text-[10px] text-destructive">Row {err.row}: {err.message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Duplicate Handling</label>
                      <Select value={duplicateMode} onValueChange={(v: any) => setDuplicateMode(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip All Duplicates</SelectItem>
                          <SelectItem value="update">Update Existing Records</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={resetImport}>Re-upload</Button>
                    <Button onClick={executeImport} disabled={validationErrors.length > 0}>
                      Start Import ({fullValidData.length} rows)
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {importStep === "importing" && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <div className="text-center space-y-2 w-full max-w-sm">
                    <p className="font-bold">Importing Records...</p>
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{importProgress}% Complete</p>
                  </div>
                </div>
              )}

              {importStep === "success" && (
                <div className="py-8 text-center space-y-6">
                  <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Import Successful!</h3>
                    <p className="text-muted-foreground">Supplier records have been added to Firestore.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Created</p>
                      <p className="text-xl font-bold text-green-500">{importResults.success}</p>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Updated</p>
                      <p className="text-xl font-bold text-blue-500">{importResults.updated}</p>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Failed</p>
                      <p className="text-xl font-bold text-destructive">{importResults.failed}</p>
                    </div>
                  </div>
                  <Button className="w-full max-w-sm" onClick={() => setIsImportModalOpen(false)}>Close & Refresh</Button>
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
                      <span>{supplier.country}</span>
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
                    {(supplier.specializedProducts?.length || 0) > 2 && (
                      <Badge variant="outline" className="text-[8px] h-4">+{supplier.specializedProducts.length - 2}</Badge>
                    )}
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
                    {supplier.certifications?.organic?.has && <Badge className="h-4 w-4 p-0 flex items-center justify-center bg-blue-500 rounded-full" title="Organic"><Info className="h-2.5 w-2.5 text-white" /></Badge>}
                    {supplier.certifications?.iso?.has && <Badge className="h-4 w-4 p-0 flex items-center justify-center bg-purple-500 rounded-full" title="ISO"><ShieldCheck className="h-2.5 w-2.5 text-white" /></Badge>}
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
                      <DropdownMenuItem><Printer className="mr-2 h-4 w-4" /> Print PDF</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
