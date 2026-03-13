
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Sun,
  Moon,
  Menu,
  FileText,
  Briefcase,
  Kanban,
  Target,
  Cookie,
  Sparkles,
  Droplets,
  Upload,
  ShieldCheck
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

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { type: 'separator', label: 'Market Segments' },
  { name: "Chocolate Market", href: "/department/chocolate", icon: Cookie },
  { name: "Cosmetics Market", href: "/department/cosmetics", icon: Sparkles },
  { name: "Detergents Market", href: "/department/detergents", icon: Droplets },
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
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                placeholder="Search across all departments..."
                className="w-64 pl-9 md:w-80 lg:w-96"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/uploads">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Upload className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold border border-primary/30">
              M1
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
