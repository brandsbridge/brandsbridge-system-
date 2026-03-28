"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { 
  Users, 
  ArrowRight,
  Loader2,
  Kanban,
  CheckCircle2,
  Factory
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function MarketDashboard({ assignedMarket }: { assignedMarket: string }) {
  const customersQuery = useMemoFirebase(() => query(collection(db, "customers"), where("markets", "array-contains", assignedMarket)), [assignedMarket]);
  const suppliersQuery = useMemoFirebase(() => query(collection(db, "suppliers"), where("markets", "array-contains", assignedMarket)), [assignedMarket]);
  const tasksQuery = useMemoFirebase(() => query(collection(db, "tasks"), where("department", "==", assignedMarket)), [assignedMarket]);

  const { data: customersData } = useCollection(customersQuery);
  const { data: suppliersData } = useCollection(suppliersQuery);
  const { data: tasksData } = useCollection(tasksQuery);

  const customers = customersData || [];
  const suppliers = suppliersData || [];
  const tasks = tasksData || [];

  const taskStats = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'To Do').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      done: tasks.filter(t => t.status === 'Done').length,
    };
  }, [tasks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline capitalize">{assignedMarket} Market Hub</h1>
        <p className="text-muted-foreground">Operational overview for your assigned market segment.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Market Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{customers.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Active network</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Market Suppliers</CardTitle>
            <Factory className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{suppliers.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Supply chain</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Kanban className="h-5 w-5 text-primary" /> Market Tasks
            </CardTitle>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="text-xs h-8">View Board <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-3xl font-bold">{taskStats.total}</div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Assignments</p>
              </div>
              <div className="flex flex-wrap gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">To Do</p>
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold">{taskStats.todo}</div>
                    <Badge variant="outline" className="text-[8px] h-4">Awaiting</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-accent uppercase font-bold">In Progress</p>
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold">{taskStats.inProgress}</div>
                    <div className="h-1.5 w-16 rounded-full bg-accent/20 overflow-hidden hidden sm:block">
                      <div className="h-full bg-accent" style={{ width: `${(taskStats.inProgress / (taskStats.total || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-green-500 uppercase font-bold">Done</p>
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold">{taskStats.done}</div>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
