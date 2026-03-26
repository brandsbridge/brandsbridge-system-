
"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo } from "react";
import { 
  Trophy, 
  Medal, 
  Star, 
  TrendingUp, 
  Users, 
  Factory, 
  FileText, 
  Send,
  Loader2,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const MANAGERS = [
  { id: 'chocolate', name: 'DIA Manager', market: 'Chocolate Market' },
  { id: 'cosmetics', name: 'Musaed Manager', market: 'Cosmetics Market' },
  { id: 'detergents', name: 'Saddam Manager', market: 'Detergents Market' },
];

const COLORS = ['#755EDE', '#5182E0', '#F59E0B'];

export default function PerformancePage() {
  // Fetch required collections from Firestore
  const suppliersCol = useMemoFirebase(() => collection(db, "suppliers"), []);
  const customersCol = useMemoFirebase(() => collection(db, "customers"), []);
  const invoicesCol = useMemoFirebase(() => collection(db, "invoices"), []);
  const poCol = useMemoFirebase(() => collection(db, "purchase_orders"), []);
  const campaignsCol = useMemoFirebase(() => collection(db, "campaigns"), []);

  const { data: suppliersData, isLoading: loadingSuppliers } = useCollection(suppliersCol);
  const { data: customersData, isLoading: loadingCustomers } = useCollection(customersCol);
  const { data: invoicesData, isLoading: loadingInvoices } = useCollection(invoicesCol);
  const { data: poData, isLoading: loadingPO } = useCollection(poCol);
  const { data: campaignsData, isLoading: loadingCampaigns } = useCollection(campaignsCol);

  const isLoading = loadingSuppliers || loadingCustomers || loadingInvoices || loadingPO || loadingCampaigns;

  const performanceData = useMemo(() => {
    const suppliers = suppliersData || [];
    const customers = customersData || [];
    const invoices = invoicesData || [];
    const purchaseOrders = poData || [];
    const campaigns = campaignsData || [];

    const stats = MANAGERS.map(manager => {
      const mSuppliers = suppliers.filter(s => s.departments?.includes(manager.id)).length;
      const mCustomers = customers.filter(c => c.departments?.includes(manager.id)).length;
      const mInvoices = invoices.filter(i => i.department === manager.id);
      const mRevenue = mInvoices.reduce((sum, i) => sum + (i.totalUSD || i.total || i.totals?.gross || 0), 0);
      const mOrders = purchaseOrders.filter(po => po.department === manager.id).length;
      const mCampaigns = campaigns.filter(c => c.targetMarket === manager.market && c.status === 'Active').length;

      // Score Calculation Algorithm: 
      // Revenue (per $1000) + Customers (x20) + Suppliers (x10) + Active Campaigns (x100) + Orders (x5)
      const score = Math.round((mRevenue / 1000) + (mCustomers * 20) + (mSuppliers * 10) + (mCampaigns * 100) + (mOrders * 5));

      return {
        ...manager,
        suppliers: mSuppliers,
        customers: mCustomers,
        revenue: mRevenue,
        orders: mOrders,
        campaigns: mCampaigns,
        score
      };
    });

    // Sort by revenue for initial rank, but score for the table
    return stats.sort((a, b) => b.revenue - a.revenue);
  }, [suppliersData, customersData, invoicesData, poData, campaignsData]);

  const topThree = performanceData.slice(0, 3);

  const chartData = performanceData.map(m => ({
    name: m.name.split(' ')[0],
    revenue: Math.round(m.revenue)
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Aggregating live performance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Team Performance</h1>
        <p className="text-muted-foreground">Live leaderboard based on real business activity across market segments.</p>
      </div>

      {/* Top 3 Manager Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {topThree.map((manager, idx) => (
          <Card key={manager.id} className={cn(
            "relative overflow-hidden group transition-all hover:border-primary/50",
            idx === 0 && "border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
          )}>
            {idx === 0 && (
              <div className="absolute top-0 right-0 p-4">
                <Trophy className="h-12 w-12 text-primary opacity-10 rotate-12 group-hover:opacity-20 transition-opacity" />
              </div>
            )}
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="h-20 w-24 rounded-2xl bg-secondary flex items-center justify-center text-3xl font-bold border-2 border-border group-hover:border-primary/30 transition-colors">
                    {manager.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={cn(
                    "absolute -top-3 -right-3 h-8 w-8 rounded-full flex items-center justify-center border-4 border-background font-bold text-xs",
                    idx === 0 ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                  )}>
                    #{idx + 1}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg">{manager.name}</h3>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{manager.market}</p>
                </div>

                <div className="grid grid-cols-2 w-full gap-2">
                  <div className="bg-secondary/50 rounded-lg p-2 border border-border/50">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Revenue</p>
                    <p className="font-bold text-accent">${(manager.revenue / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2 border border-border/50">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Orders</p>
                    <p className="font-bold text-white">{manager.orders}</p>
                  </div>
                </div>

                <div className="w-full space-y-1 text-left px-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                    <span>Performance Score</span>
                    <span>{manager.score}</span>
                  </div>
                  <Progress value={Math.min(100, (manager.score / (topThree[0].score || 1)) * 100)} className="h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Distribution Chart */}
        <Card className="lg:col-span-1 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Revenue Contribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Leaderboard Table */}
        <Card className="lg:col-span-2 border-border/50 overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Detailed Benchmark Registry</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[60px] text-center text-[10px] uppercase font-bold">Rank</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Manager / Market</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Partners</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Campaigns</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Value (USD)</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((m, i) => (
                <TableRow key={m.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell className="text-center">
                    <div className={cn(
                      "h-6 w-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold",
                      i === 0 ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                    )}>
                      {i + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{m.market}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold">{m.suppliers + m.customers}</span>
                      <span className="text-[8px] text-muted-foreground uppercase">Entities</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={m.campaigns > 0 ? "default" : "outline"} className={cn("text-[9px]", m.campaigns > 0 && "bg-green-500")}>
                      {m.campaigns} Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-accent">
                    ${m.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm font-black text-white">{m.score}</span>
                      {i === 0 && <Star className="h-3 w-3 fill-primary text-primary animate-pulse" />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <CardContent className="p-4 bg-secondary/10 border-t">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
              <TrendingUp className="h-3 w-3" />
              <span>Benchmark logic: (Revenue / 1k) + (Customers × 20) + (Suppliers × 10) + (Active Campaigns × 100) + (Orders × 5)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
