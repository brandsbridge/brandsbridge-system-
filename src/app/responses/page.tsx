"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Download, Search, Filter } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { subscribeToCollection, formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B'];

export default function ResponsesPage() {
  const [responses, setResponses] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [offers, setOffers] = useState<Record<string, any>>({});
  const [products, setProducts] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubResponses = subscribeToCollection("customerResponses", (data) => setResponses(data));
    const unsubCustomers = subscribeToCollection("customers", (data) => {
      const map: Record<string, string> = {};
      data.forEach(c => map[c.id] = c.name);
      setCustomers(map);
    });
    const unsubOffers = subscribeToCollection("bestOffers", (data) => {
      const map: Record<string, any> = {};
      data.forEach(o => map[o.id] = o);
      setOffers(map);
    });
    const unsubProducts = subscribeToCollection("products", (data) => {
      const map: Record<string, string> = {};
      data.forEach(p => map[p.id] = p.name);
      setProducts(map);
    });

    return () => {
      unsubResponses(); unsubCustomers(); unsubOffers(); unsubProducts();
    };
  }, []);

  const chartData = [
    { name: 'Order', value: responses.filter(r => r.responseType === 'order').length },
    { name: 'Quote', value: responses.filter(r => r.responseType === 'quote').length },
    { name: 'Interest', value: responses.filter(r => r.responseType === 'interest').length },
  ].filter(d => d.value > 0);

  const filteredResponses = responses.filter(r => {
    const customerName = customers[r.customerId]?.toLowerCase() || "";
    return customerName.includes(searchTerm.toLowerCase());
  });

  const exportCSV = () => {
    const headers = ["Customer", "Offer ID", "Product", "Response Type", "Date"];
    const rows = filteredResponses.map(r => [
      customers[r.customerId] || "Unknown",
      r.bestOfferId,
      products[offers[r.bestOfferId]?.productId] || "Unknown",
      r.responseType,
      new Date(r.createdAt?.seconds * 1000).toLocaleString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customer_responses_${new Date().toISOString()}.csv`);
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Customer Responses</h1>
          <p className="text-muted-foreground">Analyze how customers are engaging with your offers.</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Response Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by customer name..." 
                className="pl-9" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Offer Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No responses found.</TableCell>
                  </TableRow>
                ) : (
                  filteredResponses.map((res) => {
                    const offer = offers[res.bestOfferId];
                    const productName = products[offer?.productId] || "Unknown Product";
                    return (
                      <TableRow key={res.id}>
                        <TableCell className="font-medium">{customers[res.customerId] || "Unknown"}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-semibold">{productName}</span>
                            {offer && <span className="ml-2 text-accent">${offer.bestPrice}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={res.responseType === 'order' ? 'default' : 'secondary'}
                            className={cn(
                              res.responseType === 'order' && "bg-green-500 hover:bg-green-600",
                              res.responseType === 'quote' && "bg-blue-500/10 text-blue-500",
                              res.responseType === 'interest' && "bg-yellow-500/10 text-yellow-500",
                            )}
                          >
                            {res.responseType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatFirebaseTimestamp(res.createdAt)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Split</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
