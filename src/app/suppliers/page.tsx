"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, Search, Edit, Trash2, ExternalLink, Filter, 
  Download, Printer, CheckCircle2, AlertCircle, 
  ShieldCheck, Info, Star, MoreVertical
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
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
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MOCK_SUPPLIERS, Supplier } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [tierFilter, setPriceTier] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [natureFilter, setNatureFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredSuppliers = useMemo(() => {
    return MOCK_SUPPLIERS.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.contacts.sales.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === "all" || s.country === countryFilter;
      const matchesTier = tierFilter === "all" || s.pricing.tier === tierFilter;
      const matchesStatus = statusFilter === "all" || s.recordStatus === statusFilter;
      const matchesNature = natureFilter === "all" || s.natureOfBusiness === natureFilter;
      return matchesSearch && matchesCountry && matchesTier && matchesStatus && matchesNature;
    });
  }, [searchTerm, countryFilter, tierFilter, statusFilter, natureFilter]);

  const countries = Array.from(new Set(MOCK_SUPPLIERS.map(s => s.country))).sort();
  const natures = Array.from(new Set(MOCK_SUPPLIERS.map(s => s.natureOfBusiness))).sort();
  const tiers = ['Budget', 'Mid-Range', 'Premium', 'Luxury'];
  const statuses = Array.from(new Set(MOCK_SUPPLIERS.map(s => s.recordStatus))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Global Supplier Directory</h1>
          <p className="text-muted-foreground">Consolidated database of verified manufacturing and trading partners.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="mr-2 h-4 w-4" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register New Global Supplier</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Company Name</label>
                  <Input placeholder="e.g. Istanbul Industrial Group" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nature of Business</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select nature" /></SelectTrigger>
                    <SelectContent>
                      {natures.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Country</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Price Tier</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                    <SelectContent>
                      {tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddModalOpen(false)}>Initialize Profile</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-secondary/10 border-none shadow-none">
        <CardContent className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search companies..." 
              className="pl-9 h-9" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="All Countries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={setPriceTier}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Price Tier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Record Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={natureFilter} onValueChange={setNatureFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Nature of Biz" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Natures</SelectItem>
              {natures.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Company Name</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Price Tier</TableHead>
              <TableHead>Record Status</TableHead>
              <TableHead className="w-[120px]">Completeness</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id} className="group">
                <TableCell>
                  <div>
                    <Link href={`/suppliers/${supplier.id}`} className="font-bold hover:text-primary flex items-center gap-2 group/link">
                      <span className="text-lg">{supplier.flag}</span>
                      {supplier.name}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </Link>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="font-bold">{supplier.contacts.sales.name}</span>
                      <span>•</span>
                      <span>{supplier.country}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs">{supplier.natureOfBusiness}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {supplier.specializedProducts.slice(0, 2).map(p => (
                      <Badge key={p} variant="secondary" className="text-[8px] h-4">{p}</Badge>
                    ))}
                    {supplier.specializedProducts.length > 2 && (
                      <Badge variant="outline" className="text-[8px] h-4">+{supplier.specializedProducts.length - 2}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-bold",
                    supplier.pricing.tier === 'Luxury' && "border-purple-500 text-purple-500",
                    supplier.pricing.tier === 'Premium' && "border-blue-500 text-blue-500",
                    supplier.pricing.tier === 'Mid-Range' && "border-green-500 text-green-500"
                  )}>
                    {supplier.pricing.tier}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[9px] capitalize",
                    supplier.recordStatus.includes('Verified') && "bg-green-500",
                    supplier.recordStatus === 'Blacklisted' && "bg-destructive",
                    supplier.recordStatus === 'Checking Data' && "bg-orange-500"
                  )}>
                    {supplier.recordStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold">
                      <span>{supplier.dataCompleteness}%</span>
                    </div>
                    <Progress 
                      value={supplier.dataCompleteness} 
                      className="h-1" 
                      indicatorClassName={cn(
                        supplier.dataCompleteness > 80 ? "bg-green-500" : supplier.dataCompleteness > 50 ? "bg-yellow-500" : "bg-destructive"
                      )}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {supplier.certifications.halal.has && <Badge className="h-4 w-4 p-0 flex items-center justify-center bg-green-500 rounded-full" title="Halal"><CheckCircle2 className="h-2.5 w-2.5" /></Badge>}
                    {supplier.certifications.organic.has && <Badge className="h-4 w-4 p-0 flex items-center justify-center bg-blue-500 rounded-full" title="Organic"><Info className="h-2.5 w-2.5" /></Badge>}
                    {supplier.certifications.iso.has && <Badge className="h-4 w-4 p-0 flex items-center justify-center bg-purple-500 rounded-full" title="ISO"><ShieldCheck className="h-2.5 w-2.5" /></Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/suppliers/${supplier.id}`}><ExternalLink className="mr-2 h-4 w-4" /> Full Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit Record</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem><Printer className="mr-2 h-4 w-4" /> Print PDF</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
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
