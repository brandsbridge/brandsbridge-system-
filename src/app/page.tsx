
"use client";

import React, { useMemo, useEffect, useState } from "react";
import { 
  Users, 
  Factory, 
  Clock, 
  UserPlus,
  Share2,
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
  BarChart, 
  Bar, 
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
import { 
  MOCK_SUPPLIERS, 
  MOCK_CUSTOMERS, 
  MOCK_UPLOAD_LOGS,
  Employee
} from "@/lib/mock-data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444', '#10B981'];

export default function OverviewPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const db = useFirestore();

  // Memoize Firestore Collections to prevent infinite render loops
  const suppliersCol = useMemo(() => collection(db, "suppliers"), [db]);
  const customersCol = useMemo(() => collection(db, "customers"), [db]);
  const uploadLogsCol = useMemo(() => collection(db, "uploadLogs"), [db]);
  const leadsCol = useMemo(() => collection(db, "leads"), [db]);
  const productsCol = useMemo(() => collection(db, "products"), [db]);

  const { data: fbSuppliers = [], loading: loadingSuppliers } = useCollection(suppliersCol);
  const { data: fbCustomers = [], loading: loadingCustomers } = useCollection(customersCol);
  const { data: fbUploadLogs = [], loading: loadingLogs } = useCollection(uploadLogsCol);
  const { data: fbLeads = [] } = useCollection(leadsCol);
  const { data: fbProducts = [] } = useCollection(productsCol);

  useEffect(() => {
    const savedUser = localStorage.getItem("demoUser");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      if (user.role === 'manager' && user.department !== 'all') {
        router.push(`/department/${user.department}`);
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const currentDept = currentUser?.department || 'all';

  const suppliers = fbSuppliers.length > 0 ? fbSuppliers : MOCK_SUPPLIERS;
  const customers = fbCustomers.length > 0 ? fbCustomers : MOCK_CUSTOMERS;

  const sharedWithMe = useMemo(() => 
    [...suppliers, ...customers].filter((e: any) => e.departments?.length > 1)
  , [suppliers, customers]);

  const deptComposition = useMemo(() => {
    const depts = ['chocolate', 'cosmetics', 'detergents'];
    return depts.map(d => ({
      name: d.charAt(0).toUpperCase() + d.slice(1),
      value: customers.filter((c: any) => c.departments?.includes(d)).length
    }));
  }, [customers]);

  const kpis = [
    { title: "Suppliers", value: suppliers.length, icon: Factory, color: "text-blue-500", loading: loadingSuppliers },
    { title: "Customers", value: customers.length, icon: Users, color: "text-purple-500", loading: loadingCustomers },
    { title: "Active Leads", value: fbLeads.length, icon: Target, color: "text-accent", loading: false },
    { title: "Products", value: fbProducts.length, icon: TrendingUp, color: "text-orange-500", loading: false },
    { title: "System", value: "Healthy", icon: ShieldCheck, color: "text-green-500", loading: false },
  ];

  const recentUploads = fbUploadLogs.length > 0 ? fbUploadLogs : MOCK_UPLOAD_LOGS;

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
            ) : (
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
                  {recentUploads.slice(0, 6).map((log: any) => (
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
