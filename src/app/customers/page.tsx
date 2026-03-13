"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, Search, User, Mail, Phone, Trash2, Edit, ExternalLink, 
  Filter, Download, Star, TrendingUp, AlertCircle, HeartPulse, 
  FileText, ShieldCheck
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
import { MOCK_CUSTOMERS, MOCK_RESPONSES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={cn("h-2.5 w-2.5", i <= Math.round(rating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
    ))}
  </div>
);

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const countries = Array.from(new Set(MOCK_CUSTOMERS.map(c => c.country))).sort();
  const statuses = Array.from(new Set(MOCK_CUSTOMERS.map(c => c.accountStatus))).sort();

  const filteredCustomers = useMemo(() => {
    return MOCK_CUSTOMERS.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === "all" || c.country === countryFilter;
      const matchesStatus = statusFilter === "all" || c.accountStatus === statusFilter;
      const matchesHealth = healthFilter === "all" || c.accountHealth === healthFilter;
      return matchesSearch && matchesCountry && matchesStatus && matchesHealth;
    });
  }, [searchTerm, countryFilter, statusFilter, healthFilter]);

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <HeartPulse className="h-3 w-3 text-green-500" />;
      case 'at risk': return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'dormant': return <AlertCircle className="h-3 w-3 text-orange-500" />;
      case 'churned': return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Corporate Buyers</h1>
          <p className="text-muted-foreground">Manage B2B relationships and track procurement dynamics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="mr-2 h-4 w-4" /> Register Buyer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register New B2B Customer</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Company Name</label>
                  <Input placeholder="e.g. Arab Food Logistics" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Company Type</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retailer">Retailer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
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
                  <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddModalOpen(false)}>Create Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-secondary/10 border-none shadow-none">
        <CardContent className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by company or email..." 
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Account Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Account Health" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="at risk">At Risk</SelectItem>
              <SelectItem value="dormant">Dormant</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Interests</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                      {customer.name[0]}
                    </div>
                    <div>
                      <Link href={`/customers/${customer.id}`} className="font-bold hover:text-primary flex items-center gap-1 group/link">
                        {customer.name}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </Link>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>{customer.flag} {customer.country}</span>
                        <span>•</span>
                        <span>{customer.assignedManager}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs">{customer.companyType}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[9px] capitalize",
                    customer.accountStatus === 'active' && "bg-green-500 text-white border-none",
                    customer.accountStatus === 'key account' && "bg-primary text-white border-none",
                    customer.accountStatus === 'at risk' && "bg-yellow-500 text-white border-none"
                  )}>
                    {customer.accountStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {customer.interests.products.slice(0, 2).map(p => (
                      <Badge key={p} variant="secondary" className="text-[8px] h-4">{p}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {getHealthIcon(customer.accountHealth)}
                    <span className="text-[10px] capitalize font-medium">{customer.accountHealth}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <StarRating rating={customer.internalRating} />
                    <div className="w-16">
                      <Progress value={customer.dataCompleteness} className="h-1" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-xs font-bold text-primary">${customer.totalRevenue.toLocaleString()}</div>
                  <div className="text-[8px] text-muted-foreground">Lifetime Value</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/customers/${customer.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Mail className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
