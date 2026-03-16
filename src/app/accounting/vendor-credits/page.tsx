
"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  Plus, 
  Search, 
  Factory, 
  Calendar,
  AlertTriangle,
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
  DialogFooter
} from "@/components/ui/dialog";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import { accountingService } from "@/services/accounting-service";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { toast } from "@/hooks/use-toast";

export default function VendorCreditsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const creditsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "vendor_credits");
  }, [db, user]);

  const { data: credits, isLoading } = useCollection(creditsQuery);

  const handleRecordVendorCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      supplierName: formData.get('supplierName'),
      amount: parseFloat(formData.get('amount') as string),
      reason: formData.get('reason'),
      date: new Date().toISOString()
    };

    accountingService.recordVendorCredit(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Vendor Credit Logged", description: `Credit from ${data.supplierName} added to balances.` });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Vendor Credits</h1>
          <p className="text-muted-foreground">Track credits issued by manufacturing partners for future procurement.</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Log Vendor Credit</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleRecordVendorCredit}>
              <DialogHeader>
                <DialogTitle>Record Supplier Credit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Supplier</label>
                  <Input name="supplierName" required placeholder="Istanbul Industrial Group" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Credit Amount</label>
                  <Input name="amount" type="number" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Reason</label>
                  <Input name="reason" placeholder="Returned defective batch" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Record</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-blue-500">Total Vendor Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              ${credits?.reduce((acc, c) => acc + c.remainingAmount, 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Aging (0-30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$15,000</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-orange-500">Over 90 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">$2,400</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Remaining Credit</TableHead>
                <TableHead className="text-right">Total Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits?.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(c.date)}</TableCell>
                  <TableCell className="font-medium">{c.supplierName}</TableCell>
                  <TableCell className="text-xs">{c.reason}</TableCell>
                  <TableCell className="font-bold text-blue-500">${c.remainingAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">${c.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {(!credits || credits.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No vendor credits logged.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
