
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  FileText, 
  MoreVertical, 
  CheckCircle2, 
  Package, 
  Truck, 
  AlertTriangle,
  Loader2,
  Calendar,
  Paperclip
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
import { collection, query, where } from "firebase/firestore";
import { purchaseOrderService } from "@/services/purchase-order-service";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function PurchaseOrdersPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // Fetch Suppliers for dropdown
  const suppliersQuery = useMemoFirebase(() => user ? collection(db, "suppliers") : null, [db, user]);
  const { data: suppliers } = useCollection(suppliersQuery);

  const poQuery = useMemoFirebase(() => {
    if (!user || !currentUser) return null;
    const colRef = collection(db, "purchase_orders");
    return currentUser.department === 'all' 
      ? colRef 
      : query(colRef, where("department", "==", currentUser.department));
  }, [db, user, currentUser]);

  const { data: purchaseOrders, isLoading } = useCollection(poQuery);

  const filteredPOs = useMemo(() => {
    const safePOs = purchaseOrders || [];
    return safePOs.filter(po => {
      const matchesSearch = (po.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (po.number || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [purchaseOrders, searchTerm]);

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      number: formData.get('reference') || `PO-${Date.now().toString().slice(-6)}`,
      supplierId: formData.get('supplierId'),
      supplierName: suppliers?.find(s => s.id === formData.get('supplierId'))?.name || formData.get('manualSupplier'),
      total: parseFloat(formData.get('total') as string),
      status: 'Confirmed',
      notes: formData.get('notes'),
      date: new Date().toISOString(),
      department: currentUser?.department || 'all',
      createdAt: new Date().toISOString()
    };

    purchaseOrderService.createPO(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Purchase Order Created", description: `Record ${data.number} sent to supplier.` });
  };

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Purchase Orders</h1>
          <p className="text-muted-foreground">Supply chain procurement and stock acquisition tracking.</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Create PO</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreatePO}>
              <DialogHeader>
                <DialogTitle>Issue Purchase Order</DialogTitle>
                <DialogDescription>Formal procurement request for your manufacturing partners.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Select Supplier</Label>
                    <Select name="supplierId">
                      <SelectTrigger><SelectValue placeholder="Verified partners..." /></SelectTrigger>
                      <SelectContent>
                        {suppliers?.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Manual Vendor (Optional)</Label>
                    <Input name="manualSupplier" placeholder="If not in directory..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Estimated Total ($)</Label>
                    <Input name="total" type="number" step="0.01" required placeholder="0.00" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Reference / PO #</Label>
                    <Input name="reference" placeholder="Auto-generated if empty" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Internal Notes</Label>
                    <Textarea name="notes" placeholder="Instructions for logistics..." />
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Button variant="ghost" size="sm" type="button" className="text-xs">
                      <Paperclip className="mr-2 h-3 w-3" /> Attach Quote PDF
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit">Submit PO</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase text-muted-foreground">Active POs</span>
            </div>
            <div className="text-2xl font-bold">{filteredPOs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-bold uppercase text-muted-foreground">In Transit</span>
            </div>
            <div className="text-2xl font-bold">
              {filteredPOs.filter(po => po.status === 'Confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-bold uppercase text-muted-foreground">Open Issues</span>
            </div>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs font-bold uppercase text-muted-foreground">Value (MTD)</span>
            </div>
            <div className="text-2xl font-bold">
              ${filteredPOs.reduce((acc, po) => acc + (po.total || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search PO number or supplier..." 
              className="pl-9" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
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
              {filteredPOs.map(po => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-xs font-bold">{po.number}</TableCell>
                  <TableCell className="font-medium">{po.supplierName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(po.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[10px]">{po.department}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(po.status)}</TableCell>
                  <TableCell className="text-right font-bold text-accent">${(po.total || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> View PO</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => purchaseOrderService.updatePO(db, po.id, { status: 'Fully Received' })}><Package className="mr-2 h-4 w-4" /> Record Receipt</DropdownMenuItem>
                        <DropdownMenuItem className="text-blue-500">Convert to Invoice</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPOs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">No purchase orders found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
