
"use client";

import React, { useMemo } from "react";
import { 
  Trophy, Medal, Star, BarChart3, TrendingUp, 
  ArrowUpRight, ArrowDownRight, User, Users 
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
import { DEMO_USERS, MOCK_EMAILS, MOCK_PURCHASES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function PerformancePage() {
  const employeeStats = useMemo(() => {
    return DEMO_USERS.filter(u => u.role !== 'admin').map(emp => {
      const empEmails = MOCK_EMAILS.filter(e => e.empId === emp.id);
      const replies = empEmails.filter(e => e.replyReceived).length;
      const empPurchases = MOCK_PURCHASES.filter(p => p.employeeName === emp.name);
      const revenue = empPurchases.reduce((acc, p) => acc + p.totalRevenue, 0);
      
      return {
        ...emp,
        emails: empEmails.length,
        replies,
        replyRate: (replies / (empEmails.length || 1)) * 100,
        orders: empPurchases.length,
        revenue
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, []);

  const topThreeByRevenue = employeeStats.slice(0, 3);

  const chartData = employeeStats.slice(0, 6).map(e => ({
    name: e.name.split(' ')[0],
    revenue: e.revenue,
    replies: e.replies
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Team Performance</h1>
        <p className="text-muted-foreground">Detailed employee benchmarking and sales effectiveness tracking.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {topThreeByRevenue.map((emp, idx) => (
          <Card key={emp.id} className={cn(idx === 0 && "border-primary/50 shadow-lg shadow-primary/10")}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="h-20 w-24 rounded-2xl bg-secondary flex items-center justify-center text-3xl font-bold">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-primary flex items-center justify-center border-4 border-background">
                    {idx === 0 ? <Trophy className="h-4 w-4 text-primary-foreground" /> : <Medal className="h-4 w-4 text-primary-foreground" />}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{emp.name}</h3>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{emp.department} • {emp.role}</p>
                </div>
                <div className="grid grid-cols-2 w-full gap-2">
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                    <p className="font-bold text-accent">${(emp.revenue / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Reply Rate</p>
                    <p className="font-bold">{emp.replyRate.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard: Top Volume</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {employeeStats.slice(0, 4).map(emp => (
                <div key={emp.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">{emp.name}</span>
                    <span className="text-muted-foreground">{emp.orders} orders • {emp.emails} emails</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Progress value={emp.replyRate} className="h-1.5 flex-1" />
                    <span className="text-[10px] font-bold w-8">{emp.replyRate.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Team Breakdown</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Communication</TableHead>
              <TableHead>Conversion</TableHead>
              <TableHead>Financial Impact</TableHead>
              <TableHead className="text-right">Rank</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeStats.map((emp, i) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <div className="font-bold text-xs">{emp.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{emp.department} Market</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">{emp.emails} Emails Sent</div>
                  <div className="text-[10px] text-muted-foreground">{emp.replies} Replies ({emp.replyRate.toFixed(0)}%)</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-bold">{emp.orders} Orders</div>
                  <div className="text-[10px] text-muted-foreground">Lead-to-Order: {((emp.orders / (emp.emails || 1)) * 100).toFixed(1)}%</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-bold text-accent">${emp.revenue.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">Avg. Deal: ${(emp.revenue / (emp.orders || 1)).toLocaleString()}</div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="text-[10px]">#{i + 1}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
