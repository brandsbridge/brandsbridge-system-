
"use client";

import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Download, Search } from "lucide-react";
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
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";
import { MOCK_RESPONSES, MOCK_CUSTOMERS, MOCK_OFFERS, MOCK_PRODUCTS } from "@/lib/mock-data";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B'];

export default function ResponsesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const customersMap = useMemo(() => {
    const map: Record<string, string> = {};
    MOCK_CUSTOMERS.forEach(c => map[c.id] = c.name);
    return map;
  }, []);

  const offersMap = useMemo(() => {
    const map: Record<string, any> = {};
    MOCK_OFFERS.forEach(o => map[o.id] = o);
    return map;
  }, []);

  const productsMap = useMemo(() => {
    const map: Record<string, string> = {};
    MOCK_PRODUCTS.forEach(p => map[p.id] = p.name);
    return map;
  }, []);

  const chartData = [
    { name: 'Order', value: MOCK_RESPONSES.filter(r => r.responseType === 'order').length },
    { name: 'Quote', value: MOCK_RESPONSES.filter(r => r.responseType === 'quote').length },
    { name: 'Interest', value: MOCK_RESPONSES.filter(r => r.responseType === 'interest').length },
  ];

  const filteredResponses = MOCK_RESPONSES.filter(r => {
    const customerName = customersMap[r.customerId]?.toLowerCase() || "";
    return customerName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Customer Responses</h1>
          <p className="text-muted-foreground">Analyze how customers are engaging (Mock Data).</p>
        </div>
        <Button variant="outline">
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
                {filteredResponses.map((res) => {
                  const offer = offersMap[res.bestOfferId];
                  const productName = productsMap[offer?.productId] || "Unknown Product";
                  return (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">{customersMap[res.customerId] || "Unknown"}</TableCell>
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
                })}
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
