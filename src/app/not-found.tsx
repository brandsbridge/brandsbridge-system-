
"use client";

export const dynamic = 'force-dynamic';

import React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h2 className="text-4xl font-bold font-headline text-primary">404 - Page Not Found</h2>
      <p className="text-muted-foreground text-center max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <a href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-colors">
        Return Dashboard
      </a>
    </div>
  );
}
