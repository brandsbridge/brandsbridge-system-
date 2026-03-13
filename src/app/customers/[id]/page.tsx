
"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Mail, Phone, Globe, Calendar, Clock, 
  FileText, TrendingUp, Heart, Target, 
  Download, Share2, MessageSquare, 
  DollarSign, BarChart3, Star, MapPin, 
  CheckCircle2, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { MOCK_CUSTOMERS, MOCK_RESPONSES, MOCK_OFFERS, MOCK_PRODUCTS } from "@/lib/mock-data";

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const customer = useMemo(() => MOCK_CUSTOMERS.find(c => c.id === customerId), [customerId]);
  const responses = useMemo(() => MOCK_RESPONSES.filter(r => r.customerId === customerId), [customerId]);
  
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Customer Not Found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const scores = {
    response: 92,
    orderFreq: 65,
    orderValue: 88,
    loyalty: 95
  };

  const revenueData = [
    { month: 'Jan', revenue: 4500 },
    { month: 'Feb', revenue: 5200 },
    { month: 'Mar', revenue: 4800 },
    { month: 'Apr', revenue: 6100 },
    { month: 'May', revenue: 5900 },
    { month: 'Jun', revenue: 7200 },
  ];

  const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <Badge variant="outline" className="capitalize">{customer.accountStatus}</Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
            <MapPin className="h-3 w-3" /> {customer.country} • Active Account
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Financial Audit</Button>
          <Button className="bg-accent hover:bg-accent/90">Send New Offer</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 pb-4">
              <div className="h-24 w-24 rounded-full bg-accent/10 flex items-center justify-center text-3xl font-bold text-accent border-4 border-accent/20">
                {customer.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">{customer.name}</h3>
                <div className="flex items-center justify-center gap-1 text-xs">
                   <Target className="h-3 w-3 text-muted-foreground" />
                   <span className="text-muted-foreground">Annual Value: </span>
                   <span className="font-bold text-primary">${(totalRevenue * 2).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{customer.country}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Buying cycle: 45 Days</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">Interests</h4>
              <div className="flex flex-wrap gap-1">
                {customer.interestedProducts?.map((p: string) => (
                  <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-green-500">Account Healthy</p>
                <p className="text-[10px] text-muted-foreground">Responded to 3/4 recent offers within 24 hours.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${totalRevenue.toLocaleString()}</div>
                <p className="text-[10px] text-green-500 flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" /> +12.5% vs Last Year</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">78%</div>
                <p className="text-[10px] text-muted-foreground mt-1">High conversion threshold</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Buying Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>Response Speed</span>
                      <span>{scores.response}%</span>
                    </div>
                    <Progress value={scores.response} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>Order Frequency</span>
                      <span>{scores.orderFreq}%</span>
                    </div>
                    <Progress value={scores.orderFreq} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>Order Value</span>
                      <span>{scores.orderValue}%</span>
                    </div>
                    <Progress value={scores.orderValue} className="h-1.5" />
                  </div>
                </div>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData.slice(-4)}>
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="responses">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="responses">Offer History</TabsTrigger>
              <TabsTrigger value="intelligence">Buying Patterns</TabsTrigger>
              <TabsTrigger value="history">Interactions</TabsTrigger>
            </TabsList>
            <TabsContent value="responses" className="pt-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map(res => (
                      <TableRow key={res.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(res.createdAt.seconds * 1000).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs font-medium capitalize">{res.responseType}</TableCell>
                        <TableCell>
                          {res.responseType === 'order' ? (
                            <Badge className="bg-green-500 h-5 text-[10px]">Closed</Badge>
                          ) : (
                            <Badge variant="secondary" className="h-5 text-[10px]">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
            <TabsContent value="intelligence" className="pt-4">
               <div className="p-4 border rounded-lg bg-secondary/10 flex items-start gap-4">
                  <BarChart3 className="h-6 w-6 text-accent shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Recommended for Next Offer</h4>
                    <p className="text-xs text-muted-foreground">Based on order history, this buyer responds best to mid-range bulk cocoa butter offers between $11.50 and $12.80.</p>
                  </div>
               </div>
            </TabsContent>
            <TabsContent value="history" className="pt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="flex gap-4 items-start border-l-2 border-primary/20 pl-4">
                      <div className="space-y-1">
                        <p className="text-xs">
                          <span className="font-bold text-primary">James Carter</span> sent Price Quote #4421.
                        </p>
                        <p className="text-[10px] text-muted-foreground">April {15 - i}, 2024 • 09:30 AM</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full text-[10px] h-8">Add New Meeting Note</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
