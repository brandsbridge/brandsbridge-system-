
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  Download, 
  MoreVertical, 
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  Trash2,
  Info,
  Scan,
  Upload,
  Sparkles,
  AlertTriangle,
  History,
  Check,
  FileText,
  Zap,
  LayoutGrid,
  FileEdit,
  ArrowRight,
  User,
  Package,
  Calculator,
  Plus as PlusIcon,
  X
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { invoiceService } from "@/services/invoice-service";
import { invoiceScanService } from "@/services/invoice-scan-service";
import { scanInvoice } from "@/ai/flows/scan-invoice-flow";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatFirebaseTimestamp } from "@/lib/db-utils";

// --- Helper: Number to Words ---
const numberToWords = (num: number) => {
  // Simple implementation for demo
  return "USD " + num.toLocaleString() + " ONLY";
};

export default function InvoicesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creationStep, setCreationStep] = useState<"choice" | "auto" | "manual">("choice");
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Manual/Auto Form State ---
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [manualLineItems, setManualLineItems] = useState<any[]>([]);
  const [invoiceType, setInvoiceType] = useState<any>("INV");
  const [generatedNumber, setGeneratedNumber] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // --- Fetch Data ---
  const invoicesQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "invoices");
    return currentUser.department === 'all' 
      ? query(colRef, orderBy("createdAt", "desc"))
      : query(colRef, where("department", "==", currentUser.department), orderBy("createdAt", "desc"));
  }, [db, user, currentUser]);

  const customersQuery = useMemoFirebase(() => user ? collection(db, "customers") : null, [db, user]);
  const productsQuery = useMemoFirebase(() => user ? collection(db, "products") : null, [db, user]);
  const scansQuery = useMemoFirebase(() => user ? query(collection(db, "invoice_scans"), orderBy("scannedAt", "desc")) : null, [db, user]);

  const { data: invoices, isLoading } = useCollection(invoicesQuery);
  const { data: customers } = useCollection(customersQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: scans } = useCollection(scansQuery);

  const filteredInvoices = useMemo(() => {
    const safeInvoices = invoices || [];
    return safeInvoices.filter(inv => {
      const matchesSearch = (inv.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (inv.number || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // --- Sequence Generation ---
  useEffect(() => {
    if (isAddModalOpen && creationStep !== "choice") {
      invoiceService.generateSequenceNumber(db, invoiceType).then(setGeneratedNumber);
    }
  }, [isAddModalOpen, creationStep, invoiceType, db]);

  const handleAutoGenerate = async () => {
    const customer = customers?.find(c => c.id === selectedCustomerId);
    const selectedProds = products?.filter(p => selectedProductIds.includes(p.id)) || [];

    if (!customer || selectedProds.length === 0) {
      toast({ variant: "destructive", title: "Incomplete Selection", description: "Please select a customer and at least one product." });
      return;
    }

    const nextNumber = await invoiceService.generateSequenceNumber(db, 'INV');
    
    const lines = selectedProds.map(p => ({
      gtin: p.gtin || '',
      description: p.name,
      packing: p.packing || 1,
      quantityCs: 10,
      quantityPcs: (p.packing || 1) * 10,
      priceNet: 10.00, // Fallback price
      vatRate: customer.country === 'UAE' ? 5 : 0,
      total: (p.packing || 1) * 10 * 10.00
    }));

    const subtotal = lines.reduce((acc, l) => acc + l.total, 0);
    const vatTotal = lines.reduce((acc, l) => acc + (l.total * (l.vatRate / 100)), 0);

    const data = {
      number: nextNumber,
      type: 'INV',
      status: 'draft',
      dateIssue: new Date().toISOString().split('T')[0],
      dateSale: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: customer.name,
      customerId: customer.id,
      destinationCountry: customer.country,
      deliveryTerms: 'EXW',
      department: currentUser?.department || 'all',
      createdBy: currentUser?.name || 'System',
      lineItems: lines,
      totals: {
        net: subtotal,
        vat: vatTotal,
        gross: subtotal + vatTotal,
        weightNet: selectedProds.reduce((acc, p) => acc + (p.weightNet || 0) * 10, 0),
        weightGross: selectedProds.reduce((acc, p) => acc + (p.weightGross || 0) * 10, 0),
        totalBoxes: lines.reduce((acc, l) => acc + l.quantityCs, 0)
      },
      paymentTerms: {
        method: 'Bank Transfer',
        dueDate: '30 Days',
        notes: 'Auto-generated terms from profile.'
      }
    };

    invoiceService.createInvoice(db, data);
    setIsAddModalOpen(false);
    setCreationStep("choice");
    setSelectedProductIds([]);
    setSelectedCustomerId("");
    toast({ title: "Invoice Auto-Generated", description: `Record ${data.number} has been created.` });
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Simplistic manual gathering for demo
    const data = {
      number: formData.get('number') || generatedNumber,
      type: invoiceType,
      status: 'draft',
      dateIssue: formData.get('dateIssue'),
      dateSale: formData.get('dateSale'),
      dueDate: formData.get('dueDate'),
      customerName: formData.get('buyerName'),
      recipientName: formData.get('recipientName'),
      destinationCountry: formData.get('country'),
      deliveryTerms: formData.get('deliveryTerms'),
      department: currentUser?.department || 'all',
      createdBy: currentUser?.name || 'System',
      shippingInfo: {
        shipmentDate: formData.get('shipDate'),
        containerNumber: formData.get('container'),
        sealNumber: formData.get('seal')
      },
      lineItems: manualLineItems,
      notes: formData.get('notes'),
      internalNotes: formData.get('internalNotes'),
      totals: {
        gross: parseFloat(formData.get('grandTotal') as string) || 0
      }
    };

    invoiceService.createInvoice(db, data);
    setIsAddModalOpen(false);
    setCreationStep("choice");
    toast({ title: "Manual Invoice Created", description: `Document ${data.number} saved to ledger.` });
  };

  const addManualLine = () => {
    setManualLineItems([...manualLineItems, { gtin: '', description: '', quantityCs: 0, priceNet: 0, total: 0 }]);
  };

  const removeManualLine = (idx: number) => {
    setManualLineItems(manualLineItems.filter((_, i) => i !== idx));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" /> Paid</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'overdue': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Sales Invoices</h1>
          <p className="text-muted-foreground">Manage complex billing cycles and track accounts receivable.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/5" onClick={() => setIsScanModalOpen(true)}>
            <Scan className="mr-2 h-4 w-4" /> AI Scan
          </Button>

          <Dialog open={isAddModalOpen} onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) setCreationStep("choice");
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary shadow-lg shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> New Invoice</Button>
            </DialogTrigger>
            <DialogContent className={cn("max-h-[90vh] overflow-y-auto", creationStep === 'manual' ? "max-w-6xl" : "max-w-3xl")}>
              <DialogHeader>
                <DialogTitle>Generate Sales Document</DialogTitle>
                <DialogDescription>Choose your creation method to proceed.</DialogDescription>
              </DialogHeader>

              {creationStep === "choice" && (
                <div className="grid grid-cols-2 gap-6 py-12">
                  <Card className="hover:border-primary cursor-pointer transition-all bg-secondary/5 group" onClick={() => setCreationStep("auto")}>
                    <CardContent className="pt-8 text-center space-y-4">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Zap className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Auto Generate</h3>
                        <p className="text-sm text-muted-foreground mt-1">Fills all data from profile & catalog</p>
                      </div>
                      <ArrowRight className="h-5 w-5 mx-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>

                  <Card className="hover:border-accent cursor-pointer transition-all bg-secondary/5 group" onClick={() => setCreationStep("manual")}>
                    <CardContent className="pt-8 text-center space-y-4">
                      <div className="h-16 w-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <FileEdit className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Manual Create</h3>
                        <p className="text-sm text-muted-foreground mt-1">Full control over every ledger field</p>
                      </div>
                      <ArrowRight className="h-5 w-5 mx-auto text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>
                </div>
              )}

              {creationStep === "auto" && (
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Select Customer</Label>
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger><SelectValue placeholder="Choose a corporate buyer..." /></SelectTrigger>
                        <SelectContent>
                          {customers?.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name} ({c.country})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Package className="h-4 w-4" /> Select Products</Label>
                      <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                        {products?.map(p => (
                          <div key={p.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={p.id} 
                              checked={selectedProductIds.includes(p.id)}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedProductIds([...selectedProductIds, p.id]);
                                else setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                              }}
                            />
                            <label htmlFor={p.id} className="text-sm font-medium leading-none cursor-pointer">
                              {p.name} <span className="text-[10px] text-muted-foreground ml-2">{p.gtin}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="border-t pt-6">
                    <Button variant="ghost" onClick={() => setCreationStep("choice")}>Back</Button>
                    <Button className="bg-primary" onClick={handleAutoGenerate}>
                      <Zap className="mr-2 h-4 w-4" /> Auto Generate Invoice
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {creationStep === "manual" && (
                <form onSubmit={handleManualSave} className="space-y-8 py-4">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Document Type</Label>
                        <Select value={invoiceType} onValueChange={setInvoiceType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INV">Standard Invoice</SelectItem>
                            <SelectItem value="EXP">Export Invoice</SelectItem>
                            <SelectItem value="PRO">Proforma Invoice</SelectItem>
                            <SelectItem value="CN">Credit Note</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Invoice #</Label>
                        <Input name="number" value={generatedNumber} onChange={e => setGeneratedNumber(e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Issue Date</Label>
                        <Input name="dateIssue" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sale Date</Label>
                        <Input name="dateSale" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Due Date</Label>
                        <Input name="dueDate" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Delivery Terms</Label>
                        <Select name="deliveryTerms" defaultValue="EXW">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EXW">EXW</SelectItem>
                            <SelectItem value="CIF">CIF</SelectItem>
                            <SelectItem value="FOB">FOB</SelectItem>
                            <SelectItem value="DDP">DDP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4 bg-secondary/10 p-4 rounded-xl border">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <User className="h-3 w-3" /> Buyer / Consignee
                      </h4>
                      <div className="space-y-3">
                        <Input name="buyerName" placeholder="Company Name" required />
                        <Input name="country" placeholder="Destination Country" required />
                        <Textarea name="buyerAddress" placeholder="Full Billing Address" className="h-20" />
                      </div>
                    </div>
                    <div className="space-y-4 bg-secondary/10 p-4 rounded-xl border">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                        <Package className="h-3 w-3" /> Recipient / Shipping
                      </h4>
                      <div className="space-y-3">
                        <Input name="recipientName" placeholder="Consignee (if different)" />
                        <Input name="container" placeholder="Container #" />
                        <Input name="seal" placeholder="Seal #" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Line Items</h4>
                      <Button type="button" variant="outline" size="sm" onClick={addManualLine}>
                        <PlusIcon className="h-3 w-3 mr-1" /> Add Line
                      </Button>
                    </div>
                    <div className="border rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[40%] text-[10px] uppercase">Description</TableHead>
                            <TableHead className="text-[10px] uppercase text-right">Qty (CS)</TableHead>
                            <TableHead className="text-[10px] uppercase text-right">Price</TableHead>
                            <TableHead className="text-[10px] uppercase text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {manualLineItems.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Input 
                                  value={item.description} 
                                  placeholder="Product name..." 
                                  className="h-8 text-xs"
                                  onChange={(e) => {
                                    const lines = [...manualLineItems];
                                    lines[idx].description = e.target.value;
                                    setManualLineItems(lines);
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number" 
                                  value={item.quantityCs} 
                                  className="h-8 text-xs text-right"
                                  onChange={(e) => {
                                    const lines = [...manualLineItems];
                                    lines[idx].quantityCs = parseInt(e.target.value) || 0;
                                    lines[idx].total = lines[idx].quantityCs * lines[idx].priceNet;
                                    setManualLineItems(lines);
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number" 
                                  value={item.priceNet} 
                                  className="h-8 text-xs text-right"
                                  onChange={(e) => {
                                    const lines = [...manualLineItems];
                                    lines[idx].priceNet = parseFloat(e.target.value) || 0;
                                    lines[idx].total = lines[idx].quantityCs * lines[idx].priceNet;
                                    setManualLineItems(lines);
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-right font-bold text-xs">
                                ${item.total.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeManualLine(idx)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Notes</Label>
                      <Textarea name="notes" placeholder="T&Cs, Bank Details, etc." className="h-24" />
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Internal Notes (Private)</Label>
                      <Textarea name="internalNotes" placeholder="Hidden from client..." className="h-20" />
                    </div>
                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-bold">${manualLineItems.reduce((acc, l) => acc + l.total, 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">VAT (0%):</span>
                        <span className="font-bold">$0.00</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold uppercase text-primary">Grand Total:</span>
                        <div className="text-right">
                          <input type="hidden" name="grandTotal" value={manualLineItems.reduce((acc, l) => acc + l.total, 0)} />
                          <span className="text-3xl font-black text-primary tracking-tighter">
                            USD ${manualLineItems.reduce((acc, l) => acc + l.total, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-8 border-t">
                    <Button type="button" variant="ghost" onClick={() => setCreationStep("choice")}>Back</Button>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline">Save Draft</Button>
                      <Button type="submit" className="bg-primary">Generate Invoice</Button>
                    </div>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="all">Active Invoices</TabsTrigger>
          <TabsTrigger value="scans">AI Scan History</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="pt-4">
          <Card>
            <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by invoice # or customer..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>All</Button>
                <Button variant={statusFilter === 'paid' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('paid')}>Paid</Button>
                <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('pending')}>Pending</Button>
              </div>
            </CardHeader>
            {isLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs font-bold">{inv.number}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{inv.customerName}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">By {inv.createdBy}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell>
                        {inv.originalImageUrl ? (
                          <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20">
                            <Sparkles className="h-2 w-2" /> AI Scanned
                          </Badge>
                        ) : (
                          <Badge variant="outline">Manual</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-accent">${(inv.total || inv.totals?.gross || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/accounting/invoices/${inv.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="scans" className="pt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans?.map(scan => (
                  <TableRow key={scan.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(scan.scannedAt)}</TableCell>
                    <TableCell className="font-medium text-xs">{scan.fileName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${scan.accuracyRate}%` }} />
                        </div>
                        <span className="text-[10px] font-bold">{scan.accuracyRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{scan.scannedBy}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={scan.originalImageUrl} target="_blank"><Eye className="h-4 w-4" /></a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!scans || scans.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No AI scans in history.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
