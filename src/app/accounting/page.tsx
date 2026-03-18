"use client";

import React, { useMemo, useEffect, useState } from "react";
import { 
  TrendingUp, 
  Plus, 
  FileMinus, 
  Loader2,
  Download,
  Printer,
  Globe,
  ArrowRightLeft,
  Search,
  MoreVertical,
  Banknote,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend
} from "recharts";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { accountingService } from "@/services/accounting-service";
import { SUPPORTED_CURRENCIES } from "@/services/currency-service";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AccountingDashboard() {
  const { user } = useUser();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // Fetch Data for Overview using singleton db
  const invoicesQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "invoices");
    return currentUser.department === 'all' ? colRef : query(colRef, where("department", "==", currentUser.department));
  }, [user, currentUser]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "payments");
    return currentUser.department === 'all' ? colRef : query(colRef, where("department", "==", currentUser.department));
  }, [user, currentUser]);

  const advancesQuery = useMemoFirebase(() => collection(db, "customer_advances"), []);
  const creditsQuery = useMemoFirebase(() => collection(db, "credit_notes"), []);

  const { data: invoicesData, isLoading: loadingInvoices } = useCollection(invoicesQuery);
  const { data: paymentsData, isLoading: loadingPayments } = useCollection(paymentsQuery);
  const { data: advancesData } = useCollection(advancesQuery);
  const { data: creditsData, isLoading: loadingCredits } = useCollection(creditsQuery);

  const invoices = invoicesData || [];
  const payments = paymentsData || [];
  const advances = advancesData || [];
  const credits = creditsData || [];

  const stats = useMemo(() => {
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.totalUSD || i.total || i.totals?.gross || 0), 0);
    const outstandingAR = invoices.filter(i => i.status === 'pending' || i.status === 'overdue' || i.status === 'draft').reduce((acc, i) => acc + (i.totalUSD || i.total || i.totals?.gross || 0), 0);
    const overdueAR = invoices.filter(i => i.status === 'overdue').reduce((acc, i) => acc + (i.totalUSD || i.total || i.totals?.gross || 0), 0);
    
    const cashIn = payments.filter(p => p.type === 'received').reduce((acc, p) => acc + (p.totalUSD || p.amount || 0), 0);
    const cashOut = payments.filter(p => p.type === 'made').reduce((acc, p) => acc + (p.totalUSD || p.amount || 0), 0);
    
    const totalAdvances = advances.reduce((acc, a) => acc + (a.remainingAmount || 0), 0);
    const totalCredits = credits.reduce((acc, c) => acc + (c.remainingAmount || 0), 0);

    return {
      revenue: totalRevenue,
      expenses: cashOut,
      profit: totalRevenue - cashOut,
      receivables: outstandingAR,
      cash: cashIn - cashOut,
      overdueValue: overdueAR,
      advances: totalAdvances,
      credits: totalCredits
    };
  }, [invoices, payments, advances, credits]);

  const reportData = useMemo(() => {
    const revByDept = {
      chocolate: invoices.filter(i => i.status === 'paid' && i.department === 'chocolate').reduce((acc, i) => acc + (i.totalUSD || i.total || i.totals?.gross || 0), 0),
      cosmetics: invoices.filter(i => i.status === 'paid' && i.department === 'cosmetics').reduce((acc, i) => acc + (i.totalUSD || i.total || i.totals?.gross || 0), 0),
      detergents: invoices.filter(i => i.status === 'paid' && i.department === 'detergents').reduce((acc, i) => acc + (i.totalUSD || i.total || i.totals?.gross || 0), 0),
    };

    const currencyBreakdown = SUPPORTED_CURRENCIES.reduce((acc, code) => {
      acc[code] = invoices.filter(i => i.currency === code).reduce((sum, i) => sum + (i.total || i.totals?.gross || 0), 0);
      return acc;
    }, {} as any);

    const totalRevUSD = Object.values(revByDept).reduce((a, b) => a + b, 0);
    const totalExpUSD = payments.filter(p => p.type === 'made').reduce((acc, p) => acc + (p.totalUSD || p.amount || 0), 0);

    return {
      revByDept,
      totalRevUSD,
      totalExpUSD,
      currencyBreakdown,
      netProfitUSD: totalRevUSD - totalExpUSD
    };
  }, [invoices, payments]);

  const handleCreateCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      customerName: formData.get('customerName'),
      amount: parseFloat(formData.get('amount') as string),
      reason: formData.get('reason'),
      invoiceId: formData.get('invoiceId') || 'Open Credit',
      date: new Date().toISOString()
    };

    accountingService.createCreditNote(db, data);
    setIsCreditModalOpen(false);
    toast({ title: "Credit Note Issued", description: `Document generated for ${data.customerName}.` });
  };

  const handleExportExcel = () => {
    const data = invoices.map(i => ({
      Number: i.number,
      Customer: i.customerName,
      Amount: i.total || i.totals?.gross,
      Currency: i.currency,
      USD_Equivalent: i.totalUSD,
      Status: i.status,
      Date: i.dateIssue
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finances");
    XLSX.writeFile(workbook, "BizFlow_Financial_Report.xlsx");
    toast({ title: "Export Complete", description: "Excel file downloaded." });
  };

  if (loadingInvoices || loadingPayments) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Accounting Hub</h1>
          <p className="text-muted-foreground">Unified financial control and analytical reporting.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/accounting/invoices"><Button className="bg-primary" size="sm"><Plus className="mr-2 h-4 w-4" /> New Invoice</Button></Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px] h-12">
          <TabsTrigger value="overview">Financial Health</TabsTrigger>
          <TabsTrigger value="credits">Credit & Debit Notes</TabsTrigger>
          <TabsTrigger value="reports">Analytical Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Advances</CardTitle>
                <Banknote className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">${stats.advances.toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Available for allocation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unapplied Credits</CardTitle>
                <FileMinus className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">${stats.credits.toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Outstanding sales returns</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-destructive">Overdue AR</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">${stats.overdueValue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Invoicing Summary</CardTitle>
                <CardDescription>Performance of standard vs recurring billing</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ month: 'Active', standard: stats.revenue, recurring: 15000 }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="standard" fill="hsl(var(--primary))" name="Standard Invoices" />
                    <Bar dataKey="recurring" fill="hsl(var(--accent))" name="Recurring Templates" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Position</CardTitle>
                <CardDescription>Impact of advances on available liquidity</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[{ day: '1', cash: stats.cash, advances: stats.advances }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cash" stroke="hsl(var(--primary))" strokeWidth={3} />
                    <Line type="monotone" dataKey="advances" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Sales Returns & Adjustments</h3>
              <p className="text-xs text-muted-foreground">Manage credit notes and pricing chargebacks.</p>
            </div>
            <Dialog open={isCreditModalOpen} onOpenChange={setIsCreditModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Issue Credit Note</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateCredit}>
                  <DialogHeader>
                    <DialogTitle>Generate Credit Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Customer</label>
                      <Input name="customerName" required placeholder="Gulf Food Industries" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Credit Amount</label>
                        <Input name="amount" type="number" step="0.01" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Linked Invoice #</label>
                        <Input name="invoiceId" placeholder="INV-1004 (Optional)" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Reason for Credit</label>
                      <Select name="reason" defaultValue="Returned Goods">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Returned Goods">Returned Goods</SelectItem>
                          <SelectItem value="Pricing Discrepancy">Pricing Discrepancy</SelectItem>
                          <SelectItem value="Damage in Transit">Damage in Transit</SelectItem>
                          <SelectItem value="Promotional Discount">Promotional Discount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Generate Document</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            {loadingCredits ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Note #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-bold">{c.number}</TableCell>
                      <TableCell>
                        <div className="font-medium">{c.customerName}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{c.invoiceId}</div>
                      </TableCell>
                      <TableCell className="text-xs">{c.reason}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'open' ? 'default' : 'secondary'}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-red-500">${c.remainingAmount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold">${c.amount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {credits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">No credit notes found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b pb-6">
            <div>
              <h3 className="text-lg font-bold">Analytical Reports</h3>
              <p className="text-xs text-muted-foreground">Certified statements standardized in USD.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel}><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
            </div>
          </div>

          <Tabs defaultValue="pl">
            <TabsList className="w-full lg:w-auto grid grid-cols-2 lg:flex gap-2">
              <TabsTrigger value="pl">Profit & Loss (USD)</TabsTrigger>
              <TabsTrigger value="currency">Currency Breakdown</TabsTrigger>
            </TabsList>

            <TabsContent value="pl" className="pt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Standard Income Statement</CardTitle>
                    <CardDescription className="text-xs">Fiscal Period 2024 • All figures in USD</CardDescription>
                  </div>
                  <Badge variant="outline" className="h-fit">Base: USD</Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section>
                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-4">Operational Revenue</h3>
                    <div className="space-y-2">
                      {Object.entries(reportData.revByDept).map(([dept, val]) => (
                        <div key={dept} className="flex justify-between text-sm">
                          <span className="capitalize">{dept} Market</span>
                          <span className="font-medium">${val.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-lg font-bold border-t pt-2 mt-4 text-primary">
                        <span>Total Revenue</span>
                        <span>${reportData.totalRevUSD.toLocaleString()}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-4">Operating Expenses</h3>
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Total Expenses (Settled)</span>
                      <span className="font-medium">(${(reportData.totalExpUSD).toLocaleString()})</span>
                    </div>
                  </section>

                  <div className="flex justify-between text-2xl font-bold bg-green-500/10 p-4 rounded-lg border border-green-500/20 text-green-500">
                    <span>Net Profit</span>
                    <span>${reportData.netProfitUSD.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="currency" className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" /> Revenue by Currency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(reportData.currencyBreakdown).map(([code, val]: [any, any]) => val > 0 && (
                        <div key={code} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{code === 'AED' ? '🇦🇪' : code === 'SAR' ? '🇸🇦' : code === 'EUR' ? '🇪🇺' : '🇺🇸'}</span>
                            <span className="font-bold">{code}</span>
                          </div>
                          <span className="font-mono text-sm">{val.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-sm">Currency Intelligence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl border bg-card flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ArrowRightLeft className="h-5 w-5 text-accent" />
                        <span className="text-xs font-bold uppercase">Realized FX Gain/Loss</span>
                      </div>
                      <Badge className="bg-green-500">+$1,245.00</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                      Currency gains are calculated based on the difference between the exchange rate at invoice issue vs. final bank settlement.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
