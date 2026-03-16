'use client';

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  TrendingUp, 
  Settings, 
  ShieldCheck, 
  AlertTriangle,
  History,
  Info,
  DollarSign,
  ArrowRightLeft,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useFirestore, useMemoFirebase } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { currencyService, SUPPORTED_CURRENCIES, type ExchangeRates } from "@/services/currency-service";
import { toast } from "@/hooks/use-toast";
import { formatFirebaseTimestamp } from "@/lib/db-utils";

export default function CurrencySettingsPage() {
  const db = useFirestore();
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'exchangeRates'), (doc) => {
      if (doc.exists()) {
        setRates(doc.data() as ExchangeRates);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, [db]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await currencyService.fetchLatestRates(db);
      toast({ title: "Rates Updated", description: "Successfully synchronized with global markets." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Market data currently unavailable." });
    } finally {
      setIsRefreshing(false);
    }
  };

  const mockHistory = [
    { day: '1', rate: 3.672 },
    { day: '5', rate: 3.673 },
    { day: '10', rate: 3.671 },
    { day: '15', rate: 3.672 },
    { day: '20', rate: 3.674 },
    { day: '25', rate: 3.672 },
    { day: '30', rate: 3.672 },
  ];

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Currency Control</h1>
          <p className="text-muted-foreground">Manage global exchange rates and financial standardization.</p>
        </div>
        <Button 
          className="bg-primary" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
        >
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Live Rates
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle>Active Exchange Rates</CardTitle>
              <CardDescription>Base Currency: <strong>USD</strong></CardDescription>
            </div>
            <div className="text-right">
              <Badge variant={rates?.source === 'cache' ? 'destructive' : 'outline'} className="gap-1">
                {rates?.source === 'cache' && <AlertTriangle className="h-3 w-3" />}
                Source: {rates?.source || 'unknown'}
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-1">Last Updated: {rates?.updatedAt ? new Date(rates.updatedAt).toLocaleString() : 'Never'}</p>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead>Rate (to 1 USD)</TableHead>
                <TableHead>Example (100 USD)</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SUPPORTED_CURRENCIES.map(code => (
                <TableRow key={code}>
                  <TableCell className="font-bold">{code}</TableCell>
                  <TableCell className="font-mono">{rates?.rates[code]?.toFixed(4) || '1.0000'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {currencyService.format(100 * (rates?.rates[code] || 1), code)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-[10px]">ACTIVE</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> AED/USD History (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" hide />
                  <YAxis domain={['dataMin - 0.01', 'dataMax + 0.01']} hide />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Corporate Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                All financial entries are converted to USD at the moment of creation. Reports strictly use these recorded USD values to ensure historical accuracy, even if current rates fluctuate.
              </p>
              <div className="p-3 bg-card rounded border text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Reporting</span>
                  <span className="font-bold">USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refresh Cycle</span>
                  <span className="font-bold">24 Hours</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
