
"use client";

export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import { 
  Banknote, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  User,
  MoreVertical,
  History,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import { accountingService } from "@/services/accounting-service";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { toast } from "@/hooks/use-toast";

export default function AdvancesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const advancesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "customer_advances");
  }, [db, user]);

  const { data: advances, isLoading } = useCollection(advancesQuery);

  const handleRecordAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      customerName: formData.get('customerName'),
      amount: parseFloat(formData.get('amount') as string),
      reference: formData.get('reference'),
      paymentMethod: formData.get('method'),
      date: new Date().toISOString()
    };

    accountingService.recordAdvance(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Advance Recorded", description: `Pre-payment from ${data.customerName} saved.` });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Customer Advances</h1>
          <p className="text-muted-foreground">Manage pre-payments and deposits from your B2B distribution partners.</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Record Advance</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleRecordAdvance}>
              <DialogHeader>
                <DialogTitle>Record New Deposit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Customer Name</label>
                  <Input name="customerName" required placeholder="Emirates Distribution Co" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Advance Amount ($)</label>
                    <Input name="amount" type="number" step="0.01" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Payment Reference</label>
                    <Input name="reference" placeholder="TT-9942-DXB" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Method</label>
                  <Select name="method" defaultValue="Bank Transfer">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Check">Post-Dated Check</SelectItem>
                      <SelectItem value="Cash">Cash Deposit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Finalize Record</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-green-500">Available Advance Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${advances?.reduce((acc, a) => acc + a.remainingAmount, 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Consumed (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$25,000</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Pending Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Records</div>
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
                <TableHead>Customer</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Remaining Balance</TableHead>
                <TableHead className="text-right">Initial Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances?.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(a.date)}</TableCell>
                  <TableCell className="font-medium">{a.customerName}</TableCell>
                  <TableCell className="font-mono text-xs">{a.reference}</TableCell>
                  <TableCell><Badge variant="outline">{a.paymentMethod}</Badge></TableCell>
                  <TableCell className="font-bold text-green-500">${a.remainingAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">${a.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!advances || advances.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">No advances recorded.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
