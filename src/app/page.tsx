
"use client";

import React, { useMemo, useEffect, useState } from "react";
import { 
  Users, 
  Factory, 
  Trophy, 
  Clock, 
  UserPlus,
  Share2,
  Upload,
  ArrowRight,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { 
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
  MOCK_UPLOAD_LOGS,
  Employee
} from "@/lib/mock-data";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444'];

export default function OverviewPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("demoUser");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      // Redirect managers to their department pages automatically
      if (user.role === 'manager' && user.department !== 'all') {
        router.push(`/department/${user.department}`);
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const currentDept = currentUser?.department || 'all';

  const mySuppliers = useMemo(() => 
    currentDept === 'all' ? MOCK_SUPPLIERS : MOCK_SUPPLIERS.filter(s => s.departments.includes(currentDept))
  , [currentDept]);

  const myBuyers = useMemo(() => 
    currentDept === 'all' ? MOCK_CUSTOMERS : MOCK_CUSTOMERS.filter(c => c.departments.includes(currentDept))
  , [currentDept]);

  const sharedWithMe = useMemo(() => 
    [...mySuppliers, ...myBuyers].filter(e => e.departments.length > 1)
  , [mySuppliers, myBuyers]);

  const responseTypes = useMemo(() => [
    { name: 'Active', value: myBuyers.filter(b => b.accountStatus === 'active').length },
    { name: 'Key Account', value: myBuyers.filter(b => b.accountStatus === 'key account').length },
    { name: 'Prospect', value: myBuyers.filter(b => b.accountStatus === 'prospect').length },
  ], [myBuyers]);

  const kpis = [
    { title: "Total Suppliers", value: mySuppliers.length, icon: Factory, color: "text-blue-500" },
    { title: "Total Buyers", value: myBuyers.length, icon: Users, color: "text-purple-500" },
    { title: "Shared Clients", value: sharedWithMe.length, icon: Share2, color: "text-accent" },
    { title: "Engagement", value: "88%", icon: Clock, color: "text-orange-500" },
    { title: "System Health", value: "Optimal", icon: ShieldCheck, color: "text-green-500" },
  ];

  const recentUploads = useMemo(() => 
    currentDept === 'all' ? MOCK_UPLOAD_LOGS.slice(0, 3) : MOCK_UPLOAD_LOGS.filter(l => l.department === currentDept).slice(0, 3)
  , [currentDept]);

  if (!currentUser || (currentUser.role === 'manager' && currentUser.department !== 'all')) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Overview</h1>
          <p className="text-muted-foreground">Welcome, <strong className="text-primary">{currentUser.name}</strong>. Global system status.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/permissions">
            <Button variant="outline" size="sm">
              <ShieldCheck className="mr-2 h-4 w-4" /> Permissions
            </Button>
          </Link>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" /> System Audit
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
              <CardTitle>Global Activity</CardTitle>
              <CardDescription>Recent system-wide updates and imports.</CardDescription>
            </div>
            <Link href="/uploads">
              <Button variant="ghost" size="sm" className="text-xs">History <ArrowRight className="ml-2 h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUploads.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                       <Badge variant="outline" className="capitalize">{log.department}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-xs">Bulk Import: {log.fileName}</TableCell>
                    <TableCell className="text-xs font-bold">{log.uploadedBy}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">{formatFirebaseTimestamp(log.uploadDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Global Composition</CardTitle>
            <CardDescription>Market distribution across all segments</CardDescription>
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
