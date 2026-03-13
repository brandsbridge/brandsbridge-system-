"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Mail, Phone, Globe, Calendar, Clock, 
  TrendingUp, AlertTriangle, ShieldCheck, 
  Download, Share2, MessageSquare, 
  Star, MapPin, DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { MOCK_SUPPLIERS, MOCK_STOCKS, MOCK_PRODUCTS } from "@/lib/mock-data";

/**
 * generateStaticParams is required for dynamic routes when using output: 'export'
 */
export function generateStaticParams() {
  return MOCK_SUPPLIERS.map((s) => ({
    id: s.id,
  }));
}

export default function SupplierProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;

  const supplier = useMemo(() => MOCK_SUPPLIERS.find(s => s.id === supplierId), [supplierId]);
  const stocks = useMemo(() => MOCK_STOCKS.filter(s => s.supplierId === supplierId), [supplierId]);
  
  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Supplier Not Found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const performanceScores = {
    responseSpeed: 85,
    submissionFreq: 72,
    priceCompetitiveness: 94,
    reliability: 88
  };

  const avgScore = (performanceScores.responseSpeed + performanceScores.submissionFreq + performanceScores.priceCompetitiveness + performanceScores.reliability) / 4;

  const priceHistoryData = [
    { month: 'Jan', price: 12.10 },
    { month: 'Feb', price: 12.50 },
    { month: 'Mar', price: 12.30 },
    { month: 'Apr', price: 12.80 },
    { month: 'May', price: 12.50 },
    { month: 'Jun', price: 12.40 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
            <Badge variant={supplier.contractStatus === 'active' ? 'default' : 'secondary'} className={supplier.contractStatus === 'active' ? 'bg-green-500' : ''}>
              {supplier.contractStatus}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
            <MapPin className="h-3 w-3" /> {supplier.country} • Member since Jan 2023
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" /> PDF Report</Button>
          <Button>Contact Supplier</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Header Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-3 pb-4">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary border-4 border-primary/20">
                {supplier.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">{supplier.name}</h3>
                <div className="flex items-center justify-center gap-1">
                   {[1,2,3,4,5].map(i => (
                     <Star key={i} className={`h-3 w-3 ${i <= 4 ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                   ))}
                   <span className="text-xs font-bold ml-1">4.2</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{supplier.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.country}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">Specializations</h4>
              <div className="flex flex-wrap gap-1">
                {supplier.productsOffered?.map((p: string) => (
                  <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Live metrics based on recent interaction and stock submission history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Response Speed</span>
                      <span className="font-bold">{performanceScores.responseSpeed}%</span>
                    </div>
                    <Progress value={performanceScores.responseSpeed} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Stock Submission Freq.</span>
                      <span className="font-bold">{performanceScores.submissionFreq}%</span>
                    </div>
                    <Progress value={performanceScores.submissionFreq} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Price Competitiveness</span>
                      <span className="font-bold">{performanceScores.priceCompetitiveness}%</span>
                    </div>
                    <Progress value={performanceScores.priceCompetitiveness} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Reliability</span>
                      <span className="font-bold">{performanceScores.reliability}%</span>
                    </div>
                    <Progress value={performanceScores.reliability} className="h-2" />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center border rounded-lg bg-secondary/20 p-6">
                  <div className="text-4xl font-bold text-primary">{Math.round(avgScore)}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Overall Score</div>
                  <Badge className="mt-4 bg-green-500">Tier 1 Supplier</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="stocks">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stocks">Stock Feed</TabsTrigger>
              <TabsTrigger value="intelligence">Price Trends</TabsTrigger>
              <TabsTrigger value="history">Interactions</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            <TabsContent value="stocks" className="pt-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Lead Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map(stock => {
                      const product = MOCK_PRODUCTS.find(p => p.id === stock.productId);
                      return (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium text-xs">{product?.name || stock.productId}</TableCell>
                          <TableCell className="text-xs">{stock.quantity}</TableCell>
                          <TableCell className="text-xs font-bold text-accent">${stock.price.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{stock.leadTime} days</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
            <TabsContent value="intelligence" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Baseline Price Trend (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="price" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history" className="pt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs">
                          <span className="font-bold">System</span> updated stock list via import.
                        </p>
                        <p className="text-[10px] text-muted-foreground">May {22 - i}, 2024 • 10:45 AM</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full text-[10px] h-8">View Full Timeline</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mt-6">
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] uppercase font-bold text-orange-500">Risk Assessment</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <p className="text-xs font-medium">Price Volatility detected in Serum category.</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] uppercase font-bold text-green-500">Audit Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <p className="text-xs font-medium">Fully certified until Dec 2024.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground">Avg lead time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <p className="text-xs font-bold">5.2 Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground">Payment terms</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <p className="text-xs font-bold">Net 30</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
