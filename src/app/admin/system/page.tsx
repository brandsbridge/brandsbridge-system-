
"use client";

import React, { useMemo } from "react";
import { 
  Database, 
  ShieldAlert, 
  RefreshCw, 
  Settings, 
  Server, 
  HardDrive, 
  Activity,
  FileText,
  Users,
  Factory,
  Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";

export default function SystemManagementPage() {
  const db = useFirestore();

  const suppliersCol = useMemo(() => collection(db, "suppliers"), [db]);
  const customersCol = useMemo(() => collection(db, "customers"), [db]);
  const productsCol = useMemo(() => collection(db, "products"), [db]);
  const employeesCol = useMemo(() => collection(db, "employees"), [db]);
  const logsCol = useMemo(() => collection(db, "uploadLogs"), [db]);

  const { data: suppliers } = useCollection(suppliersCol);
  const { data: customers } = useCollection(customersCol);
  const { data: products } = useCollection(productsCol);
  const { data: employees } = useCollection(employeesCol);
  const { data: logs } = useCollection(logsCol);

  const stats = [
    { label: "Suppliers", count: suppliers.length, icon: Factory, color: "text-blue-500" },
    { label: "Customers", count: customers.length, icon: Users, color: "text-purple-500" },
    { label: "Products", count: products.length, icon: Package, color: "text-orange-500" },
    { label: "Employees", count: employees.length, icon: Settings, color: "text-accent" },
    { label: "System Logs", count: logs.length, icon: FileText, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">System Management</h1>
          <p className="text-muted-foreground">Global database configuration and platform health monitor.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Re-sync Database
          </Button>
          <Button className="bg-primary" size="sm">
            <Settings className="mr-2 h-4 w-4" /> Platform Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Firestore Health</CardTitle>
            </div>
            <CardDescription>Live record counts across all core application collections.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="p-4 rounded-xl border bg-secondary/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <s.icon className={cn("h-4 w-4", s.color)} />
                    <Badge variant="outline" className="text-[10px]">Active</Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.count}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <CardTitle>Access Control</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold">Admin Privileges</p>
              <p className="text-[10px] text-muted-foreground">Only Saleh Admin and Alex Johnson have full system write access.</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-bold">Data Isolation</p>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active - High Security</Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">Review Security Rules</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-accent" />
              <CardTitle>System Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Cloud Function Latency</span>
              </div>
              <span className="text-xs font-bold">12ms</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Cache Efficiency</span>
              </div>
              <span className="text-xs font-bold">94%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10 border-dashed border-2 flex flex-col items-center justify-center p-8 text-center">
          <RefreshCw className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="font-bold">Maintenance Mode</h3>
          <p className="text-xs text-muted-foreground max-w-[250px] mt-2">Temporarily disable user access while performing major database updates.</p>
          <Button variant="outline" size="sm" className="mt-6" disabled>Enter Maintenance Mode</Button>
        </Card>
      </div>
    </div>
  );
}
