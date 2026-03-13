"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreVertical, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Eye
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MOCK_INVOICES } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = useMemo(() => {
    return MOCK_INVOICES.filter(inv => {
      const matchesSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           inv.number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = MOCK_INVOICES.reduce((acc, i) => acc + i.total, 0);
    const paid = MOCK_INVOICES.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.total, 0);
    const pending = MOCK_INVOICES.filter(i => ['pending', 'overdue'].includes(i.status)).reduce((acc, i) => acc + i.total, 0);
    return { total, paid, pending };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" /> Paid</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'overdue': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Overdue</Badge>;
      case 'partially paid': return <Badge variant="outline" className="border-blue-500 text-blue-500 gap-1"><Clock className="h-3 w-3" /> Partial</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Sales Invoices</h1>
          <p className="text-muted-foreground">Manage billing cycles and track accounts receivable.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> New Invoice</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Amount Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${stats.paid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Outstanding (AR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">${stats.pending.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by invoice # or customer..." 
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={statusFilter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={statusFilter === 'paid' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter('paid')}
            >
              Paid
            </Button>
            <Button 
              variant={statusFilter === 'pending' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </Button>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Dept</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map(inv => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs font-bold">{inv.number}</TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{inv.customerName}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{inv.createdBy}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-[10px]">{inv.department}</Badge>
                </TableCell>
                <TableCell>{getStatusBadge(inv.status)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(inv.dueDate)}</TableCell>
                <TableCell className="text-right font-bold text-accent">
                  ${inv.total.toLocaleString()}
                  <div className="text-[8px] text-muted-foreground font-normal">Incl. 5% VAT</div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                      <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                      <DropdownMenuItem><Send className="mr-2 h-4 w-4" /> Send Email</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-green-500 font-bold">Record Payment</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
