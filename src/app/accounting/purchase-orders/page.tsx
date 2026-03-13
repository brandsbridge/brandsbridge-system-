"use client";

import React, { useMemo } from "react";
import { 
  Plus, 
  Search, 
  FileText, 
  MoreVertical, 
  CheckCircle2, 
  Package, 
  Truck, 
  AlertTriangle 
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MOCK_PURCHASE_ORDERS } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

export default function PurchaseOrdersPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Closed': return <Badge className="bg-secondary text-secondary-foreground">Closed</Badge>;
      case 'Fully Received': return <Badge className="bg-green-500">Fully Received</Badge>;
      case 'Partially Received': return <Badge className="bg-orange-500">Partial</Badge>;
      case 'Confirmed': return <Badge className="bg-blue-500">Confirmed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Purchase Orders</h1>
          <p className="text-muted-foreground">Supply chain procurement and stock acquisition tracking.</p>
        </div>
        <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Create PO</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase text-muted-foreground">Active POs</span>
            </div>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-bold uppercase text-muted-foreground">In Transit</span>
            </div>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-bold uppercase text-muted-foreground">Discrepancies</span>
            </div>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs font-bold uppercase text-muted-foreground">Received (MTD)</span>
            </div>
            <div className="text-2xl font-bold">$42,500</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search PO number or supplier..." className="pl-9" />
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Dept</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_PURCHASE_ORDERS.map(po => (
              <TableRow key={po.id}>
                <TableCell className="font-mono text-xs font-bold">{po.number}</TableCell>
                <TableCell className="font-medium">{po.supplierName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(po.date)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-[10px]">{po.department}</Badge>
                </TableCell>
                <TableCell>{getStatusBadge(po.status)}</TableCell>
                <TableCell className="text-right font-bold">${po.total.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> View PO</DropdownMenuItem>
                      <DropdownMenuItem><Package className="mr-2 h-4 w-4" /> Record Receipt</DropdownMenuItem>
                      <DropdownMenuItem className="text-blue-500">Convert to Invoice</DropdownMenuItem>
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
