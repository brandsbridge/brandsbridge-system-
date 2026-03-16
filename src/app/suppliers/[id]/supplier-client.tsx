
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Mail, Phone, Globe, Calendar, Clock, 
  TrendingUp, AlertTriangle, ShieldCheck, 
  Download, Share2, MessageSquare, 
  Star, MapPin, DollarSign, ExternalLink,
  Linkedin, Factory, Edit, Trash2,
  Lock, Loader2, Send, MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { emailService } from "@/services/email-service";
import { supplierService } from "@/services/supplier-service";

interface SupplierClientProps {
  id: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
    ))}
  </div>
);

export default function SupplierClient({ id }: SupplierClientProps) {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const supplierRef = useMemoFirebase(() => doc(db, "suppliers", id), [db, id]);
  const { data: supplier, isLoading: loading } = useDoc(supplierRef);
  
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Profile Link Copied",
          description: "The unique URL for this supplier has been copied to your clipboard.",
        });
      });
    }
  };

  const handleExportPDF = async () => {
    if (!supplier) return;
    
    toast({
      title: "Generating PDF",
      description: "Preparing your professional supplier report...",
    });

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("supplier-profile-container");
      
      if (!element) return;

      const opt = {
        margin: [10, 10],
        filename: `${supplier.name.toLowerCase().replace(/\s+/g, '-')}-profile.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save();
      
      toast({ title: "Export Successful", description: "Your report has been downloaded." });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate PDF." });
    }
  };

  const handleOpenContactDialog = () => {
    const email = supplier?.email || supplier?.contacts?.sales?.email || supplier?.contacts?.primary?.email;
    if (!email) {
      toast({ variant: "destructive", title: "No Email Found", description: "This supplier has no registered contact email." });
      return;
    }
    setEmailSubject(`Business Inquiry: ${supplier?.name || "Partner Inquiry"}`);
    setEmailBody(`Dear ${supplier?.name || "Team"},\n\nWe are reaching out from the Procurement Department...`);
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supplier) return;
    setIsSending(true);
    const targetEmail = supplier.email || supplier.contacts?.sales?.email || supplier.contacts?.primary?.email;
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
      toast({ title: "Message Dispatched", description: `Your inquiry has been sent to ${supplier.name}.` });
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Transmission Error", description: "Could not send message." });
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      country: formData.get('country'),
      natureOfBusiness: formData.get('natureOfBusiness')
    };
    supplierService.updateSupplier(db, id, data);
    setIsEditDialogOpen(false);
    toast({ title: "Profile Updated", description: "Supplier changes saved to directory." });
  };

  const handleDeleteSupplier = () => {
    if (confirm(`Archive ${supplier?.name}? This action cannot be undone from the active directory.`)) {
      supplierService.deleteSupplier(db, id);
      toast({ title: "Supplier Archived", description: "Record removed from live registry." });
      router.push("/suppliers");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Synchronizing supplier record...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Supplier Not Found</h2>
        <Button onClick={() => router.back()}>Return to Directory</Button>
      </div>
    );
  }

  return (
    <div id="supplier-profile-container" className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="print-hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{supplier.flag || '🏭'}</span>
              <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {supplier.recordStatus || 'Active'}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3" /> {supplier.country || 'Global'} • {supplier.natureOfBusiness}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap print-hidden">
          <Button variant="outline" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button variant="outline" onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" /> Export PDF</Button>
          <Button className="bg-primary" onClick={handleOpenContactDialog}><Mail className="h-4 w-4 mr-2" /> Contact</Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="border"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteSupplier} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Archive Record
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3 pb-4">
                <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary border-2 border-primary/20">
                  {(supplier.name || 'S')[0]}
                </div>
                <div>
                  <StarRating rating={supplier.internalRating || 0} />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Quality Rating</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Profile Sync</span>
                  <span className="font-bold text-green-500">{supplier.dataCompleteness || 0}%</span>
                </div>
                <Progress value={supplier.dataCompleteness || 0} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 print-hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Catalog</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6 pt-4">
              <Card>
                <CardHeader><CardTitle>Partner Intelligence</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{supplier.overview || 'No extended overview available.'}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateSupplier}>
            <DialogHeader>
              <DialogTitle>Edit Partner Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Company Name</label>
                <Input name="name" defaultValue={supplier.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Nature of Business</label>
                <Input name="natureOfBusiness" defaultValue={supplier.natureOfBusiness} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Country</label>
                <Input name="country" defaultValue={supplier.country} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSendEmail}>
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
