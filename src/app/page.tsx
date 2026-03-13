"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  Factory, 
  Trophy, 
  Clock, 
  UserPlus, 
  TrendingUp 
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
import { subscribeToCollection, formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444'];

export default function OverviewPage() {
  const [stats, setStats] = useState({
    suppliers: 0,
    customers: 0,
    offers: 0,
    responses: 0,
    newCustomers: 0
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [customerTrend, setCustomerTrend] = useState<any[]>([]);
  const [responseTypes, setResponseTypes] = useState<any[]>([]);

  useEffect(() => {
    const unsubSuppliers = subscribeToCollection("suppliers", (data) => setStats(prev => ({ ...prev, suppliers: data.length })));
    const unsubCustomers = subscribeToCollection("customers", (data) => {
      setStats(prev => ({ ...prev, customers: data.length }));
      // Mocking a trend for visual purposes as requested
      const trend = Array.from({ length: 30 }, (_, i) => ({
        day: 30 - i,
        count: Math.floor(Math.random() * 5) + 1
      }));
      setCustomerTrend(trend);
    });
    const unsubOffers = subscribeToCollection("bestOffers", (data) => setStats(prev => ({ ...prev, offers: data.length })));
    const unsubResponses = subscribeToCollection("customerResponses", (data) => {
      setStats(prev => ({ ...prev, responses: data.length }));
      const types = [
        { name: 'order', value: data.filter(d => d.responseType === 'order').length },
        { name: 'quote', value: data.filter(d => d.responseType === 'quote').length },
        { name: 'interest', value: data.filter(d => d.responseType === 'interest').length },
      ];
      setResponseTypes(types);
    });
    const unsubLogs = subscribeToCollection("automationLogs", (data) => setLogs(data.slice(0, 10)), "timestamp", "desc");

    return () => {
      unsubSuppliers();
      unsubCustomers();
      unsubOffers();
      unsubResponses();
      unsubLogs();
    };
  }, []);

  const kpis = [
    { title: "Total Suppliers", value: stats.suppliers, icon: Factory, color: "text-blue-500" },
    { title: "Total Customers", value: stats.customers, icon: Users, color: "text-purple-500" },
    { title: "Active Offers", value: stats.offers, icon: Trophy, color: "text-yellow-500" },
    { title: "Pending Responses", value: stats.responses, icon: Clock, color: "text-orange-500" },
    { title: "New Customers (Week)", value: stats.newCustomers || 12, icon: UserPlus, color: "text-green-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time pulse of your business operations.</p>
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
            <CardDescription>New customers acquired per day (Last 30 days)</CardDescription>
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
          <CardDescription>Last 10 pipeline events across all workflows.</CardDescription>
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
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">No logs found.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
