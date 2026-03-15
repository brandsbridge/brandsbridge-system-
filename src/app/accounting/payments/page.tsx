
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  Search, 
  Download, 
  MoreVertical,
  Banknote,
  Clock,
  Plus,
  Loader2
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { paymentService } from "@/services/payment-service";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function PaymentsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const paymentsQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "payments");
    return currentUser.department === 'all' 
      ? colRef 
      : query(colRef, where("department", "==", currentUser.department));
  }, [db, user, currentUser]);

  const { data: payments, isLoading } = useCollection(paymentsQuery);

  const stats = useMemo(() => {
    const safePayments = payments || [];
    const received = safePayments.filter(p => p.type === 'received').reduce((acc, p) => acc + (p.amount || 0), 0);
    const made = safePayments.filter(p => p.type === 'made').reduce((acc, p) => acc + (p.amount || 0), 0);
    return { received, made, net: received - made };
  }, [payments]);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      partyName: formData.get('partyName'),
      amount: parseFloat(formData.get('amount') as string),
      type: formData.get('type'),
      method: formData.get('method'),
      reference: formData.get('reference') || `REF-${Date.now().toString().slice(-4)}`,
      department: currentUser?.department === 'all' ? formData.get('department') : currentUser?.department,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    paymentService.createPayment(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Payment Recorded", description: `Financial settlement saved to ledger.` });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Payments Ledger</h1>
          <p className="text-muted-foreground">Historical record of all bank transfers and cash settlements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleRecordPayment}>
                <DialogHeader>
                  <DialogTitle>Record New Settlement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Party Name</label>
                    <Input name="partyName" required placeholder="Customer or Supplier name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Amount ($)</label>
                      <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Payment Type</label>
                      <Select name="type" defaultValue="received">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="received">Inward (Customer Pay)</SelectItem>
                          <SelectItem value="made">Outward (Exp/Supplier)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Method</label>
                      <Select name="method" defaultValue="Bank Transfer">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Reference #</label>
                      <Input name="reference" placeholder="e.g. TXN-9942" />
                    </div>
                  </div>
                  {currentUser?.department === 'all' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Market Segment</label>
                      <Select name="department" defaultValue="chocolate">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chocolate">Chocolate</SelectItem>
                          <SelectItem value="cosmetics">Cosmetics</SelectItem>
                          <SelectItem value="detergents">Detergents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Finalize Record</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-green-500">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${stats.received.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-red-500">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${stats.made.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-primary">Net Cash Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${stats.net.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or reference..." className="pl-9" />
          </div>
          <Badge variant="outline" className="text-primary border-primary">LIVE LEDGER</Badge>
        </CardHeader>
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments || []).map(pay => (
                <TableRow key={pay.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(pay.date)}</TableCell>
                  <TableCell className="font-medium">
                    {pay.partyName}
                    <div className="text-[8px] uppercase text-muted-foreground">{pay.department} Market</div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px]">{pay.reference}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] capitalize">{pay.method}</Badge>
                  </TableCell>
                  <TableCell>
                    {pay.type === 'received' ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Inward</Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Outward</Badge>
                    )}
                  </TableCell>
                  <TableCell className={cn("text-right font-bold", pay.type === 'received' ? "text-green-500" : "text-red-500")}>
                    {pay.type === 'received' ? '+' : '-'}${pay.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {(!payments || payments.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">No payment records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
