"use client";

import React, { useMemo } from "react";
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  Search, 
  Download, 
  MoreVertical,
  Banknote,
  Clock
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
import { MOCK_PAYMENTS } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
  const stats = useMemo(() => {
    const received = MOCK_PAYMENTS.filter(p => p.type === 'received').reduce((acc, p) => acc + p.amount, 0);
    const made = MOCK_PAYMENTS.filter(p => p.type === 'made').reduce((acc, p) => acc + p.amount, 0);
    return { received, made, net: received - made };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Payments Ledger</h1>
          <p className="text-muted-foreground">Historical record of all bank transfers and cash settlements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button className="bg-primary">Record Payment</Button>
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
        <CardHeader className="p-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or reference..." className="pl-9" />
          </div>
        </CardHeader>
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
            {MOCK_PAYMENTS.map(pay => (
              <TableRow key={pay.id}>
                <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(pay.date)}</TableCell>
                <TableCell className="font-medium">{pay.partyName}</TableCell>
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
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
