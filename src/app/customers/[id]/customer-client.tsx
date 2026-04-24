"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, MapPin,
  Download, Send,
  MessageSquare, Clock, Phone,
  Loader2, Edit, Trash2, MoreVertical,
  Globe, Factory, Box, Package, DollarSign,
  FileText, Plus, ExternalLink,
  History, Paperclip, X,
  Upload, Trash,
  Facebook, Instagram, Linkedin,
  Bot, StickyNote, Save, XCircle, ShieldCheck,
  Star, HeartPulse, Users, Copy, Archive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
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
import { formatFirebaseTimestamp } from "@/lib/db-utils";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
    ))}
  </div>
);

export default function CustomerClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // --- Data Fetching ---
  const customerRef = useMemoFirebase(() => doc(db, "customers", id), [id]);
  const { data: customer, isLoading: loadingCustomer } = useDoc(customerRef);

  const invoiceQuery = useMemoFirebase(() => query(
    collection(db, "invoices"),
    where("customerId", "==", id),
    orderBy("createdAt", "desc")
  ), [id]);

  const paymentQuery = useMemoFirebase(() => query(
    collection(db, "payments"),
    where("customerId", "==", id),
    orderBy("date", "desc")
  ), [id]);

  const orderQuery = useMemoFirebase(() => query(
    collection(db, "purchase_orders"),
    where("customerId", "==", id),
    orderBy("date", "desc")
  ), [id]);

  const attachmentQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "customer_attachments"),
      where("customerId", "==", id),
      where("userId", "==", user.uid),
      orderBy("uploadedAt", "desc")
    );
  }, [id, user]);

  const { data: invoicesData } = useCollection(invoiceQuery);
  const { data: paymentsData } = useCollection(paymentQuery);
  const { data: ordersData } = useCollection(orderQuery);
  const { data: attachmentsData } = useCollection(attachmentQuery);

  const invoices = invoicesData || [];
  const payments = paymentsData || [];
  const orders = ordersData || [];
  const attachments = attachmentsData || [];

  // --- Calculations ---
  const stats = useMemo(() => {
    const totalInvoicesValue = invoices.reduce((sum: number, inv: any) => sum + (inv.totalUSD || inv.total || 0), 0);
    const totalPaymentsReceived = payments.filter((p: any) => p.type === "received").reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    return {
      totalInvoicesValue,
      totalOrders: orders.length,
      totalPaymentsReceived,
      invoiceCount: invoices.length,
    };
  }, [invoices, payments, orders]);

  // --- Handlers ---
  const handleMarketChange = async (marketId: string) => {
    try {
      await updateDoc(customerRef, {
        markets: [marketId],
        departments: [marketId.split('_')[0]],
        updatedAt: serverTimestamp()
      });
      toast({ title: "Market Updated", description: `Customer moved to ${marketId.replace('_', ' ')}.` });
    } catch {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const startEditing = () => {
    if (!customer) return;
    setEditForm({
      name: customer.name || "",
      country: customer.country || "",
      natureOfBusiness: customer.natureOfBusiness || customer.companyType || "",
      specializedProducts: customer.specializedProducts || "",
      priceTier: customer.priceTier || "",
      strategicNotes: customer.strategicNotes || "",
      topProducts: (customer.topProducts || []).join("\n"),
      companyOverview: customer.companyOverview || "",
      certifications: customer.certifications || "",
      accountHealth: customer.accountHealth || "healthy",
      recordStatus: customer.recordStatus || "Active",
      // Contacts
      salesManager: customer.salesManager || "",
      exportManager: customer.exportManager || "",
      customerServiceNumber: customer.customerServiceNumber || "",
      customerServiceEmail: customer.customerServiceEmail || "",
      contactPerson: customer.contactPerson || "",
      consignee: customer.consignee || "",
      whatsapp: customer.whatsapp || "",
      // Social
      website: customer.website || "",
      socialFacebook: customer.socialFacebook || "",
      socialInstagram: customer.socialInstagram || "",
      socialLinkedin: customer.socialLinkedin || "",
      // AI
      bestProductPriceAI: customer.bestProductPriceAI || "",
      notesFromAI: customer.notesFromAI || "",
      notesFromStaff: customer.notesFromStaff || "",
      // Notes
      specificNotes: customer.specificNotes || "",
      governorateCity: customer.governorateCity || "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveAll = async () => {
    try {
      const data = {
        name: editForm.name,
        country: editForm.country,
        natureOfBusiness: editForm.natureOfBusiness,
        specializedProducts: editForm.specializedProducts,
        priceTier: editForm.priceTier,
        strategicNotes: editForm.strategicNotes,
        topProducts: editForm.topProducts.split("\n").map((s: string) => s.trim()).filter(Boolean),
        companyOverview: editForm.companyOverview,
        certifications: editForm.certifications,
        accountHealth: editForm.accountHealth,
        recordStatus: editForm.recordStatus,
        salesManager: editForm.salesManager,
        exportManager: editForm.exportManager,
        customerServiceNumber: editForm.customerServiceNumber,
        customerServiceEmail: editForm.customerServiceEmail,
        contactPerson: editForm.contactPerson,
        consignee: editForm.consignee,
        whatsapp: editForm.whatsapp,
        website: editForm.website,
        socialFacebook: editForm.socialFacebook,
        socialInstagram: editForm.socialInstagram,
        socialLinkedin: editForm.socialLinkedin,
        bestProductPriceAI: editForm.bestProductPriceAI,
        notesFromAI: editForm.notesFromAI,
        notesFromStaff: editForm.notesFromStaff,
        specificNotes: editForm.specificNotes,
        governorateCity: editForm.governorateCity,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(customerRef, data);
      setIsEditing(false);
      toast({ title: "Customer Updated", description: "All changes saved." });
    } catch {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum 20MB." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const storagePath = `attachments/customers/${id}/${Date.now()}_${file.name}`;
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
          uploadedBy: user.displayName || "System",
          userId: user.uid,
          customerId: id,
        };
        const newDocRef = doc(collection(db, "customer_attachments"));
        await setDoc(newDocRef, attachmentData);
        setIsUploading(false);
        toast({ title: "File Attached", description: `${file.name} saved.` });
      }
    );
  };

  const handleDeleteAttachment = async (attachment: any) => {
    if (!confirm("Delete this attachment?")) return;
    try {
      await deleteObject(ref(storage, attachment.storagePath));
      await deleteDoc(doc(db, "customer_attachments", attachment.id));
      toast({ title: "File Deleted" });
    } catch {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const handleExportPDF = async () => {
    if (!customer) return;
    toast({ title: "Generating Report", description: "Preparing PDF..." });
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("customer-profile-container");
      if (!element) return;
      const opt = {
        margin: 10,
        filename: `${(customer.name || "customer").replace(/\s+/g, '-')}-report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } catch {
      toast({ variant: "destructive", title: "PDF Failed" });
    }
  };

  const handleContactCustomer = () => {
    const wa = customer?.whatsapp;
    const email = customer?.customerServiceEmail || customer?.email;
    if (wa) {
      window.open(`https://wa.me/${wa.replace(/[^0-9+]/g, "")}`, "_blank");
    } else if (email) {
      setEmailSubject(`Regarding your account: ${customer?.name || ""}`);
      setEmailBody(`Dear ${customer?.name || "Team"},\n\n`);
      setIsEmailDialogOpen(true);
    } else {
      toast({ variant: "destructive", title: "No contact info", description: "No WhatsApp or email found." });
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !customer) return;
    setIsSending(true);
    try {
      // Log email to Firestore
      await setDoc(doc(collection(db, "emails")), {
        to: customer.customerServiceEmail || customer.email || "",
        toName: customer.name,
        subject: emailSubject,
        body: emailBody,
        senderName: user.displayName || "Manager",
        senderId: user.uid,
        entityId: id,
        entityType: 'customer',
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Email Logged", description: `Message recorded for ${customer.name}.` });
      setIsEmailDialogOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Send Failed" });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!confirm(`Delete ${customer?.name}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "customers", id));
      toast({ title: "Customer Deleted" });
      router.push("/customers");
    } catch {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  // --- Render ---
  if (loadingCustomer) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!customer) return (
    <div className="text-center py-20 space-y-4">
      <h2 className="text-2xl font-bold">Customer Not Found</h2>
      <p className="text-muted-foreground">The requested customer ID does not match any records.</p>
      <Button onClick={() => router.push("/customers")}>Back to Customers</Button>
    </div>
  );

  const currentMarket = customer.markets?.[0] || 'unassigned';
  const healthLabel = (customer.accountHealth || "healthy").toLowerCase();
  const healthBadgeClass = healthLabel === "healthy" ? "bg-green-500/10 text-green-500 border-green-500/20"
    : healthLabel === "warning" || healthLabel === "at risk" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    : "bg-red-500/10 text-red-500 border-red-500/20";

  const interestsDisplay = typeof customer.interests === "string"
    ? customer.interests.split(",").map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(customer.interests?.products) ? customer.interests.products : [];

  return (
    <div id="customer-profile-container" className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/customers")} className="print-hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-lg font-bold text-accent border border-accent/20">
                {(customer.name || 'C')[0]}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <Badge variant="outline" className={healthBadgeClass}>
                {healthLabel === "healthy" ? "Healthy" : healthLabel === "warning" || healthLabel === "at risk" ? "Warning" : "Critical"}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {customer.natureOfBusiness || customer.companyType || "Customer"}
              </Badge>
              {(customer.active === true || customer.accountStatus === "active") && (
                <Badge className="bg-green-500 text-white border-none text-[9px]">Active</Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {customer.country || "Global"}{customer.governorateCity ? ` • ${customer.governorateCity}` : ""}</span>
              {customer.internalRating > 0 && <StarRating rating={customer.internalRating} />}
              {currentMarket !== 'unassigned' && (
                <span className="text-primary font-bold capitalize">{currentMarket.replace('_', ' ')}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={cancelEditing}><XCircle className="h-4 w-4 mr-2" /> Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveAll}><Save className="h-4 w-4 mr-2" /> Save All Changes</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" /> Export PDF</Button>
              <Button variant="outline" onClick={startEditing}><Edit className="h-4 w-4 mr-2" /> Edit</Button>
              <Button className="bg-primary shadow-lg shadow-primary/20" onClick={handleContactCustomer}><Send className="h-4 w-4 mr-2" /> Contact Customer</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="border"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setIsEmailDialogOpen(true)}><Mail className="mr-2 h-4 w-4" /> Send Email</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive font-bold" onSelect={handleDeleteCustomer}><Trash2 className="mr-2 h-4 w-4" /> Delete Customer</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
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
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold">${(customer.totalRevenue || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Customer Health</p>
            <p className={cn("text-2xl font-bold capitalize", healthLabel === "healthy" ? "text-green-500" : healthLabel === "warning" ? "text-yellow-500" : "text-red-500")}>{healthLabel}</p>
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
            {/* LEFT: Basic Intelligence */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-bold uppercase">Basic Intelligence</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Nature of Business</label>
                    {isEditing ? (
                      <Input className="mt-1" value={editForm.natureOfBusiness} onChange={(e) => setEditForm({ ...editForm, natureOfBusiness: e.target.value })} />
                    ) : (
                      <p className="font-medium">{customer.natureOfBusiness || customer.companyType || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Country</label>
                    {isEditing ? (
                      <Input className="mt-1" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
                    ) : (
                      <p className="font-medium">{customer.country || "—"}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Specialized Products</label>
                  {isEditing ? (
                    <Input className="mt-1" placeholder="e.g. Confectionery, Snacks" value={editForm.specializedProducts} onChange={(e) => setEditForm({ ...editForm, specializedProducts: e.target.value })} />
                  ) : (
                    <p className="font-medium mt-1">{customer.specializedProducts || <span className="text-muted-foreground italic">None</span>}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Price Tier</label>
                  {isEditing ? (
                    <Select value={editForm.priceTier || "Mid-Range"} onValueChange={(v) => setEditForm({ ...editForm, priceTier: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Budget">Budget</SelectItem>
                        <SelectItem value="Mid-Range">Mid-Range</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{customer.priceTier || "—"}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Market Assignment</label>
                  <Select value={currentMarket} onValueChange={handleMarketChange}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chocolate_market">Chocolate Market</SelectItem>
                      <SelectItem value="cosmetics_market">Cosmetics Market</SelectItem>
                      <SelectItem value="detergents_market">Detergents Market</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Strategic Notes</label>
                  {isEditing ? (
                    <Textarea className="mt-1 min-h-[80px]" value={editForm.strategicNotes} onChange={(e) => setEditForm({ ...editForm, strategicNotes: e.target.value })} placeholder="Strategic notes..." />
                  ) : (
                    <p className="text-sm mt-1 leading-relaxed">{customer.strategicNotes || <span className="text-muted-foreground italic">No strategic notes</span>}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Top 5 Best-Selling Products</label>
                  {isEditing ? (
                    <Textarea className="mt-1 min-h-[100px]" placeholder="One product per line" value={editForm.topProducts} onChange={(e) => setEditForm({ ...editForm, topProducts: e.target.value })} />
                  ) : (
                    <div className="mt-1">
                      {customer.topProducts?.length > 0 ? (
                        <ol className="list-decimal list-inside space-y-0.5">
                          {customer.topProducts.map((p: string, i: number) => <li key={i} className="text-sm">{p}</li>)}
                        </ol>
                      ) : <span className="text-xs text-muted-foreground italic">None listed</span>}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Company Overview</label>
                  {isEditing ? (
                    <Textarea className="mt-1 min-h-[100px]" value={editForm.companyOverview} onChange={(e) => setEditForm({ ...editForm, companyOverview: e.target.value })} />
                  ) : (
                    <p className="text-sm mt-1 leading-relaxed">{customer.companyOverview || <span className="text-muted-foreground italic">No overview</span>}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Organic / Halal Certifications</label>
                  {isEditing ? (
                    <Input className="mt-1" value={editForm.certifications} onChange={(e) => setEditForm({ ...editForm, certifications: e.target.value })} placeholder="e.g. Halal, ISO 9001" />
                  ) : (
                    <p className="font-medium mt-1">{customer.certifications || <span className="text-muted-foreground italic">None</span>}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Record Status</label>
                  {isEditing ? (
                    <Select value={editForm.recordStatus || "Active"} onValueChange={(v) => setEditForm({ ...editForm, recordStatus: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Active - Verified">Active - Verified</SelectItem>
                        <SelectItem value="Checking Data">Checking Data</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={cn("mt-1 text-[9px]",
                      (customer.recordStatus || "Active").includes('Active') && "bg-green-500",
                      customer.recordStatus === 'Blacklisted' && "bg-destructive",
                      customer.recordStatus === 'Checking Data' && "bg-orange-500",
                      customer.recordStatus === 'Inactive' && "bg-gray-500"
                    )}>{customer.recordStatus || "Active"}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Primary Sales Contact */}
              <Card>
                <CardHeader><CardTitle className="text-sm font-bold uppercase">Primary Sales Contact</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Sales Manager</label>
                      {isEditing ? (
                        <Input className="mt-1" value={editForm.salesManager} onChange={(e) => setEditForm({ ...editForm, salesManager: e.target.value })} />
                      ) : (
                        <p className="font-medium">{customer.salesManager || "—"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Export Manager</label>
                      {isEditing ? (
                        <Input className="mt-1" value={editForm.exportManager} onChange={(e) => setEditForm({ ...editForm, exportManager: e.target.value })} />
                      ) : (
                        <p className="font-medium">{customer.exportManager || "—"}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Support Phone</label>
                      {isEditing ? (
                        <Input className="mt-1" value={editForm.customerServiceNumber} onChange={(e) => setEditForm({ ...editForm, customerServiceNumber: e.target.value })} />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {customer.customerServiceNumber ? (
                            <a href={`tel:${customer.customerServiceNumber}`} className="text-sm text-primary hover:underline">{customer.customerServiceNumber}</a>
                          ) : <span className="text-sm text-muted-foreground">—</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Support Email</label>
                      {isEditing ? (
                        <Input className="mt-1" type="email" value={editForm.customerServiceEmail} onChange={(e) => setEditForm({ ...editForm, customerServiceEmail: e.target.value })} />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {customer.customerServiceEmail ? (
                            <a href={`mailto:${customer.customerServiceEmail}`} className="text-sm text-primary hover:underline">{customer.customerServiceEmail}</a>
                          ) : <span className="text-sm text-muted-foreground">—</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Contact Person</label>
                      {isEditing ? (
                        <Input className="mt-1" value={editForm.contactPerson} onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })} />
                      ) : (
                        <p className="font-medium">{customer.contactPerson || "—"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Consignee</label>
                      {isEditing ? (
                        <Input className="mt-1" value={editForm.consignee} onChange={(e) => setEditForm({ ...editForm, consignee: e.target.value })} />
                      ) : (
                        <p className="font-medium">{customer.consignee || "—"}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">WhatsApp</label>
                    {isEditing ? (
                      <Input className="mt-1" value={editForm.whatsapp} onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })} />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        {customer.whatsapp ? (
                          <a href={`https://wa.me/${customer.whatsapp.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                            {customer.whatsapp} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : <span className="text-sm text-muted-foreground">—</span>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader><CardTitle className="text-sm font-bold uppercase">Social Media</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Website</label>
                        <Input className="mt-1" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} placeholder="https://..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Facebook</label>
                        <Input className="mt-1" value={editForm.socialFacebook} onChange={(e) => setEditForm({ ...editForm, socialFacebook: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Instagram</label>
                        <Input className="mt-1" value={editForm.socialInstagram} onChange={(e) => setEditForm({ ...editForm, socialInstagram: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">LinkedIn</label>
                        <Input className="mt-1" value={editForm.socialLinkedin} onChange={(e) => setEditForm({ ...editForm, socialLinkedin: e.target.value })} />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {[
                        { icon: Globe, label: "Website", value: customer.website },
                        { icon: Facebook, label: "Facebook", value: customer.socialFacebook },
                        { icon: Instagram, label: "Instagram", value: customer.socialInstagram },
                        { icon: Linkedin, label: "LinkedIn", value: customer.socialLinkedin },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 text-sm">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-[10px] font-bold uppercase text-muted-foreground w-20">{label}</span>
                          {value ? (
                            <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex items-center gap-1">
                              {value} <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          ) : <span className="text-muted-foreground italic">—</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader><CardTitle className="text-sm font-bold uppercase flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> AI Insights</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Best Product Price (AI from n8n)</label>
                    {isEditing ? (
                      <Input className="mt-1" value={editForm.bestProductPriceAI} onChange={(e) => setEditForm({ ...editForm, bestProductPriceAI: e.target.value })} />
                    ) : (
                      <p className="text-sm mt-1">{customer.bestProductPriceAI || <span className="text-muted-foreground italic">No AI price insights</span>}</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">AI Notes (from n8n)</label>
                    {isEditing ? (
                      <Textarea className="mt-1 min-h-[60px]" value={editForm.notesFromAI} onChange={(e) => setEditForm({ ...editForm, notesFromAI: e.target.value })} />
                    ) : (
                      <p className="text-sm mt-1">{customer.notesFromAI || <span className="text-muted-foreground italic">No AI notes</span>}</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><StickyNote className="h-3 w-3" /> Staff Notes</label>
                    {isEditing ? (
                      <Textarea className="mt-1 min-h-[60px]" value={editForm.notesFromStaff} onChange={(e) => setEditForm({ ...editForm, notesFromStaff: e.target.value })} />
                    ) : (
                      <p className="text-sm mt-1">{customer.notesFromStaff || <span className="text-muted-foreground italic">No staff notes</span>}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Priority Notes */}
              {(customer.specificNotes || isEditing) && (
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardHeader><CardTitle className="text-sm font-bold uppercase flex items-center gap-2"><StickyNote className="h-4 w-4 text-yellow-500" /> Priority Notes</CardTitle></CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea className="min-h-[80px] border-yellow-500/30" value={editForm.specificNotes} onChange={(e) => setEditForm({ ...editForm, specificNotes: e.target.value })} />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{customer.specificNotes}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Catalog */}
        <TabsContent value="catalog" className="pt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm font-bold uppercase">Products & Interests</CardTitle></CardHeader>
            <CardContent>
              {interestsDisplay.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {interestsDisplay.map((p: string) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No product interests specified.</p>
              )}
            </CardContent>
          </Card>
          {customer.specializedProducts && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-bold uppercase">Specialized Products</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{customer.specializedProducts}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Orders */}
        <TabsContent value="orders" className="pt-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Order History</h3>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs font-bold">{o.number || o.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{formatFirebaseTimestamp(o.date)}</TableCell>
                    <TableCell className="text-xs">{o.notes || "—"}</TableCell>
                    <TableCell className="text-right font-bold text-accent">${(o.total || 0).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{o.status || "pending"}</Badge></TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No orders found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab 4: Invoices */}
        <TabsContent value="invoices" className="pt-6 space-y-4">
          <h3 className="font-bold">Customer Invoices</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-bold">{inv.number || inv.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{inv.dateIssue || formatFirebaseTimestamp(inv.createdAt)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[9px]">{inv.currency || "USD"}</Badge></TableCell>
                    <TableCell className="text-right font-bold text-primary">${(inv.totalUSD || inv.total || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={cn(inv.status === 'paid' || inv.status === 'Paid' ? "bg-green-500" : "bg-yellow-500")}>{inv.status || "draft"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No invoices for this customer.</TableCell></TableRow>}
              </TableBody>
            </Table>
            {invoices.length > 0 && (
              <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-muted-foreground">Total Invoiced:</span>
                <span className="text-xl font-black text-primary">${stats.totalInvoicesValue.toLocaleString()}</span>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 5: Payments */}
        <TabsContent value="payments" className="pt-6 space-y-4">
          <h3 className="font-bold">Payment Ledger</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((pay: any) => (
                  <TableRow key={pay.id}>
                    <TableCell className="text-xs">{formatFirebaseTimestamp(pay.date)}</TableCell>
                    <TableCell className="text-xs">{pay.partyName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[9px]", pay.type === "received" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600")}>
                        {pay.type === "received" ? "Received" : "Paid"}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[9px]">{pay.currency || "USD"}</Badge></TableCell>
                    <TableCell className="text-right font-bold text-green-500">${(pay.amount || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No payments recorded.</TableCell></TableRow>}
              </TableBody>
            </Table>
            {payments.length > 0 && (
              <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-muted-foreground">Total Received:</span>
                <span className="text-xl font-black text-green-500">${stats.totalPaymentsReceived.toLocaleString()}</span>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 6: Attachments */}
        <TabsContent value="attachments" className="pt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Document Vault</h3>
            <div className="relative">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                Upload Document
              </Button>
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span>Uploading...</span>
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
                {attachments.map((att: any) => (
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
                {attachments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic text-xs">No documents uploaded.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSendEmail}>
            <DialogHeader><DialogTitle>Contact Customer</DialogTitle><DialogDescription>Send a message to {customer.name}</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Recipient</label>
                <Input value={customer.customerServiceEmail || customer.email || ""} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Subject</label>
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Message</label>
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
