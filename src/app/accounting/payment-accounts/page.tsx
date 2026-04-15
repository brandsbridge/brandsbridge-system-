"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Loader2,
  MoreVertical,
  Pencil,
  Ban,
  CheckCircle2,
  Landmark,
  Wallet,
  Banknote,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import {
  DEFAULT_PAYMENT_ACCOUNTS,
  PaymentAccountType,
  PAYMENT_ACCOUNT_TYPES,
} from "@/lib/payment-accounts";

interface PaymentAccountRecord {
  id: string;
  accountName: string;
  accountType: PaymentAccountType;
  owner: string;
  bankName?: string;
  currency: string;
  isActive: boolean;
  createdAt?: any;
}

const typeBadge = (type: PaymentAccountType) => {
  switch (type) {
    case "bank":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Landmark className="h-3 w-3 mr-1" /> Bank
        </Badge>
      );
    case "cash":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          <Banknote className="h-3 w-3 mr-1" /> Cash
        </Badge>
      );
    case "wallet":
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
          <Wallet className="h-3 w-3 mr-1" /> Wallet
        </Badge>
      );
  }
};

export default function PaymentAccountsPage() {
  const db = useFirestore();
  const { user } = useUser();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<PaymentAccountType>("bank");
  const [owner, setOwner] = useState("");
  const [bankName, setBankName] = useState("");
  const [currency, setCurrency] = useState("USD");

  const accountsQuery = useMemoFirebase(
    () => (user ? collection(db, "paymentAccounts") : null),
    [db, user]
  );
  const { data: accountsData, isLoading } = useCollection(accountsQuery);
  const accounts = useMemo<PaymentAccountRecord[]>(
    () => ((accountsData as any) || []) as PaymentAccountRecord[],
    [accountsData]
  );

  // Seed default accounts once on mount if the collection is empty.
  // Guarded with a ref so React Strict Mode's dev double-invoke cannot
  // fire two parallel seeds.
  const seedRef = useRef(false);
  useEffect(() => {
    if (!user || isLoading || seedRef.current) return;
    if (accountsData === null) return; // still loading
    if ((accountsData?.length || 0) > 0) {
      seedRef.current = true; // already seeded
      return;
    }
    seedRef.current = true;
    (async () => {
      try {
        for (const acc of DEFAULT_PAYMENT_ACCOUNTS) {
          const ref = doc(collection(db, "paymentAccounts"));
          await setDoc(ref, {
            ...acc,
            isActive: true,
            createdAt: Timestamp.now(),
          });
        }
        toast({
          title: "Payment Accounts Seeded",
          description: `${DEFAULT_PAYMENT_ACCOUNTS.length} default accounts created.`,
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Seed Failed",
          description: err.message,
        });
      }
    })();
  }, [user, isLoading, accountsData, db]);

  const resetForm = () => {
    setEditingId(null);
    setAccountName("");
    setAccountType("bank");
    setOwner("");
    setBankName("");
    setCurrency("USD");
  };

  const openNewForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (acc: PaymentAccountRecord) => {
    setEditingId(acc.id);
    setAccountName(acc.accountName || "");
    setAccountType(acc.accountType || "bank");
    setOwner(acc.owner || "");
    setBankName(acc.bankName || "");
    setCurrency(acc.currency || "USD");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim() || !owner.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Account Name and Owner are required.",
      });
      return;
    }
    const payload = {
      accountName: accountName.trim(),
      accountType,
      owner: owner.trim(),
      bankName: bankName.trim() || null,
      currency: currency || "USD",
    };
    try {
      if (editingId) {
        await updateDoc(doc(db, "paymentAccounts", editingId), {
          ...payload,
          updatedAt: Timestamp.now(),
        });
        toast({ title: "Account Updated" });
      } else {
        const ref = doc(collection(db, "paymentAccounts"));
        await setDoc(ref, {
          ...payload,
          isActive: true,
          createdAt: Timestamp.now(),
        });
        toast({ title: "Account Created" });
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    }
  };

  const toggleActive = async (acc: PaymentAccountRecord) => {
    try {
      await updateDoc(doc(db, "paymentAccounts", acc.id), {
        isActive: !acc.isActive,
        updatedAt: Timestamp.now(),
      });
      toast({
        title: acc.isActive ? "Account Deactivated" : "Account Activated",
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    }
  };

  const activeCount = accounts.filter((a) => a.isActive).length;
  const inactiveCount = accounts.length - activeCount;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Payment Accounts</h1>
          <p className="text-muted-foreground">
            Manage the bank, cash, and wallet accounts used across expenses, payments, and purchase orders.
          </p>
        </div>
        <Button onClick={openNewForm}>
          <Plus className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Total Accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Deactivated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{inactiveCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Accounts</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => (
                <TableRow key={acc.id} className={acc.isActive ? "" : "opacity-60"}>
                  <TableCell className="font-bold">{acc.accountName}</TableCell>
                  <TableCell>{typeBadge(acc.accountType)}</TableCell>
                  <TableCell>{acc.owner}</TableCell>
                  <TableCell className="text-muted-foreground">{acc.bankName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{acc.currency || "USD"}</Badge>
                  </TableCell>
                  <TableCell>
                    {acc.isActive ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(acc)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleActive(acc)}
                          className={acc.isActive ? "text-destructive" : "text-green-500"}
                        >
                          {acc.isActive ? (
                            <>
                              <Ban className="mr-2 h-4 w-4" /> Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                    No payment accounts defined yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Payment Account" : "Add Payment Account"}</DialogTitle>
              <DialogDescription>
                Define a bank, cash, or digital wallet account for expense and payment tracking.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Account Name</Label>
                <Input
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Company Bank Account"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Type</Label>
                  <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QAR">QAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="SAR">SAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Owner</Label>
                <Input
                  required
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. Musaed, Sam, Company"
                />
              </div>
              {accountType === "bank" && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Bank Name (optional)</Label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Emirates NBD"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? "Save Changes" : "Create Account"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
