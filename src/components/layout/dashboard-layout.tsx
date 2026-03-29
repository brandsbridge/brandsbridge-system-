"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Factory, 
  Users, 
  Menu,
  FileText,
  Briefcase,
  Kanban,
  Target,
  Cookie,
  Sparkles,
  Droplets,
  Upload,
  ShieldCheck,
  User,
  LogOut,
  Users as UsersIcon,
  ChevronDown,
  ShieldAlert,
  Mail,
  BarChart3,
  CreditCard,
  Send,
  Calculator,
  Receipt,
  Wallet,
  History,
  FileBarChart,
  Search,
  Terminal,
  Settings,
  Repeat,
  FileMinus,
  Banknote,
  Loader2,
  CreditCard as CreditCardIcon,
  Globe
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { DEMO_USERS, Employee } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { useUser } from "@/firebase";
import { startTransition } from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  // Redirect to login only if user is NOT authenticated AND loading is complete AND not already on login
  useEffect(() => {
    if (!isUserLoading && !user && pathname !== "/login") {
      console.log("No authenticated user found, redirecting to login");
      window.location.href = "/login";
    }
  }, [user, isUserLoading, pathname]);

  // Load demo user from localStorage if available
  useEffect(() => {
    const savedUser = localStorage.getItem("demoUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Auto sign-in if authenticated but not auto-signed in
  useEffect(() => {
    const savedUser = localStorage.getItem("demoUser");
    if (savedUser && !user && !isUserLoading) {
      signInAnonymously(auth).catch(err => console.error("Auto-auth failed:", err));
    }
  }, [user, isUserLoading]);

  const handleLogout = () => {
    localStorage.removeItem("demoUser");
    setCurrentUser(null);
    auth.signOut();
    router.push("/login");
  };

  const switchUser = async (user: Employee) => {
    try {
      await signInAnonymously(auth);
      localStorage.setItem("demoUser", JSON.stringify(user));
      setCurrentUser(user);
      startTransition(() => {
        router.push(user.department !== 'all' ? `/department/${user.department}` : "/");
      });
    } catch (err) {
      console.error("Switcher auth failed:", err);
    }
  };

  const role = user?.profile?.role;
  const isSA = role === 'super_admin';
  const isFinance = role === 'finance_manager';
  const isMarketManager = role === 'chocolate_manager' || role === 'cosmetics_manager' || role === 'detergents_manager';
  const assigned = user?.profile?.assignedMarket;

  const allNavigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, show: true },
    { type: 'separator', label: 'Market Segments', show: isSA || isMarketManager },
    { name: "Chocolate Market", href: "/department/chocolate", icon: Cookie, dept: 'chocolate', show: isSA || assigned === 'chocolate' },
    { name: "Cosmetics Market", href: "/department/cosmetics", icon: Sparkles, dept: 'cosmetics', show: isSA || assigned === 'cosmetics' },
    { name: "Detergents Market", href: "/department/detergents", icon: Droplets, dept: 'detergents', show: isSA || assigned === 'detergents' },
    { type: 'separator', label: 'Finance', show: isSA || isFinance },
    { name: "Accounting Hub", href: "/accounting", icon: Calculator, show: isSA || isFinance },
    { name: "Expenses", href: "/accounting/expenses", icon: Receipt, show: isSA || isFinance },
    { name: "Invoices", href: "/accounting/invoices", icon: FileText, show: isSA || isFinance },
    { name: "Payments", href: "/accounting/payments", icon: CreditCardIcon, show: isSA || isFinance },
    { name: "Purchase Orders", href: "/accounting/purchase-orders", icon: FileText, show: isSA || isFinance },
    { type: 'separator', label: 'Marketing', show: isSA },
    { name: "Campaigns", href: "/campaigns", icon: Send, show: isSA },
    { name: "Email Analytics", href: "/email-analytics", icon: Mail, show: isSA },
    { name: "Performance", href: "/performance", icon: BarChart3, show: isSA || isFinance },
    { type: 'separator', label: 'Sales & Ops', show: isSA || isMarketManager },
    { name: "Suppliers", href: "/suppliers", icon: Factory, show: isSA || isMarketManager },
    { name: "Customers", href: "/customers", icon: Users, show: isSA || isMarketManager },
    { name: "Offers Tracking", href: "/offers-tracking", icon: Target, show: isSA || isMarketManager },
    { name: "Purchase History", href: "/purchases", icon: CreditCard, show: isSA || isMarketManager },
    { name: "Bulk Uploads", href: "/uploads", icon: Upload, show: isSA },
    { type: 'separator', label: 'Admin', show: isSA || isMarketManager },
    { name: "Shared Clients", href: "/admin/shared-clients", icon: ShieldCheck, show: isSA },
    { name: "Permissions", href: "/admin/permissions", icon: ShieldAlert, show: isSA },
    { name: "Employees", href: "/employees", icon: Briefcase, show: isSA },
    { name: "Projects (Tasks)", href: "/projects", icon: Kanban, show: isSA || isMarketManager },
    { name: "System Hub", href: "/admin/system", icon: Settings, show: isSA },
    { name: "Automation", href: "/automation", icon: Terminal, show: isSA },
  ];

  const navigation = allNavigation.filter(n => n.show);

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
                  item.dept && currentUser?.department !== 'all' && currentUser?.department !== item.dept && "opacity-30 pointer-events-none"
                )}
              >
                <item.icon className={cn("mr-3 h-5 w-5 shrink-0", pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
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
            {currentUser && (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-bold">{currentUser.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{currentUser.role} • {currentUser.department}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 rounded-full bg-primary/20 p-0 border border-primary/30">
                      <span className="text-xs font-bold">{currentUser.name.split(' ').map(n => n[0]).join('')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
      
      <div className="fixed bottom-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary" className="shadow-lg rounded-full h-10 px-4">
              <UsersIcon className="mr-2 h-4 w-4" /> Role Switcher <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto w-64">
             {DEMO_USERS.map(user => (
                <DropdownMenuItem key={user.id} onClick={() => switchUser(user)}>
                   <div className="flex flex-col w-full">
                      <div className="flex items-center justify-between">
                         <span className="font-bold text-xs">{user.name}</span>
                         <Badge variant="outline" className="text-[8px] h-4">{user.role}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground capitalize">{user.department}</span>
                   </div>
                </DropdownMenuItem>
             ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Toaster />
    </div>
  );
}
