"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2, 
  Calendar,
  Layers,
  Tag,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firestore Data Fetching
  const campaignsQuery = useMemoFirebase(() => collection(db, "campaigns"), []);
  const { data: campaignsData, isLoading } = useCollection(campaignsQuery);
  const campaigns = campaignsData || [];

  // KPI Calculations
  const stats = useMemo(() => {
    return {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === "Active").length,
      completed: campaigns.filter(c => c.status === "Completed").length,
      draft: campaigns.filter(c => c.status === "Draft").length,
    };
  }, [campaigns]);

  // Filtering
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => 
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [campaigns, searchTerm]);

  // Handlers
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    
    const campaignId = editingCampaign?.id || doc(collection(db, "campaigns")).id;
    const campaignRef = doc(db, "campaigns", campaignId);

    const data = {
      name: formData.get("name"),
      type: formData.get("type"),
      targetMarket: formData.get("targetMarket"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      status: formData.get("status"),
      description: formData.get("description"),
      notes: formData.get("notes"),
      updatedAt: serverTimestamp(),
      ...(editingCampaign ? {} : { createdAt: serverTimestamp() })
    };

    try {
      await setDoc(campaignRef, data, { merge: true });
      toast({ title: editingCampaign ? "Campaign Updated" : "Campaign Created" });
      setIsModalOpen(false);
      setEditingCampaign(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Operation Failed", description: "Could not save campaign data." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!campaignId) return;
    
    // Confirmation dialog before deletion
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      // Correct Firestore deletion logic
      await deleteDoc(doc(db, "campaigns", campaignId));
      
      // Success message
      toast({ 
        title: "Campaign deleted",
        description: "The record has been permanently removed from the ledger."
      });
    } catch (err) {
      // Error handling
      toast({ 
        variant: "destructive", 
        title: "Failed to delete", 
        description: "An error occurred while communicating with Firestore. Please try again." 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Completed": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Campaigns</h1>
          <p className="text-muted-foreground">Track and manage your marketing campaigns</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingCampaign(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSaveCampaign}>
              <DialogHeader>
                <DialogTitle>{editingCampaign ? "Edit Campaign" : "Launch New Campaign"}</DialogTitle>
                <DialogDescription>Define your marketing strategy and target audience.</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-6 py-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Campaign Name</Label>
                    <Input name="name" defaultValue={editingCampaign?.name} required placeholder="e.g. Summer Flash Sale" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Type</Label>
                      <Select name="type" defaultValue={editingCampaign?.type || "Promotion"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Promotion">Promotion</SelectItem>
                          <SelectItem value="Announcement">Announcement</SelectItem>
                          <SelectItem value="Seasonal">Seasonal</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Status</Label>
                      <Select name="status" defaultValue={editingCampaign?.status || "Draft"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Target Market</Label>
                    <Select name="targetMarket" defaultValue={editingCampaign?.targetMarket || "All Markets"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chocolate Market">Chocolate Market</SelectItem>
                        <SelectItem value="Cosmetics Market">Cosmetics Market</SelectItem>
                        <SelectItem value="Detergents Market">Detergents Market</SelectItem>
                        <SelectItem value="All Markets">All Markets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</Label>
                      <Input name="startDate" type="date" defaultValue={editingCampaign?.startDate} required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">End Date</Label>
                      <Input name="endDate" type="date" defaultValue={editingCampaign?.endDate} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Description</Label>
                    <Textarea name="description" defaultValue={editingCampaign?.description} placeholder="Goal of this campaign..." className="h-[108px]" />
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Internal Notes</Label>
                  <Textarea name="notes" defaultValue={editingCampaign?.notes} placeholder="Logistics, budgets, or special instructions..." className="h-20" />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCampaign ? "Save Changes" : "Create Campaign"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Campaigns</CardTitle>
            <Tag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-green-500">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{isLoading ? "..." : stats.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-blue-500">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{isLoading ? "..." : stats.completed}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Drafts</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.draft}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <div className="p-4 border-b">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search campaigns..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target Market</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell className="font-bold">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">{c.type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{c.targetMarket}</TableCell>
                  <TableCell>
                    <div className="text-[10px] text-muted-foreground">
                      {c.startDate} <span className="mx-1">→</span> {c.endDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px] font-bold", getStatusColor(c.status))}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/campaigns/${c.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        setEditingCampaign(c);
                        setIsModalOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive" 
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCampaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                    {searchTerm ? "No matching campaigns found." : "No campaigns recorded yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}