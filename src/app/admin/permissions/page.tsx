
"use client";

import React from "react";
import { ShieldCheck, Check, X, ShieldAlert, Users, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PermissionsPage() {
  const ROLES = ['Admin', 'Manager', 'Sales', 'Viewer'];
  const PERMISSIONS = [
    { name: 'View Global Dashboard', admin: true, manager: true, sales: true, viewer: true },
    { name: 'Access All Departments', admin: true, manager: false, sales: false, viewer: false },
    { name: 'Manage Own Department', admin: true, manager: true, sales: false, viewer: false },
    { name: 'Bulk Upload Records', admin: true, manager: true, sales: false, viewer: false },
    { name: 'Edit Supplier/Buyer Details', admin: true, manager: true, sales: true, viewer: false },
    { name: 'View Price Intelligence', admin: true, manager: true, sales: true, viewer: true },
    { name: 'Mark Featured Products', admin: true, manager: true, sales: false, viewer: false },
    { name: 'Shared Client Audits', admin: true, manager: false, sales: false, viewer: false },
    { name: 'Delete Records', admin: true, manager: false, sales: false, viewer: false },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">System Configuration</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Role Permissions Checklist</h1>
          <p className="text-muted-foreground">Global verification of access control and data isolation rules.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> RBAC Enabled
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground">Role-Based Access Control is active across all 12 modules.</p>
            </CardContent>
         </Card>
         <Card className="bg-accent/5 border-accent/20">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" /> Dept. Isolation
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground">Cross-department data leaking is prevented by Firestore rules.</p>
            </CardContent>
         </Card>
         <Card className="bg-green-500/5 border-green-500/20">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Audit Active
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground">All permission denials are logged for super-admin review.</p>
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>Visual verification of what each role can perform within the system.</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Permission Action</TableHead>
              {ROLES.map(role => (
                <TableHead key={role} className="text-center">{role}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS.map((perm) => (
              <TableRow key={perm.name}>
                <TableCell className="font-medium text-xs">{perm.name}</TableCell>
                <TableCell className="text-center">
                  {perm.admin ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                </TableCell>
                <TableCell className="text-center">
                  {perm.manager ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                </TableCell>
                <TableCell className="text-center">
                  {perm.sales ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                </TableCell>
                <TableCell className="text-center">
                  {perm.viewer ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      <div className="p-6 rounded-lg bg-secondary/30 border flex gap-4">
         <Info className="h-6 w-6 text-primary shrink-0" />
         <div className="space-y-1">
            <h4 className="font-bold text-sm">Security Policy Enforcement</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
               The matrix above is enforced at both the UI layer (menu visibility) and the data layer (Firestore rules). 
               Shared clients are handled via array-membership logic, ensuring Managers only see clients relevant to their market 
               while Super Admins maintain a unified global view.
            </p>
         </div>
      </div>
    </div>
  );
}
