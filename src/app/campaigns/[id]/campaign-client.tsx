"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  Target, 
  FileText, 
  Edit, 
  Loader2,
  Clock,
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function CampaignClient({ id }: { id: string }) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const campaignRef = useMemoFirebase(() => doc(db, "campaigns", id), [id]);
  const { data: campaign, isLoading } = useDoc(campaignRef);

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    
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
    };

    try {
      await setDoc(campaignRef, data, { merge: true });
      toast({ title: "Campaign Strategy Updated" });
      setIsEditModalOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Record Not Found</h2>
        <Button onClick={() => router.push("/campaigns")}>Back to List</Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Completed": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/campaigns")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge className={cn("text-[10px] font-bold", getStatusColor(campaign.status))}>
                {campaign.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">Campaign Overview & Strategy</p>
          </div>
        </div>
        <Button onClick={() => setIsEditModalOpen(true)}>
          <Edit className="mr-2 h-4 w-4" /> Edit Strategy
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Strategy & Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Description</Label>
              <p className="text-sm leading-relaxed">{campaign.description || "No description provided."}</p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Internal Notes</Label>
              <p className="text-sm italic text-muted-foreground">{campaign.notes || "No internal notes recorded."}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Campaign Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  <Tag className="h-3 w-3" /> Type
                </span>
                <Badge variant="secondary">{campaign.type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  <Target className="h-3 w-3" /> Market
                </span>
                <span className="text-sm font-medium">{campaign.targetMarket}</span>
              </div>
              <Separator />
              <div className="space-y-3 pt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Launch Date</span>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    {campaign.startDate}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">End Date</span>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-accent" />
                    {campaign.endDate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/10 border-border/50">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{campaign.createdAt ? new Date(campaign.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Modified:</span>
                <span>{campaign.updatedAt ? new Date(campaign.updatedAt.seconds * 1000).toLocaleDateString() : "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdateCampaign}>
            <DialogHeader>
              <DialogTitle>Edit Campaign Strategy</DialogTitle>
              <DialogDescription>Modify timelines or campaign objectives.</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6 py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Campaign Name</Label>
                  <Input name="name" defaultValue={campaign.name} required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Type</Label>
                    <Select name="type" defaultValue={campaign.type}>
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
                    <Select name="status" defaultValue={campaign.status}>
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
                  <Select name="targetMarket" defaultValue={campaign.targetMarket}>
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
                    <Input name="startDate" type="date" defaultValue={campaign.startDate} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">End Date</Label>
                    <Input name="endDate" type="date" defaultValue={campaign.endDate} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Description</Label>
                  <Textarea name="description" defaultValue={campaign.description} placeholder="Goal of this campaign..." className="h-[108px]" />
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Internal Notes</Label>
                <Textarea name="notes" defaultValue={campaign.notes} placeholder="Logistics or special instructions..." className="h-20" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Campaign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}