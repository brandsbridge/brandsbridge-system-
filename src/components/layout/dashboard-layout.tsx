
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Factory, 
  Users, 
  Package, 
  Trophy, 
  MessageSquare, 
  Terminal,
  Search,
  Bell,
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
  ShieldAlert
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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("demoUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else if (pathname !== "/login") {
      router.push("/login");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("demoUser");
    setCurrentUser(null);
    router.push("/login");
  };

  const switchUser = (user: Employee) => {
    localStorage.setItem("demoUser", JSON.stringify(user));
    setCurrentUser(user);
    if (user.department !== 'all') {
      router.push(`/department/${user.department}`);
    } else {
      router.push("/");
    }
  };

  const canAccess = (path: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    // Department check
    if (path.startsWith("/department/")) {
      const dept = path.split("/")[2];
      return currentUser.department === dept;
    }
    
    // Role checks for admin pages
    if (path.startsWith("/admin") && currentUser.role !== 'admin') return false;
    
    return true;
  };

  const isAccessDenied = pathname !== "/login" && pathname !== "/profile" && !canAccess(pathname);

  const navigation = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { type: 'separator', label: 'Market Segments' },
    { name: "Chocolate Market", href: "/department/chocolate", icon: Cookie, dept: 'chocolate' },
    { name: "Cosmetics Market", href: "/department/cosmetics", icon: Sparkles, dept: 'cosmetics' },
    { name: "Detergents Market", href: "/department/detergents", icon: Droplets, dept: 'detergents' },
    { type: 'separator', label: 'Management' },
    { name: "Suppliers", href: "/suppliers", icon: Factory },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Bulk Uploads", href: "/uploads", icon: Upload },
    { type: 'separator', label: 'Operations' },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Employees", href: "/employees", icon: Briefcase },
    { name: "Projects", href: "/projects", icon: Kanban },
    { name: "CRM", href: "/crm", icon: Target },
    { name: "Best Offers", href: "/offers", icon: Trophy },
    { name: "Responses", href: "/responses", icon: MessageSquare },
    { name: "Automation", href: "/automation", icon: Terminal },
    { type: 'separator', label: 'Admin' },
    { name: "Shared Clients", href: "/admin/shared-clients", icon: ShieldCheck },
    { name: "Permissions", href: "/admin/permissions", icon: ShieldAlert },
  ];

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r bg-card md:block">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">B</div>
            <span className="text-xl font-bold tracking-tight font-headline">BizFlow</span>
          </Link>
        </div>
        <nav className="space-y-1 p-4 overflow-y-auto h-[calc(100vh-64px)] custom-scrollbar">
          {navigation.map((item, idx) => (
            item.type === 'separator' ? (
              <div key={idx} className="mt-6 mb-2">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{item.label}</span>
                <div className="mt-2 h-px bg-border/50" />
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href!}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
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
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search across your department..."
                className="w-64 pl-9 md:w-80 lg:w-96"
              />
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
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-primary/20 p-0 border border-primary/30">
                      <span className="text-xs font-bold">{currentUser.name.split(' ').map(n => n[0]).join('')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Demo Switcher</DropdownMenuLabel>
                    {DEMO_USERS.map(user => (
                      <DropdownMenuItem key={user.id} onClick={() => switchUser(user)} className="text-[11px]">
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          <span className="text-[9px] text-muted-foreground">{user.role} ({user.department})</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 md:p-8">
          {isAccessDenied ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
              <ShieldAlert className="h-16 w-16 text-destructive" />
              <h2 className="text-3xl font-bold font-headline">Access Denied</h2>
              <p className="text-muted-foreground max-w-md">
                You do not have the required permissions to access this page. Please contact your department manager or the super administrator.
              </p>
              <Button onClick={() => router.push(currentUser?.department !== 'all' ? `/department/${currentUser?.department}` : '/')}>
                Go to Dashboard
              </Button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      
      {/* Floating User Switcher for easier testing */}
      <div className="fixed bottom-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="accent" className="shadow-lg rounded-full h-10 px-4">
              <UsersIcon className="mr-2 h-4 w-4" /> Role Switcher <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto w-64">
             <DropdownMenuLabel>Quick Switch (Testing)</DropdownMenuLabel>
             <DropdownMenuSeparator />
             {DEMO_USERS.map(user => (
                <DropdownMenuItem key={user.id} onClick={() => switchUser(user)}>
                   <div className="flex flex-col w-full">
                      <div className="flex items-center justify-between">
                         <span className="font-bold text-xs">{user.name}</span>
                         <Badge variant="outline" className="text-[8px] h-4">{user.role}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground capitalize">{user.department} Department</span>
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
