"use client";

import React, { useEffect, useState } from "react";
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
import { subscribeToCollection, formatFirebaseTimestamp, addDocument } from "@/lib/db-utils";
import { useToast } from "@/hooks/use-toast";
import { analyzeOfferStrategy, type AnalyzeOfferStrategyOutput } from "@/ai/flows/ai-powered-offer-strategy-recommendations-flow";
import { cn } from "@/lib/utils";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [suppliers, setSuppliers] = useState<Record<string, any>>({});
  const [stocks, setStocks] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeOfferStrategyOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubOffers = subscribeToCollection("bestOffers", (data) => setOffers(data));
    const unsubStocks = subscribeToCollection("stocks", (data) => setStocks(data));
    const unsubResponses = subscribeToCollection("customerResponses", (data) => setResponses(data));
    const unsubProducts = subscribeToCollection("products", (data) => {
      const map: Record<string, any> = {};
      data.forEach(p => map[p.id] = p);
      setProducts(map);
    });
    const unsubSuppliers = subscribeToCollection("suppliers", (data) => {
      const map: Record<string, any> = {};
      data.forEach(s => map[s.id] = s);
      setSuppliers(map);
    });

    return () => {
      unsubOffers(); unsubStocks(); unsubResponses(); unsubProducts(); unsubSuppliers();
    };
  }, []);

  const handleRecalculate = async () => {
    try {
      await addDocument("automationLogs", {
        pipelineName: "Offer Aggregator",
        event: "Manual Trigger",
        status: "pending",
        details: "User initiated offer recalculation manual trigger."
      });
      toast({ title: "Triggered", description: "Offer recalculation pipeline has been signaled." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to trigger pipeline." });
    }
  };

  const runAiStrategy = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeOfferStrategy({
        currentStocks: stocks.map(s => ({ ...s, createdAt: s.createdAt?.toDate().toISOString() || new Date().toISOString() })),
        recentCustomerResponses: responses.map(r => ({ ...r, createdAt: r.createdAt?.toDate().toISOString() || new Date().toISOString() })),
        currentBestOffers: offers.map(o => ({ ...o, calculatedAt: o.calculatedAt?.toDate().toISOString() || new Date().toISOString() })),
        supplierDetails: Object.values(suppliers).map(s => ({ id: s.id, name: s.name, country: s.country, productsOffered: s.productsOffered || [] })),
        productDetails: Object.values(products).map(p => ({ id: p.id, name: p.name, category: p.category || "General" })),
      });
      setAiAnalysis(result);
      toast({ title: "Analysis Complete", description: "AI has generated strategic adjustments." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Error", description: "Failed to run AI strategy analysis." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isFresh = (date: any) => {
    if (!date) return false;
    const d = date?.toDate ? date.toDate() : new Date(date);
    const diff = new Date().getTime() - d.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Best Offers</h1>
          <p className="text-muted-foreground">Top-performing aggregated offers ready for distribution.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runAiStrategy} disabled={isAnalyzing}>
            <Sparkles className={cn("mr-2 h-4 w-4 text-purple-500", isAnalyzing && "animate-pulse")} />
            {isAnalyzing ? "Analyzing..." : "AI Strategy"}
          </Button>
          <Button onClick={handleRecalculate}>
            <RefreshCw className="mr-2 h-4 w-4" /> Trigger Recalculation
          </Button>
        </div>
      </div>

      {aiAnalysis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Offer Strategy Recommendations
            </CardTitle>
            <CardDescription>Generated based on real-time inventory and customer response trends.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Optimal Recalculation Timing</h4>
                <p className="text-sm leading-relaxed">{aiAnalysis.recalculationTimingRecommendation}</p>
              </div>
              <div>
                <h4 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Strategic Adjustments</h4>
                <ul className="list-inside list-disc text-sm space-y-1">
                  {aiAnalysis.strategicAdjustments.map((adj, i) => <li key={i}>{adj}</li>)}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                Conversion: {aiAnalysis.conversionRateImpact}
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                Profitability: {aiAnalysis.profitabilityImpact}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
            {offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No best offers calculated yet.
                </TableCell>
              </TableRow>
            ) : (
              offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{products[offer.productId]?.name || "Unknown Product"}</TableCell>
                  <TableCell>{suppliers[offer.supplierId]?.name || "Unknown Supplier"}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
