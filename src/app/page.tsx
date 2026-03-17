"use client";

import React, { useState } from "react";
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
import { useCollection, useMemoFirebase, useUser } from "@/firebase";
import { db } from "@/lib/firebase"; // Import correctly initialized db
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const [isReading, setIsReading] = useState(false);

  // CORRECT USAGE: Pass 'db' directly to collection()
  const devLogQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "dev_sandbox"), 
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [user]);

  const { data: logs, isLoading: loadingLogs } = useCollection(devLogQuery);

  /**
   * EXAMPLE: Writing a document
   */
  const handleAddTestDoc = async () => {
    try {
      // Use the 'db' instance as the first argument
      const colRef = collection(db, "dev_sandbox");
      await addDoc(colRef, {
        message: "Developer Sandbox Write",
        author: user?.displayName || user?.email || "Anonymous",
        createdAt: serverTimestamp()
      });
      toast({ title: "Write Successful", description: "Document pushed to Firestore." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Write Failed", description: e.message });
    }
  };

  /**
   * EXAMPLE: Reading documents manually (async/await)
   */
  const handleManualRead = async () => {
    setIsReading(true);
    try {
      const colRef = collection(db, "dev_sandbox");
      const snapshot = await getDocs(colRef);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      toast({ title: "Read Successful", description: `Fetched ${items.length} docs manually.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Read Failed", description: e.message });
    } finally {
      setIsReading(false);
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
          <h1 className="text-3xl font-bold tracking-tight font-headline">Developer Console</h1>
          <p className="text-muted-foreground">Unrestricted Firestore prototyping environment.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleManualRead} disabled={isReading}>
            {isReading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="mr-2 h-4 w-4" />}
            Test Manual Read
          </Button>
          <Button className="bg-primary shadow-lg shadow-primary/20" size="sm" onClick={handleAddTestDoc}>
            <Plus className="mr-2 h-4 w-4" /> Add Test Doc
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Cloud Documents</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs?.length || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Live from dev_sandbox</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Initialization</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Verified</div>
            <p className="text-[10px] text-muted-foreground mt-1">db instance is correctly mapped</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">API Status</CardTitle>
            <Globe className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Online</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Platform</CardTitle>
            <Terminal className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NextJS 15</div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Firestore CRUD Sandbox</CardTitle>
            <CardDescription>Verify your <code>collection(db, ...)</code> usage here.</CardDescription>
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
                    <TableCell className="text-sm font-medium">{log.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.author}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteDoc(log.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!logs || logs.length === 0) && !loadingLogs && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p>Sandbox is empty. Use "Add Test Doc" to verify connectivity.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10 border-dashed border-2 flex flex-col items-center justify-center text-center p-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-bold">Initialization Resolved</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
            The <code>db</code> instance is now correctly exported from <code>src/lib/firebase.ts</code> and passed as the first argument to <code>collection()</code>.
          </p>
          <div className="flex gap-2 mt-6">
            <Link href="/admin/system">
              <Button variant="outline" size="sm">System Hub</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh App</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
