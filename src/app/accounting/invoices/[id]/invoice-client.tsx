
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Download, Printer, CheckCircle2, Clock, XCircle,
  Building, Loader2, Trash2, Languages, Info, Mail, Send,
  FileSearch, Eye, ShieldCheck, Truck, MapPin, BadgeDollarSign,
  Package, Scale, Boxes, History
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
import { invoiceService } from "@/services/invoice-service";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Helper to chunk items for pagination
const chunkItems = (items: any[], size: number) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

// Helper to convert number to words (Simplified for demo)
const amountToWords = (num: number) => {
  return "FORTY FIVE THOUSAND SIX HUNDRED SEVENTY DOLLARS AND FIFTY CENTS ONLY";
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Top Controls */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.type} Invoice</h1>
            <p className="text-muted-foreground text-xs">{invoice.number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button className="bg-primary" onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
        </div>
      </div>

      {/* Invoice Document Container */}
      <div id="invoice-container" className="bg-white text-black p-0 shadow-2xl space-y-0">
        {lineChunks.map((chunk, pageIdx) => (
          <div key={pageIdx} className="page-break-after-always min-h-[297mm] w-[210mm] mx-auto p-10 flex flex-col relative border-b last:border-b-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-4">
                <div className="h-16 w-48 bg-primary/10 rounded flex items-center justify-center border-2 border-dashed border-primary/20">
                  <span className="text-primary font-black text-xl tracking-tighter italic">BRANDS BRIDGE</span>
                </div>
                <div className="text-[10px] leading-tight text-gray-600 font-medium">
                  <p className="font-bold text-black uppercase">Brands Bridge General Trading LLC</p>
                  <p>Al Garhoud, Dubai, UAE</p>
                  <p>VAT ID: 100223344550003</p>
                  <p>BDO: 992881772</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black text-gray-200 tracking-tighter uppercase mb-2">Export Invoice</h2>
                <div className="space-y-1 text-[10px] font-bold">
                  <p>Number: <span className="font-mono text-primary">{invoice.number}</span></p>
                  <p>Date of Issue: {invoice.dateIssue}</p>
                  <p>Date of Sale: {invoice.dateSale || invoice.dateIssue}</p>
                  <p className="text-gray-400 mt-2">Page {pageIdx + 1} of {totalPages}</p>
                </div>
              </div>
            </div>

            {/* Entity Blocks */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="p-4 bg-gray-50 border rounded-sm space-y-2">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 border-b pb-1 mb-2">Buyer / Consignee</h3>
                <div className="text-xs font-bold leading-relaxed">
                  <p className="text-sm font-black">{invoice.customerName}</p>
                  <p className="font-normal text-gray-600">Main Distribution Hub, Sector 12</p>
                  <p className="font-normal text-gray-600">{invoice.destinationCountry}</p>
                  <p className="mt-2">VAT ID: 992881772</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border rounded-sm space-y-2">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 border-b pb-1 mb-2">Recipient</h3>
                <div className="text-xs font-bold leading-relaxed">
                  <p className="text-sm font-black">{invoice.recipientName || invoice.customerName}</p>
                  <p className="font-normal text-gray-600">Global Logistics Center</p>
                  <p className="font-normal text-gray-600">{invoice.destinationCountry}</p>
                  <p className="mt-2">VAT ID: 992881772</p>
                </div>
              </div>
            </div>

            {/* Logistics Info */}
            <div className="grid grid-cols-4 gap-4 p-4 border mb-8 rounded-sm bg-primary/[0.02]">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-gray-400 uppercase">Delivery Terms</p>
                <p className="text-xs font-bold">{invoice.deliveryTerms || 'CIF'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-gray-400 uppercase">Shipment Date</p>
                <p className="text-xs font-bold">{invoice.shippingInfo?.shipmentDate || 'Pending'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-gray-400 uppercase">Destination</p>
                <p className="text-xs font-bold">{invoice.destinationCountry}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-gray-400 uppercase">Container #</p>
                <p className="text-xs font-bold font-mono">{invoice.shippingInfo?.containerNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-grow">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-gray-100 border-y-2 border-black">
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase">No.</TableHead>
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase">GTIN / Barcode</TableHead>
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase">Description</TableHead>
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase text-right">CS</TableHead>
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase text-right">PCS</TableHead>
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase text-right">Price</TableHead>
                    <TableHead className="h-8 text-[9px] font-black text-black px-2 uppercase text-right">Total USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chunk.map((item: any, i: number) => (
                    <TableRow key={i} className="border-b border-gray-200 hover:bg-transparent">
                      <TableCell className="py-2 px-2 text-[10px] font-medium">{(pageIdx * 17) + i + 1}</TableCell>
                      <TableCell className="py-2 px-2 text-[9px] font-mono">{item.gtin}</TableCell>
                      <TableCell className="py-2 px-2 text-[10px] font-black leading-tight max-w-[200px]">{item.description}</TableCell>
                      <TableCell className="py-2 px-2 text-[10px] font-bold text-right">{item.quantityCs}</TableCell>
                      <TableCell className="py-2 px-2 text-[10px] font-bold text-right text-gray-500">{item.quantityPcs}</TableCell>
                      <TableCell className="py-2 px-2 text-[10px] font-bold text-right font-mono">${item.priceNet.toFixed(2)}</TableCell>
                      <TableCell className="py-2 px-2 text-[10px] font-black text-right font-mono">${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Page Footer / Grand Footer */}
            {pageIdx === totalPages - 1 ? (
              <div className="mt-8 space-y-8">
                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="p-4 border rounded bg-gray-50">
                      <h4 className="text-[9px] font-black uppercase mb-2 text-gray-400">Payment Terms</h4>
                      <div className="text-[10px] font-bold space-y-1">
                        <p>Method: {invoice.paymentTerms?.method || 'Bank Transfer'}</p>
                        <p>Due Date: {invoice.paymentTerms?.dueDate || 'On Receipt'}</p>
                        <p className="text-gray-500 italic mt-2">{invoice.paymentTerms?.notes || 'Please include invoice number in reference.'}</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded bg-primary/[0.03]">
                      <h4 className="text-[9px] font-black uppercase mb-1 text-primary">Amount in Words</h4>
                      <p className="text-[10px] font-black italic">{amountToWords(invoice.totals?.gross || 0)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-500">Total Net Weight:</span>
                      <span>{invoice.totals?.weightNet} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-500">Total Gross Weight:</span>
                      <span>{invoice.totals?.weightGross} kg</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-end">
                      <div className="text-right flex-grow pr-4">
                        <p className="text-[10px] font-black uppercase text-gray-400">Total Amount Payable</p>
                        <p className="text-3xl font-black tracking-tighter text-primary">USD ${(invoice.totals?.gross || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-8 pt-12 border-t">
                  <div className="text-center space-y-4">
                    <div className="h-20 border-b border-gray-300 flex items-end justify-center pb-2">
                      <span className="text-[8px] text-gray-300 uppercase">Manager Signature</span>
                    </div>
                    <p className="text-[9px] font-black uppercase">Issued by</p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="h-20 border-b border-gray-300 flex items-end justify-center pb-2">
                      <span className="text-[8px] text-gray-300 uppercase">Logistics Stamp</span>
                    </div>
                    <p className="text-[9px] font-black uppercase">Goods Collected</p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="h-20 border-b border-gray-300 flex items-end justify-center pb-2">
                      <span className="text-[8px] text-gray-300 uppercase">Customer Signature</span>
                    </div>
                    <p className="text-[9px] font-black uppercase">Receiver</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t text-right">
                <p className="text-[10px] font-black uppercase text-gray-400 italic">Page Subtotal continues on next page...</p>
              </div>
            )}

            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 pointer-events-none opacity-[0.03]">
              <span className="text-[150px] font-black tracking-tighter uppercase">{invoice.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
