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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
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
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline"><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export Audit</Button>
          <Button className="bg-primary"><Send className="h-4 w-4 mr-2" /> Compose Email</Button>
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

              <Separator />

              <div className="space-y-4">
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
            <TabsList className="grid w-full grid-cols-6 h-12">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="emails">Communication</TabsTrigger>
              <TabsTrigger value="ops">Operations</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
              <TabsTrigger value="notes">Notes/Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
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
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Interests & Quality</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground mb-2">Interested Products</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(customer.interests?.products) && customer.interests.products.length > 0 ? (
                          customer.interests.products.map((p: string) => <Badge key={p} className="text-[8px]">{p}</Badge>)
                        ) : (
                          <span className="text-[8px] text-muted-foreground italic">No interests logged</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-[8px] uppercase font-bold text-muted-foreground">Quality Pref</p>
                        <Badge variant="outline" className="mt-1">{customer.interests?.quality || 'Standard'}</Badge>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase font-bold text-muted-foreground">Price Sensitivity</p>
                        <p className="text-[10px] mt-1 font-medium">{customer.buyingBehavior?.priceSensitivity || 'Medium'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <CardTitle className="text-primary text-sm font-bold uppercase tracking-wider">Strategic Notes (Confidential)</CardTitle>
                    </div>
                    <Badge className="bg-primary text-[8px]">INTERNAL</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs italic text-foreground/80 leading-relaxed">
                      "{customer.strategicNotes || 'No strategic notes added yet.'}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="emails" className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search emails..." className="pl-9 h-9" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Templates</Button>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Email</Button>
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
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              {email.attachments?.length > 0 && (
                                <div className="flex items-center gap-1 text-[8px] text-primary">
                                  <Paperclip className="h-3 w-3" /> {email.attachments.length} Attachments
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px]">View Thread</Button>
                          </div>
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

            <TabsContent value="ops" className="space-y-6 pt-4">
              <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-9">
                  <TabsTrigger value="offers" className="text-xs">Offers</TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
                  <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
                </TabsList>
                
                <TabsContent value="orders" className="pt-4">
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.length > 0 ? (
                          purchases.map(p => (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono text-[10px]">{p.id}</TableCell>
                              <TableCell className="text-[10px]">{formatFirebaseTimestamp(p.date)}</TableCell>
                              <TableCell className="text-[10px] font-medium">{p.productName}</TableCell>
                              <TableCell className="text-right text-[10px] font-bold text-accent">${p.totalRevenue.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[8px] capitalize">{p.deliveryStatus}</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic text-xs">No purchase history available.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

                <TabsContent value="invoices" className="pt-4">
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Inv #</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.length > 0 ? (
                          invoices.map(i => (
                            <TableRow key={i.id}>
                              <TableCell className="font-mono text-[10px]">{i.number}</TableCell>
                              <TableCell className="text-[10px]">{formatFirebaseTimestamp(i.dueDate)}</TableCell>
                              <TableCell className="text-right text-[10px] font-bold">${i.total.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge 
                                  className={cn(
                                    "text-[8px] capitalize",
                                    i.status === 'paid' ? "bg-green-500" : i.status === 'overdue' ? "bg-red-500" : "bg-yellow-500"
                                  )}
                                >
                                  {i.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic text-xs">No invoices found.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 pt-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <p className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Lifetime Value</p>
                  <p className="text-xl font-bold text-primary">${(customer.totalRevenue || 0).toLocaleString()}</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-xl font-bold">{purchases.length}</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Reply Rate</p>
                  <p className="text-xl font-bold text-accent">{stats.replyRate}%</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Avg Order</p>
                  <p className="text-xl font-bold text-green-500">${((customer.totalRevenue || 0) / (purchases.length || 1)).toLocaleString()}</p>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Revenue Trend</CardTitle></CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#755EDE" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Category Breakdown</CardTitle></CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={productSplit} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {productSplit.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="docs" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Corporate Documents</h3>
                <Button size="sm"><Upload className="mr-2 h-4 w-4" /> Upload Doc</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {['Signed Agreement.pdf', 'VAT_Certificate.pdf', 'Purchase_Order_Ref442.pdf', 'Credit_Application.pdf'].map(docName => (
                  <Card key={docName} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{docName}</p>
                        <p className="text-[10px] text-muted-foreground">Uploaded May 10, 2024</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Internal Notes</CardTitle>
                    <Button size="sm" variant="outline"><Plus className="h-3 w-3" /></Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="py-8 text-center text-xs text-muted-foreground italic">
                      No internal notes recorded.
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Active Tasks</CardTitle>
                    <Button size="sm" variant="outline"><Plus className="h-3 w-3" /></Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="py-8 text-center text-xs text-muted-foreground italic">
                      No pending tasks for this client.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
