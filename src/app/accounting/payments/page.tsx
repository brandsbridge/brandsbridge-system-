"use client";

import React, { useMemo, useState, useEffect } from "react";
import { 
  Wallet, 
  Plus, 
  Loader2, 
  MoreVertical,
  Banknote,
  Download
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { paymentService } from "@/services/payment-service";
import { accountingService } from "@/services/accounting-service";
import { currencyService, SUPPORTED_CURRENCIES, type CurrencyCode, type ExchangeRates } from "@/services/currency-service";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function PaymentsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<CurrencyCode>('USD');
  const [paymentAmount, setPaymentAmount] = useState<string>('0');

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
    currencyService.fetchLatestRates(db).then(setExchangeRates);
  }, [db]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "payments");
    return currentUser.department === 'all' 
      ? colRef 
      : query(colRef, where("department", "==", currentUser.department));
  }, [db, user, currentUser]);

  const advancesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "customer_advances");
  }, [db, user]);

  const { data: paymentsData, isLoading: loadingPayments } = useCollection(paymentsQuery);
  const { data: advancesData, isLoading: loadingAdvances } = useCollection(advancesQuery);

  const payments = paymentsData || [];
  const advances = advancesData || [];

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = parseFloat(paymentAmount) || 0;
    const rate = exchangeRates?.rates[paymentCurrency] || 1;
    
    const data = {
      partyName: formData.get('partyName'),
      amount: amount,
      currency: paymentCurrency,
      exchangeRateAtPayment: rate,
      totalUSD: amount / rate,
      type: formData.get('type'),
      method: formData.get('method'),
      reference: formData.get('reference') || `REF-${Date.now().toString().slice(-4)}`,
      department: currentUser?.department || 'all',
      date: new Date().toISOString()
    };

    paymentService.createPayment(db, data);
    setIsPaymentModalOpen(false);
    toast({ title: "Payment Recorded", description: `Settlement of ${paymentCurrency} ${amount} saved.` });
  };

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
    setIsAdvanceModalOpen(false);
    toast({ title: "Advance Recorded", description: `Pre-payment from ${data.customerName} saved.` });
  };

  const usdPreview = useMemo(() => {
    if (!exchangeRates) return 0;
    return parseFloat(paymentAmount) / (exchangeRates.rates[paymentCurrency] || 1);
  }, [paymentAmount, paymentCurrency, exchangeRates]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Payments & Advances</h1>
          <p className="text-muted-foreground">Manage multi-currency bank transfers and pre-payments.</p>
        </div>
      </div>

      <Tabs defaultValue="ledger" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-12">
          <TabsTrigger value="ledger">Settlement Ledger</TabsTrigger>
          <TabsTrigger value="advances">Customer Advances</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-6 pt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Record Settlement</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <form onSubmit={handleRecordPayment}>
                  <DialogHeader>
                    <DialogTitle>Financial Settlement</DialogTitle>
                    <DialogDescription>Record inward customer payments or outward supplier settlements.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Payment Type</Label>
                        <Select name="type" defaultValue="received">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="received">Inward (Customer Pay)</SelectItem>
                            <SelectItem value="made">Outward (Exp/Supplier)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Currency</Label>
                        <Select value={paymentCurrency} onValueChange={(v: any) => setPaymentCurrency(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Amount ({paymentCurrency})</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          required 
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">USD Equivalent</Label>
                        <div className="h-10 px-3 py-2 bg-muted/50 rounded-md border flex items-center text-sm font-bold text-muted-foreground">
                          ≈ USD {usdPreview.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Contact / Party Name</Label>
                      <Input name="partyName" required placeholder="Who is this payment with?" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Payment Method</Label>
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
                        <Label className="text-xs font-bold uppercase">Reference #</Label>
                        <Input name="reference" placeholder="e.g. Bank Ref" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Finalize Record</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            {loadingPayments ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Original Currency</TableHead>
                    <TableHead className="text-right">USD Equivalent</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(pay => (
                    <TableRow key={pay.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(pay.date)}</TableCell>
                      <TableCell className="font-medium">{pay.partyName}</TableCell>
                      <TableCell>
                        <div className="font-bold text-xs">{pay.currency || 'USD'} {pay.amount?.toLocaleString()}</div>
                        <div className="text-[8px] text-muted-foreground">Rate: {pay.exchangeRateAtPayment?.toFixed(4) || '1.0000'}</div>
                      </TableCell>
                      <TableCell className={cn("text-right font-bold", pay.type === 'received' ? "text-green-500" : "text-red-500")}>
                        {pay.type === 'received' ? '+' : '-'}${ (pay.totalUSD || pay.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={pay.type === 'received' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                          {pay.type === 'received' ? 'Inward' : 'Outward'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No payments recorded.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="advances" className="space-y-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Customer Advances</h3>
              <p className="text-xs text-muted-foreground">Manage pre-payments and deposits from partners.</p>
            </div>
            <Dialog open={isAdvanceModalOpen} onOpenChange={setIsAdvanceModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Record Advance</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleRecordAdvance}>
                  <DialogHeader>
                    <DialogTitle>Record New Deposit</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Customer Name</Label>
                      <Input name="customerName" required placeholder="Emirates Distribution Co" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Advance Amount ($)</Label>
                        <Input name="amount" type="number" step="0.01" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Payment Reference</Label>
                        <Input name="reference" placeholder="TT-9942-DXB" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Method</Label>
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

          <Card>
            {loadingAdvances ? (
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
                  {advances.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(a.date)}</TableCell>
                      <TableCell className="font-medium">{a.customerName}</TableCell>
                      <TableCell className="font-mono text-xs">{a.reference}</TableCell>
                      <TableCell><Badge variant="outline">{a.paymentMethod}</Badge></TableCell>
                      <TableCell className="font-bold text-green-500">${a.remainingAmount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">${a.amount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {advances.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">No advances recorded.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
