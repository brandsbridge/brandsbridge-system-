
"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Terminal, 
  Zap, 
  Link as LinkIcon, 
  Send, 
  Settings2,
  ExternalLink,
  Code2,
  Loader2
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { MOCK_LOGS } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

export default function AutomationPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const filteredLogs = MOCK_LOGS.filter(l => 
    l.pipelineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast({ variant: "destructive", title: "URL Required", description: "Please enter a valid webhook URL from n8n or Zapier." });
      return;
    }
    setIsTesting(true);
    try {
      // Simulate sending a payload to the external service
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "test_connection",
          timestamp: new Date().toISOString(),
          system: "BrandsBridge-CRM",
          data: { message: "Connectivity test successful" }
        })
      });
      
      toast({ title: "Signal Sent", description: "Test payload dispatched to your automation endpoint." });
    } catch (e) {
      toast({ variant: "destructive", title: "Connection Failed", description: "Could not reach the webhook URL. Check for CORS or URL errors." });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Automation Control</h1>
          <p className="text-muted-foreground">Orchestrate data flows between Firestore and external platforms.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Settings2 className="mr-2 h-4 w-4" /> Global Settings</Button>
          <Button className="bg-primary"><Zap className="mr-2 h-4 w-4" /> Active Workflows</Button>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="w-full lg:w-auto grid grid-cols-2 lg:flex gap-2">
          <TabsTrigger value="integrations">Integrations & Webhooks</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="pt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Outgoing Webhooks</CardTitle>
                </div>
                <CardDescription>Send real-time Firestore updates to n8n, Zapier, or custom APIs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Endpoint URL</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://n8n.your-domain.com/webhook/..." 
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={handleTestWebhook}
                      disabled={isTesting}
                    >
                      {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-dashed text-center">
                  <Code2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Data is sent as a structured JSON payload compatible with all major automation tools.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" />
                  <CardTitle>Automation Schema</CardTitle>
                </div>
                <CardDescription>Reference the structure required for your automations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your Firestore data follows the structure defined in <code>backend.json</code>. Use this schema to map fields in your automation tool.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href="/admin/system"><ExternalLink className="mr-2 h-3 w-3" /> View Data Definitions</a>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href="https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlefirestore/" target="_blank"><ExternalLink className="mr-2 h-3 w-3" /> Firestore n8n Docs</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="pt-6">
          <Card>
            <CardHeader className="p-4 flex flex-row items-center justify-between border-b space-y-0">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter logs by pipeline name or event..." 
                  className="pl-9" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Badge variant="outline">Live Feed</Badge>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>Pipeline Name</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <TableCell>
                        {expandedId === log.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-medium">{log.pipelineName}</TableCell>
                      <TableCell className="text-xs uppercase font-mono">{log.event}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="capitalize text-xs font-medium">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[10px]">{formatFirebaseTimestamp(log.timestamp)}</TableCell>
                    </TableRow>
                    {expandedId === log.id && (
                      <TableRow className="bg-muted/10 border-none">
                        <TableCell colSpan={5} className="p-4">
                          <div className="rounded-lg border bg-card p-4 shadow-inner">
                            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Execution Details</h4>
                            <pre className="overflow-x-auto rounded bg-secondary p-3 text-[10px] font-code leading-relaxed border">
                              {log.details || "No details provided."}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
