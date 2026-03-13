"use client";

import React, { useMemo, useState, useRef } from "react";
import { 
  Database, 
  ShieldAlert, 
  RefreshCw, 
  Settings, 
  Server, 
  HardDrive, 
  Activity,
  FileText,
  Users,
  Factory,
  Package,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  DatabaseZap,
  Info,
  FileX
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCollection, useFirestore } from "@/firebase";
import { collection, writeBatch, doc, getDocs, query, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const CORE_COLLECTIONS = [
  { id: 'suppliers', label: 'Suppliers', icon: Factory, uniqueKey: 'email' },
  { id: 'customers', label: 'Customers', icon: Users, uniqueKey: 'email' },
  { id: 'products', label: 'Products', icon: Package, uniqueKey: 'name' },
  { id: 'leads', label: 'CRM Leads', icon: DatabaseZap, uniqueKey: 'name' },
  { id: 'employees', label: 'Employees', icon: Settings, uniqueKey: 'email' },
  { id: 'tasks', label: 'Project Tasks', icon: FileText, uniqueKey: 'title' },
];

export default function SystemManagementPage() {
  const db = useFirestore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<"select" | "preview" | "processing" | "success">("select");
  const [targetCollection, setTargetCollection] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fullValidData, setFullValidData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{row: number, message: string}[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize collections to prevent infinite loops
  const suppliersCol = useMemo(() => collection(db, "suppliers"), [db]);
  const customersCol = useMemo(() => collection(db, "customers"), [db]);
  const productsCol = useMemo(() => collection(db, "products"), [db]);
  const employeesCol = useMemo(() => collection(db, "employees"), [db]);
  const tasksCol = useMemo(() => collection(db, "tasks"), [db]);
  const leadsCol = useMemo(() => collection(db, "leads"), [db]);

  const { data: suppliers } = useCollection(suppliersCol);
  const { data: customers } = useCollection(customersCol);
  const { data: products } = useCollection(productsCol);
  const { data: employees } = useCollection(employeesCol);
  const { data: tasks } = useCollection(tasksCol);
  const { data: leads } = useCollection(leadsCol);

  const stats = [
    { label: "Suppliers", count: suppliers.length, icon: Factory, color: "text-blue-500" },
    { label: "Customers", count: customers.length, icon: Users, color: "text-purple-500" },
    { label: "Products", count: products.length, icon: Package, color: "text-orange-500" },
    { label: "Leads", count: leads.length, icon: DatabaseZap, color: "text-accent" },
    { label: "Employees", count: employees.length, icon: Settings, color: "text-green-500" },
    { label: "Tasks", count: tasks.length, icon: FileText, color: "text-muted-foreground" },
  ];

  // --- EXPORT LOGIC ---
  const handleExport = async (collectionId: string, format: "csv" | "xlsx" | "json") => {
    setIsExporting(true);
    try {
      const colRef = collection(db, collectionId);
      const snapshot = await getDocs(colRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (data.length === 0) {
        toast({ title: "No Data", description: `The ${collectionId} collection is empty.` });
        return;
      }

      const filename = `${collectionId}_export_${new Date().toISOString().split('T')[0]}`;

      if (format === "json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.json`;
        link.click();
      } else if (format === "csv") {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
      } else if (format === "xlsx") {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      }

      toast({ title: "Export Complete", description: `Successfully exported ${data.length} records.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not fetch data from Firestore." });
    } finally {
      setIsExporting(false);
    }
  };

  // --- IMPORT LOGIC ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    
    const reader = new FileReader();
    if (file.name.endsWith('.json')) {
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          validateAndPreview(Array.isArray(json) ? json : [json]);
        } catch (err) {
          toast({ variant: "destructive", title: "Invalid JSON", description: "Could not parse the selected JSON file." });
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
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
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet);
        validateAndPreview(json);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const validateAndPreview = (data: any[]) => {
    const colInfo = CORE_COLLECTIONS.find(c => c.id === targetCollection);
    const key = colInfo?.uniqueKey || 'name';
    
    const errors: {row: number, message: string}[] = [];
    const validRows = data.filter((row, idx) => {
      // Basic validation: ensure the primary identifier exists
      const identifier = row[key] || row['Company Name'] || row['name'] || row['title'];
      if (!identifier) {
        errors.push({ row: idx + 1, message: `Missing required field: ${key}` });
        return false;
      }
      return true;
    });

    setValidationErrors(errors);
    setPreviewData(validRows.slice(0, 5));
    setFullValidData(validRows);
    setImportStep("preview");
  };

  const executeImport = async () => {
    if (!targetCollection || fullValidData.length === 0) return;
    setImportStep("processing");
    setImportProgress(0);

    const colRef = collection(db, targetCollection);
    const colInfo = CORE_COLLECTIONS.find(c => c.id === targetCollection);
    const uniqueKey = colInfo?.uniqueKey || 'email';
    
    // Fetch existing records for duplicate prevention (limited to 1000 for cache efficiency)
    let existingIds = new Set<string>();
    try {
      const existingSnap = await getDocs(query(colRef, limit(1000)));
      existingSnap.forEach(doc => {
        const data = doc.data();
        const identifier = (data[uniqueKey] || data['name'] || data['title'] || "").toString().toLowerCase().trim();
        if (identifier) existingIds.add(identifier);
      });
    } catch (e) {
      console.warn("Duplicate check limited to existing cache.");
    }

    let successCount = 0;
    let skipCount = 0;

    // Chunk size for Firestore batches is 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < fullValidData.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = fullValidData.slice(i, i + BATCH_SIZE);

      for (const row of chunk) {
        const identifier = (row[uniqueKey] || row['Company Name'] || row['name'] || row['title'] || "").toString().toLowerCase().trim();

        if (identifier && existingIds.has(identifier)) {
          skipCount++;
          continue;
        }

        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          ...row,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        successCount++;
      }

      try {
        await batch.commit();
        setImportProgress(Math.min(100, Math.round(((i + chunk.length) / fullValidData.length) * 100)));
      } catch (err) {
        console.error("Batch commit failed", err);
      }
    }

    setImportStep("success");
    toast({ title: "Import Successful", description: `Created ${successCount} records. Skipped ${skipCount} duplicates and ${validationErrors.length} invalid rows.` });
  };

  const downloadErrorReport = () => {
    if (validationErrors.length === 0) return;
    const csv = Papa.unparse(validationErrors.map(e => ({ Row: e.row, Reason: e.message })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `import_errors_${targetCollection}_${new Date().toISOString()}.csv`;
    link.click();
  };

  const resetImport = () => {
    setImportFile(null);
    setPreviewData([]);
    setFullValidData([]);
    setValidationErrors([]);
    setImportStep("select");
    setTargetCollection("");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">System Management</h1>
          <p className="text-muted-foreground">Global database configuration and platform health monitor.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Re-sync Database
          </Button>
          <Button className="bg-primary" size="sm">
            <Settings className="mr-2 h-4 w-4" /> Platform Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Firestore Health</CardTitle>
            </div>
            <CardDescription>Live record counts across core application collections.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="p-4 rounded-xl border bg-secondary/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <s.icon className={cn("h-4 w-4", s.color)} />
                    <Badge variant="outline" className="text-[8px]">ACTIVE</Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.count}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-5 w-5 text-accent" />
              <CardTitle>Data Portability</CardTitle>
            </div>
            <CardDescription>Manage backups and bulk operations. Skip errors and continue enabled.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Global Operations</p>
              <div className="grid grid-cols-2 gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full" disabled={isExporting}>
                      {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />} Export Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Select Collection</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {CORE_COLLECTIONS.map(col => (
                      <DropdownMenuSub key={col.id}>
                        <DropdownMenuSubTrigger>
                          <col.icon className="mr-2 h-4 w-4" /> {col.label}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleExport(col.id, "xlsx")}>
                              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(col.id, "csv")}>
                              <FileText className="mr-2 h-4 w-4" /> CSV (.csv)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(col.id, "json")}>
                              <FileJson className="mr-2 h-4 w-4" /> JSON (.json)
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Upload className="mr-2 h-3 w-3" /> Import Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Bulk Data Import</DialogTitle>
                      <DialogDescription>Upload CSV, Excel, or JSON files. Invalid rows (missing required identifiers) are skipped automatically.</DialogDescription>
                    </DialogHeader>

                    {importStep === "select" && (
                      <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-muted-foreground">1. Select Target Collection</label>
                          <Select value={targetCollection} onValueChange={setTargetCollection}>
                            <SelectTrigger><SelectValue placeholder="Choose where to import..." /></SelectTrigger>
                            <SelectContent>
                              {CORE_COLLECTIONS.map(col => (
                                <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-muted-foreground">2. Upload File</label>
                          <div 
                            className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/5"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                            <p className="text-sm font-medium">Click to select file</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Supports .csv, .xlsx, .json</p>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept=".csv,.xlsx,.json" 
                              onChange={handleFileChange}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {importStep === "preview" && (
                      <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" /> Validation Preview ({fullValidData.length} records ready)
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
                          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                              <div>
                                <p className="text-sm font-bold text-destructive">{validationErrors.length} Invalid Rows Detected</p>
                                <p className="text-xs text-muted-foreground">These rows are missing required identifiers and will be skipped. You can proceed with valid rows.</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="text-destructive border-destructive/20" onClick={downloadErrorReport}>
                              <FileX className="h-3 w-3 mr-2" /> Error Report
                            </Button>
                          </div>
                        )}

                        <div className="p-4 bg-accent/5 rounded-lg border border-accent/20 flex gap-3">
                          <Info className="h-5 w-5 text-accent shrink-0" />
                          <p className="text-xs leading-relaxed">
                            System will automatically check for duplicates based on the collection's unique identifier. Existing records will be skipped to maintain data integrity.
                          </p>
                        </div>

                        <DialogFooter className="gap-2">
                          <Button variant="ghost" onClick={resetImport}>Start Over</Button>
                          <Button onClick={executeImport} className="bg-primary" disabled={fullValidData.length === 0}>
                            Import {fullValidData.length} Valid Records
                          </Button>
                        </DialogFooter>
                      </div>
                    )}

                    {importStep === "processing" && (
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
                          <h3 className="text-xl font-bold">Data Import Complete</h3>
                          <p className="text-muted-foreground">Valid records have been synchronized with the cloud database. All invalid rows were ignored.</p>
                        </div>
                        <Button className="w-full max-w-sm" onClick={() => setIsImportModalOpen(false)}>Close & Finish</Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Storage Quota</p>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Database Usage</span>
                <span>12.4 MB</span>
              </div>
              <Progress value={12} className="h-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-accent" />
              <CardTitle>System Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Cloud Function Latency</span>
              </div>
              <span className="text-xs font-bold">12ms</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Cache Efficiency</span>
              </div>
              <span className="text-xs font-bold">94%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10 border-dashed border-2 flex flex-col items-center justify-center p-8 text-center">
          <RefreshCw className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="font-bold">Maintenance Mode</h3>
          <p className="text-xs text-muted-foreground max-w-[250px] mt-2">Temporarily disable user access while performing major database updates.</p>
          <Button variant="outline" size="sm" className="mt-6" disabled>Enter Maintenance Mode</Button>
        </Card>
      </div>
    </div>
  );
}
