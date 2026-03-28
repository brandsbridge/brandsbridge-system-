"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  FileText, 
  Plus, 
  ArrowUpRight, 
  ArrowRight,
  Receipt,
  CreditCard,
  Calculator
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function FinanceDashboard() {
  const invoicesQuery = useMemoFirebase(() => collection(db, "invoices"), []);
  const expensesQuery = useMemoFirebase(() => collection(db, "expenses"), []);
  const paymentsQuery = useMemoFirebase(() => collection(db, "payments"), []);

  const { data: invoicesData } = useCollection(invoicesQuery);
  const { data: expensesData } = useCollection(expensesQuery);
  const { data: paymentsData } = useCollection(paymentsQuery);

  const invoices = invoicesData || [];
  const expenses = expensesData || [];
  const payments = paymentsData || [];

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = invoices
      .filter(inv => {
        const date = inv.createdAt ? new Date(inv.createdAt) : new Date();
        return inv.status === 'paid' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + (inv.totalUSD || inv.totals?.gross || 0), 0);

    const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'draft');
    const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + (inv.totalUSD || inv.totals?.gross || 0), 0);
    
    // Calculate total expenses and payments
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalPayments = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);

    return {
      revenue: monthlyRevenue,
      pendingCount: pendingInvoices.length,
      pendingTotal,
      totalExpenses,
      totalPayments
    };
  }, [invoices, expenses, payments]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Finance Hub</h1>
        <p className="text-muted-foreground">Centralized financial oversight and accounting management.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-[10px] text-green-500 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="h-3 w-3" /> Based on paid invoices
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Receivables</CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingTotal.toLocaleString()}</div>
            <p className="text-[10px] text-accent mt-1 font-medium">{stats.pendingCount} invoices awaiting payment</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalExpenses.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Recorded company expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Payments Made</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalPayments.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Outgoing capital</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Financial Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center hover:bg-primary/5 hover:border-primary/50 transition-all group" asChild>
              <Link href="/accounting/invoices">
                <Plus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-tight">New Invoice</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center hover:bg-orange-500/5 hover:border-orange-500/50 transition-all group" asChild>
              <Link href="/accounting/expenses">
                <Receipt className="h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Add Expense</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center hover:bg-accent/5 hover:border-accent/50 transition-all group" asChild>
              <Link href="/accounting/payments">
                <CreditCard className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Record Payment</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center hover:bg-green-500/5 hover:border-green-500/50 transition-all group" asChild>
              <Link href="/performance">
                <Calculator className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Financial Reports</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
