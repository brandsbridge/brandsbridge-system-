
"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from "react";
import { User, Mail, Shield, Building, Calendar, Clock, Edit, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Employee } from "@/lib/mock-data";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const [user, setUser] = useState<Employee | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("demoUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information and preferences.</p>
        </div>
        <Button>
          <Edit className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary border-4 border-primary/20">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <Badge variant="secondary" className="mt-1 uppercase text-[10px] tracking-widest">{user.role}</Badge>
            </div>
            <Separator />
            <div className="w-full space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{user.department} Market</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Personal and professional information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                <Input value={user.name} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                <Input value={user.email} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Department</label>
                <Input value={user.department} readOnly className="capitalize" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">User Role</label>
                <Input value={user.role} readOnly className="uppercase" />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Security & Access</h3>
              <div className="p-4 rounded-lg bg-secondary/30 border space-y-4">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-sm font-medium">Last Login</p>
                       <p className="text-xs text-muted-foreground">{new Date(user.lastLogin || '').toLocaleString()}</p>
                    </div>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                 </div>
                 <Button variant="outline" size="sm" className="w-full">Change Password</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
