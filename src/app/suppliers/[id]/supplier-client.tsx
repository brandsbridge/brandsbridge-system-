"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Mail, Phone, Globe, Calendar, Clock, 
  TrendingUp, AlertTriangle, ShieldCheck, 
  Download, Share2, MessageSquare, 
  Star, MapPin, DollarSign, ExternalLink,
  Linkedin, Instagram, Facebook, MessageCircle,
  Building2, Users as UsersIcon, Factory,
  ShieldAlert, Lock, CheckCircle2, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_SUPPLIERS, Supplier } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SupplierClientProps {
  id: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
    ))}
  </div>
);

export default function SupplierClient({ id }: SupplierClientProps) {
  const router = useRouter();
  const supplier = useMemo(() => MOCK_SUPPLIERS.find(s => s.id === id), [id]);
  
  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Supplier Not Found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{supplier.flag}</span>
              <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
              <Badge 
                variant={supplier.recordStatus.includes('Verified') ? 'default' : 'secondary'}
                className={cn(
                  supplier.recordStatus.includes('Verified') && "bg-green-500",
                  supplier.recordStatus === 'Blacklisted' && "bg-destructive",
                  supplier.recordStatus === 'Under Review' && "bg-orange-500"
                )}
              >
                {supplier.recordStatus}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3" /> {supplier.country} • {supplier.natureOfBusiness} • Est. {supplier.yearEstablished}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline"><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export PDF</Button>
          <Button className="bg-primary"><Mail className="h-4 w-4 mr-2" /> Contact Supplier</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Column: Core Info & Status */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3 pb-4">
                <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary border-2 border-primary/20">
                  {supplier.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <StarRating rating={supplier.internalRating} />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Internal Rating</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Data Completeness</span>
                  <span className={cn("font-bold", supplier.dataCompleteness > 80 ? "text-green-500" : supplier.dataCompleteness > 50 ? "text-yellow-500" : "text-destructive")}>
                    {supplier.dataCompleteness}%
                  </span>
                </div>
                <Progress value={supplier.dataCompleteness} className="h-1.5" />
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Priority Level</h4>
                <Badge variant="outline" className={cn(
                  "w-full justify-center py-1",
                  supplier.priorityLevel === 'High' && "border-destructive text-destructive bg-destructive/5",
                  supplier.priorityLevel === 'Medium' && "border-orange-500 text-orange-500 bg-orange-500/5"
                )}>
                  {supplier.priorityLevel} Priority
                </Badge>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Digital Presence</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" asChild>
                    <a href={supplier.website} target="_blank"><ExternalLink className="mr-1 h-3 w-3" /> Website</a>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" asChild>
                    <a href={`https://${supplier.socialLinks.linkedin}`} target="_blank"><Linkedin className="mr-1 h-3 w-3" /> LinkedIn</a>
                  </Button>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-pink-500"><Instagram className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600"><Facebook className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500"><MessageCircle className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs uppercase flex items-center gap-2">
                <Clock className="h-3 w-3" /> Record Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified By:</span>
                <span className="font-bold">{supplier.verifiedBy || 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-bold">{supplier.lastUpdatedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-bold">{new Date(supplier.lastUpdatedDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-12">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="commercial">Commercial</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed">{supplier.overview}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Established</p>
                      <p className="text-sm font-medium">{supplier.yearEstablished}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Employees</p>
                      <p className="text-sm font-medium">{supplier.employeeCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Export Vol.</p>
                      <p className="text-sm font-medium">{supplier.annualExportVolume}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Nature</p>
                      <p className="text-sm font-medium">{supplier.natureOfBusiness}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Markets Served</h4>
                    <div className="flex flex-wrap gap-2">
                      {supplier.marketsServed.map(m => (
                        <Badge key={m} variant="secondary" className="px-3">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strategic Notes - Confidential */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <CardTitle className="text-primary text-sm font-bold uppercase tracking-wider">Strategic Notes (Confidential)</CardTitle>
                  </div>
                  <Badge className="bg-primary text-[8px]">INTERNAL USE ONLY</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm italic text-foreground/80 leading-relaxed">
                    "{supplier.strategicNotes}"
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Specialization Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {supplier.specializedProducts.map(p => (
                      <Badge key={p} className="bg-accent">{p}</Badge>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Main Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    {['Chocolate', 'Cosmetics', 'Detergents'].map(cat => (
                      <div key={cat} className="flex items-center gap-2">
                        <div className={cn(
                          "h-3 w-3 rounded-full",
                          supplier.departments.includes(cat.toLowerCase()) ? "bg-green-500" : "bg-muted"
                        )} />
                        <span className="text-xs">{cat}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Best-Selling Products</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Avg. Price Range</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplier.topSellingProducts.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.unit}</TableCell>
                        <TableCell className="text-accent font-bold">{p.avgPrice}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-primary" /> Sales Manager
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm font-bold">{supplier.contacts.sales.name}</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {supplier.contacts.sales.email}</div>
                      <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {supplier.contacts.sales.phone}</div>
                      <div className="flex items-center gap-2"><MessageCircle className="h-3 w-3" /> {supplier.contacts.sales.whatsapp}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-accent" /> Export Manager
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm font-bold">{supplier.contacts.export.name}</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {supplier.contacts.export.email}</div>
                      <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {supplier.contacts.export.phone}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-secondary/10">
                <CardHeader>
                  <CardTitle className="text-sm">Customer Service & Support</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Support Phone:</span>
                      <span className="font-bold">{supplier.contacts.support.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Support Email:</span>
                      <span className="font-bold">{supplier.contacts.support.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Working Hours:</span>
                      <span className="font-bold">{supplier.contacts.support.hours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Lang:</span>
                      <span className="font-bold">{supplier.contacts.support.language}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commercial" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="text-center p-4">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Price Tier</div>
                  <Badge className={cn(
                    "w-fit mx-auto px-4 py-1",
                    supplier.pricing.tier === 'Luxury' && "bg-purple-500",
                    supplier.pricing.tier === 'Premium' && "bg-blue-500",
                    supplier.pricing.tier === 'Mid-Range' && "bg-green-500",
                    supplier.pricing.tier === 'Budget' && "bg-secondary text-foreground"
                  )}>
                    {supplier.pricing.tier}
                  </Badge>
                </Card>
                <Card className="text-center p-4">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Min. Order (MOQ)</div>
                  <p className="text-sm font-bold">{supplier.pricing.moq}</p>
                </Card>
                <Card className="text-center p-4">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Min. Value (MOV)</div>
                  <p className="text-sm font-bold">${supplier.pricing.mov.toLocaleString()}</p>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Trading Terms</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Payment Terms</h4>
                      <div className="flex flex-wrap gap-2">
                        {supplier.pricing.paymentTerms.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Incoterms</h4>
                      <div className="flex flex-wrap gap-2">
                        {supplier.pricing.incoterms.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Currency</p>
                        <p className="text-sm font-bold">{supplier.pricing.currency}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Lead Time</p>
                        <p className="text-sm font-bold">{supplier.pricing.leadTime} Days</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Sample Policy</h4>
                      <p className="text-sm">{supplier.pricing.samplePolicy}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'halal', label: 'Halal', icon: CheckCircle2, data: supplier.certifications.halal },
                  { id: 'organic', label: 'Organic', icon: CheckCircle2, data: supplier.certifications.organic },
                  { id: 'iso', label: 'ISO', icon: ShieldCheck, data: supplier.certifications.iso },
                  { id: 'fda', label: 'FDA Approved', icon: ShieldCheck, data: { has: supplier.certifications.fda.has } }
                ].map((cert) => (
                  <Card key={cert.id} className={cn(
                    "p-4 border-2 transition-all",
                    cert.data.has ? "border-green-500/20 bg-green-500/5" : "border-muted opacity-50"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-background border">
                        <cert.icon className={cn("h-5 w-5", cert.data.has ? "text-green-500" : "text-muted-foreground")} />
                      </div>
                      <Badge variant={cert.data.has ? 'default' : 'secondary'} className={cn(cert.data.has && "bg-green-500")}>
                        {cert.data.has ? 'Valid' : 'None'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest">{cert.label}</p>
                      {cert.data.has && cert.data.expiry && (
                        <div className="flex items-center gap-1 mt-2">
                          <Calendar className={cn("h-3 w-3", isExpiringSoon(cert.data.expiry) ? "text-destructive" : "text-muted-foreground")} />
                          <span className={cn("text-[10px]", isExpiringSoon(cert.data.expiry) ? "text-destructive font-bold" : "text-muted-foreground")}>
                            Exp: {new Date(cert.data.expiry).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {cert.data.has && isExpiringSoon(cert.data.expiry) && (
                        <div className="mt-2 flex items-center gap-1 text-[8px] font-bold text-destructive animate-pulse">
                          <ShieldAlert className="h-3 w-3" /> ACTION REQUIRED
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Compliance Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(supplier.certifications).map(([key, cert]: [string, any]) => cert.has && (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                        <div className="flex items-center gap-3">
                          <Download className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium capitalize">{key} Certificate.pdf</span>
                        </div>
                        <Button size="sm" variant="ghost">View</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
