
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { 
  Star, 
  Mail, 
  TrendingUp, 
  ImageIcon, 
  Plus, 
  Upload,
  Users as UsersIcon,
  Share2,
  ExternalLink,
  Loader2,
  Box
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { supplierService } from "@/services/supplier-service";
import { customerService } from "@/services/customer-service";
import { toast } from "@/hooks/use-toast";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
    ))}
  </div>
);

export default function ChocolateDepartmentPage() {
  const departmentId = "chocolate";
  const name = "Chocolate Market";
  const manager = "DIA Manager";
  
  const [activeTab, setActiveTab] = useState("suppliers");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const db = useFirestore();

  // Firestore Queries for this specific market
  const suppliersQuery = useMemoFirebase(() => query(collection(db, "suppliers"), where("departments", "array-contains", departmentId)), [db, departmentId]);
  const customersQuery = useMemoFirebase(() => query(collection(db, "customers"), where("departments", "array-contains", departmentId)), [db, departmentId]);
  const productsQuery = useMemoFirebase(() => query(collection(db, "products"), where("department", "==", departmentId)), [db, departmentId]);
  const stocksQuery = useMemoFirebase(() => query(collection(db, "stocks"), where("department", "==", departmentId)), [db, departmentId]);

  const { data: suppliers = [], isLoading: loadingSuppliers } = useCollection(suppliersQuery);
  const { data: buyers = [], isLoading: loadingBuyers } = useCollection(customersQuery);
  const { data: products = [] } = useCollection(productsQuery);
  const { data: stocks = [] } = useCollection(stocksQuery);

  const priceIntellData = useMemo(() => {
    return products.map(p => {
      const pStocks = stocks.filter(s => s.productId === p.id).sort((a, b) => a.price - b.price);
      const bestDeal = pStocks[0];
      const sellingPrice = bestDeal ? bestDeal.price * (1 + (p.margin || 10) / 100) : 0;
      
      return {
        ...p,
        bestPrice: bestDeal?.price || 0,
        supplier: suppliers.find(s => s.id === bestDeal?.supplierId)?.name || "N/A",
        quantity: bestDeal?.quantity || 0,
        leadTime: bestDeal?.leadTime || 0,
        sellingPrice,
        profit: sellingPrice - (bestDeal?.price || 0),
        allPrices: pStocks.map(s => ({
          name: suppliers.find(sup => sup.id === s.supplierId)?.name || 'Unknown',
          price: s.price
        }))
      };
    });
  }, [products, stocks, suppliers]);

  const stats = useMemo(() => {
    const avgSupRating = suppliers.reduce((acc, s) => acc + (s.internalRating || 3), 0) / (suppliers.length || 1);
    const avgBuyRating = buyers.reduce((acc, b) => acc + (b.internalRating || 3), 0) / (buyers.length || 1);
    return {
      suppliersCount: suppliers.length,
      sharedSuppliers: suppliers.filter(s => s.departments && s.departments.length > 1).length,
      avgSupRating,
      buyersCount: buyers.length,
      sharedBuyers: buyers.filter(b => b.departments && b.departments.length > 1).length,
      avgBuyRating,
      bestDeals: priceIntellData.filter(d => d.bestPrice > 0).length,
      totalPipeline: priceIntellData.reduce((acc, p) => acc + (p.sellingPrice * p.quantity), 0)
    };
  }, [suppliers, buyers, priceIntellData]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const type = formData.get('type') as 'supplier' | 'buyer';
    
    const baseData = {
      name: formData.get('companyName'),
      email: formData.get('email'),
      country: formData.get('country'),
      departments: [departmentId],
      createdAt: new Date().toISOString()
    };

    if (type === 'supplier') {
      supplierService.createSupplier(db, {
        ...baseData,
        natureOfBusiness: 'Manufacturer',
        recordStatus: 'Active - Verified',
        dataCompleteness: 40,
        priorityLevel: 'Medium',
        internalRating: 3
      });
    } else {
      customerService.createCustomer(db, {
        ...baseData,
        accountStatus: 'prospect',
        accountHealth: 'healthy',
        dataCompleteness: 40,
        assignedManager: manager,
        internalRating: 3
      });
    }

    setIsQuickAddOpen(false);
    toast({ 
      title: "Entity Registered", 
      description: `New ${type} successfully added to the ${name} database.` 
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{name}</h1>
          <p className="text-muted-foreground">Managed by <strong>{manager}</strong> | Scoped Firestore Access.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/uploads">
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
          </Link>
          
          <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Quick Add</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleQuickAdd}>
                <DialogHeader>
                  <DialogTitle>Quick Register Entity</DialogTitle>
                  <DialogDescription>Add a new partner or client to this market segment instantly.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Entity Type</label>
                    <Select name="type" defaultValue="buyer">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Corporate Buyer (Customer)</SelectItem>
                        <SelectItem value="supplier">Manufacturing Partner (Supplier)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Company Name</label>
                    <Input name="companyName" required placeholder="e.g. Global Trade LLC" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Primary Email</label>
                      <Input name="email" type="email" required placeholder="contact@company.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Base Country</label>
                      <Input name="country" required placeholder="e.g. Turkey" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsQuickAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Complete Registration</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Suppliers</CardTitle>
            <Badge variant="outline" className="text-[8px]">{stats.sharedSuppliers} Shared</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{loadingSuppliers ? "..." : stats.suppliersCount}</div>
            <div className="mt-1 flex items-center gap-1">
              <StarRating rating={stats.avgSupRating} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Active Buyers</CardTitle>
            <Badge variant="outline" className="text-[8px]">{stats.sharedBuyers} Shared</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{loadingBuyers ? "..." : stats.buyersCount}</div>
            <div className="mt-1 flex items-center gap-1">
              <StarRating rating={stats.avgBuyRating} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Best Deals</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.bestDeals}</div>
            <p className="text-[10px] text-green-500 flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" /> Live Data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Shared Clients</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.sharedSuppliers + stats.sharedBuyers}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Cross-department</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">${(stats.totalPipeline / 1000).toFixed(1)}k</div>
            <p className="text-[10px] text-accent mt-1">Projected</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="buyers">Buyers</TabsTrigger>
          <TabsTrigger value="intelligence">Price Intelligence</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4 pt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Lead Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSuppliers ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : suppliers.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/suppliers/${s.id}`} className="font-medium hover:text-primary flex items-center gap-1 group">
                          {s.name}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </Link>
                        {s.departments && s.departments.length > 1 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Share2 className="h-3 w-3 text-accent" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-[10px]">Shared with: {s.departments.filter((d: string) => d !== departmentId).join(", ")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{s.email} | {s.country}</div>
                    </TableCell>
                    <TableCell>{s.pricing?.leadTime || 7} days</TableCell>
                    <TableCell>
                      <Badge variant={s.recordStatus?.includes('Verified') ? 'default' : 'secondary'} className={s.recordStatus?.includes('Verified') ? 'bg-green-500' : ''}>
                        {s.recordStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StarRating rating={s.internalRating || 3} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="text-[10px] h-7">
                        <Mail className="mr-1 h-3 w-3" /> Request Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingSuppliers && suppliers.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No suppliers linked to this market segment.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="buyers" className="space-y-4 pt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer Name</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBuyers ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : buyers.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/customers/${b.id}`} className="font-medium hover:text-primary flex items-center gap-1 group">
                          {b.name}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </Link>
                        {b.departments && b.departments.length > 1 && (
                          <Badge variant="outline" className="text-[8px] flex items-center gap-1 border-accent text-accent">
                            <Share2 className="h-2 w-2" /> Shared
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{b.country} | {b.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{b.accountStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      <StarRating rating={b.internalRating || 3} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">Edit Notes</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingBuyers && buyers.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">No corporate buyers registered in this market.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {priceIntellData.filter(p => p.allPrices.length > 0).map(p => (
              <Card key={p.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{p.name}</CardTitle>
                    </div>
                    {p.isFeatured && <Badge className="bg-purple-500 animate-pulse">Best Deal</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={p.allPrices} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis fontSize={8} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '10px' }} />
                        <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                          {p.allPrices.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.price === p.bestPrice ? '#10B981' : '#94A3B8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map(p => (
              <Card key={p.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                <div className="aspect-square w-full bg-secondary flex items-center justify-center relative">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                  <Button size="icon" variant="secondary" className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <h4 className="font-bold text-xs">{p.name}</h4>
                  <div className="mt-3 flex items-center justify-between border-t pt-2">
                    <span className="text-[8px] uppercase text-muted-foreground">Market Low:</span>
                    <span className="text-xs font-bold text-accent">${priceIntellData.find(d => d.id === p.id)?.bestPrice.toFixed(2) || '0.00'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
