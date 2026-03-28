'use client';

export const dynamic = 'force-dynamic';

import React from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@/firebase";
import { SuperAdminDashboard } from "@/components/dashboards/super-admin-dashboard";
import { MarketDashboard } from "@/components/dashboards/market-dashboard";
import { FinanceDashboard } from "@/components/dashboards/finance-dashboard";

export default function DashboardRouter() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const role = user?.profile?.role;
  const assignedMarket = user?.profile?.assignedMarket;

  if (role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  if (role === 'finance_manager') {
    return <FinanceDashboard />;
  }

  if (role === 'chocolate_manager' || role === 'cosmetics_manager' || role === 'detergents_manager') {
    if (assignedMarket) {
      return <MarketDashboard assignedMarket={assignedMarket} />;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h2 className="text-2xl font-bold text-muted-foreground">Dashboard Access Restricted</h2>
      <p className="text-sm text-muted-foreground">Please configure your role or market assignment to view operational data.</p>
    </div>
  );
}
