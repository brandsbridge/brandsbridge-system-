"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Mail, MapPin, 
  Share2, Download, Send, 
  MessageSquare, Clock, Phone,
  Briefcase, Star, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
    ))}
  </div>
);

export default function CustomerClient({ id }: { id: string }) {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  const customerRef = useMemo(() => doc(db, "customers", id), [db, id]);
  const { data: customer, loading } = useDoc(customerRef);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link Copied",
          description: "The customer profile URL has been saved to your clipboard.",
        });
      });
    }
  };

  const handleExportPDF = async () => {
    if (!customer) return;
    
    const element = document.getElementById("customer-profile-container");
    if (!element) return;

    toast({
      title: "Generating PDF",
      description: "Preparing your professional customer report...",
    });

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const worker = html2pdf();
      
      const opt = {
        margin: [10, 10],
        filename: `${customer.name.toLowerCase().replace(/\s+/g, '-')}-profile.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          windowWidth: 1200 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.backgroundColor = "white";
      clone.style.color = "black";
      
      const toHide = clone.querySelectorAll('.print-hidden, button, [role="tablist"], .dropdown-menu');
      toHide.forEach(el => (el as HTMLElement).style.display = 'none');

      const cards = clone.querySelectorAll('.card, div[class*="border"]');
      cards.forEach(card => {
        (card as HTMLElement).style.borderColor = "#e2e8f0";
        (card as HTMLElement).style.boxShadow = "none";
        (card as HTMLElement).style.backgroundColor = "#ffffff";
      });

      await worker.set(opt).from(clone).save();
      
      toast({
        title: "Export Successful",
        description: "Your report has been downloaded.",
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
      });
    }
  };

  const handleComposeEmail = () => {
    const email = customer?.email || 
                  customer?.contacts?.primary?.email || 
                  customer?.contacts?.finance?.email;
    
    if (email) {
      const subject = encodeURIComponent(`Corporate Account Update: ${customer?.name || "Client Notification"}`);
      const body = encodeURIComponent(`Dear ${customer?.name || "Team"},\n\nI am reaching out regarding your account status and upcoming opportunities...`);
      const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
      
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.click();
    } else {
      toast({
        variant: "destructive",
        title: "Action Restricted",
        description: "This customer profile is missing a registered contact email.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Pulling profile from secure storage...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Client Record Not Found</h2>
        <p className="text-muted-foreground">The requested customer ID does not match any records in your department.</p>
        <Button onClick={() => router.back()}>Back to Ledger</Button>
      </div>
    );
  }

  const getHealthColor = (health: string) => {
    switch (health?.toLowerCase()) {
      case 'healthy': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'at risk': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'dormant': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'churned': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div id="customer-profile-container" className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="print-hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{customer.flag || '🏢'}</span>
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <Badge variant="outline" className={cn("capitalize", getHealthColor(customer.accountHealth))}>
                {customer.accountHealth || 'Healthy'}
              </Badge>
              <Badge variant="secondary" className="capitalize">{customer.accountStatus || 'Prospect'}</Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3" /> {customer.city || 'Global'}, {customer.country || 'Territory'} • {customer.companyType || 'Corporate'} • Est. {customer.yearEstablished || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap print-hidden">
          <Button variant="outline" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button variant="outline" onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" /> Export PDF</Button>
          <Button className="bg-primary shadow-lg shadow-primary/20" onClick={handleComposeEmail}><Send className="h-4 w-4 mr-2" /> Compose Email</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-6">
          <Card className="card">
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3 pb-4">
                <div className="h-24 w-24 rounded-2xl bg-accent/10 flex items-center justify-center text-4xl font-bold text-accent border-2 border-accent/20">
                  {(customer.name || 'C').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <StarRating rating={customer.internalRating || 0} />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Account Priority: {customer.accountPriority || 'Normal'}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Data Completeness</span>
                  <span className={cn("font-bold", (customer.dataCompleteness || 0) > 80 ? "text-green-500" : "text-yellow-500")}>
                    {customer.dataCompleteness || 0}%
                  </span>
                </div>
                <Progress value={customer.dataCompleteness || 0} className="h-1.5" />
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Account Owner</h4>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {(customer.assignedManager || 'S').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="text-xs">
                    <p className="font-bold">{customer.assignedManager || 'System'}</p>
                    <p className="text-muted-foreground text-[10px]">Primary Manager</p>
                  </div>
                </div>
              </div>

              <Separator className="print-hidden" />

              <div className="space-y-4 print-hidden">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Connectivity</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" asChild disabled={!customer.socialLinks?.linkedin}>
                    <a href={customer.socialLinks?.linkedin ? `https://${customer.socialLinks.linkedin}` : '#'} target="_blank" rel="noopener noreferrer"><Briefcase className="mr-1 h-3 w-3" /> LinkedIn</a>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" asChild disabled={!customer.socialLinks?.whatsapp}>
                    <a href={customer.socialLinks?.whatsapp ? `https://wa.me/${customer.socialLinks.whatsapp}` : '#'} target="_blank" rel="noopener noreferrer"><MessageSquare className="mr-1 h-3 w-3" /> WhatsApp</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs uppercase flex items-center gap-2">
                <Clock className="h-3 w-3" /> Latest Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Contact:</span>
                <span className="font-bold">{customer.lastContactDate ? new Date(customer.lastContactDate).toLocaleDateString() : 'Never'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Order:</span>
                <span className="font-bold">{customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'No History'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LTV Revenue:</span>
                <span className="font-bold text-primary">${(customer.totalRevenue || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 h-12 print-hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="emails">Communication</TabsTrigger>
              <TabsTrigger value="ops">Operations</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
              <TabsTrigger value="notes">Notes/Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 pt-4">
              <Card className="card">
                <CardHeader><CardTitle className="text-sm">Client Executive Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">{customer.overview || 'No executive overview available for this corporate account.'}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground">Market Interests</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(customer.targetMarkets) && customer.targetMarkets.length > 0 ? (
                          customer.targetMarkets.map((m: string) => <Badge key={m} variant="secondary" className="text-[8px]">{m}</Badge>)
                        ) : (
                          <span className="text-[8px] text-muted-foreground italic">None specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground">Strategic Advantages</p>
                      <p className="text-[10px] mt-1">{Array.isArray(customer.competitiveAdvantages) ? customer.competitiveAdvantages.join(", ") : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card">
                <CardHeader><CardTitle className="text-sm">Primary Decision Maker</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {customer.contacts?.primary ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {customer.contacts.primary.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{customer.contacts.primary.name}</p>
                          <p className="text-[10px] text-muted-foreground">{customer.contacts.primary.designation}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs mt-2">
                        <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {customer.contacts.primary.email}</div>
                        <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {customer.contacts.primary.phone}</div>
                        <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> Preferred Reach Time: {customer.contacts.primary.preferredTime || 'Anytime'}</div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Primary contact record pending update.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}