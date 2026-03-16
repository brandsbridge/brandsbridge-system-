
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  XCircle,
  User,
  Building,
  Loader2,
  Trash2,
  Languages,
  Info,
  Mail,
  Link as LinkIcon,
  Signature
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
  const [displayLanguage, setDisplayLanguage] = useState<'en' | 'ar'>('en');
  
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

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate PDF.",
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

  const isRTL = displayLanguage === 'ar' || invoice.language === 'ar';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
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
          <Button variant="outline" onClick={() => setDisplayLanguage(displayLanguage === 'en' ? 'ar' : 'en')}>
            <Languages className="mr-2 h-4 w-4" /> {displayLanguage === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          </Button>
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button className="bg-primary shadow-lg shadow-primary/20" onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card id="invoice-card" className={cn("overflow-hidden border-t-4 border-t-primary shadow-lg bg-card", isRTL && "text-right")}>
            <CardHeader className="bg-muted/30 pb-8 pt-10 px-10">
              <div className={cn("flex flex-col md:flex-row justify-between gap-6", isRTL && "md:flex-row-reverse")}>
                <div className="space-y-4">
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <div className="h-10 w-10 bg-primary flex items-center justify-center rounded-lg text-primary-foreground font-bold text-xl">B</div>
                    <span className="text-xl font-bold tracking-tight font-headline">BizFlow CRM</span>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed uppercase font-bold tracking-widest">
                    {displayLanguage === 'ar' ? 'وثيقة مالية تجارية' : 'Business Financial Document'}
                  </div>
                </div>
                <div className={cn("space-y-2", isRTL ? "text-left" : "text-right")}>
                  <h2 className="text-3xl font-black text-muted-foreground/20">
                    {invoice.isProforma ? (displayLanguage === 'ar' ? 'فاتورة مبدئية' : 'PROFORMA') : (displayLanguage === 'ar' ? 'فاتورة ضريبية' : 'INVOICE')}
                  </h2>
                  <div className="font-mono text-sm font-bold bg-secondary px-3 py-1 rounded inline-block">
                    {invoice.number}
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-10 space-y-10 bg-white text-black min-h-[800px]">
              <div className={cn("grid grid-cols-2 gap-12", isRTL && "direction-rtl")}>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {displayLanguage === 'ar' ? 'فاتورة إلى:' : 'Bill To:'}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">{invoice.customerName}</p>
                    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
                      <Building className="h-3 w-3" />
                      <span>{displayLanguage === 'ar' ? 'قطاع السوق: ' : 'Market Segment: '}</span>
                      <Badge variant="outline" className="capitalize text-[10px]">{invoice.department}</Badge>
                    </div>
                  </div>
                </div>
                <div className={cn("grid grid-cols-2 gap-4", isRTL ? "text-right" : "text-left")}>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{displayLanguage === 'ar' ? 'تاريخ الفاتورة' : 'Invoice Date'}</p>
                    <p className="text-sm font-medium">Jan 12, 2024</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{displayLanguage === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</p>
                    <p className="text-sm font-bold text-destructive">{invoice.dueDate}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className={cn(isRTL && "flex-row-reverse")}>
                      <TableHead className={cn("w-[60%]", isRTL && "text-right")}>{displayLanguage === 'ar' ? 'الوصف' : 'Description'}</TableHead>
                      <TableHead className={cn("text-right", isRTL && "text-left")}>{displayLanguage === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className={cn(isRTL && "flex-row-reverse")}>
                      <TableCell className={cn("py-6", isRTL && "text-right")}>
                        <p className="font-bold text-black">{displayLanguage === 'ar' ? 'توريد سلع وخدمات مهنية قياسية' : 'Standard Professional Services / Goods Supply'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{displayLanguage === 'ar' ? 'تنفيذ قطاع السوق: ' : 'Market Segment Fulfillment: '}{invoice.department}</p>
                      </TableCell>
                      <TableCell className={cn("text-right font-mono font-bold py-6 text-black", isRTL && "text-left")}>
                        ${(invoice.subtotal || invoice.total || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className={cn("flex flex-col items-end gap-2", isRTL && "items-start")}>
                <div className="w-full md:w-1/3 space-y-3">
                  <div className={cn("flex justify-between text-sm", isRTL && "flex-row-reverse")}>
                    <span className="text-muted-foreground">{displayLanguage === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                    <span>${(invoice.subtotal || invoice.total || 0).toLocaleString()}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className={cn("flex justify-between text-sm text-green-600", isRTL && "flex-row-reverse")}>
                      <span>{displayLanguage === 'ar' ? 'الخصم' : 'Discount'}</span>
                      <span>-${(invoice.discountTotal || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {invoice.shippingCharges > 0 && (
                    <div className={cn("flex justify-between text-sm", isRTL && "flex-row-reverse")}>
                      <span>{displayLanguage === 'ar' ? 'رسوم الشحن' : 'Shipping'}</span>
                      <span>+${(invoice.shippingCharges || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className={cn("flex justify-between items-center pt-2", isRTL && "flex-row-reverse")}>
                    <span className="text-lg font-bold">{displayLanguage === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</span>
                    <span className="text-2xl font-black text-primary">${(invoice.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-10 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {displayLanguage === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 pl-4 py-1">
                    {invoice.termsAndConditions || 'Payment expected within term.'}
                  </p>
                </div>

                <div className={cn("flex justify-between items-center pt-10", isRTL && "flex-row-reverse")}>
                  <div className="space-y-4">
                    <div className="h-20 w-40 border-b border-muted-foreground/30 flex items-end justify-center pb-2">
                      <Signature className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                      {displayLanguage === 'ar' ? 'التوقيع المخول' : 'Authorized Signature'}
                    </p>
                  </div>
                  <div className="h-24 w-24 rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center text-primary/10 text-[8px] font-black text-center p-2 uppercase rotate-12">
                    Official Stamp Area
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6 print:hidden">
          <Card>
            <CardHeader><CardTitle className="text-sm">Administrative Controls</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleMarkAsPaid} disabled={invoice.status === 'paid'} className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Fully Paid
              </Button>
              {invoice.sentStatus === 'draft' && (
                <Button variant="outline" className="w-full" onClick={() => invoiceService.updateInvoice(db, id, { sentStatus: 'sent' })}>
                  Mark as Sent
                </Button>
              )}
              <Separator />
              <Button variant="outline" className="w-full text-destructive border-destructive/20" onClick={handleArchive}>
                <Trash2 className="mr-2 h-4 w-4" /> Archive Record
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Internal Context</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-muted-foreground leading-relaxed">
                {invoice.internalNotes || "No internal notes for this record."}
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Automation Links</p>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] justify-start" asChild disabled={!invoice.paymentLink}>
                    <a href={invoice.paymentLink} target="_blank"><LinkIcon className="mr-2 h-3 w-3" /> Copy Payment Link</a>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] justify-start" disabled={!invoice.ccEmails}>
                    <Mail className="mr-2 h-3 w-3" /> Notify Stakeholders
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
