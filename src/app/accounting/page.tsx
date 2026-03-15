
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
  Clock,
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

  // Memoize Collections with Department Isolation
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

  const { data: invoices, isLoading: loadingInvoices } = useCollection(invoicesQuery);
  const { data: payments, isLoading: loadingPayments } = useCollection(paymentsQuery);

  const stats = useMemo(() => {
    const safeInvoices = invoices || [];
    const safePayments = payments || [];

    const totalRevenue = safeInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.total || 0), 0);
    const outstandingAR = safeInvoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((acc, i) => acc + (i.total || 0), 0);
    const overdueAR = safeInvoices.filter(i => i.status === 'overdue').reduce((acc, i) => acc + (i.total || 0), 0);
    
    const cashIn = safePayments.filter(p => p.type === 'received').reduce((acc, p) => acc + (p.amount || 0), 0);
    const cashOut = safePayments.filter(p => p.type === 'made').reduce((acc, p) => acc + (p.amount || 0), 0);
    
    const profit = totalRevenue - cashOut;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      expenses: cashOut,
      profit,
      margin,
      receivables: outstandingAR,
      cash: cashIn - cashOut,
      overdueCount: safeInvoices.filter(i => i.status === 'overdue').length,
      overdueValue: overdueAR
    };
  }, [invoices, payments]);

  const chartData = [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, expenses: 31000 },
    { month: 'Apr', revenue: 61000, expenses: 42000 },
    { month: 'May', revenue: 59000, expenses: 38000 },
    { month: 'Jun', revenue: stats.revenue || 0, expenses: stats.expenses || 0 },
  ];

  if (loadingInvoices || loadingPayments) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Financial Hub</h1>
          <p className="text-muted-foreground">General ledger overview and real-time cash flow monitoring.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/accounting/invoices">
            <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button>
          </Link>
          <Link href="/accounting/payments">
            <Button variant="outline"><Receipt className="mr-2 h-4 w-4" /> Record Payment</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (MTD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-[10px] text-green-500 flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3" /> Real-time Firestore sync
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.profit.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Margin: {stats.margin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
            <Wallet className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.cash.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Net Cash Impact active</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">AR Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${stats.overdueValue.toLocaleString()}</div>
            <p className="text-[10px] text-destructive/70 mt-1">{stats.overdueCount} Invoices past due</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Consolidated performance trend (USD)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Trend</CardTitle>
            <CardDescription>Net cash movement over last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(payments || []).slice(0, 5).map(pay => (
                <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      pay.type === 'received' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {pay.type === 'received' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{pay.partyName}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{pay.method} • {pay.department} Market</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-bold", pay.type === 'received' ? "text-green-500" : "text-red-500")}>
                      {pay.type === 'received' ? '+' : '-'}${pay.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatFirebaseTimestamp(pay.date)}</p>
                  </div>
                </div>
              ))}
              {(!payments || payments.length === 0) && <div className="text-center py-8 text-muted-foreground italic text-sm">No recent transactions.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
