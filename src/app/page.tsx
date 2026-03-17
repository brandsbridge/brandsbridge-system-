"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Loader2, 
  Globe, 
  Zap, 
  Terminal,
  Plus,
  Trash2,
  Database,
  Code2,
  LockOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useMemoFirebase, useUser, useFirestore } from "@/firebase";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function DeveloperConsole() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore(); 
  const [isWriting, setIsWriting] = useState(false);

  /**
   * Safely memoize the sandbox query.
   * Ensures 'collection()' is only called with a verified firestore instance.
   */
  const sandboxQuery = useMemoFirebase(() => {
    // Only call collection() if firestore is truthy and valid
    if (!firestore || typeof firestore !== 'object') return null;
    try {
      return query(
        collection(firestore, "dev_sandbox"), 
        orderBy("createdAt", "desc"),
        limit(10)
      );
    } catch (e) {
      console.error("Query Initialization Error:", e);
      return null;
    }
  }, [firestore]);

  const { data: logs, isLoading: loadingLogs } = useCollection(sandboxQuery);

  const handleAddTestDoc = async () => {
    if (!firestore) return;
    setIsWriting(true);
    try {
      const colRef = collection(firestore, "dev_sandbox");
      await addDoc(colRef, {
        message: "Development CRUD Sync Successful",
        author: user?.email || "Anonymous Dev",
        timestamp: new Date().toLocaleTimeString(),
        createdAt: serverTimestamp()
      });
      toast({ title: "Write Success", description: "Document pushed to Firestore." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Write Error", description: e.message });
    } finally {
      setIsWriting(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "dev_sandbox", id));
      toast({ title: "Document Deleted" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Error", description: e.message });
    }
  };

  if (isUserLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Code2 className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Next.js 15 + Firestore</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Developer Console</h1>
          <p className="text-muted-foreground">Unrestricted workbench for Firestore CRUD prototyping.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-primary shadow-lg shadow-primary/20" 
            onClick={handleAddTestDoc} 
            disabled={isWriting}
          >
            {isWriting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Test Cloud Write
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase text-primary">SDK Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Unified</div>
            <p className="text-[9px] text-muted-foreground mt-1">Firestore singleton active</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase text-green-500">Security Rules</CardTitle>
            <LockOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Unrestricted</div>
            <p className="text-[9px] text-muted-foreground mt-1">Global Read/Write enabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground">Latency</CardTitle>
            <Globe className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">12ms</div>
            <p className="text-[9px] text-muted-foreground mt-1">Real-time sync active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground">Runtime</CardTitle>
            <Terminal className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Turbopack</div>
            <p className="text-[9px] text-muted-foreground mt-1">Next.js 15.5.9</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Live CRUD Sandbox</CardTitle>
                <CardDescription>Real-time updates from <code>dev_sandbox</code> collection.</CardDescription>
              </div>
              <Badge variant="outline" className="animate-pulse">Live Feed</Badge>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cloud Message</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingLogs ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : logs?.map((log) => (
                <TableRow key={log.id} className="group">
                  <TableCell>
                    <div className="font-medium text-sm">{log.message}</div>
                    <div className="text-[10px] text-muted-foreground">{log.timestamp}</div>
                  </TableCell>
                  <TableCell className="text-xs">{log.author}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                      onClick={() => handleDeleteDoc(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!logs || logs.length === 0) && !loadingLogs && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20 text-muted-foreground italic">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p>No sandbox data found. Click "Test Cloud Write" above.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="space-y-6">
          <Card className="border-dashed border-2 bg-secondary/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Implementation Note
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-4 leading-relaxed">
              <p>
                The <code>collection()</code> error was resolved by unifying initialization in <code>lib/firebase.ts</code> and ensuring all SDK calls use the unified singleton via the <code>useFirestore()</code> hook.
              </p>
              <Separator />
              <p>
                This setup avoids duplicate SDK bundles in Next.js 15, which is the primary cause of instance validation failures.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
