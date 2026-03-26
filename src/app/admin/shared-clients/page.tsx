
"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo } from "react";
import { 
  ShieldAlert, 
  Users, 
  ArrowRightLeft, 
  TrendingUp, 
  Search,
  AlertTriangle,
  Layers,
  MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MOCK_SUPPLIERS, MOCK_CUSTOMERS } from "@/lib/mock-data";

export default function SharedClientsAdminPage() {
  const sharedSuppliers = useMemo(() => MOCK_SUPPLIERS.filter(s => s.departments.length > 1), []);
  const sharedBuyers = useMemo(() => MOCK_CUSTOMERS.filter(c => c.departments.length > 1), []);

  const totalShared = sharedSuppliers.length + sharedBuyers.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Super Admin Console</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Shared Clients Overview</h1>
          <p className="text-muted-foreground">Manage global relationships and audit cross-department data isolation.</p>
        </div>
        <Button className="bg-primary">
          <Layers className="mr-2 h-4 w-4" /> Audit Isolation
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shared</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShared}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Clients across 2+ depts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Suppliers</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sharedSuppliers.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Cross-supply chains</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Buyers</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sharedBuyers.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Multi-market accounts</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Pricing Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">2</div>
            <p className="text-[10px] text-destructive/70 mt-1">Requires reconciliation</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search shared entities by name or email..." className="pl-9" />
          </div>
          <Button variant="outline">Filter by Conflict</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Global Shared Directory</CardTitle>
            <CardDescription>Consolidated list of all entities operating in multiple departments.</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Active Departments</TableHead>
                <TableHead>Total Interactions</TableHead>
                <TableHead>Conflict Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...sharedSuppliers, ...sharedBuyers].map((entity: any) => (
                <TableRow key={entity.id}>
                  <TableCell>
                    <div className="font-medium">{entity.name}</div>
                    <div className="text-[10px] text-muted-foreground">{entity.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] uppercase">{entity.departments.includes('chocolate') && entity.productsOffered ? 'Supplier' : 'Buyer'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {entity.departments.map((d: string) => (
                        <Badge key={d} variant="outline" className="text-[8px] capitalize">{d}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold">{Object.keys(entity.interactionNotes || {}).length} Departments</span>
                  </TableCell>
                  <TableCell>
                    {entity.name === "EuroRetail Group" ? (
                      <Badge variant="destructive" className="text-[8px] animate-pulse">Conflict: Different Pricing</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[8px] text-green-500 border-green-500">Normal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Cross-Audit</DropdownMenuItem>
                        <DropdownMenuItem>Merge Duplicates</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Reassign Primary Manager</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="p-6 rounded-lg bg-secondary/30 border space-y-4">
        <h3 className="font-bold flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> Conflict Management Protocol</h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
          The "Pricing Conflict" alert triggers when a shared entity is recorded with significantly different baseline terms across departments. Super Admins should review these cases to ensure brand consistency while maintaining the necessary operational autonomy for each department manager.
        </p>
      </div>
    </div>
  );
}
