"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Users,
  FileText,
  Briefcase,
  Kanban,
  Target,
  Cookie,
  Sparkles,
  Droplets,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Mail,
  BarChart3,
  CreditCard,
  Send,
  Calculator,
  Receipt,
  Search,
  Terminal,
  Settings,
  Loader2,
  CreditCard as CreditCardIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase";
import { useUser } from "@/firebase";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  // Redirect to login only if user is NOT authenticated AND loading is complete AND not already on login
  useEffect(() => {
    if (!isUserLoading && !user && pathname !== "/login") {
      console.log("No authenticated user found, redirecting to login");
      window.location.href = "/login";
    }
  }, [user, isUserLoading, pathname]);

  const handleLogout = () => {
    auth.signOut();
    window.location.href = "/login";
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { type: 'separator', label: 'Market Segments' },
    { name: "Chocolate Market", href: "/department/chocolate", icon: Cookie },
    { name: "Cosmetics Market", href: "/department/cosmetics", icon: Sparkles },
    { name: "Detergents Market", href: "/department/detergents", icon: Droplets },
    { type: 'separator', label: 'Finance' },
    { name: "Accounting Hub", href: "/accounting", icon: Calculator },
    { name: "Expenses", href: "/accounting/expenses", icon: Receipt },
    { name: "Invoices", href: "/accounting/invoices", icon: FileText },
    { name: "Payments", href: "/accounting/payments", icon: CreditCardIcon },
    { name: "Purchase Orders", href: "/accounting/purchase-orders", icon: FileText },
    { type: 'separator', label: 'Marketing' },
    { name: "Campaigns", href: "/campaigns", icon: Send },
    { name: "Email Analytics", href: "/email-analytics", icon: Mail },
    { name: "Performance", href: "/performance", icon: BarChart3 },
    { type: 'separator', label: 'Sales & Ops' },
    { name: "Suppliers", href: "/suppliers", icon: Factory },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Offers Tracking", href: "/offers-tracking", icon: Target },
    { name: "Purchase History", href: "/purchases", icon: CreditCard },
    { name: "Bulk Uploads", href: "/uploads", icon: Upload },
    { type: 'separator', label: 'Admin' },
    { name: "Shared Clients", href: "/admin/shared-clients", icon: ShieldCheck },
    { name: "Permissions", href: "/admin/permissions", icon: ShieldAlert },
    { name: "Employees", href: "/employees", icon: Briefcase },
    { name: "Projects (Tasks)", href: "/projects", icon: Kanban },
    { name: "System Hub", href: "/admin/system", icon: Settings },
    { name: "Automation", href: "/automation", icon: Terminal },
  ];

  // Skip all layout/redirect logic for login page
  if (pathname === "/login") return <>{children}</>;

  // Show loading state while checking auth
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r-0 md:block bg-gradient-to-b from-[#073D4E] to-[#0B5E75] text-white shadow-xl">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#12A0C3] text-white font-bold">B</div>
            <span className="text-xl font-bold tracking-tight font-headline">BrandsBridge</span>
          </Link>
        </div>
        <nav className="space-y-1 p-4 overflow-y-auto h-[calc(100vh-64px)] custom-scrollbar">
          {navigation.map((item, idx) => (
            item.type === 'separator' ? (
              <div key={idx} className="mt-6 mb-2">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#12A0C3]/70">{item.label}</span>
                <div className="mt-2 h-px bg-[#12A0C3]/20" />
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href!}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href ? "bg-[#0E7A96]/80 text-white border-l-4 border-[#12A0C3]" : "text-white/70 hover:bg-[#0E7A96]/40 hover:text-white",
                  ""
                )}
              >
                {item.icon && <item.icon className={cn("mr-3 h-5 w-5 shrink-0", pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />}
                {item.name}
              </Link>
            )
          ))}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search financials..." className="w-64 pl-9 md:w-80 lg:w-96" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.profile && (() => {
              const profile = user.profile!;
              const roleBadge: Record<string, string> = {
                super_admin: "SUPER ADMIN",
                chocolate_manager: "MANAGER • CHOCOLATE",
                cosmetics_manager: "MANAGER • COSMETICS",
                detergents_manager: "MANAGER • DETERGENTS",
                finance_manager: "FINANCE MANAGER",
              };
              const badge = roleBadge[profile.role] || profile.role.toUpperCase();
              const initials = profile.name.split(' ').map(n => n[0]).join('');
              return (
                <div className="flex items-center gap-4">
                  <div className="hidden lg:flex flex-col items-end">
                    <span className="text-sm font-bold">{profile.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{badge}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 rounded-full bg-primary/20 p-0 border border-primary/30">
                        <span className="text-xs font-bold">{initials}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive">Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })()}
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
      
      <Toaster />
    </div>
  );
}
