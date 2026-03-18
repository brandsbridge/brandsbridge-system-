"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Mail, MapPin, 
  Download, Send, 
  MessageSquare, Clock, Phone,
  Briefcase, Loader2, Edit, Trash2, MoreVertical,
  Globe, Factory, Box, Package, DollarSign,
  FileText, Plus, FileCheck, ExternalLink,
  History, CreditCard, Receipt, Paperclip, X,
  AlertCircle, Upload, Trash
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { emailService } from "@/services/email-service";
import { supplierService } from "@/services/supplier-service";
import { formatFirebaseTimestamp } from "@/lib/db-utils";

export default function SupplierClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- Data Fetching ---
  const supplierRef = useMemoFirebase(() => doc(db, "suppliers", id), [id]);
  const { data: supplier, isLoading: loadingSupplier } = useDoc(supplierRef);

  const poQuery = useMemoFirebase(() => query(
    collection(db, "purchase_orders"), 
    where("supplierId", "==", id),
    orderBy("date", "desc")
  ), [id]);
  
  const invoiceQuery = useMemoFirebase(() => query(
    collection(db, "invoices"), 
    where("sellerId", "==", id),
    orderBy("createdAt", "desc")
  ), [id]);

  const paymentQuery = useMemoFirebase(() => query(
    collection(db, "payments"), 
    where("vendorId", "==", id),
    orderBy("date", "desc")
  ), [id]);

  const attachmentQuery = useMemoFirebase(() => query(
    collection(db, "supplier_attachments"),
    where("supplierId", "==", id),
    orderBy("uploadedAt", "desc")
  ), [id]);

  const { data: purchaseOrders = [] } = useCollection(poQuery);
  const { data: invoices = [] } = useCollection(invoiceQuery);
  const { data: payments = [] } = useCollection(paymentQuery);
  const { data: attachments = [] } = useCollection(attachmentQuery);

  // --- Calculations ---
  const stats = useMemo(() => {
    const totalInvoicesValue = (invoices || []).reduce((sum, inv) => sum + (inv.totalUSD || inv.totals?.gross || 0), 0);
    const lastOrder = purchaseOrders?.[0]?.date || null;
    return {
      totalInvoicesValue,
      totalOrders: purchaseOrders?.length || 0,
      lastOrderDate: lastOrder,
    };
  }, [invoices, purchaseOrders]);

  // --- Handlers ---
  const handleMarketChange = async (marketId: string) => {
    try {
      await updateDoc(supplierRef, {
        departments: [marketId],
        updatedAt: serverTimestamp()
      });
      toast({ title: "Market Assignment Updated", description: `Supplier moved to ${marketId.toUpperCase()} market.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    await updateDoc(supplierRef, { notes, updatedAt: serverTimestamp() });
    toast({ title: "Notes Saved" });
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      country: formData.get('country'),
      natureOfBusiness: formData.get('natureOfBusiness'),
      pricing: {
        ...supplier.pricing,
        tier: formData.get('tier')
      }
    };

    try {
      await updateDoc(supplierRef, { ...data, updatedAt: serverTimestamp() });
      setIsEditDialogOpen(false);
      toast({ title: "Record Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum size is 20MB." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const storagePath = `attachments/suppliers/${id}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => {
        setIsUploading(false);
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        const attachmentData = {
          fileName: file.name,
          fileUrl: url,
          fileType: file.type,
          storagePath,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.displayName || "System",
          supplierId: id
        };
        const newDocRef = doc(collection(db, "supplier_attachments"));
        await setDoc(newDocRef, attachmentData);
        setIsUploading(false);
        toast({ title: "File Attached", description: `${file.name} saved successfully.` });
      }
    );
  };

  const handleDeleteAttachment = async (attachment: any) => {
    if (!confirm("Delete this attachment?")) return;
    try {
      await deleteObject(ref(storage, attachment.storagePath));
      await deleteDoc(doc(db, "supplier_attachments", attachment.id));
      toast({ title: "File Deleted" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const handleExportPDF = async () => {
    if (!supplier) return;
    toast({ title: "Generating Report", description: "Preparing PDF..." });
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("supplier-profile-container");
      if (!element) return;
      const opt = {
        margin: 10,
        filename: `${supplier.name.replace(/\s+/g, '-')}-report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } catch (e) {
      toast({ variant: "destructive", title: "PDF Failed" });
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supplier) return;
    setIsSending(true);
    const targetEmail = supplier.email || supplier.contacts?.sales?.email;
    try {
      emailService.sendInternalEmail(db, {
        to: targetEmail,
        toName: supplier.name,
        subject: emailSubject,
        body: emailBody,
        senderName: user.displayName || "Manager",
        senderId: user.uid,
        entityId: id,
        entityType: 'supplier'
      });
      toast({ title: "Email Dispatched" });
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Send Failed" });
    } finally {
      setIsSending(false);
    }
  };

  if (loadingSupplier) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!supplier) return <div className="text-center py-20">Partner record not found.</div>;

  const currentMarket = supplier.departments?.[0] || 'unassigned';

  return (
    <div id="supplier-profile-container" className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="print:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{supplier.flag || '🏭'}</span>
              <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {supplier.recordStatus || 'Active-Verified'}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {currentMarket === 'unassigned' ? 'Unassigned Market' : `${currentMarket} Market`}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {supplier.country}</span>
              <span className="flex items-center gap-1"><Factory className="h-3 w-3" /> {supplier.natureOfBusiness}</span>
              {stats.lastOrderDate && <span className="flex items-center gap-1 text-primary font-bold"><History className="h-3 w-3" /> Last Order: {formatFirebaseTimestamp(stats.lastOrderDate)}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" /> Export PDF</Button>
          <Button className="bg-primary shadow-lg shadow-primary/20" onClick={() => setIsEmailDialogOpen(true)}><Send className="h-4 w-4 mr-2" /> Contact Supplier</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="border"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Record</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive font-bold"><Trash2 className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-secondary/20">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Total Orders</p>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-primary mb-1">Total Invoices Value</p>
            <p className="text-2xl font-bold text-primary">${stats.totalInvoicesValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Avg Lead Time</p>
            <p className="text-2xl font-bold">{supplier.pricing?.leadTime || 7} Days</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Price Tier</p>
            <p className="text-2xl font-bold text-accent">{supplier.pricing?.tier || 'Premium'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-12 bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm font-bold uppercase">Basic Intelligence</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Nature of Business</label>
                    <p className="font-medium">{supplier.natureOfBusiness}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Country</label>
                    <p className="font-medium">{supplier.country}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Specialized Products</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {supplier.specializedProducts?.map((p: string) => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Market Assignment</label>
                  <Select value={currentMarket} onValueChange={handleMarketChange}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chocolate">Chocolate Market</SelectItem>
                      <SelectItem value="cosmetics">Cosmetics Market</SelectItem>
                      <SelectItem value="detergents">Detergents Market</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-bold uppercase">Primary Sales Contact</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {supplier.contacts?.sales ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black">{supplier.contacts.sales.name?.[0]}</div>
                      <div>
                        <p className="font-bold">{supplier.contacts.sales.name}</p>
                        <p className="text-xs text-muted-foreground">Key Account Manager</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {supplier.contacts.sales.email}</div>
                      <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {supplier.contacts.sales.phone || "N/A"}</div>
                    </div>
                  </>
                ) : <p className="text-sm italic text-muted-foreground">No contact data recorded.</p>}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-sm font-bold uppercase">Operational Notes</CardTitle></CardHeader>
              <CardContent>
                <Textarea 
                  className="min-h-[150px] leading-relaxed" 
                  defaultValue={supplier.notes} 
                  placeholder="Strategic notes, quality history, or delivery preferences..."
                  onBlur={(e) => handleUpdateNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Catalog & Logistics */}
        <TabsContent value="catalog" className="pt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm font-bold uppercase">Logistics & MOQs</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Min. Order Quantity</p>
                  <p className="text-lg font-bold">{supplier.pricing?.moq || '100 Units'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Min. Order Value</p>
                  <p className="text-lg font-bold">${(supplier.pricing?.mov || 1000).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-bold uppercase">Standard Terms</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {supplier.pricing?.paymentTerms?.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>) || <span className="text-sm italic">Standard Net 30</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Purchase Orders */}
        <TabsContent value="orders" className="pt-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Procurement History</h3>
            <Button size="sm" asChild><Link href="/accounting/purchase-orders"><Plus className="h-4 w-4 mr-2" /> New Order</Link></Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-xs font-bold">{po.number}</TableCell>
                    <TableCell className="text-xs">{formatFirebaseTimestamp(po.date)}</TableCell>
                    <TableCell className="text-xs">{po.notes || "Standard Supply"}</TableCell>
                    <TableCell className="text-right font-bold text-accent">${po.total?.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{po.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {purchaseOrders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">No purchase orders found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab 4: Invoices */}
        <TabsContent value="invoices" className="pt-6 space-y-4">
          <h3 className="font-bold">Supplier Invoices</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead className="text-right">Amount (USD)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-bold">{inv.number}</TableCell>
                    <TableCell className="text-xs">{inv.dateIssue}</TableCell>
                    <TableCell className="text-right font-bold text-primary">${(inv.totalUSD || inv.totals?.gross || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={cn(inv.status === 'paid' ? "bg-green-500" : "bg-yellow-500")}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No invoices recorded for this supplier.</TableCell></TableRow>}
              </TableBody>
            </Table>
            <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-muted-foreground">Total Billed Value:</span>
              <span className="text-xl font-black text-primary">${stats.totalInvoicesValue.toLocaleString()}</span>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 5: Payments */}
        <TabsContent value="payments" className="pt-6 space-y-4">
          <h3 className="font-bold">Settlement Ledger</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(pay => (
                  <TableRow key={pay.id}>
                    <TableCell className="text-xs">{formatFirebaseTimestamp(pay.date)}</TableCell>
                    <TableCell className="text-xs">{pay.method}</TableCell>
                    <TableCell className="font-mono text-[10px]">{pay.reference}</TableCell>
                    <TableCell className="text-right font-bold text-green-500">${pay.amount?.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">Cleared</Badge></TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No payments recorded.</TableCell></TableRow>}
              </TableBody>
            </Table>
            <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-muted-foreground">Total Settled:</span>
              <span className="text-xl font-black text-green-500">${payments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}</span>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 6: Attachments */}
        <TabsContent value="attachments" className="pt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Partner Document Vault</h3>
            <div className="relative">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload Document
              </Button>
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span>Transmission in progress...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attachments.map(att => (
                  <TableRow key={att.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> {att.fileName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(att.uploadedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{att.uploadedBy}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild><a href={att.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAttachment(att)}><Trash className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {attachments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic text-xs">No documents uploaded for this partner.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdateSupplier}>
            <DialogHeader>
              <DialogTitle>Edit Partner Intelligence</DialogTitle>
              <DialogDescription>Modify core supplier details.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Company Name</label>
                <Input name="name" defaultValue={supplier.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Nature of Business</label>
                <Select name="natureOfBusiness" defaultValue={supplier.natureOfBusiness}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="Trader">Trader</SelectItem>
                    <SelectItem value="Distributor">Distributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Country</label>
                <Input name="country" defaultValue={supplier.country} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Price Tier</label>
                <Select name="tier" defaultValue={supplier.pricing?.tier || 'Premium'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Budget">Budget</SelectItem>
                    <SelectItem value="Mid-Range">Mid-Range</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Sync Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSendEmail}>
            <DialogHeader><DialogTitle>Compose Corporate Inquiry</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Recipient</label>
                <Input value={supplier.email || supplier.contacts?.sales?.email} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Subject</label>
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Message Body</label>
                <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} required className="min-h-[200px]" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEmailDialogOpen(false)} disabled={isSending}>Cancel</Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Send
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
