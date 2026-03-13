
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
  DatabaseZap
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
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const CORE_COLLECTIONS = [
  { id: 'suppliers', label: 'Suppliers', icon: Factory },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'leads', label: 'CRM Leads', icon: DatabaseZap },
  { id: 'employees', label: 'Employees', icon: Settings },
  { id: 'tasks', label: 'Project Tasks', icon: FileText },
];

export default function SystemManagementPage() {
  const db = useFirestore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<"select" | "preview" | "processing" | "success">("select");
  const [targetCollection, setTargetCollection] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suppliersCol = useMemo(() => collection(db, "suppliers"), [db]);
  const customersCol = useMemo(() => collection(db, "customers"), [db]);
  const productsCol = useMemo(() => collection(db, "products"), [db]);
  const employeesCol = useMemo(() => collection(db, "employees"), [db]);
  const logsCol = useMemo(() => collection(db, "uploadLogs"), [db]);

  const { data: suppliers } = useCollection(suppliersCol);
  const { data: customers } = useCollection(customersCol);
  const { data: products } = useCollection(productsCol);
  const { data: employees } = useCollection(employeesCol);
  const { data: logs } = useCollection(logsCol);

  const stats = [
    { label: "Suppliers", count: suppliers.length, icon: Factory, color: "text-blue-500" },
    { label: "Customers", count: customers.length, icon: Users, color: "text-purple-500" },
    { label: "Products", count: products.length, icon: Package, color: "text-orange-500" },
    { label: "Employees", count: employees.length, icon: Settings, color: "text-accent" },
    { label: "System Logs", count: logs.length, icon: FileText, color: "text-muted-foreground" },
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
          setPreviewData(Array.isArray(json) ? json : [json]);
          setImportStep("preview");
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
          setPreviewData(results.data);
          setImportStep("preview");
        }
      });
    } else {
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet);
        setPreviewData(json);
        setImportStep("preview");
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const executeImport = async () => {
    if (!targetCollection || previewData.length === 0) return;
    setImportStep("processing");
    setImportProgress(0);

    const batch = writeBatch(db);
    const colRef = collection(db, targetCollection);
    
    // Fetch existing records for duplicate prevention (basic by email or name if possible)
    let existingIds = new Set<string>();
    try {
      const existingSnap = await getDocs(query(colRef, limit(500)));
      existingSnap.forEach(doc => {
        const data = doc.data();
        if (data.email) existingIds.add(data.email.toLowerCase());
        if (data.name) existingIds.add(data.name.toLowerCase());
      });
    } catch (e) {
      console.warn("Could not fetch existing records for duplicate check.");
    }

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < previewData.length; i++) {
      const row = previewData[i];
      const identifier = (row.email || row.name || "").toLowerCase();

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

      if ((i + 1) % 50 === 0 || i === previewData.length - 1) {
        setImportProgress(Math.round(((i + 1) / previewData.length) * 100));
      }
    }

    try {
      await batch.commit();
      setImportStep("success");
      toast({ title: "Import Successful", description: `Created ${successCount} records. Skipped ${skipCount} duplicates.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Import Failed", description: "Database write failed. Check your data structure." });
      setImportStep("preview");
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setPreviewData([]);
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
                    <Badge variant="outline" className="text-[10px]">Active</Badge>
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
            <CardDescription>Manage backups and bulk operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Global Export</p>
              <div className="grid grid-cols-2 gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full" disabled={isExporting}>
                      {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />} Export Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Select Collection</DropdownMenuLabel>
                    <Separator />
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
                      <DialogDescription>Upload CSV, Excel, or JSON files to populate Firestore.</DialogDescription>
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
                            <FileText className="h-4 w-4 text-primary" /> Data Validation Preview ({previewData.length} records)
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
                              {previewData.slice(0, 5).map((row, i) => (
                                <TableRow key={i}>
                                  {Object.values(row).map((val: any, j) => (
                                    <TableCell key={j} className="text-[10px] whitespace-nowrap">{String(val)}</TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {previewData.length > 5 && (
                            <div className="p-2 text-center text-[10px] text-muted-foreground border-t">
                              Showing 5 of {previewData.length} rows...
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-accent/5 rounded-lg border border-accent/20 flex gap-3">
                          <Info className="h-5 w-5 text-accent shrink-0" />
                          <p className="text-xs leading-relaxed">
                            <strong>Note:</strong> System will automatically check for duplicates by email or name. 
                            If a record matches, it will be skipped to maintain data integrity.
                          </p>
                        </div>

                        <DialogFooter className="gap-2">
                          <Button variant="ghost" onClick={resetImport}>Start Over</Button>
                          <Button onClick={executeImport} className="bg-primary">
                            Begin Import to {CORE_COLLECTIONS.find(c => c.id === targetCollection)?.label}
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
                          <p className="text-muted-foreground">Your records have been synchronized with the cloud database.</p>
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

// --- REUSABLE DROPDOWN COMPONENTS ---
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
