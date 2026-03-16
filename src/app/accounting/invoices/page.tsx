
"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Info
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { invoiceService } from "@/services/invoice-service";
import { toast } from "@/hooks/use-toast";

export default function InvoicesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const invoicesQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "invoices");
    return currentUser.department === 'all' 
      ? colRef 
      : query(colRef, where("department", "==", currentUser.department));
  }, [db, user, currentUser]);

  const { data: invoices, isLoading } = useCollection(invoicesQuery);

  const filteredInvoices = useMemo(() => {
    const safeInvoices = invoices || [];
    return safeInvoices.filter(inv => {
      const matchesSearch = (inv.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (inv.number || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const subtotal = parseFloat(formData.get('subtotal') as string) || 0;
    const discountTotal = parseFloat(formData.get('discountTotal') as string) || 0;
    const shippingCharges = parseFloat(formData.get('shippingCharges') as string) || 0;
    const total = subtotal - discountTotal + shippingCharges;

    const data = {
      number: `INV-${Date.now().toString().slice(-6)}`,
      customerName: formData.get('customerName'),
      total,
      subtotal,
      discountTotal,
      shippingCharges,
      status: 'pending',
      sentStatus: 'draft',
      dueDate: formData.get('dueDate'),
      isProforma: formData.get('isProforma') === 'on',
      language: formData.get('language') || 'en',
      ccEmails: formData.get('ccEmails'),
      paymentLink: formData.get('paymentLink'),
      internalNotes: formData.get('internalNotes'),
      termsAndConditions: formData.get('termsAndConditions') || "Payment is due within 30 days.",
      department: currentUser?.department === 'all' ? formData.get('department') : currentUser?.department,
      createdBy: currentUser?.name || 'System',
      createdAt: new Date().toISOString()
    };

    invoiceService.createInvoice(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Invoice Created", description: `Record ${data.number} added to ledger.` });
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
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary shadow-lg shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> New Advanced Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateInvoice}>
                <DialogHeader>
                  <DialogTitle>Configure Sales Document</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="general" className="mt-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                    <TabsTrigger value="documentation">Documentation</TabsTrigger>
                    <TabsTrigger value="notes">Notes & Terms</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Customer Name</label>
                        <Input name="customerName" required placeholder="e.g. Arab Food Logistics" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Due Date</label>
                        <Input name="dueDate" type="date" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="isProforma" name="isProforma" />
                        <Label htmlFor="isProforma">Proforma Invoice</Label>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Document Language</label>
                        <Select name="language" defaultValue="en">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English (US)</SelectItem>
                            <SelectItem value="ar">Arabic (UAE)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {currentUser?.department === 'all' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Market Segment</label>
                        <Select name="department" defaultValue="chocolate">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chocolate">Chocolate</SelectItem>
                            <SelectItem value="cosmetics">Cosmetics</SelectItem>
                            <SelectItem value="detergents">Detergents</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="financials" className="space-y-4 pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Gross Subtotal ($)</label>
                        <Input name="subtotal" type="number" step="0.01" required placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Overall Discount ($)</label>
                        <Input name="discountTotal" type="number" step="0.01" defaultValue="0.00" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Shipping Charges ($)</label>
                        <Input name="shippingCharges" type="number" step="0.01" defaultValue="0.00" />
                      </div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-center">
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Info className="h-3 w-3" /> Net total will be calculated automatically upon submission.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="documentation" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">CC Emails (Multiple)</label>
                      <Input name="ccEmails" placeholder="finance@client.com, manager@client.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Digital Payment Link</label>
                      <Input name="paymentLink" placeholder="https://stripe.com/..." />
                    </div>
                    <div className="border-2 border-dashed rounded-xl p-8 text-center bg-secondary/5">
                      <p className="text-sm font-medium">Digital Stamp & Signature Area</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Upload verified stamp for this transaction (Optional)</p>
                      <Button variant="outline" size="sm" type="button" className="mt-4">Choose File</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-primary">Internal Notes (Private)</label>
                      <Textarea name="internalNotes" placeholder="Context for management only. Not visible on invoice PDF." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Terms & Conditions (Public)</label>
                      <Textarea name="termsAndConditions" defaultValue="Payment is expected within 30 days from invoice date. Please mention invoice # in bank reference." />
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-8">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Finalize & Generate</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs font-bold">
                    {inv.number}
                    {inv.language === 'ar' && <Badge variant="outline" className="ml-2 text-[8px]">AR</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{inv.customerName}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">By {inv.createdBy}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={inv.isProforma ? 'secondary' : 'outline'} className="capitalize text-[10px]">
                      {inv.isProforma ? 'Proforma' : 'Standard'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inv.dueDate}</TableCell>
                  <TableCell className="text-right font-bold text-accent">${(inv.total || 0).toLocaleString()}</TableCell>
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
                        {inv.sentStatus === 'draft' && (
                          <DropdownMenuItem onClick={() => invoiceService.updateInvoice(db, inv.id, { sentStatus: 'sent' })}>Mark as Sent</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => invoiceService.updateInvoice(db, inv.id, { status: 'paid' })} className="text-green-500 font-bold">Mark as Paid</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => invoiceService.deleteInvoice(db, inv.id)} className="text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">No invoices found for this criteria.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
