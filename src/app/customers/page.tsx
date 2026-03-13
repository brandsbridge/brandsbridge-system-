"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  Plus, Search, Trash2, Edit, ExternalLink, 
  Download, Star, HeartPulse, 
  FileText, Upload, CheckCircle2, Loader2, FileSpreadsheet,
  FileDown, AlertTriangle, Mail, X, FileX
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
import { useCollection, useFirestore } from "@/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { MOCK_CUSTOMERS } from "@/lib/mock-data";
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
  "Company Name", "Country", "City", "Company Type", "Contact Person",
  "Designation", "Email", "Phone", "WhatsApp", "Website", "LinkedIn",
  "Account Status", "Product Interests", "Preferred Payment Terms",
  "Preferred Currency", "Annual Budget", "Notes"
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
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
  const customersQuery = useMemo(() => collection(db, "customers"), [db]);
  const { data: firestoreCustomers = [], loading } = useCollection(customersQuery);

  const customers = useMemo(() => {
    if (firestoreCustomers.length > 0) return firestoreCustomers;
    return MOCK_CUSTOMERS;
  }, [firestoreCustomers]);

  const countries = Array.from(new Set(customers.map(c => c.country))).sort();
  const statuses = Array.from(new Set(customers.map(c => c.accountStatus))).sort();

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (c.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === "all" || c.country === countryFilter;
      const matchesStatus = statusFilter === "all" || c.accountStatus === statusFilter;
      const matchesHealth = healthFilter === "all" || c.accountHealth === healthFilter;
      return matchesSearch && matchesCountry && matchesStatus && matchesHealth;
    });
  }, [customers, searchTerm, countryFilter, statusFilter, healthFilter]);

  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredCustomers.map(c => ({
      ...c,
      interests: Array.isArray(c.interests?.products) ? c.interests.products.join(", ") : "",
      departments: Array.isArray(c.departments) ? c.departments.join(", ") : ""
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
    const worksheet = XLSX.utils.json_to_sheet(filteredCustomers.map(c => ({
      "Company Name": c.name,
      "Email": c.email,
      "Country": c.country,
      "City": c.city,
      "Account Status": c.accountStatus,
      "Revenue": c.totalRevenue
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, `customers-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadTemplate = (type: "csv" | "xlsx") => {
    if (type === "csv") {
      const csv = Papa.unparse([IMPORT_TEMPLATE_HEADERS]);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "customer_import_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const worksheet = XLSX.utils.aoa_to_sheet([IMPORT_TEMPLATE_HEADERS]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      XLSX.writeFile(workbook, "customer_import_template.xlsx");
    }
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
    link.setAttribute("download", `customer_import_errors_${new Date().toISOString()}.csv`);
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
      
      // Only critical field is Company Name
      if (!companyName) {
        errors.push({ row: idx + 1, message: "Missing Company Name (Required)" });
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

    const BATCH_SIZE = 500;
    for (let i = 0; i < fullValidData.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = fullValidData.slice(i, i + BATCH_SIZE);

      for (const row of chunk) {
        const email = (row["Email"] || row["email"] || "").toString().toLowerCase().trim();
        const name = row["Company Name"] || row["name"] || row["title"];
        
        // Flexible duplicate detection: only check if email is provided
        const existing = email ? customers.find(c => (c.email || "").toLowerCase().trim() === email) : null;
        
        // Map available columns, use null for missing fields
        const customerData = {
          name,
          email: email || null,
          country: row["Country"] || row["country"] || null,
          city: row["City"] || row["city"] || null,
          companyType: row["Company Type"] || row["companyType"] || "Retailer",
          accountStatus: (row["Account Status"] || row["accountStatus"] || "prospect").toLowerCase(),
          departments: [currentDept],
          assignedManager: manager.name,
          totalRevenue: parseFloat(row["Annual Budget"] || row["totalRevenue"] || row["Revenue"]) || 0,
          accountHealth: "healthy",
          lastContactDate: new Date().toISOString(),
          dataCompleteness: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        try {
          if (existing && existing.id) {
            if (duplicateMode === "update") {
              const docRef = doc(db, "customers", existing.id);
              batch.update(docRef, customerData);
              updates++;
            }
          } else {
            const newDocRef = doc(collection(db, "customers"));
            batch.set(newDocRef, customerData);
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
    toast({ title: "Import Processed", description: `Finished processing ${fullValidData.length} records.` });
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
          <h1 className="text-3xl font-bold tracking-tight font-headline">Corporate Buyers</h1>
          <p className="text-muted-foreground">Manage B2B relationships and track procurement dynamics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          
          <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" /> Import Customers
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Import Customers</DialogTitle>
                <DialogDescription>Bulk upload customer data. Only "Company Name" is required; missing fields will be set to null automatically.</DialogDescription>
              </DialogHeader>

              {importStep === "upload" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-lg border border-dashed border-primary/20">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Step 1: Download Templates</p>
                      <p className="text-xs text-muted-foreground">Standardized headers for a smooth import.</p>
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
                    <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, and .json</p>
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
                      <FileText className="h-4 w-4 text-primary" /> Data Preview
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
                              <TableCell key={j} className="text-[10px] whitespace-nowrap">{val ? String(val) : <span className="text-muted-foreground italic">null</span>}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="bg-secondary/20 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-bold">{fullValidData.length} Rows Ready</p>
                          <p className="text-xs text-muted-foreground">Incomplete fields will be filled with null values.</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500">Ready</Badge>
                    </div>

                    {validationErrors.length > 0 && (
                      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-destructive">{validationErrors.length} Invalid Rows (Missing Name)</p>
                            <p className="text-xs text-muted-foreground">These rows are missing the required "Company Name" and will be skipped.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/20" onClick={downloadErrorReport}>
                          <FileX className="h-3 w-3 mr-2" /> Error Report
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Duplicate Handling</label>
                      <Select value={duplicateMode} onValueChange={(v: any) => setDuplicateMode(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip Existing Emails</SelectItem>
                          <SelectItem value="update">Update Existing Records</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={resetImport}>Re-upload</Button>
                    <Button onClick={executeImport} disabled={fullValidData.length === 0} className="bg-primary">
                      Import {fullValidData.length} Records
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {importStep === "importing" && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <div className="text-center space-y-2 w-full max-w-sm">
                    <p className="font-bold">Writing to Firestore...</p>
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
                    <h3 className="text-xl font-bold">Import Complete</h3>
                    <p className="text-muted-foreground">Records have been synchronized. All missing optional fields were stored as null.</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto">
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Created</p>
                      <p className="text-xl font-bold text-green-500">{importResults.success}</p>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Updated</p>
                      <p className="text-xl font-bold text-blue-500">{importResults.updated}</p>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Skipped</p>
                      <p className="text-xl font-bold text-orange-500">{importResults.invalid}</p>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Failed</p>
                      <p className="text-xl font-bold text-destructive">{importResults.failed}</p>
                    </div>
                  </div>
                  <Button className="w-full max-w-sm" onClick={() => setIsImportModalOpen(false)}>Close & Finish</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="mr-2 h-4 w-4" /> Register Buyer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register New B2B Customer</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Company Name</label>
                  <Input placeholder="e.g. Arab Food Logistics" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Company Type</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retailer">Retailer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
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
                  <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddModalOpen(false)}>Create Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-secondary/10 border-none shadow-none">
        <CardContent className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by company or email..." 
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Account Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Account Health" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="at risk">At Risk</SelectItem>
              <SelectItem value="dormant">Dormant</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Interests</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading buyers...</p>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.map((customer) => (
              <TableRow key={customer.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                      {customer.name?.[0] || 'C'}
                    </div>
                    <div>
                      <Link href={`/customers/${customer.id}`} className="font-bold hover:text-primary flex items-center gap-1 group/link">
                        {customer.name}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </Link>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>{customer.country || "Global"}</span>
                        <span>•</span>
                        <span>{customer.assignedManager}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs">{customer.companyType}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[9px] capitalize",
                    customer.accountStatus === 'active' && "bg-green-500 text-white border-none",
                    customer.accountStatus === 'key account' && "bg-primary text-white border-none",
                    customer.accountStatus === 'at risk' && "bg-yellow-500 text-white border-none"
                  )}>
                    {customer.accountStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {Array.isArray(customer.interests?.products) && customer.interests.products.slice(0, 2).map(p => (
                      <Badge key={p} variant="secondary" className="text-[8px] h-4">{p}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <HeartPulse className={cn("h-3 w-3", customer.accountHealth === 'healthy' ? "text-green-500" : "text-destructive")} />
                    <span className="text-[10px] capitalize font-medium">{customer.accountHealth}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <StarRating rating={customer.internalRating || 0} />
                    <div className="w-16">
                      <Progress value={customer.dataCompleteness} className="h-1" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-xs font-bold text-primary">${(customer.totalRevenue || 0).toLocaleString()}</div>
                  <div className="text-[8px] text-muted-foreground">Lifetime Value</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/customers/${customer.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Mail className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No customers found. Use the import tool to populate the database.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
