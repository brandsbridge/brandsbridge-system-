"use client";

import React from "react";
import { 
  History, 
  Search, 
  Calendar, 
  MoreVertical, 
  Filter,
  CheckCircle2,
  Clock
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MOCK_JOURNALS } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";

export default function JournalPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">General Journal</h1>
          <p className="text-muted-foreground">The master chronological record of all financial transactions.</p>
        </div>
        <Button className="bg-primary">New Manual Entry</Button>
      </div>

      <Card>
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reference or description..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Filter by Account</Button>
            <Button variant="outline" size="sm">Date Range</Button>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_JOURNALS.map(je => (
              <React.Fragment key={je.id}>
                <TableRow className="bg-muted/20">
                  <TableCell className="text-[10px] text-muted-foreground">{formatFirebaseTimestamp(je.date)}</TableCell>
                  <TableCell className="font-mono text-xs font-bold">{je.reference}</TableCell>
                  <TableCell className="text-sm font-medium">{je.description}</TableCell>
                  <TableCell>
                    <Badge variant={je.type === 'System' ? 'secondary' : 'outline'} className="text-[10px]">
                      {je.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">${je.entries.reduce((acc, entry) => acc + entry.debit, 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold">${je.entries.reduce((acc, entry) => acc + entry.credit, 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
                {je.entries.map((entry, idx) => (
                  <TableRow key={`${je.id}-${idx}`} className="border-none hover:bg-transparent">
                    <TableCell colSpan={2} />
                    <TableCell className="text-[11px] italic pl-8">
                      {entry.accountCode} - {entry.accountName}
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right text-[11px]">
                      {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-[11px]">
                      {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
