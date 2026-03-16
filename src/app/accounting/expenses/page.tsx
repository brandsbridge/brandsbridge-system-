
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Receipt, 
  Plus, 
  Search, 
  Download, 
  MoreVertical, 
  Loader2, 
  FileText, 
  Paperclip,
  Trash2,
  DollarSign,
  User,
  Factory
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { expenseService } from "@/services/expense-service";
import { CHART_OF_ACCOUNTS } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { toast } from "@/hooks/use-toast";

export default function ExpensesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // Fetch Suppliers and Customers for dropdowns
  const suppliersQuery = useMemoFirebase(() => user ? collection(db, "suppliers") : null, [db, user]);
  const customersQuery = useMemoFirebase(() => user ? collection(db, "customers") : null, [db, user]);
  const expensesQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "expenses");
    return currentUser.department === 'all' 
      ? colRef 
      : query(colRef, where("department", "==", currentUser.department));
  }, [db, user, currentUser]);

  const { data: suppliers } = useCollection(suppliersQuery);
  const { data: customers } = useCollection(customersQuery);
  const { data: expenses, isLoading } = useCollection(expensesQuery);

  const expenseAccounts = CHART_OF_ACCOUNTS.filter(a => a.group === 'Expenses');
  const paymentAccounts = CHART_OF_ACCOUNTS.filter(a => a.code === '1000' || a.name.includes('Bank') || a.name.includes('Cash'));

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const data = {
      accountCode: formData.get('accountCode'),
      accountName: expenseAccounts.find(a => a.code === formData.get('accountCode'))?.name,
      paidThrough: formData.get('paidThrough'),
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') || 'USD',
      vendorId: formData.get('vendorId'),
      vendorName: suppliers?.find(s => s.id === formData.get('vendorId'))?.name,
      reference: formData.get('reference'),
      notes: formData.get('notes'),
      customerId: formData.get('customerId'),
      customerName: customers?.find(c => c.id === formData.get('customerId'))?.name,
      isBillable: formData.get('isBillable') === 'on',
      date: new Date().toISOString(),
      department: currentUser?.department || 'all',
      createdBy: currentUser?.name || 'System'
    };

    expenseService.createExpense(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Expense Recorded", description: "The transaction has been logged in the general ledger." });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Expenses</h1>
          <p className="text-muted-foreground">Track departmental spending and manage billable outlays.</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Record New Expense</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleRecordExpense}>
              <DialogHeader>
                <DialogTitle>Expense Entry</DialogTitle>
                <DialogDescription>Record outgoing business costs and map them to the correct ledger account.</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-6 py-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Expense Account</Label>
                    <Select name="accountCode" required>
                      <SelectTrigger><SelectValue placeholder="Choose account..." /></SelectTrigger>
                      <SelectContent>
                        {expenseAccounts.map(acc => (
                          <SelectItem key={acc.code} value={acc.code}>{acc.code} - {acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Paid Through</Label>
                    <Select name="paidThrough" defaultValue="Cash">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Petty Cash</SelectItem>
                        <SelectItem value="Bank Account">Corporate Bank Account</SelectItem>
                        <SelectItem value="Credit Card">Business Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Vendor / Supplier</Label>
                    <Select name="vendorId">
                      <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                      <SelectContent>
                        {suppliers?.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Amount</Label>
                      <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Currency</Label>
                      <Select name="currency" defaultValue="USD">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="AED">AED (د.إ)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Reference #</Label>
                    <Input name="reference" placeholder="Receipt or Invoice #" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Notes</Label>
                    <Textarea name="notes" className="h-20" placeholder="Purpose of this expense..." />
                  </div>

                  <div className="p-4 bg-secondary/30 rounded-lg border space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase">Bill to Customer</Label>
                      <Switch name="isBillable" />
                    </div>
                    <div className="space-y-2">
                      <Select name="customerId">
                        <SelectTrigger><SelectValue placeholder="Choose customer..." /></SelectTrigger>
                        <SelectContent>
                          {customers?.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Button variant="ghost" size="sm" type="button" className="text-xs">
                      <Paperclip className="mr-2 h-3 w-3" /> Attach Receipt
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit">Finalize Record</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Expenses (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${expenses?.reduce((acc, e) => acc + e.amount, 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Billable to Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              ${expenses?.filter(e => e.isBillable).reduce((acc, e) => acc + e.amount, 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Pending Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between border-b space-y-0">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search expenses..." className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
        </CardHeader>
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor / Account</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(e.date)}</TableCell>
                  <TableCell>
                    <div className="font-bold text-sm">{e.vendorName || 'General Expense'}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{e.accountName}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.reference || '-'}</TableCell>
                  <TableCell>
                    {e.isBillable ? (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-[10px]">Billable</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Non-Billable</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {e.currency === 'AED' ? 'د.إ' : '$'}{e.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!expenses || expenses.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">No expense records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
