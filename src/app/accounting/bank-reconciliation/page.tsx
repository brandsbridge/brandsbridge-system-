"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useRef } from "react";
import {
  Upload,
  Loader2,
  Eye,
  Trash2,
  CheckCircle2,
  Search,
  Plus,
  Landmark,
  AlertTriangle,
  FileText as FileIcon,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function BankReconciliationPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [periodMonth, setPeriodMonth] = useState(String(new Date().getMonth()));
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statementsQuery = useMemoFirebase(
    () => (user ? collection(db, "bankStatements") : null),
    [db, user]
  );
  const { data: statementsData, isLoading } = useCollection(statementsQuery);
  const statements = statementsData || [];

  const filteredStatements = statements
    .filter((s: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.bankName?.toLowerCase().includes(q) ||
        s.period?.toLowerCase().includes(q) ||
        s.status?.toLowerCase().includes(q)
      );
    })
    .sort((a: any, b: any) => {
      const da = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const db2 = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return db2 - da;
    });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = [
      "text/csv",
      "application/pdf",
      "application/vnd.ms-excel",
      "text/plain",
    ];
    const validExt = file.name.match(/\.(csv|pdf)$/i);
    if (!validTypes.includes(file.type) && !validExt) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Only CSV and PDF files are accepted.",
      });
      return;
    }
    setUploadFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !bankName.trim()) return;

    setIsSubmitting(true);
    const month = parseInt(periodMonth);
    const year = parseInt(periodYear);
    const timestamp = Date.now();
    const safeBankName = bankName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `bank-statements/${year}/${month + 1}/${safeBankName}_${timestamp}`;
    const period = `${MONTHS[month]} ${year}`;

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, uploadFile);

      const fileUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setUploadProgress(progress);
          },
          reject,
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      const docRef = doc(collection(db, "bankStatements"));
      await setDoc(docRef, {
        bankName: bankName.trim(),
        period,
        fileUrl,
        fileName: uploadFile.name,
        storagePath,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.profile?.name || "System",
        status: "pending",
      });

      toast({ title: "Statement Uploaded", description: `${bankName} - ${period}` });
      setIsUploadOpen(false);
      setBankName("");
      setUploadFile(null);
      setUploadProgress(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkReconciled = async (id: string) => {
    await setDoc(doc(db, "bankStatements", id), { status: "reconciled" }, { merge: true });
    toast({ title: "Status Updated", description: "Marked as reconciled." });
  };

  const handleMarkPartial = async (id: string) => {
    await setDoc(doc(db, "bankStatements", id), { status: "partial" }, { merge: true });
    toast({ title: "Status Updated", description: "Marked as partial." });
  };

  const handleDelete = async (statement: any) => {
    try {
      if (statement.storagePath) {
        const storageRef = ref(storage, statement.storagePath);
        await deleteObject(storageRef).catch(() => {});
      }
      await deleteDoc(doc(db, "bankStatements", statement.id));
      toast({ title: "Deleted", description: "Bank statement removed." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "reconciled":
        return <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-[10px]">Reconciled</Badge>;
      case "partial":
        return <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 text-[10px]">Partial</Badge>;
      default:
        return <Badge className="bg-yellow-500/15 text-yellow-500 border-yellow-500/30 text-[10px]">Pending</Badge>;
    }
  };

  // Check if any statement was uploaded in the last 30 days
  const hasRecentStatement = statements.some((s: any) => {
    if (!s.uploadedAt) return false;
    const uploadDate = new Date(s.uploadedAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return uploadDate >= thirtyDaysAgo;
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Bank Reconciliation</h1>
          <p className="text-muted-foreground">Upload and manage bank statements for reconciliation.</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={(open) => {
          setIsUploadOpen(open);
          if (!open) {
            setBankName("");
            setUploadFile(null);
            setUploadProgress(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Upload Statement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleUpload}>
              <DialogHeader>
                <DialogTitle>Upload Bank Statement</DialogTitle>
                <DialogDescription>Upload a CSV or PDF bank statement for reconciliation.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Bank Name</Label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Emirates NBD, ADCB, HSBC..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Month</Label>
                    <Select value={periodMonth} onValueChange={setPeriodMonth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Year</Label>
                    <Select value={periodYear} onValueChange={setPeriodYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {years.map(y => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Statement File</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {!uploadFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Click to upload CSV or PDF</p>
                    </button>
                  ) : (
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center shrink-0">
                            <FileIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-xs truncate">{uploadFile.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => {
                            setUploadFile(null);
                            setUploadProgress(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {uploadProgress !== null && uploadProgress < 100 && (
                        <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!uploadFile || !bankName.trim() || isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                  ) : (
                    "Upload Statement"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reminder banner */}
      {!isLoading && !hasRecentStatement && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-600">No bank statement uploaded this month.</p>
            <p className="text-xs text-muted-foreground">Upload your latest bank statement to keep reconciliation up to date.</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10" onClick={() => setIsUploadOpen(true)}>
            Upload Now
          </Button>
        </div>
      )}

      {/* Statements table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Bank Statements</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search statements..."
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Uploaded</TableHead>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStatements.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.uploadedAt
                        ? new Date(s.uploadedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{s.bankName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.period}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px] inline-block">
                        {s.fileName}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{s.uploadedBy}</TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.fileUrl && (
                          <a href={s.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="View file">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        {s.status !== "reconciled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-500"
                            title="Mark as reconciled"
                            onClick={() => handleMarkReconciled(s.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {s.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-blue-500 text-[10px] px-2"
                            title="Mark as partial"
                            onClick={() => handleMarkPartial(s.id)}
                          >
                            Partial
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Delete"
                          onClick={() => handleDelete(s)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStatements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                      No bank statements found. Upload your first statement to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
