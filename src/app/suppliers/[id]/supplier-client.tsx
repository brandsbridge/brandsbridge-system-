
"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Mail, Phone, Globe, Calendar, Clock, 
  TrendingUp, AlertTriangle, ShieldCheck, 
  Download, Share2, MessageSquare, 
  Star, MapPin, DollarSign, ExternalLink,
  Linkedin, Factory,
  Lock, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const supplierRef = useMemo(() => doc(db, "suppliers", id), [db, id]);
  const { data: supplier, loading } = useDoc(supplierRef);
  
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Profile Link Copied",
        description: "The unique URL for this supplier has been copied to your clipboard.",
      });
    }
  };

  const handleExportPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleContactSupplier = () => {
    const email = supplier?.email || 
                  supplier?.contacts?.sales?.email || 
                  supplier?.contacts?.export?.email ||
                  supplier?.contacts?.support?.email;
    
    if (email) {
      const subject = `Business Inquiry: ${supplier?.name || "Partner Inquiry"}`;
      const body = `Dear ${supplier?.name || "Team"},\n\nWe are reaching out from the Procurement Department regarding...`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      toast({
        variant: "destructive",
        title: "Communication Error",
        description: "This supplier profile does not contain a registered email address.",
      });
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
        <p className="text-muted-foreground">The requested record could not be retrieved from Firestore.</p>
        <Button onClick={() => router.back()}>Return to Directory</Button>
      </div>
    );
  }

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <style jsx global>{`
        @media print {
          aside, header, .print-hidden, button, [role="tablist"], .fixed {
            display: none !important;
          }
          main, .md\:pl-64 {
            padding: 0 !important;
            margin: 0 !important;
            margin-left: 0 !important;
          }
          .card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="print-hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{supplier.flag || '🏭'}</span>
              <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
              <Badge 
                variant={supplier.recordStatus?.includes('Verified') ? 'default' : 'secondary'}
                className={cn(
                  supplier.recordStatus?.includes('Verified') && "bg-green-500",
                  supplier.recordStatus === 'Blacklisted' && "bg-destructive",
                  supplier.recordStatus === 'Under Review' && "bg-orange-500"
                )}
              >
                {supplier.recordStatus || 'Pending Review'}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3" /> {supplier.country || 'Global'} • {supplier.natureOfBusiness || 'Corporate'} • Est. {supplier.yearEstablished || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap print-hidden">
          <Button variant="outline" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button variant="outline" onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" /> Export PDF</Button>
          <Button className="bg-primary shadow-lg shadow-primary/20" onClick={handleContactSupplier}><Mail className="h-4 w-4 mr-2" /> Contact Supplier</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3 pb-4">
                <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary border-2 border-primary/20">
                  {(supplier.name || 'S').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <StarRating rating={supplier.internalRating || 0} />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Internal Quality Rating</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Profile Completeness</span>
                  <span className={cn("font-bold", (supplier.dataCompleteness || 0) > 80 ? "text-green-500" : (supplier.dataCompleteness || 0) > 50 ? "text-yellow-500" : "text-destructive")}>
                    {supplier.dataCompleteness || 0}%
                  </span>
                </div>
                <Progress value={supplier.dataCompleteness || 0} className="h-1.5" />
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Strategic Priority</h4>
                <Badge variant="outline" className={cn(
                  "w-full justify-center py-1",
                  supplier.priorityLevel === 'High' && "border-destructive text-destructive bg-destructive/5",
                  supplier.priorityLevel === 'Medium' && "border-orange-500 text-orange-500 bg-orange-500/5"
                )}>
                  {supplier.priorityLevel || 'Medium'} Priority
                </Badge>
              </div>

              <Separator className="print-hidden" />

              <div className="space-y-4 print-hidden">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Online Presence</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" asChild disabled={!supplier.website}>
                    <a href={supplier.website || '#'} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-3 w-3" /> Website</a>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" asChild disabled={!supplier.socialLinks?.linkedin}>
                    <a href={supplier.socialLinks?.linkedin ? `https://${supplier.socialLinks.linkedin}` : '#'} target="_blank" rel="noopener noreferrer"><Linkedin className="mr-1 h-3 w-3" /> LinkedIn</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs uppercase flex items-center gap-2">
                <Clock className="h-3 w-3" /> Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Authored By:</span>
                <span className="font-bold">{supplier.verifiedBy || 'System Admin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Modified:</span>
                <span className="font-bold">{supplier.lastUpdatedBy || 'System'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sync Date:</span>
                <span className="font-bold">{supplier.lastUpdatedDate ? new Date(supplier.lastUpdatedDate).toLocaleDateString() : 'Real-time'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-12 print-hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="commercial">Commercial</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enterprise Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed">{supplier.overview || 'No company overview available.'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Established</p>
                      <p className="text-sm font-medium">{supplier.yearEstablished || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Workforce</p>
                      <p className="text-sm font-medium">{supplier.employeeCount || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Annual Export</p>
                      <p className="text-sm font-medium">{supplier.annualExportVolume || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Entity Type</p>
                      <p className="text-sm font-medium">{supplier.natureOfBusiness || 'Corporate'}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Markets Served</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(supplier.marketsServed) && supplier.marketsServed.length > 0 ? (
                        supplier.marketsServed.map((m: string) => (
                          <Badge key={m} variant="secondary" className="px-3">{m}</Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No specific markets listed.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <CardTitle className="text-primary text-sm font-bold uppercase tracking-wider">Strategic Intelligence (Confidential)</CardTitle>
                  </div>
                  <Badge className="bg-primary text-[8px]">INTERNAL LEDGER</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm italic text-foreground/80 leading-relaxed">
                    "{supplier.strategicNotes || 'No internal strategic notes recorded for this partner.'}"
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Production Focus</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {Array.isArray(supplier.specializedProducts) && supplier.specializedProducts.length > 0 ? (
                      supplier.specializedProducts.map((p: string) => (
                        <Badge key={p} className="bg-accent">{p}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No specialized products tagged.</span>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Department Alignment</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    {['Chocolate', 'Cosmetics', 'Detergents'].map(cat => (
                      <div key={cat} className="flex items-center gap-2">
                        <div className={cn(
                          "h-3 w-3 rounded-full",
                          supplier.departments?.includes(cat.toLowerCase()) ? "bg-green-500" : "bg-muted"
                        )} />
                        <span className="text-xs">{cat}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Catalog Staples</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Product Specification</TableHead>
                      <TableHead>Unit Type</TableHead>
                      <TableHead>Market Price Guide</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(supplier.topSellingProducts) && supplier.topSellingProducts.length > 0 ? (
                      supplier.topSellingProducts.map((p: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.unit}</TableCell>
                          <TableCell className="text-accent font-bold">{p.avgPrice}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic text-xs">No product catalog entries synchronized.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Factory className="h-4 w-4 text-primary" /> Key Account Manager
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {supplier.contacts?.sales ? (
                      <>
                        <p className="text-sm font-bold">{supplier.contacts.sales.name || 'N/A'}</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {supplier.contacts.sales.email || 'No email registered'}</div>
                          <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {supplier.contacts.sales.phone || 'No phone registered'}</div>
                          <div className="flex items-center gap-2"><MessageSquare className="h-3 w-3" /> WhatsApp Connectivity Ready</div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Primary contact details not finalized.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-accent" /> Logistics & Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {supplier.contacts?.export ? (
                      <>
                        <p className="text-sm font-bold">{supplier.contacts.export.name || 'N/A'}</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {supplier.contacts.export.email || 'No email registered'}</div>
                          <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {supplier.contacts.export.phone || 'No phone registered'}</div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Export department contact not recorded.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="commercial" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="text-center p-4">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Pricing Strategy</div>
                  <Badge className={cn(
                    "w-fit mx-auto px-4 py-1",
                    supplier.pricing?.tier === 'Luxury' && "bg-purple-500",
                    supplier.pricing?.tier === 'Premium' && "bg-blue-500",
                    supplier.pricing?.tier === 'Mid-Range' && "bg-green-500",
                    supplier.pricing?.tier === 'Budget' && "bg-secondary text-foreground"
                  )}>
                    {supplier.pricing?.tier || 'Standard'}
                  </Badge>
                </Card>
                <Card className="text-center p-4">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Minimum Order (MOQ)</div>
                  <p className="text-sm font-bold">{supplier.pricing?.moq || 'Variable'}</p>
                </Card>
                <Card className="text-center p-4">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Entry Value (MOV)</div>
                  <p className="text-sm font-bold">${(supplier.pricing?.mov || 0).toLocaleString()}</p>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Trade & Settlement Terms</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Settlement Logic</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(supplier.pricing?.paymentTerms) && supplier.pricing.paymentTerms.length > 0 ? (
                          supplier.pricing.paymentTerms.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Standard terms apply</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Standard Incoterms</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(supplier.pricing?.incoterms) && supplier.pricing.incoterms.length > 0 ? (
                          supplier.pricing.incoterms.map((t: string) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Ex-Works by default</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Currency</p>
                        <p className="text-sm font-bold">{supplier.pricing?.currency || 'USD'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Est. Lead Time</p>
                        <p className="text-sm font-bold">{supplier.pricing?.leadTime || '7-14' } Days</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Sample Agreement</h4>
                      <p className="text-sm">{supplier.pricing?.samplePolicy || 'Request individually'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'halal', label: 'Halal', icon: ShieldCheck, data: supplier.certifications?.halal },
                  { id: 'organic', label: 'Organic', icon: ShieldCheck, data: supplier.certifications?.organic },
                  { id: 'iso', label: 'ISO Standard', icon: ShieldCheck, data: supplier.certifications?.iso },
                  { id: 'fda', label: 'FDA Approved', icon: ShieldCheck, data: supplier.certifications?.fda }
                ].map((cert) => (
                  <Card key={cert.id} className={cn(
                    "p-4 border-2 transition-all",
                    cert.data?.has ? "border-green-500/20 bg-green-500/5" : "border-muted opacity-50"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-background border">
                        <cert.icon className={cn("h-5 w-5", cert.data?.has ? "text-green-500" : "text-muted-foreground")} />
                      </div>
                      <Badge variant={cert.data?.has ? 'default' : 'secondary'} className={cn(cert.data?.has && "bg-green-500")}>
                        {cert.data?.has ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest">{cert.label}</p>
                      {cert.data?.has && cert.data?.expiry && (
                        <div className="flex items-center gap-1 mt-2">
                          <Calendar className={cn("h-3 w-3", isExpiringSoon(cert.data.expiry) ? "text-destructive" : "text-muted-foreground")} />
                          <span className={cn("text-[10px]", isExpiringSoon(cert.data.expiry) ? "text-destructive font-bold" : "text-muted-foreground")}>
                            Expires: {new Date(cert.data.expiry).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
