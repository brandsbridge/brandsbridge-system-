"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Download, Printer, CheckCircle2, Building, Loader2,
  Languages, ArrowRightLeft, FileText, BadgeDollarSign
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { currencyService } from "@/services/currency-service";
import { toast } from "@/hooks/use-toast";

const chunkItems = (items: any[], size: number) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export default function InvoiceClient({ id }: { id: string }) {
  const router = useRouter();
  const db = useFirestore();
  const invoiceRef = useMemoFirebase(() => doc(db, "invoices", id), [db, id]);
  const { data: invoice, isLoading } = useDoc(invoiceRef);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    toast({ title: "Generating PDF", description: "Preparing export documents..." });
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("invoice-container");
      if (!element) return;
      const opt = {
        margin: 0,
        filename: `${invoice.number.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } catch (e) {
      toast({ variant: "destructive", title: "PDF Failed" });
    }
  };

  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!invoice) return <div className="text-center py-20">Record not found.</div>;

  const lineChunks = chunkItems(invoice.lineItems || [], 17);
  const totalPages = lineChunks.length;
  const currency = invoice.currency || 'USD';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">Invoice Details</h1>
            <p className="text-muted-foreground text-xs">{invoice.number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button className="bg-primary" onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
        </div>
      </div>

      <div id="invoice-container" className="bg-white text-black p-0 shadow-2xl space-y-0 border border-gray-200">
        {lineChunks.map((chunk, pageIdx) => (
          <div key={pageIdx} className="page-break-after-always min-h-[297mm] w-[210mm] mx-auto p-10 flex flex-col relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-4">
                <div className="h-12 w-48 bg-black flex items-center justify-center rounded">
                  <span className="text-white font-black text-lg italic">BRANDSBRIDGE GLOBAL</span>
                </div>
                <div className="text-[10px] leading-tight text-gray-600 font-medium uppercase">
                  <p className="font-black text-black">Brands Bridge General Trading LLC</p>
                  <p>Al Garhoud, Dubai, UAE</p>
                  <p>VAT ID: 100223344550003</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black tracking-tight uppercase mb-2">Sales Invoice</h2>
                <div className="space-y-1 text-[10px] font-bold">
                  <p>Number: <span className="text-primary">{invoice.number}</span></p>
                  <p>Date: {invoice.dateIssue}</p>
                  <p className="text-gray-400 mt-2">Page {pageIdx + 1} of {totalPages}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="p-4 bg-gray-50 border rounded space-y-2">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 border-b pb-1 mb-2">Buyer / Client</h3>
                <div className="text-xs font-bold leading-relaxed">
                  <p className="text-sm font-black">{invoice.customerName}</p>
                  <p className="font-normal text-gray-600">{invoice.destinationCountry}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border rounded space-y-2">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 border-b pb-1 mb-2">Currency Reference</h3>
                <div className="text-xs font-bold space-y-1">
                  <p>Transaction Currency: <span className="font-black text-primary">{currency}</span></p>
                  {currency !== 'USD' && (
                    <p className="text-[9px] text-gray-500 font-medium italic">
                      Exchange Rate: 1 USD = {(invoice.exchangeRate || 1).toFixed(4)} {currency}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-grow">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow className="border-y-2 border-black">
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase">No.</TableHead>
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase">Description</TableHead>
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase text-right">Qty</TableHead>
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase text-right">Price ({currency})</TableHead>
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase text-right">Total ({currency})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chunk.map((item: any, i: number) => (
                    <TableRow key={i} className="border-b border-gray-200">
                      <TableCell className="py-2 px-2 text-[10px]">{(pageIdx * 17) + i + 1}</TableCell>
                      <TableCell className="py-2 px-2 text-[10px] font-black">{item.description}</TableCell>
                      <TableCell className="py-2 px-2 text-[10px] text-right font-medium">{item.quantityCs || item.quantity || 0}</TableCell>
                      <TableCell className="py-2 px-2 text-[10px] text-right font-mono">{item.priceNet?.toFixed(2)}</TableCell>
                      <TableCell className="py-2 px-2 text-[10px] font-black text-right font-mono">{item.total?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pageIdx === totalPages - 1 && (
              <div className="mt-12 space-y-8">
                <div className="flex justify-end">
                  <div className="w-1/2 space-y-2 border-t-2 border-black pt-4">
                    <div className="flex justify-between items-center text-sm font-black">
                      <span>Grand Total ({currency}):</span>
                      <span className="text-xl">{currency} {(invoice.total || invoice.totals?.gross || 0).toLocaleString()}</span>
                    </div>
                    {currency !== 'USD' && (
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 italic">
                        <span>USD Equivalent:</span>
                        <span>USD ${(invoice.totalUSD || invoice.total || invoice.totals?.gross || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-8 pt-12 border-t">
                  <div className="text-center space-y-4">
                    <div className="h-16 border-b border-gray-300"></div>
                    <p className="text-[9px] font-black uppercase">Issued By</p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="h-16 border-b border-gray-300"></div>
                    <p className="text-[9px] font-black uppercase">Goods Dispatched</p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="h-16 border-b border-gray-300"></div>
                    <p className="text-[9px] font-black uppercase">Receiver</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
