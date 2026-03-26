
"use client";

import React, { useState, useMemo } from "react";
import { Trophy, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { MOCK_OFFERS, MOCK_PRODUCTS, MOCK_SUPPLIERS } from "@/lib/mock-data";

export default function OffersPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const productsMap = useMemo(() => {
    const map: Record<string, any> = {};
    MOCK_PRODUCTS.forEach(p => map[p.id] = p);
    return map;
  }, []);

  const suppliersMap = useMemo(() => {
    const map: Record<string, any> = {};
    MOCK_SUPPLIERS.forEach(s => map[s.id] = s);
    return map;
  }, []);

  const isFresh = (date: any) => {
    if (!date) return false;
    const seconds = date.seconds || date / 1000;
    const d = new Date(seconds * 1000);
    const diff = new Date().getTime() - d.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Best Offers</h1>
          <p className="text-muted-foreground">Top-performing aggregated offers ready for distribution (Mock Data).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={true}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" /> AI Strategy (Static)
          </Button>
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Trigger Recalculation
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Best Price</TableHead>
              <TableHead>Lead Time</TableHead>
              <TableHead>Last Calculated</TableHead>
              <TableHead>Freshness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_OFFERS.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell className="font-medium">{productsMap[offer.productId]?.name || "Unknown Product"}</TableCell>
                <TableCell>{suppliersMap[offer.supplierId]?.name || "Unknown Supplier"}</TableCell>
                <TableCell className="font-bold text-accent">${offer.bestPrice?.toFixed(2)}</TableCell>
                <TableCell>{offer.leadTime} days</TableCell>
                <TableCell className="text-muted-foreground">{formatFirebaseTimestamp(offer.calculatedAt)}</TableCell>
                <TableCell>
                  {isFresh(offer.calculatedAt) ? (
                    <Badge className="bg-green-500">Fresh</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <AlertTriangle className="mr-1 h-3 w-3" /> Stale
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
