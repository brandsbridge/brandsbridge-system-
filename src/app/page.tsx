'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function DashboardRouter() {
  const { user, isUserLoading } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoleLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role || "super_admin");
        } else {
          setUserRole("super_admin");
        }
      } catch (error) {
        console.error("Role fetch error:", error);
        setUserRole("super_admin");
      } finally {
        setRoleLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  if (isUserLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const role = userRole;
  const assignedMarket = user?.profile?.assignedMarket;

  if (role === 'super_admin') {
    const SuperAdminDashboardLazy = React.lazy(() => 
      import("@/components/dashboards/super-admin-dashboard").then(m => ({ default: m.SuperAdminDashboard }))
    );
    return (
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <SuperAdminDashboardLazy />
      </React.Suspense>
    );
  }

  if (role === 'finance_manager') {
    const FinanceDashboardLazy = React.lazy(() => 
      import("@/components/dashboards/finance-dashboard").then(m => ({ default: m.FinanceDashboard }))
    );
    return (
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <FinanceDashboardLazy />
      </React.Suspense>
    );
  }

  if (role === 'chocolate_manager' || role === 'cosmetics_manager' || role === 'detergents_manager') {
    if (assignedMarket) {
      const MarketDashboardLazy = React.lazy(() => 
        import("@/components/dashboards/market-dashboard").then(m => ({ default: m.MarketDashboard }))
      );
      return (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <MarketDashboardLazy assignedMarket={assignedMarket} />
        </React.Suspense>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h2 className="text-2xl font-bold text-muted-foreground">Dashboard Access Restricted</h2>
      <p className="text-sm text-muted-foreground">Please configure your role or market assignment to view operational data.</p>
    </div>
  );
}
