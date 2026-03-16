
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Mail, MapPin, 
  Share2, Download, Send, 
  MessageSquare, Clock, Phone,
  Briefcase, Star, Loader2, Edit, Trash2, MoreVertical,
  Globe, Factory, ShieldCheck, Box, Package
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { emailService } from "@/services/email-service";
import { supplierService } from "@/services/supplier-service";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
    ))}
  </div>
);

export default function SupplierClient({ id }: { id: string }) {
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
          title: "Link Copied",
          description: "The supplier profile URL has been saved to your clipboard.",
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
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          windowWidth: 1200 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Temporarily hide UI elements for clean capture
      const toHide = element.querySelectorAll('.print-hidden, button, [role="tablist"], .dropdown-menu');
      toHide.forEach(el => (el as HTMLElement).style.display = 'none');

      await html2pdf().set(opt).from(element).save();
      
      // Restore UI elements
      toHide.forEach(el => (el as HTMLElement).style.display = '');

      toast({
        title: "Export Successful",
        description: "Your report has been downloaded.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
      });
    }
  };

  const handleOpenContactDialog = () => {
    const email = supplier?.email || supplier?.contacts?.sales?.email || supplier?.contacts?.primary?.email;
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Action Restricted",
        description: "This supplier profile is missing a registered contact email.",
      });
      return;
    }

    setEmailSubject(`Supply Chain Inquiry: ${supplier?.name || "Manufacturing Partner"}`);
    setEmailBody(`Dear ${supplier?.name || "Team"},\n\nWe are reaching out regarding current availability and pricing for your specialized product catalog...`);
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

      toast({
        title: "Message Dispatched",
        description: `Your inquiry has been sent to ${supplier.name} and logged in the system.`,
      });
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Transmission Error",
        description: "The system was unable to dispatch the message. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

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

    supplierService.updateSupplier(db, id, data);
    setIsEditDialogOpen(false);
    toast({ title: "Profile Updated", description: "Changes have been successfully synchronized with Firestore." });
  };

  const handleDeleteSupplier = () => {
    if (confirm(`Archive ${supplier?.name}? This action will remove the record from the active directory.`)) {
      supplierService.deleteSupplier(db, id);
      toast({ title: "Supplier Archived", description: "Record successfully removed from registry." });
      router.push("/suppliers");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Pulling supplier intelligence from cloud...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Partner Record Not Found</h2>
        <Button onClick={() => router.back()}>Back to Directory</Button>
      </div>
    );
  }

  return (
    <div id="supplier-profile-container" className="space-y-8 max-w-7xl mx-auto pb-20">
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
                {supplier.recordStatus || 'Verified'}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3" /> {supplier.country || 'Global'} • {supplier.natureOfBusiness || 'Manufacturer'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap print-hidden">
          <Button variant="outline" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button variant="outline" onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" /> Export PDF</Button>
          <Button className="bg-primary" onClick={handleOpenContactDialog}><Mail className="h-4 w-4 mr-2" /> Contact Supplier</Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="border"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Record
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleDeleteSupplier} className="text-destructive font-bold">
                <Trash2 className="mr-2 h-4 w-4" /> Archive Supplier
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
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Reliability Index</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Data Completeness</span>
                  <span className="font-bold text-green-500">{supplier.dataCompleteness || 0}%</span>
                </div>
                <Progress value={supplier.dataCompleteness || 0} className="h-1.5" />
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Avg. Lead Time</span>
                  <span className="font-bold">{supplier.pricing?.leadTime || 7} Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Price Tier</span>
                  <Badge variant="secondary" className="text-[10px]">{supplier.pricing?.tier || 'Premium'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 print-hidden">
              <TabsTrigger value="overview">Executive Overview</TabsTrigger>
              <TabsTrigger value="products">Catalog & Logistics</TabsTrigger>
              <TabsTrigger value="compliance">Compliance & Certs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 pt-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Strategic Intelligence</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">{supplier.overview || 'No extended overview provided for this manufacturing partner.'}</p>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Nature of Business</p>
                      <p className="text-sm font-medium">{supplier.natureOfBusiness || 'Manufacturer'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Base Operations</p>
                      <p className="text-sm font-medium">{supplier.country}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Primary Sales Contact</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {supplier.contacts?.sales ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                          {supplier.contacts.sales.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{supplier.contacts.sales.name}</p>
                          <p className="text-[10px] text-muted-foreground">Account Manager</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.location.href = `mailto:${supplier.contacts.sales.email}`}><Mail className="h-3 w-3" /></Button>
                        <Button variant="outline" size="sm"><Phone className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">Contact data pending verification.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6 pt-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Specialized Categories</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {supplier.specializedProducts?.map((p: string) => (
                      <Badge key={p} variant="secondary" className="px-3 py-1">
                        <Box className="h-3 w-3 mr-2" /> {p}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle className="text-sm">Logistics & MOQs</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Min. Order Quantity</p>
                    <p className="text-lg font-bold">{supplier.pricing?.moq || '100 Units'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Min. Order Value</p>
                    <p className="text-lg font-bold">${(supplier.pricing?.mov || 1000).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6 pt-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Verification Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-green-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                        <span className="text-xs font-bold uppercase">KYC Verified</span>
                      </div>
                      <Badge className="bg-green-500">Valid</Badge>
                    </div>
                    <div className="p-4 rounded-xl border bg-secondary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-primary" />
                        <span className="text-xs font-bold uppercase">Halal Cert</span>
                      </div>
                      <Badge variant="outline">In Review</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdateSupplier}>
            <DialogHeader>
              <DialogTitle>Edit Partner Intelligence</DialogTitle>
              <DialogDescription>Modify core supplier details for global directory alignment.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Company Name</label>
                <Input name="name" defaultValue={supplier.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Nature of Business</label>
                <Select name="natureOfBusiness" defaultValue={supplier.natureOfBusiness || 'Manufacturer'}>
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
              <Button type="submit">Synchronize Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSendEmail}>
            <DialogHeader>
              <DialogTitle>Compose Corporate Inquiry</DialogTitle>
              <DialogDescription>
                Your message will be sent to {supplier.name} and logged in the communication audit trail.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Recipient</label>
                <Input value={supplier.email || supplier.contacts?.sales?.email || supplier.contacts?.primary?.email} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Subject</label>
                <Input 
                  value={emailSubject} 
                  onChange={(e) => setEmailSubject(e.target.value)} 
                  required 
                  placeholder="Inquiry regarding..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Message Body</label>
                <Textarea 
                  value={emailBody} 
                  onChange={(e) => setEmailBody(e.target.value)} 
                  required 
                  className="min-h-[200px] leading-relaxed"
                  placeholder="Type your message here..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEmailDialogOpen(false)} disabled={isSending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Inquiry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
