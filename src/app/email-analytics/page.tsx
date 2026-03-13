
"use client";

import React, { useMemo, useState } from "react";
import { 
  Mail, MessageSquare, Clock, AlertCircle, Search, 
  Filter, Download, ChevronRight, User, Factory 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { MOCK_EMAILS } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

export default function EmailAnalyticsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = useMemo(() => {
    const total = MOCK_EMAILS.length;
    const replied = MOCK_EMAILS.filter(e => e.replyReceived).length;
    const pending = MOCK_EMAILS.filter(e => e.status === 'sent').length;
    const avgResponse = MOCK_EMAILS.reduce((acc, e) => acc + (e.responseTimeHours || 0), 0) / (replied || 1);
    
    return { total, replied, pending, avgResponse };
  }, []);

  const filteredEmails = MOCK_EMAILS.filter(e => {
    const matchesSearch = e.sentTo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Email Intelligence</h1>
        <p className="text-muted-foreground">Monitor communication health and response dynamics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Replies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.replied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Reply Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{((stats.replied / stats.total) * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Avg Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponse.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Sent Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by company or subject..." 
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Sent</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead>Email Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Handling</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmails.slice(0, 50).map(email => (
              <TableRow key={email.id} className="group">
                <TableCell className="text-[10px] text-muted-foreground">
                  {formatFirebaseTimestamp(email.date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <div className="text-xs">
                      <span className="font-bold">{email.sentBy}</span>
                      <div className="text-[10px] text-muted-foreground uppercase">{email.dept}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium truncate max-w-[250px]">{email.subject}</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Factory className="h-2.5 w-2.5" /> {email.sentTo}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={email.status === 'replied' ? 'default' : 'secondary'}
                    className={cn(
                      "capitalize text-[10px]",
                      email.status === 'replied' && "bg-green-500",
                      email.status === 'opened' && "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    )}
                  >
                    {email.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {email.replyReceived ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-accent">{email.responseTimeHours}h Response</span>
                      <span className="text-[10px] capitalize text-muted-foreground">{email.actionTaken}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Pending</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
