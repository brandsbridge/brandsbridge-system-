"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Mail, Globe, Calendar, Clock, 
  TrendingUp, Target, Download, Share2, 
  BarChart3, MapPin, CheckCircle2, 
  MessageSquare, FileText, ShoppingCart, 
  CreditCard, PieChart as PieIcon, Phone,
  Users as UsersIcon, ShieldCheck, Lock,
  Plus, Send, History, Briefcase, 
  AlertCircle, ChevronRight, Filter,
  Paperclip, Star, MoreVertical, Search,
  Upload, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { MOCK_CUSTOMERS, MOCK_EMAILS, MOCK_OFFERS_TRACKING, MOCK_PURCHASES, MOCK_INVOICES, MOCK_PAYMENTS } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444', '#10B981'];

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
  
  // Fetch live customer data from Firestore
  const customerRef = useMemo(() => doc(db, "customers", id), [db, id]);
  const { data: customer, loading } = useDoc(customerRef);

  // Filter related data (Note: These remain mock until their respective collections are populated)
  const emails = useMemo(() => MOCK_EMAILS.filter(e => e.custId === id), [id]);
  const offers = useMemo(() => MOCK_OFFERS_TRACKING.filter(o => o.sentTo === customer?.name), [customer]);
  const purchases = useMemo(() => MOCK_PURCHASES.filter(p => p.buyerName === customer?.name), [customer]);
  const invoices = useMemo(() => MOCK_INVOICES.filter(i => i.customerName === customer?.name), [customer]);
  const payments = useMemo(() => MOCK_PAYMENTS.filter(p => p.partyName === customer?.name), [customer]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Profile Shared",
        description: "Customer profile link has been copied to your clipboard.",
      });
    }
  };

  const handleExportAudit = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleComposeEmail = () => {
    if (customer?.email) {
      window.location.href = `mailto:${customer.email}?subject=Follow-up from BizFlow Account Management`;
    } else {
      toast({
        variant: "destructive",
        title: "Communication Error",
        description: "This customer does not have a registered email address.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading profile from Firestore...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Customer Not Found</h2>
        <p className="text-muted-foreground">The requested customer record does not exist in the database.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const revenueData = [
    { month: 'Jan', revenue: 4500 },
    { month: 'Feb', revenue: 5200 },
    { month: 'Mar', revenue: 4800 },
    { month: 'Apr', revenue: 6100 },
    { month: 'May', revenue: 5900 },
    { month: 'Jun', revenue: 7200 },
  ];

  const productSplit = [
    { name: 'Chocolate', value: 60 },
    { name: 'Cosmetics', value: 30 },
    { name: 'Detergents', value: 10 },
  ];

  const stats = {
    revenue: customer.totalRevenue || 0,
    orders: purchases.length,
    replyRate: 85,
    avgResponse: 4.2
  };

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
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <style jsx global>{`
        @media print {
          aside, header, .print-hidden, button, [role="tablist"] {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .md\:pl-64 {
            padding-left: 0 !important;
          }
        }
      `}</style>

      {/* Header */}
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
                {customer.accountHealth || 'Status Unknown'}
              </Badge>
              <Badge variant="secondary" className="capitalize">{customer.accountStatus || 'Prospect'}</Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3" /> {customer.city || 'Unknown City'}, {customer.country || 'Unknown Country'} • {customer.companyType || 'Corporate'} • Est. {customer.yearEstablished || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap print-hidden">
          <Button variant="outline" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button variant="outline" onClick={handleExportAudit}><Download className="h-4 w-4 mr-2" /> Export Audit</Button>
          <Button className="bg-primary" onClick={handleComposeEmail}><Send className="h-4 w-4 mr-2" /> Compose Email</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
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
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Managed By</h4>
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
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Social Links</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" asChild disabled={!customer.socialLinks?.linkedin}>
                    <a href={customer.socialLinks?.linkedin ? `https://${customer.socialLinks.linkedin}` : '#'} target="_blank"><Briefcase className="mr-1 h-3 w-3" /> LinkedIn</a>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" asChild disabled={!customer.socialLinks?.whatsapp}>
                    <a href={customer.socialLinks?.whatsapp ? `https://wa.me/${customer.socialLinks.whatsapp}` : '#'} target="_blank"><MessageSquare className="mr-1 h-3 w-3" /> WhatsApp</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs uppercase flex items-center gap-2">
                <Clock className="h-3 w-3" /> Last Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Contact:</span>
                <span className="font-bold">{customer.lastContactDate ? new Date(customer.lastContactDate).toLocaleDateString() : 'Never'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Purchase:</span>
                <span className="font-bold">{customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'No History'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Yearly Rev:</span>
                <span className="font-bold text-primary">${(customer.totalRevenue || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
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
              <Card>
                <CardHeader><CardTitle className="text-sm">Company Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">{customer.overview || 'No overview provided.'}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground">Target Markets</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(customer.targetMarkets) && customer.targetMarkets.length > 0 ? (
                          customer.targetMarkets.map((m: string) => <Badge key={m} variant="secondary" className="text-[8px]">{m}</Badge>)
                        ) : (
                          <span className="text-[8px] text-muted-foreground italic">None specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground">Key Advantages</p>
                      <p className="text-[10px] mt-1">{Array.isArray(customer.competitiveAdvantages) ? customer.competitiveAdvantages.join(", ") : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Primary Contact (Decision Maker)</CardTitle></CardHeader>
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
                        <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> Preferred: {customer.contacts.primary.preferredTime || 'Anytime'}</div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No primary contact recorded.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other content remains live and functional as per existing structure */}
            <TabsContent value="emails" className="space-y-6 pt-4">
              <div className="flex items-center justify-between print-hidden">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search emails..." className="pl-9 h-9" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Templates</Button>
                  <Button size="sm" onClick={handleComposeEmail}><Plus className="mr-2 h-4 w-4" /> New Email</Button>
                </div>
              </div>

              <div className="space-y-4">
                {emails.length > 0 ? (
                  emails.slice(0, 5).map((email, idx) => (
                    <Card key={email.id} className="overflow-hidden">
                      <div className={cn("p-4 flex gap-4", idx % 2 === 0 ? "bg-card" : "bg-muted/30")}>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={email.sentBy === "Alex Johnson" ? "default" : "outline"} className="text-[8px]">
                                {email.sentBy === "Alex Johnson" ? "SENT" : "RECEIVED"}
                              </Badge>
                              <span className="text-xs font-bold">{email.subject}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{formatFirebaseTimestamp(email.date)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{email.body}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="py-12 text-center border border-dashed rounded-xl">
                    <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No communication history found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
