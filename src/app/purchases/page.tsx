
"use client";

import React, { useMemo } from "react";
import { 
  CreditCard, DollarSign, TrendingUp, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, Package, Truck, 
  BarChart3, PieChart as PieIcon 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import { MOCK_PURCHASES } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B'];

export default function PurchasesPage() {
  const totals = useMemo(() => {
    const revenue = MOCK_PURCHASES.reduce((acc, p) => acc + p.totalRevenue, 0);
    const profit = MOCK_PURCHASES.reduce((acc, p) => acc + p.netProfit, 0);
    const avgDeal = revenue / (MOCK_PURCHASES.length || 1);
    
    return { revenue, profit, avgDeal };
  }, []);

  const departmentData = useMemo(() => {
    const data: Record<string, number> = {};
    MOCK_PURCHASES.forEach(p => {
      data[p.department] = (data[p.department] || 0) + p.totalRevenue;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, []);

  const trendData = [
    { month: 'Jan', revenue: 45000, profit: 9000 },
    { month: 'Feb', revenue: 52000, profit: 11000 },
    { month: 'Mar', revenue: 48000, profit: 9500 },
    { month: 'Apr', revenue: 61000, profit: 12500 },
    { month: 'May', revenue: 59000, profit: 11800 },
    { month: 'Jun', revenue: 72000, profit: 15000 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Fulfillment & Purchases</h1>
        <p className="text-muted-foreground">Global transactional overview and financial auditing.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.revenue.toLocaleString()}</div>
            <p className="text-[10px] text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +18.4% YoY
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totals.profit.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Avg. Margin: 20.2%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Avg. Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">${totals.avgDeal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Based on {MOCK_PURCHASES.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Best Market</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">Chocolate</div>
            <p className="text-[10px] text-muted-foreground mt-1">45% of total volume</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Financial Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Registry</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Financials</TableHead>
              <TableHead>Logistics</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_PURCHASES.map(purchase => (
              <TableRow key={purchase.id}>
                <TableCell className="text-[10px] text-muted-foreground">
                  {formatFirebaseTimestamp(purchase.date)}
                </TableCell>
                <TableCell>
                  <div className="font-bold text-xs">{purchase.buyerName}</div>
                  <div className="text-[8px] uppercase text-muted-foreground">{purchase.department}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium">{purchase.productName}</div>
                  <div className="text-[10px] text-muted-foreground">Qty: {purchase.quantity}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-bold text-accent">${purchase.totalRevenue.toLocaleString()}</div>
                  <div className="text-[10px] text-green-500 font-medium">+${purchase.netProfit.toLocaleString()} Profit</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="text-[8px] gap-1 w-fit bg-green-500/10 text-green-500 border-green-500/20">
                      <CreditCard className="h-2 w-2" /> {purchase.paymentStatus}
                    </Badge>
                    <Badge variant="outline" className="text-[8px] gap-1 w-fit">
                      <Truck className="h-2 w-2" /> {purchase.deliveryStatus}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]">Audit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
