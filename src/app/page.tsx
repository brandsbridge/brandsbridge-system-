'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { SuperAdminDashboard } from "@/components/dashboards/super-admin-dashboard";
import { MarketDashboard } from "@/components/dashboards/market-dashboard";
import { FinanceDashboard } from "@/components/dashboards/finance-dashboard";

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
          // Default to super_admin if no profile found
          setUserRole("super_admin");
        }
      } catch (error) {
        console.error("Role fetch error:", error);
        // Default to super_admin on error
        setUserRole("super_admin");
      } finally {
        setRoleLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  if (isUserLoading || roleLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const role = userRole;
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
