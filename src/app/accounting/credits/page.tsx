
"use client";

import React, { useState } from "react";
import { 
  FileMinus, 
  Plus, 
  Search, 
  Download, 
  MoreVertical,
  Undo2,
  AlertCircle,
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

export default function CreditNotesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const creditsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "credit_notes");
  }, [db, user]);

  const { data: credits, isLoading } = useCollection(creditsQuery);

  const handleCreateCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      customerName: formData.get('customerName'),
      amount: parseFloat(formData.get('amount') as string),
      reason: formData.get('reason'),
      invoiceId: formData.get('invoiceId') || 'Open Credit',
      date: new Date().toISOString()
    };

    accountingService.createCreditNote(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Credit Note Issued", description: `Document generated for ${data.customerName}.` });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Credit & Debit Notes</h1>
          <p className="text-muted-foreground">Handle sales returns, pricing adjustments, and supplier chargebacks.</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Issue Credit Note</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateCredit}>
              <DialogHeader>
                <DialogTitle>Generate Credit Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Customer</label>
                  <Input name="customerName" required placeholder="Gulf Food Industries" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Credit Amount</label>
                    <Input name="amount" type="number" step="0.01" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Linked Invoice #</label>
                    <Input name="invoiceId" placeholder="INV-1004 (Optional)" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Reason for Credit</label>
                  <Select name="reason" defaultValue="Returned Goods">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Returned Goods">Returned Goods</SelectItem>
                      <SelectItem value="Pricing Discrepancy">Pricing Discrepancy</SelectItem>
                      <SelectItem value="Damage in Transit">Damage in Transit</SelectItem>
                      <SelectItem value="Promotional Discount">Promotional Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Generate Document</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-red-500">Unapplied Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${credits?.filter(c => c.status === 'open').reduce((acc, c) => acc + c.remainingAmount, 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Applied (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Supplier Debit Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Active</div>
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
                <TableHead>Note #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits?.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-bold">{c.number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{c.customerName}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{c.invoiceId}</div>
                  </TableCell>
                  <TableCell className="text-xs">{c.reason}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'open' ? 'default' : 'secondary'}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-red-500">${c.remainingAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold">${c.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!credits || credits.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">No credit notes found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
