
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  User,
  Building,
  Calendar,
  DollarSign,
  Loader2,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { invoiceService } from "@/services/invoice-service";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function InvoiceClient({ id }: { id: string }) {
  const router = useRouter();
  const db = useFirestore();
  
  const invoiceRef = useMemoFirebase(() => doc(db, "invoices", id), [db, id]);
  const { data: invoice, isLoading } = useDoc(invoiceRef);

  const handleMarkAsPaid = () => {
    if (!invoice) return;
    invoiceService.updateInvoice(db, invoice.id, { status: 'paid' });
    toast({ title: "Invoice Updated", description: "Status changed to Paid." });
  };

  const handleArchive = () => {
    if (!invoice) return;
    if (confirm("Archive this invoice? It will be removed from active ledgers.")) {
      invoiceService.deleteInvoice(db, invoice.id);
      toast({ title: "Invoice Archived", description: "Record moved to archives." });
      router.push("/accounting/invoices");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    toast({
      title: "Generating PDF",
      description: "Preparing your professional invoice document...",
    });

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("invoice-card");
      
      if (!element) return;

      const opt = {
        margin: [10, 10],
        filename: `invoice-${invoice.number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate the PDF
      html2pdf().set(opt).from(element).save();
      
      toast({
        title: "Download Started",
        description: "Your PDF document is being generated.",
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate PDF. Please try printing to PDF instead.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" /> Paid</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'overdue': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <p className="text-muted-foreground mt-2">The record may have been archived or deleted.</p>
        <Button onClick={() => router.push("/accounting/invoices")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Details</h1>
            <p className="text-muted-foreground text-sm">Review financial record for {invoice.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button variant="outline" onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
        </div>
      </div>

      <Card id="invoice-card" className="overflow-hidden border-t-4 border-t-primary shadow-lg bg-card">
        <CardHeader className="bg-muted/30 pb-8 pt-10 px-10">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-primary flex items-center justify-center rounded-lg text-primary-foreground font-bold text-xl">B</div>
                <span className="text-xl font-bold tracking-tight font-headline">BizFlow CRM</span>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed uppercase font-bold tracking-widest">
                Business Financial Document
              </div>
            </div>
            <div className="text-right space-y-2">
              <h2 className="text-3xl font-black text-muted-foreground/20">INVOICE</h2>
              <div className="font-mono text-sm font-bold bg-secondary px-3 py-1 rounded inline-block">
                {invoice.number}
              </div>
              <div className="mt-2">
                {getStatusBadge(invoice.status)}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-10 space-y-10 bg-white text-black">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bill To:</h3>
              <div className="space-y-1">
                <p className="text-lg font-bold">{invoice.customerName}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-3 w-3" />
                  <span>Market Segment: </span>
                  <Badge variant="outline" className="capitalize text-[10px]">{invoice.department}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Invoice Date</p>
                <p className="text-sm font-medium">Jan 12, 2024</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Due Date</p>
                <p className="text-sm font-bold text-destructive">{invoice.dueDate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Issued By</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <User className="h-3 w-3" /> {invoice.createdBy}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[60%]">Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="py-6">
                    <p className="font-bold text-black">Standard Professional Services / Goods Supply</p>
                    <p className="text-xs text-muted-foreground mt-1">Market Segment Fulfillment: {invoice.department}</p>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold py-6 text-black">
                    ${(invoice.total || 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="w-full md:w-1/3 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${(invoice.total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (VAT 0%)</span>
                <span>$0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-black text-primary">${(invoice.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="pt-10 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Terms & Conditions</h3>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              Please include the invoice number {invoice.number} in your bank transfer reference. 
              Payment is expected within the agreed credit term from the invoice date.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center bg-secondary/20 p-6 rounded-xl border border-dashed print:hidden">
        <div className="flex gap-3">
          {invoice.status !== 'paid' && (
            <Button onClick={handleMarkAsPaid} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Fully Paid
            </Button>
          )}
          <Button variant="outline" className="text-destructive border-destructive/20" onClick={handleArchive}>
            <Trash2 className="mr-2 h-4 w-4" /> Archive Record
          </Button>
        </div>
        <Button variant="ghost" onClick={() => router.push("/accounting/invoices")}>
          Return to Ledger
        </Button>
      </div>
    </div>
  );
}
