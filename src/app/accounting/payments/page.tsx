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
  Loader2,
  FileText,
  CreditCard,
  ArrowRightLeft,
  AlertCircle,
  TrendingUp,
  TrendingDown
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, doc, getDoc } from "firebase/firestore";
import { paymentService } from "@/services/payment-service";
import { currencyService, SUPPORTED_CURRENCIES, type CurrencyCode, type ExchangeRates } from "@/services/currency-service";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { CHART_OF_ACCOUNTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function PaymentsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const { data: payments, isLoading } = useCollection(paymentsQuery);

  const stats = useMemo(() => {
    const safePayments = payments || [];
    const received = safePayments.filter(p => p.type === 'received').reduce((acc, p) => acc + (p.totalUSD || p.amount || 0), 0);
    const made = safePayments.filter(p => p.type === 'made').reduce((acc, p) => acc + (p.totalUSD || p.amount || 0), 0);
    return { received, made, net: received - made };
  }, [payments]);

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
      paidThrough: formData.get('paidThrough'),
      reference: formData.get('reference') || `REF-${Date.now().toString().slice(-4)}`,
      notes: formData.get('notes'),
      department: currentUser?.department || 'all',
      date: new Date().toISOString()
    };

    paymentService.createPayment(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Payment Recorded", description: `Financial settlement of ${paymentCurrency} ${amount} saved.` });
  };

  const usdPreview = useMemo(() => {
    if (!exchangeRates) return 0;
    return parseFloat(paymentAmount) / (exchangeRates.rates[paymentCurrency] || 1);
  }, [paymentAmount, paymentCurrency, exchangeRates]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Payments Ledger</h1>
          <p className="text-muted-foreground">Historical record of all multi-currency bank transfers.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Record Payment</Button>
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
            <CardTitle className="text-xs font-bold uppercase text-green-500">Total Received (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${stats.received.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-red-500">Total Paid (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${stats.made.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-primary">Net USD Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${stats.net.toLocaleString()}</div>
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
                <TableHead>Party Name</TableHead>
                <TableHead>Original Currency</TableHead>
                <TableHead className="text-right">USD Equivalent</TableHead>
                <TableHead className="text-right">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments || []).map(pay => (
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
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
