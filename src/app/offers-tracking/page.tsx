
"use client";

import React, { useMemo } from "react";
import { 
  Target, Send, Eye, MessageCircle, 
  ShoppingCart, XCircle, Clock, TrendingUp 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { MOCK_OFFERS_TRACKING } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

export default function OffersTrackingPage() {
  const funnelData = useMemo(() => {
    const sent = MOCK_OFFERS_TRACKING.length;
    const viewed = MOCK_OFFERS_TRACKING.filter(o => ['viewed', 'interested', 'purchased'].includes(o.status)).length;
    const interested = MOCK_OFFERS_TRACKING.filter(o => ['interested', 'purchased'].includes(o.status)).length;
    const purchased = MOCK_OFFERS_TRACKING.filter(o => o.status === 'purchased').length;
    
    return [
      { stage: 'Sent', count: sent, color: '#94A3B8' },
      { stage: 'Viewed', count: viewed, color: '#6366F1' },
      { stage: 'Interested', count: interested, color: '#F59E0B' },
      { stage: 'Purchased', count: purchased, color: '#10B981' }
    ];
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="h-3 w-3" />;
      case 'viewed': return <Eye className="h-3 w-3" />;
      case 'interested': return <MessageCircle className="h-3 w-3" />;
      case 'purchased': return <ShoppingCart className="h-3 w-3" />;
      case 'declined': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Offer Intelligence</h1>
        <p className="text-muted-foreground">Track individual price quotes from delivery to fulfillment.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={funnelData} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                   {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {funnelData.map(stage => (
                <div key={stage.stage} className="p-4 rounded-xl bg-secondary/30 border text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">{stage.stage}</p>
                  <p className="text-2xl font-bold">{stage.count}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {((stage.count / funnelData[0].count) * 100).toFixed(0)}% conversion
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sent Date</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Product & Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent By</TableHead>
              <TableHead className="text-right">Follow-up</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_OFFERS_TRACKING.map(offer => (
              <TableRow key={offer.id}>
                <TableCell className="text-[10px] text-muted-foreground">
                  {formatFirebaseTimestamp(offer.dateSent)}
                </TableCell>
                <TableCell>
                  <div className="font-bold text-xs">{offer.sentTo}</div>
                  <Badge variant="outline" className="text-[8px] uppercase">{offer.department}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium">{offer.productName}</div>
                  <div className="text-[10px] text-accent font-bold">${offer.totalValue.toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={cn(
                      "capitalize text-[10px] gap-1",
                      offer.status === 'purchased' && "bg-green-500",
                      offer.status === 'declined' && "bg-destructive",
                      offer.status === 'interested' && "bg-accent",
                      offer.status === 'viewed' && "bg-blue-500",
                      offer.status === 'sent' && "bg-muted text-muted-foreground"
                    )}
                  >
                    {getStatusIcon(offer.status)} {offer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{offer.sentBy}</TableCell>
                <TableCell className="text-right text-[10px] text-muted-foreground">
                  {offer.followUpDate}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
