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
  X,
  ArrowRightLeft,
  ChevronDown
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
import { collection, query, where, orderBy, doc, getDoc } from "firebase/firestore";
import { invoiceService } from "@/services/invoice-service";
import { currencyService, SUPPORTED_CURRENCIES, type CurrencyCode, type ExchangeRates } from "@/services/currency-service";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatFirebaseTimestamp } from "@/lib/db-utils";

export default function InvoicesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creationStep, setCreationStep] = useState<"choice" | "auto" | "manual">("choice");
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // --- Multi-Currency State ---
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
    
    // Fetch latest rates for conversion previews
    currencyService.fetchLatestRates(db).then(setExchangeRates);
  }, [db]);

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

  const { data: invoices, isLoading } = useCollection(invoicesQuery);
  const { data: customers } = useCollection(customersQuery);
  const { data: products } = useCollection(productsQuery);

  // --- Manual/Auto Form State ---
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [manualLineItems, setManualLineItems] = useState<any[]>([]);
  const [invoiceType, setInvoiceType] = useState<any>("INV");
  const [generatedNumber, setGeneratedNumber] = useState("");

  const filteredInvoices = useMemo(() => {
    const safeInvoices = invoices || [];
    return safeInvoices.filter(inv => {
      const matchesSearch = (inv.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (inv.number || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // --- Calculations with Conversion ---
  const manualSubtotal = manualLineItems.reduce((acc, l) => acc + (l.total || 0), 0);
  const manualUSDTotal = useMemo(() => {
    if (!exchangeRates) return manualSubtotal;
    return currencyService.convert(manualSubtotal, selectedCurrency, 'USD', exchangeRates.rates);
  }, [manualSubtotal, selectedCurrency, exchangeRates]);

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
    const currency = (customer.preferredCurrency as CurrencyCode) || 'USD';
    const rate = exchangeRates?.rates[currency] || 1;
    
    const lines = selectedProds.map(p => {
      const baseUSD = 10.00;
      const convertedPrice = currency === 'USD' ? baseUSD : baseUSD * rate;
      return {
        gtin: p.gtin || '',
        description: p.name,
        packing: p.packing || 1,
        quantityCs: 10,
        quantityPcs: (p.packing || 1) * 10,
        priceNet: convertedPrice,
        vatRate: customer.country === 'UAE' ? 5 : 0,
        total: (p.packing || 1) * 10 * convertedPrice
      };
    });

    const subtotal = lines.reduce((acc, l) => acc + l.total, 0);
    const vatTotal = lines.reduce((acc, l) => acc + (l.total * (l.vatRate / 100)), 0);
    const grandTotal = subtotal + vatTotal;

    const data = {
      number: nextNumber,
      type: 'INV',
      status: 'draft',
      currency,
      exchangeRate: rate,
      totalUSD: grandTotal / rate,
      dateIssue: new Date().toISOString().split('T')[0],
      customerName: customer.name,
      customerId: customer.id,
      destinationCountry: customer.country,
      department: currentUser?.department || 'all',
      createdBy: currentUser?.name || 'System',
      lineItems: lines,
      totals: {
        net: subtotal,
        vat: vatTotal,
        gross: grandTotal
      }
    };

    invoiceService.createInvoice(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Invoice Generated", description: `Record ${data.number} created in ${currency}.` });
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const grandTotal = manualSubtotal;
    const rate = exchangeRates?.rates[selectedCurrency] || 1;
    
    const data = {
      number: formData.get('number') || generatedNumber,
      type: invoiceType,
      status: 'draft',
      currency: selectedCurrency,
      exchangeRate: rate,
      totalUSD: grandTotal / rate,
      dateIssue: formData.get('dateIssue'),
      customerName: formData.get('buyerName'),
      destinationCountry: formData.get('country'),
      department: currentUser?.department || 'all',
      createdBy: currentUser?.name || 'System',
      lineItems: manualLineItems,
      totals: {
        gross: grandTotal
      }
    };

    invoiceService.createInvoice(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Manual Invoice Created", description: `Document ${data.number} saved.` });
  };

  const addManualLine = () => {
    setManualLineItems([...manualLineItems, { gtin: '', description: '', quantityCs: 0, priceNet: 0, total: 0 }]);
  };

  const removeManualLine = (idx: number) => {
    setManualLineItems(manualLineItems.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Sales Invoices</h1>
          <p className="text-muted-foreground">Manage complex multi-currency billing cycles.</p>
        </div>
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
                      <p className="text-sm text-muted-foreground mt-1">Fills data from profile & catalog</p>
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
                      <p className="text-sm text-muted-foreground mt-1">Full control over every field</p>
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
                <div className="grid grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold">Currency</Label>
                    <Select value={selectedCurrency} onValueChange={(v: any) => setSelectedCurrency(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold">Invoice Type</Label>
                    <Select value={invoiceType} onValueChange={setInvoiceType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INV">Invoice</SelectItem>
                        <SelectItem value="EXP">Export</SelectItem>
                        <SelectItem value="PRO">Proforma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold">Invoice #</Label>
                    <Input name="number" value={generatedNumber} onChange={e => setGeneratedNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold">Issue Date</Label>
                    <Input name="dateIssue" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>

                <Separator />

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
                          <TableHead className="text-[10px] uppercase text-right">Price ({selectedCurrency})</TableHead>
                          <TableHead className="text-[10px] uppercase text-right">Total ({selectedCurrency})</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manualLineItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Input 
                                value={item.description} 
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
                              {selectedCurrency} {item.total?.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeManualLine(idx)}><X className="h-3 w-3" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Buyer Details</Label>
                    <Input name="buyerName" placeholder="Company Name" required />
                    <Input name="country" placeholder="Country" required />
                  </div>
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-bold uppercase text-[10px]">Grand Total ({selectedCurrency}):</span>
                      <span className="text-3xl font-black tracking-tighter text-primary">
                        {selectedCurrency} {manualSubtotal.toLocaleString()}
                      </span>
                    </div>
                    {selectedCurrency !== 'USD' && (
                      <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">USD Equivalent:</span>
                        <span className="text-sm font-bold text-muted-foreground">
                          ≈ USD {manualUSDTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="pt-8 border-t">
                  <Button type="button" variant="ghost" onClick={() => setCreationStep("choice")}>Back</Button>
                  <Button type="submit" className="bg-primary">Generate Invoice</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

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
        </CardHeader>
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Original Amount</TableHead>
                <TableHead className="text-right">USD Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs font-bold">{inv.number}</TableCell>
                  <TableCell className="font-medium">{inv.customerName}</TableCell>
                  <TableCell><Badge variant="outline">{inv.currency || 'USD'}</Badge></TableCell>
                  <TableCell className="text-right font-bold">
                    {inv.currency || 'USD'} {(inv.total || inv.totals?.gross || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    ${(inv.totalUSD || inv.total || inv.totals?.gross || 0).toLocaleString()}
                  </TableCell>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
