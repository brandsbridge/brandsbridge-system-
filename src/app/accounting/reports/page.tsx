"use client";

import React from "react";
import { 
  Download, 
  Printer
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const plData = {
    revenue: {
      chocolate: 125000,
      cosmetics: 85000,
      detergents: 65000,
      commissions: 12000
    },
    cogs: 185000,
    expenses: {
      salaries: 45000,
      marketing: 12000,
      shipping: 8500,
      admin: 5000,
      rent: 10000
    }
  };

  const totalRevenue = Object.values(plData.revenue).reduce((acc, val) => acc + val, 0);
  const totalExpenses = Object.values(plData.expenses).reduce((acc, val) => acc + val, 0);
  const grossProfit = totalRevenue - plData.cogs;
  const netProfit = grossProfit - totalExpenses;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Financial Reports</h1>
          <p className="text-muted-foreground">Certified financial statements and operational audits.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print PDF</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
        </div>
      </div>

      <Tabs defaultValue="pl" className="w-full">
        <TabsList className="w-full lg:w-auto grid grid-cols-2 lg:flex gap-2">
          <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
          <TabsTrigger value="aging">Aging Reports</TabsTrigger>
          <TabsTrigger value="vat">VAT Report</TabsTrigger>
        </TabsList>

        <TabsContent value="pl" className="pt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Income Statement</CardTitle>
                <CardDescription>Fiscal Year 2024 • Jan 1 - Jun 30</CardDescription>
              </div>
              <Badge variant="outline" className="h-fit">USD (Consolidated)</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Revenue</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Chocolate Market Sales</span>
                      <span className="font-medium">${plData.revenue.chocolate.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cosmetics Market Sales</span>
                      <span className="font-medium">${plData.revenue.cosmetics.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Detergents Market Sales</span>
                      <span className="font-medium">${plData.revenue.detergents.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2 font-bold">
                      <span>Total Revenue</span>
                      <span>${totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Cost of Goods Sold (COGS)</span>
                    <span className="font-medium">(${plData.cogs.toLocaleString()})</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold bg-primary/5 p-3 rounded-lg mt-4">
                    <span>Gross Profit</span>
                    <span className="text-primary">${grossProfit.toLocaleString()}</span>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 mt-6">Operating Expenses</h3>
                  <div className="space-y-2">
                    {Object.entries(plData.expenses).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between text-sm">
                        <span className="capitalize">{cat}</span>
                        <span className="font-medium">(${(val as number).toLocaleString()})</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm border-t pt-2 font-bold text-red-500">
                      <span>Total Operating Expenses</span>
                      <span>(${totalExpenses.toLocaleString()})</span>
                    </div>
                  </div>
                </section>

                <div className="flex justify-between text-2xl font-bold bg-green-500/10 p-4 rounded-lg border border-green-500/20 text-green-500">
                  <span>Net Profit</span>
                  <span>${netProfit.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bs" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>As of June 30, 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="font-bold text-primary border-b pb-2">Assets</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Cash & Equivalents</span><span className="font-bold">$125,000</span></div>
                    <div className="flex justify-between text-sm"><span>Accounts Receivable</span><span className="font-bold">$45,000</span></div>
                    <div className="flex justify-between text-sm"><span>Inventory</span><span className="font-bold">$85,000</span></div>
                    <div className="flex justify-between text-lg font-bold pt-4 border-t"><span>Total Assets</span><span>$255,000</span></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="font-bold text-accent border-b pb-2">Liabilities & Equity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Accounts Payable</span><span className="font-bold">$35,000</span></div>
                    <div className="flex justify-between text-sm"><span>Tax Payable (VAT)</span><span className="font-bold">$8,500</span></div>
                    <div className="flex justify-between text-sm italic text-muted-foreground"><span>Equity (Retained Earnings)</span><span className="font-bold">$211,500</span></div>
                    <div className="flex justify-between text-lg font-bold pt-4 border-t"><span>Total Liab. & Equity</span><span>$255,000</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="pt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>AR Aging (Buyers)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Current', value: 25000, color: 'bg-green-500' },
                    { label: '1-30 Days', value: 12000, color: 'bg-yellow-500' },
                    { label: '31-60 Days', value: 5000, color: 'bg-orange-500' },
                    { label: '60+ Days', value: 3000, color: 'bg-red-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className={cn("w-2 h-10 rounded", item.color)} />
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase text-muted-foreground">{item.label}</p>
                        <p className="text-lg font-bold">${item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>AP Aging (Suppliers)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Current', value: 18000, color: 'bg-green-500' },
                    { label: '1-30 Days', value: 10000, color: 'bg-yellow-500' },
                    { label: '31-60 Days', value: 2000, color: 'bg-orange-500' },
                    { label: '60+ Days', value: 5000, color: 'bg-red-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className={cn("w-2 h-10 rounded", item.color)} />
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase text-muted-foreground">{item.label}</p>
                        <p className="text-lg font-bold">${item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
