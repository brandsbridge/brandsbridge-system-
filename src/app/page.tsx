"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Users, 
  Factory, 
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Loader2,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
  Globe,
  FileText,
  Zap,
  Terminal
} from "lucide-react";
import { 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { Employee } from "@/lib/mock-data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function OverviewPage() {
  const router = useRouter();
  const { user } = useUser();
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const db = useFirestore();

  useEffect(() => {
    const savedUser = localStorage.getItem("demoUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    // Redirect logic moved to DashboardLayout to avoid loops
  }, []);

  const invoicesCol = useMemoFirebase(() => user ? collection(db, "invoices") : null, [db, user]);
  const customersCol = useMemoFirebase(() => user ? collection(db, "customers") : null, [db, user]);
  
  const { data: invoices = [], isLoading: loadingInvoices } = useCollection(invoicesCol);
  const { data: customers = [] } = useCollection(customersCol);

  const stats = useMemo(() => {
    const safeInvoices = invoices || [];
    const revenueUSD = safeInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.totalUSD || i.total || i.totals?.gross || 0), 0);
    
    const breakdown = {
      AED: safeInvoices.filter(i => i.currency === 'AED').reduce((acc, i) => acc + (i.total || i.totals?.gross || 0), 0),
      SAR: safeInvoices.filter(i => i.currency === 'SAR').reduce((acc, i) => acc + (i.total || i.totals?.gross || 0), 0),
      USD: safeInvoices.filter(i => !i.currency || i.currency === 'USD').reduce((acc, i) => acc + (i.total || i.totals?.gross || 0), 0)
    };

    return {
      revenueUSD,
      customersCount: customers?.length || 0,
      breakdown
    };
  }, [invoices, customers]);

  if (!currentUser) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
          <p className="text-muted-foreground">Standardized Reporting in **USD**.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/system/currency">
            <Button variant="outline" size="sm"><Globe className="mr-2 h-4 w-4" /> Currency Control</Button>
          </Link>
          <Button className="bg-primary shadow-lg shadow-primary/20" size="sm">
            <Zap className="mr-2 h-4 w-4" /> AI Strategy
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Revenue (Paid USD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenueUSD.toLocaleString()}</div>
            <div className="mt-2 flex gap-3 text-[9px] font-bold text-muted-foreground uppercase border-t pt-2">
              <span>🇦🇪 {stats.breakdown.AED.toLocaleString()}</span>
              <span>🇸🇦 {stats.breakdown.SAR.toLocaleString()}</span>
              <span>🇺🇸 {stats.breakdown.USD.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">System Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Active Invoices</CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Global Activity Feed</CardTitle>
            <CardDescription>Recent multi-currency transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.slice(0, 5).map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-bold">{inv.number}</TableCell>
                    <TableCell className="text-xs">{inv.customerName}</TableCell>
                    <TableCell className="text-right font-bold text-accent">
                      {inv.currency || 'USD'} {(inv.total || inv.totals?.gross || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {(!invoices || invoices.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">No recent transactions found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10 border-dashed border-2 flex flex-col items-center justify-center text-center p-8">
          <Terminal className="h-12 w-12 text-primary/20 mb-4" />
          <h3 className="font-bold">Automation Node</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs">
            Live webhooks are currently active. All Firestore changes are being streamed to your external automation pipelines in real-time.
          </p>
          <Link href="/automation">
            <Button variant="outline" size="sm" className="mt-6">Manage Workflows</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
