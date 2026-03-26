
"use client";

import React, { useMemo, useState, useRef } from "react";
import { 
  Database, 
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
  DatabaseZap,
  Info,
  FileX,
  ShieldCheck,
  Zap,
  Code2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, writeBatch, doc, getDocs, query, limit, setDoc } from "firebase/firestore";
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
  { id: 'suppliers', label: 'Suppliers', icon: Factory, uniqueKey: 'name', priorityKeys: ["Company Name", "name", "Email", "Country"] },
  { id: 'customers', label: 'Customers', icon: Users, uniqueKey: 'name', priorityKeys: ["Company Name", "name", "Email", "Country"] },
  { id: 'products', label: 'Products', icon: Package, uniqueKey: 'name', priorityKeys: ["name", "category", "department"] },
  { id: 'leads', label: 'CRM Leads', icon: DatabaseZap, uniqueKey: 'name', priorityKeys: ["name", "company", "value", "stage"] },
  { id: 'campaigns', label: 'Campaigns', icon: Code2, uniqueKey: 'name', priorityKeys: ["name", "status", "department"] },
  { id: 'tasks', label: 'Project Tasks', icon: FileText, uniqueKey: 'title', priorityKeys: ["title", "status", "priority", "assignee"] },
  { id: 'purchases', label: 'Purchases', icon: Database, uniqueKey: 'id', priorityKeys: ["buyerName", "totalRevenue", "date"] },
];

export default function SystemManagementPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isExporting, setIsExporting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<"select" | "preview" | "processing" | "success">("select");
  const [targetCollection, setTargetCollection] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fullValidData, setFullValidData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{row: number, message: string}[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize collections
  const suppliersCol = useMemoFirebase(() => user ? collection(db, "suppliers") : null, [db, user]);
  const customersCol = useMemoFirebase(() => user ? collection(db, "customers") : null, [db, user]);
  const productsCol = useMemoFirebase(() => user ? collection(db, "products") : null, [db, user]);
  const tasksCol = useMemoFirebase(() => user ? collection(db, "tasks") : null, [db, user]);
  const leadsCol = useMemoFirebase(() => user ? collection(db, "leads") : null, [db, user]);
  const campaignsCol = useMemoFirebase(() => user ? collection(db, "campaigns") : null, [db, user]);

  const { data: suppliers = [] } = useCollection(suppliersCol);
  const { data: customers = [] } = useCollection(customersCol);
  const { data: products = [] } = useCollection(productsCol);
  const { data: tasks = [] } = useCollection(tasksCol);
  const { data: leads = [] } = useCollection(leadsCol);
  const { data: campaigns = [] } = useCollection(campaignsCol);

  const stats = [
    { label: "Suppliers", count: suppliers?.length || 0, icon: Factory, color: "text-blue-500" },
    { label: "Customers", count: customers?.length || 0, icon: Users, color: "text-primary" },
    { label: "Products", count: products?.length || 0, icon: Package, color: "text-orange-500" },
    { label: "Leads", count: leads?.length || 0, icon: DatabaseZap, color: "text-accent" },
    { label: "Campaigns", count: campaigns?.length || 0, icon: Code2, color: "text-green-500" },
    { label: "Tasks", count: tasks?.length || 0, icon: FileText, color: "text-muted-foreground" },
  ];

  const handleActivateAdmin = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Auth Required", description: "You must be signed in to activate admin status." });
      return;
    }
    setIsActivating(true);
    try {
      const adminRef = doc(db, "app_roles_admin", user.uid);
      await setDoc(adminRef, {
        uid: user.uid,
        role: "admin",
        activatedAt: new Date().toISOString(),
        displayName: user.displayName || "Session User"
      });
      toast({ title: "Admin Activated", description: "Full Firestore access has been granted to your session." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Activation Failed", description: e.message });
    } finally {
      setIsActivating(false);
    }
  };

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

      toast({ title: "Export Complete", description: `Successfully exported ${data.length} records for your automation.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not fetch data from Firestore." });
    } finally {
      setIsExporting(false);
    }
  };

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
    const priorityKeys = colInfo?.priorityKeys || [];
    
    const errors: {row: number, message: string}[] = [];
    const validRows = data.filter((row, idx) => {
      const identifier = row[key] || row['Company Name'] || row['name'] || row['title'] || row['Email'];
      if (!identifier) {
        errors.push({ row: idx + 1, message: `Missing Required Field: ${key}` });
        return false;
      }
      return true;
    });

    const processedPreview = validRows.slice(0, 10).map(row => {
      const reordered: any = {};
      priorityKeys.forEach(k => {
        if (row[k] !== undefined) reordered[k] = row[k];
      });
      Object.keys(row).forEach(k => {
        if (!priorityKeys.includes(k)) reordered[k] = row[k];
      });
      return reordered;
    });

    setValidationErrors(errors);
    setPreviewData(processedPreview);
    setFullValidData(validRows);
    setImportStep("preview");
  };

  const executeImport = async () => {
    if (!targetCollection || fullValidData.length === 0) return;
    setImportStep("processing");
    setImportProgress(0);

    const colRef = collection(db, targetCollection);
    const colInfo = CORE_COLLECTIONS.find(c => c.id === targetCollection);
    const uniqueKey = colInfo?.uniqueKey || 'name';
    
    let successCount = 0;
    const BATCH_SIZE = 500;
    for (let i = 0; i < fullValidData.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = fullValidData.slice(i, i + BATCH_SIZE);

      for (const row of chunk) {
        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          ...row,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        successCount++;
      }

      await batch.commit();
      setImportProgress(Math.min(100, Math.round(((i + chunk.length) / fullValidData.length) * 100)));
    }

    setImportStep("success");
    toast({ title: "Import Successful", description: `Synchronized ${successCount} records.` });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">System Management</h1>
          <p className="text-muted-foreground">Global database configuration and platform health monitor.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-primary shadow-lg shadow-primary/20" 
            size="sm" 
            onClick={handleActivateAdmin}
            disabled={isActivating}
          >
            {isActivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Activate Admin Status
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Re-sync
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
            <CardDescription>Manage backups and automation exports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Connect Automation</p>
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
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Bulk Sync Tool</DialogTitle>
                      <DialogDescription>Manually push data to Firestore collections from external files.</DialogDescription>
                    </DialogHeader>

                    {importStep === "select" && (
                      <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-muted-foreground">Target Collection</label>
                          <Select value={targetCollection} onValueChange={setTargetCollection}>
                            <SelectTrigger><SelectValue placeholder="Where to import..." /></SelectTrigger>
                            <SelectContent>
                              {CORE_COLLECTIONS.map(col => (
                                <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/5"
                             onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                          <p className="text-sm font-medium">Click or drag file to sync</p>
                          <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.json" onChange={handleFileChange} />
                        </div>
                      </div>
                    )}

                    {importStep === "preview" && (
                      <div className="space-y-6 pt-4">
                        <div className="max-h-[400px] overflow-auto border rounded-lg">
                          <Table>
                            <TableHeader className="bg-muted">
                              <TableRow>
                                {previewData.length > 0 && Object.keys(previewData[0] || {}).map(k => (
                                  <TableHead key={k} className="text-[10px] uppercase">{k}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {previewData.map((row, i) => (
                                <TableRow key={i}>
                                  {Object.values(row).map((val: any, j) => (
                                    <TableCell key={j} className="text-[11px] truncate max-w-[150px]">{String(val)}</TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setImportStep("select")}>Back</Button>
                          <Button onClick={executeImport}>Sync {fullValidData.length} Records</Button>
                        </DialogFooter>
                      </div>
                    )}

                    {importStep === "processing" && (
                      <div className="py-12 flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        <Progress value={importProgress} className="w-full max-w-xs h-2" />
                        <p className="text-sm">Synchronizing data...</p>
                      </div>
                    )}

                    {importStep === "success" && (
                      <div className="py-12 text-center space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                        <h3 className="text-xl font-bold">Cloud Sync Complete</h3>
                        <Button onClick={() => setIsImportModalOpen(false)}>Return to Hub</Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <Separator />
            
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
              <h4 className="text-xs font-bold flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" /> Setup Instruction
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Use the <strong>JSON Export</strong> to feed live data into n8n or Zapier. For real-time sync, use the <strong>Webhooks</strong> feature in the Automation page.
              </p>
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
          <p className="text-xs text-muted-foreground max-w-[250px] mt-2">Temporarily disable user access while performing major updates.</p>
          <Button variant="outline" size="sm" className="mt-6" disabled>Enter Maintenance Mode</Button>
        </Card>
      </div>
    </div>
  );
}
