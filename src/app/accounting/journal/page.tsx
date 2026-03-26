
"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from "react";
import { 
  History, 
  Search, 
  Plus, 
  MoreVertical, 
  Filter,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { journalService } from "@/services/journal-service";
import { formatFirebaseTimestamp } from "@/lib/db-utils";
import { CHART_OF_ACCOUNTS } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

export default function JournalPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("demoUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const journalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "journals"), orderBy("date", "desc"));
  }, [db, user]);

  const { data: fbJournals, isLoading } = useCollection(journalsQuery);
  const journals = fbJournals || [];

  const filteredJournals = useMemo(() => {
    return journals.filter(je => 
      je.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      je.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [journals, searchTerm]);

  const handleCreateManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Simplistic balanced entry logic for prototype
    const debitAccount = CHART_OF_ACCOUNTS.find(a => a.code === formData.get('debitAccount'));
    const creditAccount = CHART_OF_ACCOUNTS.find(a => a.code === formData.get('creditAccount'));
    const amount = parseFloat(formData.get('amount') as string);

    if (!debitAccount || !creditAccount || isNaN(amount)) return;

    const data = {
      date: new Date().toISOString(),
      reference: formData.get('reference') || `MAN-${Date.now().toString().slice(-4)}`,
      description: formData.get('description'),
      type: 'Manual',
      department: formData.get('department') || 'all',
      entries: [
        { accountCode: debitAccount.code, accountName: debitAccount.name, debit: amount, credit: 0 },
        { accountCode: creditAccount.code, accountName: creditAccount.name, debit: 0, credit: amount }
      ],
      createdBy: currentUser?.name || 'System'
    };

    journalService.createJournal(db, data);
    setIsAddModalOpen(false);
    toast({ title: "Journal Entry Created", description: `Reference ${data.reference} committed to general ledger.` });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">General Journal</h1>
          <p className="text-muted-foreground">The master chronological record of all financial transactions.</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> New Manual Entry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreateManualEntry}>
              <DialogHeader>
                <DialogTitle>Create Manual Journal Entry</DialogTitle>
                <DialogDescription>Record a manual adjustment or transaction in the ledger. Entry must be balanced.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Reference #</label>
                    <Input name="reference" placeholder="e.g. ADJ-2024-01" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Department</label>
                    <Select name="department" defaultValue="all">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Global (All)</SelectItem>
                        <SelectItem value="chocolate">Chocolate</SelectItem>
                        <SelectItem value="cosmetics">Cosmetics</SelectItem>
                        <SelectItem value="detergents">Detergents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Description</label>
                  <Input name="description" placeholder="Purpose of this entry..." required />
                </div>
                
                <div className="p-4 bg-secondary/20 rounded-lg border space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Debit Account</label>
                      <Select name="debitAccount" required>
                        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                        <SelectContent>
                          {CHART_OF_ACCOUNTS.map(acc => (
                            <SelectItem key={acc.code} value={acc.code}>{acc.code} - {acc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Credit Account</label>
                      <Select name="creditAccount" required>
                        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                        <SelectContent>
                          {CHART_OF_ACCOUNTS.map(acc => (
                            <SelectItem key={acc.code} value={acc.code}>{acc.code} - {acc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Transaction Amount ($)</label>
                    <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit">Commit Entry</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search reference or description..." 
              className="pl-9" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="text-primary border-primary">LIVE LEDGER</Badge>
        </CardHeader>
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
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
              {filteredJournals.map(je => (
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
                    <TableCell className="text-right font-bold">${(je.entries || []).reduce((acc: number, entry: any) => acc + (entry.debit || 0), 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">${(je.entries || []).reduce((acc: number, entry: any) => acc + (entry.credit || 0), 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                  {(je.entries || []).map((entry: any, idx: number) => (
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
              {filteredJournals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">No journal entries found in this period.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
