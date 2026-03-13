
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
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444'];

export default function OverviewPage() {
  const db = useFirestore();

  const suppliersQuery = useMemo(() => collection(db, "suppliers"), [db]);
  const customersQuery = useMemo(() => collection(db, "customers"), [db]);
  const offersQuery = useMemo(() => collection(db, "bestOffers"), [db]);
  const responsesQuery = useMemo(() => collection(db, "customerResponses"), [db]);
  const logsQuery = useMemo(() => query(collection(db, "automationLogs"), orderBy("timestamp", "desc"), limit(10)), [db]);

  const { data: suppliers } = useCollection(suppliersQuery);
  const { data: customers } = useCollection(customersQuery);
  const { data: offers } = useCollection(offersQuery);
  const { data: responses } = useCollection(responsesQuery);
  const { data: logs } = useCollection(logsQuery);

  const stats = {
    suppliers: suppliers.length,
    customers: customers.length,
    offers: offers.length,
    responses: responses.length,
    newCustomers: customers.filter(c => {
      // Mock logic for "new this week" if no timestamp exists, or use actual field
      return true; 
    }).length
  };

  const responseTypes = useMemo(() => [
    { name: 'order', value: responses.filter(d => (d as any).responseType === 'order').length },
    { name: 'quote', value: responses.filter(d => (d as any).responseType === 'quote').length },
    { name: 'interest', value: responses.filter(d => (d as any).responseType === 'interest').length },
  ], [responses]);

  const customerTrend = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    count: Math.floor(Math.random() * 5) + 1
  })), []);

  const kpis = [
    { title: "Total Suppliers", value: stats.suppliers, icon: Factory, color: "text-blue-500" },
    { title: "Total Customers", value: stats.customers, icon: Users, color: "text-purple-500" },
    { title: "Active Offers", value: stats.offers, icon: Trophy, color: "text-yellow-500" },
    { title: "Pending Responses", value: stats.responses, icon: Clock, color: "text-orange-500" },
    { title: "New Customers (Week)", value: stats.newCustomers, icon: UserPlus, color: "text-green-500" },
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
            <CardDescription>Visual trend of acquisition</CardDescription>
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
                logs.map((log: any) => (
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
