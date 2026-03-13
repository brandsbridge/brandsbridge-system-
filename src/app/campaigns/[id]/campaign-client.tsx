
"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Send, Mail, Users, TrendingUp, 
  BarChart3, MousePointer2, PieChart as PieIcon,
  Calendar, CheckCircle2, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { MOCK_CAMPAIGNS, MOCK_EMAILS, MOCK_PURCHASES } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";

export default function CampaignClient({ id }: { id: string }) {
  const router = useRouter();
  const campaign = useMemo(() => MOCK_CAMPAIGNS.find(c => c.id === id), [id]);
  const campaignEmails = useMemo(() => MOCK_EMAILS.filter(e => e.campaignId === id), [id]);
  const campaignPurchases = useMemo(() => MOCK_PURCHASES.filter(p => campaignEmails.some(e => e.sentTo === p.buyerName)), [campaignEmails]);

  if (!campaign) return <div>Campaign not found</div>;

  const replyRate = (campaign.stats.replied / (campaign.stats.sent || 1)) * 100;
  const conversionRate = (campaignPurchases.length / (campaign.stats.replied || 1)) * 100;

  const timelineData = [
    { day: 'Day 1', sent: 20, replies: 2 },
    { day: 'Day 2', sent: 45, replies: 5 },
    { day: 'Day 3', sent: 15, replies: 8 },
    { day: 'Day 4', sent: 30, replies: 12 },
    { day: 'Day 5', sent: 40, replies: 8 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <Badge className="capitalize">{campaign.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Target: {campaign.department} Market • Created by {campaign.createdBy}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Pause Campaign</Button>
          <Button>Edit Setup</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Emails Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.stats.sent}</div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span>Delivery Success</span>
              <span className="text-green-500">99.2%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Reply Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{replyRate.toFixed(1)}%</div>
            <Progress value={replyRate} className="h-1 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${campaign.stats.revenue.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground mt-2">ROI: {(campaign.stats.revenue / 500).toFixed(1)}x</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <div className="text-[10px] text-muted-foreground mt-2">{campaignPurchases.length} Orders closed</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emails">Email Log</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="replies" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Type</p>
                    <p className="text-sm font-medium capitalize">{campaign.type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Goal</p>
                    <p className="text-sm font-medium">{campaign.goal} Responses</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</p>
                    <p className="text-sm font-medium">{campaign.startDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">End Date</p>
                    <p className="text-sm font-medium">{campaign.endDate}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Target Audience</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All buyers in the {campaign.department} sector with high response history and interest in seasonal offers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emails" className="pt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Sent By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignEmails.slice(0, 10).map(email => (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium text-xs">{email.sentTo}</TableCell>
                    <TableCell className="text-xs">{email.sentBy}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">{formatFirebaseTimestamp(email.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">{email.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px]">View Thread</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="pt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignEmails.filter(e => e.replyReceived).map(reply => (
                  <TableRow key={reply.id}>
                    <TableCell className="font-bold text-xs">{reply.sentTo}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-[10px]">Positive Interest</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{reply.responseTimeHours}h</TableCell>
                    <TableCell>
                      <Badge className="capitalize text-[10px] bg-green-500">{reply.actionTaken}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="pt-4">
          <div className="grid gap-6">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Closer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignPurchases.map(purchase => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-mono text-[10px]">{purchase.id}</TableCell>
                      <TableCell className="font-bold text-xs">{purchase.buyerName}</TableCell>
                      <TableCell className="text-accent font-bold">${purchase.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-green-500">${purchase.netProfit.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{purchase.employeeName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          <Card className="p-8">
            <div className="relative border-l-2 border-primary/20 pl-8 space-y-12">
              <div className="relative">
                <div className="absolute -left-10 mt-1 h-4 w-4 rounded-full bg-primary" />
                <h4 className="font-bold text-sm">Campaign Launch</h4>
                <p className="text-[10px] text-muted-foreground uppercase">{campaign.startDate}</p>
                <p className="text-xs text-muted-foreground mt-2">Batch 1: 50 priority buyers sent invitations.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-10 mt-1 h-4 w-4 rounded-full bg-accent" />
                <h4 className="font-bold text-sm">Peak Engagement</h4>
                <p className="text-[10px] text-muted-foreground uppercase">3 Days after launch</p>
                <p className="text-xs text-muted-foreground mt-2">15 positive replies received. Follow-up triggered.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-10 mt-1 h-4 w-4 rounded-full bg-green-500" />
                <h4 className="font-bold text-sm">First Conversion</h4>
                <p className="text-[10px] text-muted-foreground uppercase">1 Week after launch</p>
                <p className="text-xs text-muted-foreground mt-2">$2,500 order closed with Sweet Tooth Retail.</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
