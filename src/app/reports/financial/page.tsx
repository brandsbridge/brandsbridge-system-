"use client";

export const dynamic = "force-dynamic";

import React, { useMemo, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  CreditCard,
  ShoppingCart,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import Papa from "papaparse";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === "object" && v !== null && "seconds" in v)
    return new Date((v as { seconds: number }).seconds * 1000);
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function fmtDate(v: unknown): string {
  const d = toDate(v);
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function fmtCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function getMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${y}`;
}

const PIE_COLORS = ["#0B5E75", "#12A0C3", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6", "#F97316"];

// ── Date range presets ───────────────────────────────────────────────────────

function getPresetRange(preset: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(today);
  to.setHours(23, 59, 59, 999);

  switch (preset) {
    case "today":
      return { from: today, to };
    case "this_week": {
      const dow = today.getDay();
      const from = new Date(today);
      from.setDate(today.getDate() - dow);
      return { from, to };
    }
    case "this_month":
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to };
    case "this_quarter": {
      const q = Math.floor(today.getMonth() / 3) * 3;
      return { from: new Date(today.getFullYear(), q, 1), to };
    }
    case "this_year":
      return { from: new Date(today.getFullYear(), 0, 1), to };
    case "last_month": {
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { from: lm, to: lmEnd };
    }
    case "last_quarter": {
      const cq = Math.floor(today.getMonth() / 3);
      const lqStart = new Date(today.getFullYear(), (cq - 1) * 3, 1);
      const lqEnd = new Date(today.getFullYear(), cq * 3, 0, 23, 59, 59, 999);
      return { from: lqStart, to: lqEnd };
    }
    case "last_year": {
      return { from: new Date(today.getFullYear() - 1, 0, 1), to: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999) };
    }
    default:
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to };
  }
}

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function FinancialReportsPage() {
  const db = useFirestore();

  // Date range state
  const defaultRange = getPresetRange("this_month");
  const [dateFrom, setDateFrom] = useState(toInputDate(defaultRange.from));
  const [dateTo, setDateTo] = useState(toInputDate(defaultRange.to));
  const [activeTab, setActiveTab] = useState("overview");

  const rangeFrom = useMemo(() => {
    const d = new Date(dateFrom);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [dateFrom]);

  const rangeTo = useMemo(() => {
    const d = new Date(dateTo);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [dateTo]);

  const applyPreset = useCallback((preset: string) => {
    const r = getPresetRange(preset);
    setDateFrom(toInputDate(r.from));
    setDateTo(toInputDate(r.to));
  }, []);

  // Firestore queries
  const expensesRef = useMemoFirebase(() => query(collection(db, "expenses"), orderBy("createdAt", "desc")), [db]);
  const invoicesRef = useMemoFirebase(() => query(collection(db, "invoices"), orderBy("createdAt", "desc")), [db]);
  const paymentsRef = useMemoFirebase(() => query(collection(db, "payments"), orderBy("createdAt", "desc")), [db]);
  const poRef = useMemoFirebase(() => query(collection(db, "purchase_orders"), orderBy("createdAt", "desc")), [db]);

  const { data: expensesRaw = [], isLoading: loadingExp } = useCollection(expensesRef);
  const { data: invoicesRaw = [], isLoading: loadingInv } = useCollection(invoicesRef);
  const { data: paymentsRaw = [], isLoading: loadingPay } = useCollection(paymentsRef);
  const { data: posRaw = [], isLoading: loadingPO } = useCollection(poRef);

  const isLoading = loadingExp || loadingInv || loadingPay || loadingPO;

  // Filter all data by date range
  const inRange = useCallback(
    (v: unknown) => {
      const d = toDate(v);
      if (!d) return false;
      return d >= rangeFrom && d <= rangeTo;
    },
    [rangeFrom, rangeTo]
  );

  const expenses = useMemo(
    () => (expensesRaw ?? []).filter((e: any) => inRange(e.expenseDate || e.date || e.createdAt)),
    [expensesRaw, inRange]
  );

  const invoices = useMemo(
    () => (invoicesRaw ?? []).filter((inv: any) => inRange(inv.dateIssue || inv.createdAt)),
    [invoicesRaw, inRange]
  );

  const payments = useMemo(
    () => (paymentsRaw ?? []).filter((p: any) => inRange(p.date || p.createdAt)),
    [paymentsRaw, inRange]
  );

  const purchaseOrders = useMemo(
    () => (posRaw ?? []).filter((po: any) => inRange(po.date || po.createdAt)),
    [posRaw, inRange]
  );

  // ── Computed metrics ─────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const totalExpenses = expenses.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

    const paidInvoices = invoices.filter((inv: any) => inv.status === "paid" || inv.status === "Paid");
    const totalRevenue = paidInvoices.reduce((s: number, inv: any) => s + (Number(inv.totalUSD) || Number(inv.total) || 0), 0);

    const allInvoiceTotal = invoices.reduce((s: number, inv: any) => s + (Number(inv.totalUSD) || Number(inv.total) || 0), 0);

    const paymentsReceived = payments.filter((p: any) => p.type === "received");
    const paymentsMade = payments.filter((p: any) => p.type !== "received");
    const totalReceived = paymentsReceived.reduce((s: number, p: any) => s + (Number(p.totalUSD) || Number(p.amount) || 0), 0);
    const totalPaid = paymentsMade.reduce((s: number, p: any) => s + (Number(p.totalUSD) || Number(p.amount) || 0), 0);

    const totalPO = purchaseOrders.reduce((s: number, po: any) => s + (Number(po.total) || 0), 0);

    const netProfit = totalRevenue - totalExpenses;

    return {
      totalExpenses,
      totalRevenue,
      allInvoiceTotal,
      totalReceived,
      totalPaid,
      totalPO,
      netProfit,
      expenseCount: expenses.length,
      invoiceCount: invoices.length,
      paymentCount: payments.length,
      poCount: purchaseOrders.length,
      paidInvoiceCount: paidInvoices.length,
    };
  }, [expenses, invoices, payments, purchaseOrders]);

  // ── Chart data ───────────────────────────────────────────────────────────

  const revenueVsExpenseChart = useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number }> = {};
    expenses.forEach((e: any) => {
      const d = toDate(e.expenseDate || e.date || e.createdAt);
      if (!d) return;
      const k = getMonthKey(d);
      if (!map[k]) map[k] = { revenue: 0, expenses: 0 };
      map[k].expenses += Number(e.amount) || 0;
    });
    invoices
      .filter((inv: any) => inv.status === "paid" || inv.status === "Paid")
      .forEach((inv: any) => {
        const d = toDate(inv.dateIssue || inv.createdAt);
        if (!d) return;
        const k = getMonthKey(d);
        if (!map[k]) map[k] = { revenue: 0, expenses: 0 };
        map[k].revenue += Number(inv.totalUSD) || Number(inv.total) || 0;
      });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ month: getMonthLabel(k), ...v }));
  }, [expenses, invoices]);

  const expenseByCostCenter = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const cc = e.costCenter || "Uncategorized";
      map[cc] = (map[cc] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const revenueByDepartment = useMemo(() => {
    const map: Record<string, number> = {};
    invoices
      .filter((inv: any) => inv.status === "paid" || inv.status === "Paid")
      .forEach((inv: any) => {
        const dept = inv.department || "Unassigned";
        map[dept] = (map[dept] || 0) + (Number(inv.totalUSD) || Number(inv.total) || 0);
      });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const topVendors = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const v = e.vendorName || e.accountName || "Unknown";
      map[v] = (map[v] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, total]) => ({ name: name.length > 20 ? name.slice(0, 18) + "…" : name, total }));
  }, [expenses]);

  const topCustomers = useMemo(() => {
    const map: Record<string, number> = {};
    invoices
      .filter((inv: any) => inv.status === "paid" || inv.status === "Paid")
      .forEach((inv: any) => {
        const c = inv.customerName || "Unknown";
        map[c] = (map[c] || 0) + (Number(inv.totalUSD) || Number(inv.total) || 0);
      });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, total]) => ({ name: name.length > 20 ? name.slice(0, 18) + "…" : name, total }));
  }, [invoices]);

  // ── Cash Flow ────────────────────────────────────────────────────────────

  const cashFlowData = useMemo(() => {
    const map: Record<string, { inflow: number; outflow: number }> = {};

    // Inflows: payments received
    payments
      .filter((p: any) => p.type === "received")
      .forEach((p: any) => {
        const d = toDate(p.date || p.createdAt);
        if (!d) return;
        const k = getMonthKey(d);
        if (!map[k]) map[k] = { inflow: 0, outflow: 0 };
        map[k].inflow += Number(p.totalUSD) || Number(p.amount) || 0;
      });

    // Outflows: expenses + payments made
    expenses.forEach((e: any) => {
      const d = toDate(e.expenseDate || e.date || e.createdAt);
      if (!d) return;
      const k = getMonthKey(d);
      if (!map[k]) map[k] = { inflow: 0, outflow: 0 };
      map[k].outflow += Number(e.amount) || 0;
    });

    payments
      .filter((p: any) => p.type !== "received")
      .forEach((p: any) => {
        const d = toDate(p.date || p.createdAt);
        if (!d) return;
        const k = getMonthKey(d);
        if (!map[k]) map[k] = { inflow: 0, outflow: 0 };
        map[k].outflow += Number(p.totalUSD) || Number(p.amount) || 0;
      });

    let balance = 0;
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        const net = v.inflow - v.outflow;
        balance += net;
        return { month: getMonthLabel(k), ...v, net, balance };
      });
  }, [expenses, payments]);

  // ── Export functions ──────────────────────────────────────────────────────

  const exportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    if (activeTab === "overview") {
      // Multi-sheet overview
      const summaryData = [
        ["Metric", "Value"],
        ["Total Revenue (Paid Invoices)", metrics.totalRevenue],
        ["Total Expenses", metrics.totalExpenses],
        ["Net Profit", metrics.netProfit],
        ["Payments Received", metrics.totalReceived],
        ["Payments Made", metrics.totalPaid],
        ["Purchase Orders Total", metrics.totalPO],
        ["Invoice Count", metrics.invoiceCount],
        ["Expense Count", metrics.expenseCount],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, "Summary");

      if (revenueVsExpenseChart.length) {
        const ws2 = XLSX.utils.json_to_sheet(revenueVsExpenseChart);
        XLSX.utils.book_append_sheet(wb, ws2, "Revenue vs Expenses");
      }
      if (expenseByCostCenter.length) {
        const ws3 = XLSX.utils.json_to_sheet(expenseByCostCenter);
        XLSX.utils.book_append_sheet(wb, ws3, "Expense by Cost Center");
      }
      if (topVendors.length) {
        const ws4 = XLSX.utils.json_to_sheet(topVendors);
        XLSX.utils.book_append_sheet(wb, ws4, "Top Vendors");
      }
      if (topCustomers.length) {
        const ws5 = XLSX.utils.json_to_sheet(topCustomers);
        XLSX.utils.book_append_sheet(wb, ws5, "Top Customers");
      }
    } else if (activeTab === "expenses") {
      const rows = expenses.map((e: any, i: number) => ({
        "#": i + 1,
        "Expense Date": fmtDate(e.expenseDate || e.date),
        "Entry Date": fmtDate(e.createdAt),
        Vendor: e.vendorName || e.accountName || "",
        "Cost Center": e.costCenter || "",
        Reference: e.reference || "",
        Currency: e.currency || "USD",
        Amount: Number(e.amount) || 0,
        Billable: e.isBillable ? "Yes" : "No",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    } else if (activeTab === "revenue") {
      const rows = invoices
        .filter((inv: any) => inv.status === "paid" || inv.status === "Paid")
        .map((inv: any, i: number) => ({
          "#": i + 1,
          "Invoice #": inv.number || "",
          Date: fmtDate(inv.dateIssue || inv.createdAt),
          Customer: inv.customerName || "",
          Department: inv.department || "",
          Currency: inv.currency || "USD",
          "Total (USD)": Number(inv.totalUSD) || Number(inv.total) || 0,
        }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Revenue");
    } else if (activeTab === "invoices") {
      const rows = invoices.map((inv: any, i: number) => ({
        "#": i + 1,
        "Invoice #": inv.number || "",
        Date: fmtDate(inv.dateIssue || inv.createdAt),
        Customer: inv.customerName || "",
        Department: inv.department || "",
        Status: inv.status || "",
        Currency: inv.currency || "USD",
        "Total (USD)": Number(inv.totalUSD) || Number(inv.total) || 0,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    } else if (activeTab === "payments") {
      const rows = payments.map((p: any, i: number) => ({
        "#": i + 1,
        Date: fmtDate(p.date || p.createdAt),
        Party: p.partyName || "",
        Type: p.type || "",
        Currency: p.currency || "USD",
        Amount: Number(p.amount) || 0,
        "Total (USD)": Number(p.totalUSD) || Number(p.amount) || 0,
        Department: p.department || "",
        Notes: p.notes || "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Payments");
    } else if (activeTab === "purchase_orders") {
      const rows = purchaseOrders.map((po: any, i: number) => ({
        "#": i + 1,
        "PO #": po.number || "",
        Date: fmtDate(po.date || po.createdAt),
        Supplier: po.supplierName || "",
        Status: po.status || "",
        "Total (USD)": Number(po.total) || 0,
        Department: po.department || "",
        "Payment Account": po.paymentAccount || "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Purchase Orders");
    } else if (activeTab === "cashflow") {
      const ws = XLSX.utils.json_to_sheet(cashFlowData);
      XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");
    }

    XLSX.writeFile(wb, `BrandsBridge_${activeTab}_${dateFrom}_to_${dateTo}.xlsx`);
  }, [activeTab, expenses, invoices, payments, purchaseOrders, cashFlowData, metrics, revenueVsExpenseChart, expenseByCostCenter, topVendors, topCustomers, dateFrom, dateTo]);

  const exportCSV = useCallback(() => {
    let rows: Record<string, unknown>[] = [];

    if (activeTab === "expenses") {
      rows = expenses.map((e: any, i: number) => ({
        "#": i + 1, "Expense Date": fmtDate(e.expenseDate || e.date), "Entry Date": fmtDate(e.createdAt),
        Vendor: e.vendorName || e.accountName || "", "Cost Center": e.costCenter || "", Reference: e.reference || "",
        Currency: e.currency || "USD", Amount: Number(e.amount) || 0, Billable: e.isBillable ? "Yes" : "No",
      }));
    } else if (activeTab === "revenue") {
      rows = invoices.filter((inv: any) => inv.status === "paid" || inv.status === "Paid").map((inv: any, i: number) => ({
        "#": i + 1, "Invoice #": inv.number || "", Date: fmtDate(inv.dateIssue || inv.createdAt),
        Customer: inv.customerName || "", Department: inv.department || "", Currency: inv.currency || "USD",
        "Total (USD)": Number(inv.totalUSD) || Number(inv.total) || 0,
      }));
    } else if (activeTab === "invoices") {
      rows = invoices.map((inv: any, i: number) => ({
        "#": i + 1, "Invoice #": inv.number || "", Date: fmtDate(inv.dateIssue || inv.createdAt),
        Customer: inv.customerName || "", Status: inv.status || "", "Total (USD)": Number(inv.totalUSD) || Number(inv.total) || 0,
      }));
    } else if (activeTab === "payments") {
      rows = payments.map((p: any, i: number) => ({
        "#": i + 1, Date: fmtDate(p.date || p.createdAt), Party: p.partyName || "",
        Type: p.type || "", Amount: Number(p.amount) || 0, "Total (USD)": Number(p.totalUSD) || Number(p.amount) || 0,
      }));
    } else if (activeTab === "purchase_orders") {
      rows = purchaseOrders.map((po: any, i: number) => ({
        "#": i + 1, "PO #": po.number || "", Date: fmtDate(po.date || po.createdAt),
        Supplier: po.supplierName || "", Status: po.status || "", "Total (USD)": Number(po.total) || 0,
      }));
    } else if (activeTab === "cashflow") {
      rows = cashFlowData as Record<string, unknown>[];
    } else {
      // Overview summary
      rows = [
        { Metric: "Total Revenue", Value: metrics.totalRevenue },
        { Metric: "Total Expenses", Value: metrics.totalExpenses },
        { Metric: "Net Profit", Value: metrics.netProfit },
        { Metric: "Payments Received", Value: metrics.totalReceived },
        { Metric: "Payments Made", Value: metrics.totalPaid },
        { Metric: "Purchase Orders", Value: metrics.totalPO },
      ];
    }

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BrandsBridge_${activeTab}_${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeTab, expenses, invoices, payments, purchaseOrders, cashFlowData, metrics, dateFrom, dateTo]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-[#0B5E75]" />
              Financial Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive financial analysis and reporting
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <FileText className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Date Range</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px] h-9" />
                <span className="text-sm text-muted-foreground">to</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px] h-9" />
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {[
                  { label: "Today", value: "today" },
                  { label: "This Week", value: "this_week" },
                  { label: "This Month", value: "this_month" },
                  { label: "This Quarter", value: "this_quarter" },
                  { label: "This Year", value: "this_year" },
                  { label: "Last Month", value: "last_month" },
                  { label: "Last Quarter", value: "last_quarter" },
                  { label: "Last Year", value: "last_year" },
                ].map((p) => (
                  <Button key={p.value} variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => applyPreset(p.value)}>
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0B5E75]" />
          </div>
        )}

        {!isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="revenue">Revenue / Sales</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="purchase_orders">Purchase Orders</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>

            {/* ───── OVERVIEW TAB ───── */}
            <TabsContent value="overview" className="space-y-6 mt-4">
              {/* Summary Cards */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                        <p className="text-xl font-bold text-green-600">{fmtCurrency(metrics.totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground">{metrics.paidInvoiceCount} paid invoices</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Expenses</p>
                        <p className="text-xl font-bold text-red-500">{fmtCurrency(metrics.totalExpenses)}</p>
                        <p className="text-xs text-muted-foreground">{metrics.expenseCount} entries</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Net Profit</p>
                        <p className={`text-xl font-bold ${metrics.netProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {fmtCurrency(metrics.netProfit)}
                        </p>
                        <p className="text-xs text-muted-foreground">Revenue − Expenses</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-[#0B5E75]/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Purchase Orders</p>
                        <p className="text-xl font-bold">{fmtCurrency(metrics.totalPO)}</p>
                        <p className="text-xs text-muted-foreground">{metrics.poCount} orders</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-[#0B5E75]/20" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue vs Expenses line chart */}
              {revenueVsExpenseChart.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Revenue vs Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueVsExpenseChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue" />
                        <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Pie charts */}
              <div className="grid gap-4 md:grid-cols-2">
                {expenseByCostCenter.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Expenses by Cost Center</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={expenseByCostCenter} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                            {expenseByCostCenter.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                {revenueByDepartment.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Revenue by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={revenueByDepartment} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                            {revenueByDepartment.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Bar charts */}
              <div className="grid gap-4 md:grid-cols-2">
                {topVendors.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Top Vendors by Spend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topVendors} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                          <Bar dataKey="total" fill="#0B5E75" radius={[0, 4, 4, 0]} name="Total Spend" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                {topCustomers.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Top Customers by Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topCustomers} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                          <Bar dataKey="total" fill="#12A0C3" radius={[0, 4, 4, 0]} name="Total Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ───── EXPENSES TAB ───── */}
            <TabsContent value="expenses" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                    <p className="text-xl font-bold">{fmtCurrency(metrics.totalExpenses)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Entries</p>
                    <p className="text-xl font-bold">{metrics.expenseCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Avg per Entry</p>
                    <p className="text-xl font-bold">{metrics.expenseCount ? fmtCurrency(metrics.totalExpenses / metrics.expenseCount) : "$0.00"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Cost Centers</p>
                    <p className="text-xl font-bold">{expenseByCostCenter.length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Expense Date</TableHead>
                          <TableHead>Entry Date</TableHead>
                          <TableHead>Vendor / Account</TableHead>
                          <TableHead>Cost Center</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No expenses in this date range
                            </TableCell>
                          </TableRow>
                        ) : (
                          expenses.map((e: any, i: number) => (
                            <TableRow key={e.id}>
                              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                              <TableCell>{fmtDate(e.expenseDate || e.date)}</TableCell>
                              <TableCell>{fmtDate(e.createdAt)}</TableCell>
                              <TableCell className="font-medium">{e.vendorName || e.accountName || "—"}</TableCell>
                              <TableCell>{e.costCenter || "—"}</TableCell>
                              <TableCell>{e.reference || "—"}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{e.currency || "USD"}</Badge></TableCell>
                              <TableCell className="text-right font-mono">{fmtNum(Number(e.amount) || 0)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ───── REVENUE / SALES TAB ───── */}
            <TabsContent value="revenue" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold text-green-600">{fmtCurrency(metrics.totalRevenue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Paid Invoices</p>
                    <p className="text-xl font-bold">{metrics.paidInvoiceCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Avg Invoice</p>
                    <p className="text-xl font-bold">{metrics.paidInvoiceCount ? fmtCurrency(metrics.totalRevenue / metrics.paidInvoiceCount) : "$0.00"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Departments</p>
                    <p className="text-xl font-bold">{revenueByDepartment.length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead className="text-right">Total (USD)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const paidInvs = invoices.filter((inv: any) => inv.status === "paid" || inv.status === "Paid");
                          return paidInvs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                No paid invoices in this date range
                              </TableCell>
                            </TableRow>
                          ) : (
                            paidInvs.map((inv: any, i: number) => (
                              <TableRow key={inv.id}>
                                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                <TableCell className="font-medium">{inv.number || "—"}</TableCell>
                                <TableCell>{fmtDate(inv.dateIssue || inv.createdAt)}</TableCell>
                                <TableCell>{inv.customerName || "—"}</TableCell>
                                <TableCell>{inv.department || "—"}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{inv.currency || "USD"}</Badge></TableCell>
                                <TableCell className="text-right font-mono">{fmtNum(Number(inv.totalUSD) || Number(inv.total) || 0)}</TableCell>
                              </TableRow>
                            ))
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ───── INVOICES TAB ───── */}
            <TabsContent value="invoices" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Total Invoiced</p>
                    <p className="text-xl font-bold">{fmtCurrency(metrics.allInvoiceTotal)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">All Invoices</p>
                    <p className="text-xl font-bold">{metrics.invoiceCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-xl font-bold text-green-600">{metrics.paidInvoiceCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Unpaid</p>
                    <p className="text-xl font-bold text-amber-500">{metrics.invoiceCount - metrics.paidInvoiceCount}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead className="text-right">Total (USD)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              No invoices in this date range
                            </TableCell>
                          </TableRow>
                        ) : (
                          invoices.map((inv: any, i: number) => (
                            <TableRow key={inv.id}>
                              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-medium">{inv.number || "—"}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{inv.type || "INV"}</Badge></TableCell>
                              <TableCell>{fmtDate(inv.dateIssue || inv.createdAt)}</TableCell>
                              <TableCell>{inv.customerName || "—"}</TableCell>
                              <TableCell>{inv.department || "—"}</TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${
                                  inv.status === "paid" || inv.status === "Paid"
                                    ? "bg-green-100 text-green-800"
                                    : inv.status === "draft"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}>
                                  {inv.status || "draft"}
                                </Badge>
                              </TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{inv.currency || "USD"}</Badge></TableCell>
                              <TableCell className="text-right font-mono">{fmtNum(Number(inv.totalUSD) || Number(inv.total) || 0)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ───── PAYMENTS TAB ───── */}
            <TabsContent value="payments" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Payments Received</p>
                    <p className="text-xl font-bold text-green-600">{fmtCurrency(metrics.totalReceived)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Payments Made</p>
                    <p className="text-xl font-bold text-red-500">{fmtCurrency(metrics.totalPaid)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Net Flow</p>
                    <p className={`text-xl font-bold ${metrics.totalReceived - metrics.totalPaid >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {fmtCurrency(metrics.totalReceived - metrics.totalPaid)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Total Transactions</p>
                    <p className="text-xl font-bold">{metrics.paymentCount}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Party</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Total (USD)</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              No payments in this date range
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments.map((p: any, i: number) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                              <TableCell>{fmtDate(p.date || p.createdAt)}</TableCell>
                              <TableCell className="font-medium">{p.partyName || "—"}</TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${p.type === "received" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                  {p.type === "received" ? "Received" : "Paid"}
                                </Badge>
                              </TableCell>
                              <TableCell>{p.department || "—"}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{p.currency || "USD"}</Badge></TableCell>
                              <TableCell className="text-right font-mono">{fmtNum(Number(p.amount) || 0)}</TableCell>
                              <TableCell className="text-right font-mono">{fmtNum(Number(p.totalUSD) || Number(p.amount) || 0)}</TableCell>
                              <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">{p.notes || "—"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ───── PURCHASE ORDERS TAB ───── */}
            <TabsContent value="purchase_orders" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Total PO Value</p>
                    <p className="text-xl font-bold">{fmtCurrency(metrics.totalPO)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Total POs</p>
                    <p className="text-xl font-bold">{metrics.poCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Confirmed</p>
                    <p className="text-xl font-bold">{purchaseOrders.filter((po: any) => po.status === "Confirmed").length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Closed</p>
                    <p className="text-xl font-bold">{purchaseOrders.filter((po: any) => po.status === "Closed").length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>PO #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Payment Account</TableHead>
                          <TableHead className="text-right">Total (USD)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No purchase orders in this date range
                            </TableCell>
                          </TableRow>
                        ) : (
                          purchaseOrders.map((po: any, i: number) => (
                            <TableRow key={po.id}>
                              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-medium">{po.number || "—"}</TableCell>
                              <TableCell>{fmtDate(po.date || po.createdAt)}</TableCell>
                              <TableCell>{po.supplierName || "—"}</TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${
                                  po.status === "Confirmed" ? "bg-blue-100 text-blue-800"
                                  : po.status === "Closed" ? "bg-gray-100 text-gray-800"
                                  : po.status === "Fully Received" ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                                }`}>
                                  {po.status || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell>{po.department || "—"}</TableCell>
                              <TableCell>{po.paymentAccount || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{fmtNum(Number(po.total) || 0)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ───── CASH FLOW TAB ───── */}
            <TabsContent value="cashflow" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Total Inflow</p>
                    <p className="text-xl font-bold text-green-600">
                      {fmtCurrency(cashFlowData.reduce((s, r) => s + r.inflow, 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Total Outflow</p>
                    <p className="text-xl font-bold text-red-500">
                      {fmtCurrency(cashFlowData.reduce((s, r) => s + r.outflow, 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Net Cash Flow</p>
                    {(() => {
                      const net = cashFlowData.reduce((s, r) => s + r.net, 0);
                      return <p className={`text-xl font-bold ${net >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtCurrency(net)}</p>;
                    })()}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Closing Balance</p>
                    <p className="text-xl font-bold">
                      {cashFlowData.length ? fmtCurrency(cashFlowData[cashFlowData.length - 1].balance) : "$0.00"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {cashFlowData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Cash Flow Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                        <Legend />
                        <Bar dataKey="inflow" fill="#10B981" name="Inflow" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="outflow" fill="#EF4444" name="Outflow" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {cashFlowData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Running Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                        <Line type="monotone" dataKey="balance" stroke="#0B5E75" strokeWidth={2} name="Balance" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Inflow</TableHead>
                          <TableHead className="text-right">Outflow</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashFlowData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No cash flow data in this date range
                            </TableCell>
                          </TableRow>
                        ) : (
                          cashFlowData.map((r, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{r.month}</TableCell>
                              <TableCell className="text-right font-mono text-green-600">{fmtNum(r.inflow)}</TableCell>
                              <TableCell className="text-right font-mono text-red-500">{fmtNum(r.outflow)}</TableCell>
                              <TableCell className={`text-right font-mono ${r.net >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtNum(r.net)}</TableCell>
                              <TableCell className="text-right font-mono font-bold">{fmtNum(r.balance)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
