"use client";

import React, { useEffect, useState } from "react";
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
  AlertCircle
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { Employee } from "@/lib/mock-data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444', '#10B981'];

export default function OverviewPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const db = useFirestore();

  // Memoize Firestore Collections - Only fetch if user is present to prevent permission errors
  const suppliersCol = useMemoFirebase(() => user ? collection(db, "suppliers") : null, [db, user]);
  const customersCol = useMemoFirebase(() => user ? collection(db, "customers") : null, [db, user]);
  const uploadLogsCol = useMemoFirebase(() => user ? collection(db, "uploadLogs") : null, [db, user]);
  const leadsCol = useMemoFirebase(() => user ? collection(db, "leads") : null, [db, user]);
  const productsCol = useMemoFirebase(() => user ? collection(db, "products") : null, [db, user]);

  const { data: fbSuppliers = [], isLoading: loadingSuppliers } = useCollection(suppliersCol);
  const { data: fbCustomers = [], isLoading: loadingCustomers } = useCollection(customersCol);
  const { data: fbUploadLogs = [], isLoading: loadingLogs } = useCollection(uploadLogsCol);
  const { data: fbLeads = [], isLoading: loadingLeads } = useCollection(leadsCol);
  const { data: fbProducts = [], isLoading: loadingProducts } = useCollection(productsCol);

  useEffect(() => {
    const savedUser = localStorage.getItem("demoUser");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setCurrentUser(u);
      if (u.role === 'manager' && u.department !== 'all') {
        router.push(`/department/${u.department}`);
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const deptComposition = React.useMemo(() => {
    if (!fbCustomers) return [];
    const depts = ['chocolate', 'cosmetics', 'detergents'];
    return depts.map(d => ({
      name: d.charAt(0).toUpperCase() + d.slice(1),
      value: fbCustomers.filter((c: any) => c.departments?.includes(d)).length
    }));
  }, [fbCustomers]);

  const kpis = [
    { title: "Suppliers", value: fbSuppliers?.length || 0, icon: Factory, color: "text-blue-500", loading: loadingSuppliers || isUserLoading },
    { title: "Customers", value: fbCustomers?.length || 0, icon: Users, color: "text-purple-500", loading: loadingCustomers || isUserLoading },
    { title: "Active Leads", value: fbLeads?.length || 0, icon: Target, color: "text-accent", loading: loadingLeads || isUserLoading },
    { title: "Products", value: fbProducts?.length || 0, icon: TrendingUp, color: "text-orange-500", loading: loadingProducts || isUserLoading },
    { title: "System", value: "Active", icon: ShieldCheck, color: "text-green-500", loading: false },
  ];

  if (!currentUser || (currentUser.role === 'manager' && currentUser.department !== 'all')) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, <strong className="text-primary">{currentUser.name}</strong>. Global system status live from Firestore.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/system">
            <Button variant="outline" size="sm">
              <AlertCircle className="mr-2 h-4 w-4" /> System Hub
            </Button>
          </Link>
          <Link href="/employees">
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" /> Manage Team
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className={cn("h-4 w-4", kpi.color)} />
            </CardHeader>
            <CardContent>
              {kpi.loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{kpi.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Global Activity Feed</CardTitle>
              <CardDescription>Live system events and data synchronization.</CardDescription>
            </div>
            <Link href="/uploads">
              <Button variant="ghost" size="sm" className="text-xs">Full History <ArrowRight className="ml-2 h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : fbUploadLogs && fbUploadLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Market</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fbUploadLogs.slice(0, 6).map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                         <Badge variant="secondary" className="capitalize text-[10px]">{log.department}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="text-xs font-medium truncate max-w-[150px]">Import: {log.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold">{log.uploadedBy}</TableCell>
                      <TableCell className="text-right text-[10px] text-muted-foreground">{formatFirebaseTimestamp(log.uploadDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground italic">
                {isUserLoading ? "Initializing session..." : "No recent activity logs found. Try activating Admin Status in System Hub."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Market Composition</CardTitle>
            <CardDescription>Customer distribution across segments</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptComposition}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deptComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}