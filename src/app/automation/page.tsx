"use client";

import React, { useEffect, useState } from "react";
import { Terminal, Search, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { subscribeToCollection, formatFirebaseTimestamp } from "@/lib/db-utils";

export default function AutomationLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToCollection("automationLogs", (data) => setLogs(data), "timestamp", "desc");
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter(l => 
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Automation Logs</h1>
        <p className="text-muted-foreground">Monitor the health and status of all background pipelines.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filter logs by pipeline name or event..." 
          className="pl-9" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
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
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No automation events recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <TableCell>
                      {expandedId === log.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell className="font-medium">{log.pipelineName}</TableCell>
                    <TableCell>{log.event}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="capitalize text-xs font-medium">{log.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatFirebaseTimestamp(log.timestamp)}</TableCell>
                  </TableRow>
                  {expandedId === log.id && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="p-4">
                        <div className="rounded-lg border bg-card p-4">
                          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Execution Details</h4>
                          <pre className="overflow-x-auto rounded bg-secondary p-3 text-xs font-code">
                            {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details || "No details provided."}
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}