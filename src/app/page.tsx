
"use client";

import React, { useMemo } from "react";
import { 
  Users, 
  Factory, 
  Trophy, 
  Clock, 
  UserPlus 
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { 
  MOCK_SUPPLIERS, 
  MOCK_CUSTOMERS, 
  MOCK_OFFERS, 
  MOCK_RESPONSES, 
  MOCK_LOGS 
} from "@/lib/mock-data";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444'];

export default function OverviewPage() {
  const stats = {
    suppliers: MOCK_SUPPLIERS.length,
    customers: MOCK_CUSTOMERS.length,
    offers: MOCK_OFFERS.length,
    responses: MOCK_RESPONSES.length,
    newCustomers: 5 // Demo static value
  };

  const responseTypes = useMemo(() => [
    { name: 'order', value: MOCK_RESPONSES.filter(d => d.responseType === 'order').length },
    { name: 'quote', value: MOCK_RESPONSES.filter(d => d.responseType === 'quote').length },
    { name: 'interest', value: MOCK_RESPONSES.filter(d => d.responseType === 'interest').length },
  ], []);

  const customerTrend = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    count: [2, 5, 3, 8, 4, 10, 15][i]
  })), []);

  const kpis = [
    { title: "Total Suppliers", value: stats.suppliers, icon: Factory, color: "text-blue-500" },
    { title: "Total Customers", value: stats.customers, icon: Users, color: "text-purple-500" },
    { title: "Active Offers", value: stats.offers, icon: Trophy, color: "text-yellow-500" },
    { title: "Responses", value: stats.responses, icon: Clock, color: "text-orange-500" },
    { title: "New This Week", value: stats.newCustomers, icon: UserPlus, color: "text-green-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time pulse of your business operations (Mock Data).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={cn("h-4 w-4", kpi.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
            <CardDescription>Visual trend of acquisition over 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="count" stroke="#755EDE" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Customer Intent</CardTitle>
            <CardDescription>Breakdown of response types</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTypes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {responseTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Automation Activity</CardTitle>
          <CardDescription>Last pipeline events across all workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LOGS.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.pipelineName}</TableCell>
                  <TableCell>{log.event}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className={log.status === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatFirebaseTimestamp(log.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
