"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Loader2, 
  TrendingUp, 
  Globe, 
  FileText, 
  Zap, 
  Terminal,
  Plus,
  Trash2,
  Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // 1. Correct usage of collection() - Passing 'db' as the first argument
  const devLogQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "dev_sandbox"), // Demonstrating correct collection() call
      orderBy("createdAt", "desc"),
      limit(5)
    );
  }, [db, user]);

  const { data: logs, isLoading: loadingLogs } = useCollection(devLogQuery);

  const handleAddTestDoc = async () => {
    try {
      // 2. Correct usage of addDoc() with collection(db, "path")
      await addDoc(collection(db, "dev_sandbox"), {
        message: "Test Firestore Write",
        author: user?.displayName || "Anonymous",
        createdAt: serverTimestamp()
      });
      toast({ title: "Write Successful", description: "Document added to dev_sandbox." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Write Failed", description: e.message });
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await deleteDoc(doc(db, "dev_sandbox", id));
      toast({ title: "Document Deleted" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message });
    }
  };

  if (isUserLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Firebase Project Hub</h1>
          <p className="text-muted-foreground">Prototyping environment with **Unrestricted Development Rules**.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddTestDoc}>
            <Plus className="mr-2 h-4 w-4" /> Add Test Doc
          </Button>
          <Button className="bg-primary shadow-lg shadow-primary/20" size="sm">
            <Zap className="mr-2 h-4 w-4" /> AI Strategy
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Sandbox Docs</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs?.length || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Active items in dev_sandbox</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">System Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Online</div>
            <p className="text-[10px] text-muted-foreground mt-1">Permissive rules active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Network</CardTitle>
            <Globe className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Global</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Ready</CardTitle>
            <Terminal className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Firestore CRUD Sandbox</CardTitle>
            <CardDescription>Live feed from the <code>dev_sandbox</code> collection.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></TableCell></TableRow>
                ) : logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{log.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.author}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDoc(log.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!logs || logs.length === 0) && !loadingLogs && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">No docs found. Add one above!</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10 border-dashed border-2 flex flex-col items-center justify-center text-center p-8">
          <Terminal className="h-12 w-12 text-primary/20 mb-4" />
          <h3 className="font-bold">Next.js 15 + Firestore</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
            The <code>collection()</code> error is fixed by correctly destructuring the initialized Firebase services in <code>src/lib/firebase.ts</code>.
          </p>
          <div className="flex gap-2 mt-6">
            <Link href="/automation">
              <Button variant="outline" size="sm">Workflows</Button>
            </Link>
            <Link href="/admin/system">
              <Button variant="outline" size="sm">System Hub</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
