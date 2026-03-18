'use client';

import React, { useMemo } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Briefcase, 
  Plus, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowRight,
  Loader2,
  Package,
  Receipt,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useMemoFirebase, useUser, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // Fetch collections for real-time reporting
  const invoicesQuery = useMemoFirebase(() => db ? collection(db, "invoices") : null, [db]);
  const recentInvoicesQuery = useMemoFirebase(() => db ? query(collection(db, "invoices"), orderBy("createdAt", "desc"), limit(5)) : null, [db]);
  const customersQuery = useMemoFirebase(() => db ? collection(db, "customers") : null, [db]);
  const employeesQuery = useMemoFirebase(() => db ? collection(db, "employees") : null, [db]);
  const stocksQuery = useMemoFirebase(() => db ? collection(db, "stocks") : null, [db]);

  const { data: invoices, isLoading: loadingInvoices } = useCollection(invoicesQuery);
  const { data: recentInvoices, isLoading: loadingRecent } = useCollection(recentInvoicesQuery);
  const { data: customers, isLoading: loadingCustomers } = useCollection(customersQuery);
  const { data: employees, isLoading: loadingEmployees } = useCollection(employeesQuery);
  const { data: stocks } = useCollection(stocksQuery);

  // KPI Calculations
  const stats = useMemo(() => {
    const safeInvoices = invoices || [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = safeInvoices
      .filter(inv => {
        const date = inv.createdAt ? new Date(inv.createdAt) : new Date();
        return inv.status === 'paid' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + (inv.totalUSD || inv.totals?.gross || 0), 0);

    const pendingInvoices = safeInvoices.filter(inv => inv.status === 'pending' || inv.status === 'draft');
    const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + (inv.totalUSD || inv.totals?.gross || 0), 0);
    
    const overdueCount = safeInvoices.filter(inv => inv.status === 'overdue').length;
    const lowStockCount = stocks?.filter(s => s.quantity < 10).length || 0;

    return {
      revenue: monthlyRevenue,
      customers: customers?.length || 0,
      pendingCount: pendingInvoices.length,
      pendingTotal,
      employees: employees?.length || 0,
      overdueCount,
      lowStockCount
    };
  }, [invoices, customers, employees, stocks]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Paid</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">Pending</Badge>;
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isUserLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Business Overview</h1>
        <p className="text-muted-foreground">Real-time performance metrics and operational synchronization.</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-[10px] text-green-500 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="h-3 w-3" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Global B2B network</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Collection</CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingTotal.toLocaleString()}</div>
            <p className="text-[10px] text-accent mt-1 font-medium">{stats.pendingCount} invoices awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team Size</CardTitle>
            <Briefcase className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employees}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Across all departments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity Section */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <CardDescription>Last 5 invoices issued or paid.</CardDescription>
            </div>
            <Link href="/accounting/invoices">
              <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="ml-2 h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold">Invoice #</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Customer</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Amount</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRecent ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : recentInvoices?.map((inv) => (
                  <TableRow key={inv.id} className="group">
                    <TableCell className="font-mono text-xs font-bold">{inv.number}</TableCell>
                    <TableCell className="text-xs">{inv.customerName}</TableCell>
                    <TableCell className="text-xs font-bold">${(inv.totalUSD || inv.totals?.gross || 0).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-right text-[10px] text-muted-foreground">
                      {formatFirebaseTimestamp(inv.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!recentInvoices || recentInvoices.length === 0) && !loadingRecent && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic text-xs">
                      No recent invoice activity found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Quick Actions Section */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center hover:bg-primary/5 hover:border-primary/50 transition-all group" asChild>
                <Link href="/accounting/invoices">
                  <Plus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">New Invoice</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center hover:bg-accent/5 hover:border-accent/50 transition-all group" asChild>
                <Link href="/customers">
                  <Users className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Add Customer</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center hover:bg-orange-500/5 hover:border-orange-500/50 transition-all group" asChild>
                <Link href="/accounting/expenses">
                  <Receipt className="h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Add Expense</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center hover:bg-green-500/5 hover:border-green-500/50 transition-all group" asChild>
                <Link href="/accounting/reports">
                  <BarChart3 className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">View Reports</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Alerts / Notifications Section */}
          <Card className="border-border/50 bg-secondary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Operational Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.overdueCount > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-destructive">{stats.overdueCount} Overdue Invoices</p>
                    <p className="text-[10px] text-muted-foreground">Immediate follow-up required for cash flow stability.</p>
                  </div>
                </div>
              )}
              {stats.lowStockCount > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <Package className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-orange-500">{stats.lowStockCount} Low Stock Items</p>
                    <p className="text-[10px] text-muted-foreground">Inventory levels below threshold in active warehouses.</p>
                  </div>
                </div>
              )}
              {stats.overdueCount === 0 && stats.lowStockCount === 0 && (
                <div className="py-8 text-center space-y-2 opacity-50">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">No urgent alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
