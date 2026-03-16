
"use client";

import React, { useMemo, useEffect, useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt,
  Plus,
  Repeat,
  FileMinus,
  Banknote,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444'];

export default function AccountingDashboard() {
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
    return currentUser.department === 'all' ? colRef : query(colRef, where("department", "==", currentUser.department));
  }, [db, user, currentUser]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "payments");
    return currentUser.department === 'all' ? colRef : query(colRef, where("department", "==", currentUser.department));
  }, [db, user, currentUser]);

  const advancesQuery = useMemoFirebase(() => user ? collection(db, "customer_advances") : null, [db, user]);
  const creditsQuery = useMemoFirebase(() => user ? collection(db, "credit_notes") : null, [db, user]);

  const { data: invoices, isLoading: loadingInvoices } = useCollection(invoicesQuery);
  const { data: payments, isLoading: loadingPayments } = useCollection(paymentsQuery);
  const { data: advances } = useCollection(advancesQuery);
  const { data: credits } = useCollection(creditsQuery);

  const stats = useMemo(() => {
    const safeInvoices = invoices || [];
    const safePayments = payments || [];
    const safeAdvances = advances || [];
    const safeCredits = credits || [];

    const totalRevenue = safeInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.total || 0), 0);
    const outstandingAR = safeInvoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((acc, i) => acc + (i.total || 0), 0);
    const overdueAR = safeInvoices.filter(i => i.status === 'overdue').reduce((acc, i) => acc + (i.total || 0), 0);
    
    const cashIn = safePayments.filter(p => p.type === 'received').reduce((acc, p) => acc + (p.amount || 0), 0);
    const cashOut = safePayments.filter(p => p.type === 'made').reduce((acc, p) => acc + (p.amount || 0), 0);
    
    const totalAdvances = safeAdvances.reduce((acc, a) => acc + a.remainingAmount, 0);
    const totalCredits = safeCredits.reduce((acc, c) => acc + c.remainingAmount, 0);

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

  if (loadingInvoices || loadingPayments) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Financial Hub</h1>
          <p className="text-muted-foreground">General ledger overview and advanced B2B accounting controls.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/accounting/recurring"><Button variant="outline" size="sm"><Repeat className="mr-2 h-4 w-4" /> Recurring</Button></Link>
          <Link href="/accounting/credits"><Button variant="outline" size="sm"><FileMinus className="mr-2 h-4 w-4" /> Credits</Button></Link>
          <Link href="/accounting/advances"><Button variant="outline" size="sm"><Banknote className="mr-2 h-4 w-4" /> Advances</Button></Link>
          <Link href="/accounting/invoices"><Button className="bg-primary" size="sm"><Plus className="mr-2 h-4 w-4" /> New Invoice</Button></Link>
        </div>
      </div>

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
              <BarChart data={[{ month: 'Jun', standard: stats.revenue, recurring: 15000 }]}>
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
    </div>
  );
}
