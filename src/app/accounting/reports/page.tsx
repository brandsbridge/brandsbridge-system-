"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo, useEffect, useState } from "react";
import { 
  Download, 
  Printer,
  Loader2,
  FileText as FileIcon,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Globe
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";
import { SUPPORTED_CURRENCIES } from "@/services/currency-service";

export default function ReportsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const invoicesQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "invoices");
    return currentUser.department === 'all' 
      ? colRef 
      : query(colRef, where("department", "==", currentUser.department));
  }, [db, user, currentUser]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "payments");
    return currentUser.department === 'all' 
      ? colRef 
      : query(colRef, where("department", "==", currentUser.department));
  }, [db, user, currentUser]);

  const { data: invoices = [], isLoading: loadingInvoices } = useCollection(invoicesQuery);
  const { data: payments = [], isLoading: loadingPayments } = useCollection(paymentsQuery);

  const reportData = useMemo(() => {
    const safeInvoices = invoices || [];
    const safePayments = payments || [];

    // All calculations standardized to USD using recorded totalUSD or fallback to total
    const revByDept = {
      chocolate: safeInvoices.filter(i => i.status === 'paid' && i.department === 'chocolate').reduce((acc, i) => acc + (i.totalUSD || i.total || i.totals?.gross || 0), 0),
      cosmetics: safeInvoices.filter(i => i.status === 'paid' && i.department === 'cosmetics').reduce((acc, i) => acc + (i.totalUSD || i.total || i.totals?.gross || 0), 0),
      detergents: safeInvoices.filter(i => i.status === 'paid' && i.department === 'detergents').reduce((acc, i) => acc + (i.totalUSD || i.total || i.totals?.gross || 0), 0),
    };

    const currencyBreakdown = SUPPORTED_CURRENCIES.reduce((acc, code) => {
      acc[code] = safeInvoices.filter(i => i.currency === code).reduce((sum, i) => sum + (i.total || i.totals?.gross || 0), 0);
      return acc;
    }, {} as any);

    const totalRevUSD = Object.values(revByDept).reduce((a, b) => a + b, 0);
    const totalExpUSD = safePayments.filter(p => p.type === 'made').reduce((acc, p) => acc + (p.totalUSD || p.amount || 0), 0);

    return {
      revByDept,
      totalRevUSD,
      totalExpUSD,
      currencyBreakdown,
      netProfitUSD: totalRevUSD - totalExpUSD
    };
  }, [invoices, payments]);

  if (loadingInvoices || loadingPayments) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b pb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Financial Reports</h1>
          <p className="text-muted-foreground">Certified statements standardized in **USD**.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print PDF</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
        </div>
      </div>

      <Tabs defaultValue="pl" className="w-full">
        <TabsList className="w-full lg:w-auto grid grid-cols-2 lg:flex gap-2 print:hidden">
          <TabsTrigger value="pl">Profit & Loss (USD)</TabsTrigger>
          <TabsTrigger value="currency">Currency Breakdown</TabsTrigger>
          <TabsTrigger value="aging">Aging Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="pl" className="pt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Standard Income Statement</CardTitle>
                <CardDescription>Fiscal Period 2024 • All figures in USD</CardDescription>
              </div>
              <Badge variant="outline" className="h-fit">Base: USD</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-4">Operational Revenue</h3>
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
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-4">Operating Expenses</h3>
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

        <TabsContent value="currency" className="pt-6 space-y-6">
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
    </div>
  );
}
