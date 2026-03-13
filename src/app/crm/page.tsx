"use client";

import React, { useMemo } from "react";
import { Target, TrendingUp, Users, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { MOCK_LEADS } from "@/lib/mock-data";
import { useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";

const STAGES = ["Lead", "Contacted", "Negotiating", "Closed Won", "Closed Lost"];
const COLORS = ['#94A3B8', '#6366F1', '#F59E0B', '#10B981', '#EF4444'];

export default function CRMPage() {
  const db = useFirestore();
  const leadsCol = useMemo(() => collection(db, "leads"), [db]);
  const { data: fbLeads = [], loading } = useCollection(leadsCol);

  const leads = fbLeads.length > 0 ? fbLeads : MOCK_LEADS;

  const funnelData = useMemo(() => {
    return STAGES.map(stage => ({
      stage,
      count: leads.filter((l: any) => l.stage === stage).length
    }));
  }, [leads]);

  const totalValue = leads.filter((l: any) => l.stage === 'Closed Won').reduce((sum: number, l: any) => sum + (l.value || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Sales CRM</h1>
        <p className="text-muted-foreground">Manage your sales pipeline and track conversions from Firestore.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">${leads.reduce((sum: number, l: any) => sum + (l.value || 0), 0).toLocaleString()}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Won</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle>Pipeline Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map((stage, idx) => (
                <div key={stage} className="min-w-[200px] flex-1 flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stage}</span>
                    <Badge variant="outline" className="text-[10px]">{leads.filter((l: any) => l.stage === stage).length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {leads.filter((l: any) => l.stage === stage).map((lead: any) => (
                      <div key={lead.id} className="p-3 rounded-lg border bg-card/50 text-xs flex flex-col gap-1 shadow-sm">
                        <span className="font-semibold">{lead.name}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{lead.company}</span>
                          <span className="font-bold text-accent">${(lead.value || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {leads.filter((l: any) => l.stage === stage).length === 0 && (
                      <div className="text-[10px] text-muted-foreground text-center py-4 border border-dashed rounded-lg">No leads</div>
                    )}
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center py-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}