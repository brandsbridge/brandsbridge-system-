
"use client";

import React, { useMemo } from "react";
import { 
  Users, 
  Factory, 
  Trophy, 
  Clock, 
  UserPlus,
  Share2,
  Upload,
  ArrowRight
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
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { 
  MOCK_SUPPLIERS, 
  MOCK_CUSTOMERS, 
  MOCK_UPLOAD_LOGS 
} from "@/lib/mock-data";
import Link from "next/link";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444'];

export default function OverviewPage() {
  // Demo context: Acting as Manager 1 (Chocolate)
  const currentDept = 'chocolate';

  const mySuppliers = useMemo(() => MOCK_SUPPLIERS.filter(s => s.departments.includes(currentDept)), []);
  const myBuyers = useMemo(() => MOCK_CUSTOMERS.filter(c => c.departments.includes(currentDept)), []);
  const sharedWithMe = useMemo(() => [...mySuppliers, ...myBuyers].filter(e => e.departments.length > 1), [mySuppliers, myBuyers]);

  const responseTypes = useMemo(() => [
    { name: 'Active', value: myBuyers.filter(b => b.accountStatus === 'active').length },
    { name: 'Key Account', value: myBuyers.filter(b => b.accountStatus === 'key account').length },
    { name: 'Prospect', value: myBuyers.filter(b => b.accountStatus === 'prospect').length },
  ], [myBuyers]);

  const kpis = [
    { title: "My Suppliers", value: mySuppliers.length, icon: Factory, color: "text-blue-500" },
    { title: "My Buyers", value: myBuyers.length, icon: Users, color: "text-purple-500" },
    { title: "Shared Clients", value: sharedWithMe.length, icon: Share2, color: "text-accent" },
    { title: "Engagement", value: "88%", icon: Clock, color: "text-orange-500" },
    { title: "Target Met", value: "92%", icon: Trophy, color: "text-yellow-500" },
  ];

  const recentUploads = useMemo(() => MOCK_UPLOAD_LOGS.slice(0, 3), []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Manager Overview</h1>
          <p className="text-muted-foreground">Market segment: <strong className="text-primary capitalize">{currentDept}</strong></p>
        </div>
        <div className="flex gap-2">
          <Link href="/uploads">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" /> Bulk Upload
            </Button>
          </Link>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" /> Add Record
          </Button>
        </div>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Upload History</CardTitle>
              <CardDescription>Last data ingestion batches for your department.</CardDescription>
            </div>
            <Link href="/uploads">
              <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="ml-2 h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Success</TableHead>
                  <TableHead>Fail</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUploads.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-xs">{log.fileName}</TableCell>
                    <TableCell className="text-green-500 font-bold">{log.successCount}</TableCell>
                    <TableCell className="text-destructive font-bold">{log.failCount}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">{formatFirebaseTimestamp(log.uploadDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Buyer Composition</CardTitle>
            <CardDescription>Segment distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTypes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '10px' }} />
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
    </div>
  );
}
