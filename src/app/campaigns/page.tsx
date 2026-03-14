"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Plus, Send, TrendingUp, Mail, MousePointer2, ExternalLink, Loader2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";

export default function CampaignsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const campaignsCol = useMemoFirebase(() => user ? collection(db, "campaigns") : null, [db, user]);
  const { data: fbCampaigns, loading } = useCollection(campaignsCol);

  const campaigns = (fbCampaigns && fbCampaigns.length > 0) ? fbCampaigns : MOCK_CAMPAIGNS;

  const stats = useMemo(() => {
    return {
      total: campaigns.length,
      sent: campaigns.reduce((acc: number, c: any) => acc + (c.stats?.sent || 0), 0),
      replied: campaigns.reduce((acc: number, c: any) => acc + (c.stats?.replied || 0), 0),
      revenue: campaigns.reduce((acc: number, c: any) => acc + (c.stats?.revenue || 0), 0)
    };
  }, [campaigns]);

  const avgReplyRate = (stats.replied / (stats.sent || 1)) * 100;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Campaign Management</h1>
          <p className="text-muted-foreground">Orchestrate cross-department outreach and track conversion ROI.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Send className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <div className="text-2xl font-bold">{stats.total}</div>}
            <p className="text-[10px] text-muted-foreground mt-1">Live from Firestore</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Across all departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Reply Rate</CardTitle>
            <MousePointer2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgReplyRate.toFixed(1)}%</div>
            <Progress value={avgReplyRate} className="h-1 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-[10px] text-green-500 mt-1">+12% vs last quarter</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign: any) => {
                const replyRate = ((campaign.stats?.replied || 0) / (campaign.stats?.sent || 1)) * 100;
                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="font-bold">{campaign.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{campaign.type}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">{campaign.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          "capitalize text-[10px]",
                          campaign.status === 'active' && "bg-green-500",
                          campaign.status === 'completed' && "bg-secondary text-secondary-foreground",
                          campaign.status === 'draft' && "bg-muted text-muted-foreground"
                        )}
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 w-[120px]">
                        <div className="flex justify-between text-[10px]">
                          <span>{campaign.stats?.replied || 0} Replies</span>
                          <span className="font-bold">{replyRate.toFixed(0)}%</span>
                        </div>
                        <Progress value={replyRate} className="h-1" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-accent">
                      ${(campaign.stats?.revenue || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/campaigns/${campaign.id}`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          View Details <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No campaigns found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
