"use client";

export const dynamic = 'force-dynamic';

import React from "react";
import { DollarSign, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PayrollPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Monthly Payroll</h1>
        <p className="text-muted-foreground">Automated salary calculations with attendance deductions.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="relative">
            <DollarSign className="h-16 w-16 text-primary/30" />
            <Clock className="h-8 w-8 text-primary absolute -bottom-1 -right-1" />
          </div>
          <h2 className="text-2xl font-bold text-muted-foreground">Coming Soon</h2>
          <p className="text-muted-foreground text-center max-w-md">
            The payroll module will automatically calculate monthly salaries, apply attendance deductions,
            add overtime bonuses, and integrate with the commission system for a complete compensation overview.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
