
"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Mail,
  TrendingUp,
  ImageIcon,
  Plus,
  Upload,
  Share2,
  ExternalLink,
  Loader2,
  FileText,
  Download,
  Trash2,
  HeartPulse,
  Star,
  MoreVertical
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, arrayUnion, arrayRemove, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "@/lib/firebase";
import { supplierService } from "@/services/supplier-service";
import { customerService } from "@/services/customer-service";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={cn("h-3 w-3", i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />)}</div>
);

export default function DetergentsDepartmentPage() {
  const departmentId = "detergents";
  const name = "Detergents Market";
  const manager = "Saddam Manager";
  
  const [activeTab, setActiveTab] = useState("suppliers");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const db = useFirestore();

  // Firestore Queries for this specific market
  const suppliersQuery = useMemoFirebase(() => query(collection(db, "suppliers"), where("markets", "array-contains", departmentId)), [db, departmentId]);
  const customersQuery = useMemoFirebase(() => query(collection(db, "customers"), where("markets", "array-contains", departmentId)), [db, departmentId]);
  const productsQuery = useMemoFirebase(() => query(collection(db, "products"), where("department", "==", departmentId)), [db, departmentId]);
  const stocksQuery = useMemoFirebase(() => query(collection(db, "stocks"), where("department", "==", departmentId)), [db, departmentId]);

  const { data: suppliersData, isLoading: loadingSuppliers } = useCollection(suppliersQuery);
  const { data: customersData, isLoading: loadingCustomers } = useCollection(customersQuery);
  const { data: productsData } = useCollection(productsQuery);
  const { data: stocksData } = useCollection(stocksQuery);

  const suppliers = suppliersData || [];
  const customers = customersData || [];
  const products = productsData || [];
  const stocks = stocksData || [];

  // Market Assets logic
  const assetsRef = useMemoFirebase(() => doc(db, "market_assets", departmentId), [db, departmentId]);
  const { data: assetsDoc } = useDoc(assetsRef);
  const assets = assetsDoc?.files || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: 20MB limit
    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File Rejected", description: "Maximum upload size is 20MB." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const storage = getStorage(app);
    const storagePath = `attachments/${departmentId}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(fileRef, file);

    // Timeout logic: 30 seconds
    let timeoutId = setTimeout(() => {
      uploadTask.cancel();
      setIsUploading(false);
      toast({ variant: "destructive", title: "Upload Failed", description: "Transmission timed out. Please check your connection." });
    }, 30000);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
        
        // Reset timeout on progress activity
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          uploadTask.cancel();
          setIsUploading(false);
          toast({ variant: "destructive", title: "Upload Stalled", description: "No progress detected. Upload cancelled." });
        }, 30000);
      }, 
      (error) => {
        clearTimeout(timeoutId);
        setIsUploading(false);
        if (error.code !== 'storage/canceled') {
          toast({ variant: "destructive", title: "Upload Error", description: error.message });
        }
      }, 
      async () => {
        clearTimeout(timeoutId);
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          
          const newFile = {
            name: file.name,
            storagePath,
            url,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            size: file.size
          };

          await setDoc(assetsRef, {
            files: arrayUnion(newFile)
          }, { merge: true });
          
          toast({ title: "Upload Complete", description: `${file.name} is now available in the catalog.` });
        } catch (error: any) {
          toast({ variant: "destructive", title: "Sync Failed", description: "File uploaded but record could not be saved." });
        } finally {
          setIsUploading(false);
          if (e.target) e.target.value = '';
        }
      }
    );
  };

  const handleFileDelete = async (fileObj: any) => {
    const storage = getStorage(app);
    const fileRef = ref(storage, fileObj.storagePath);

    try {
      await deleteObject(fileRef);
      await updateDoc(assetsRef, {
        files: arrayRemove(fileObj)
      });
      toast({ title: "File Removed", description: "Attachment has been deleted." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not remove file from storage." });
    }
  };

  const priceIntellData = useMemo(() => {
    return products.map(p => {
      const pStocks = stocks.filter(s => s.productId === p.id).sort((a, b) => a.price - b.price);
      const bestDeal = pStocks[0];
      const sellingPrice = bestDeal ? bestDeal.price * (1 + (p.margin || 10) / 100) : 0;
      
      return {
        ...p,
        bestPrice: bestDeal?.price || 0,
        supplier: suppliers.find(s => s.id === bestDeal?.supplierId)?.name || "N/A",
        quantity: bestDeal?.quantity || 0,
        leadTime: bestDeal?.leadTime || 0,
        sellingPrice,
        profit: sellingPrice - (bestDeal?.price || 0)
      };
    });
  }, [products, stocks, suppliers]);

  const stats = useMemo(() => {
    return {
      suppliersCount: suppliers.length,
      sharedSuppliers: suppliers.filter(s => s.markets && s.markets.length > 1).length,
      customersCount: customers.length,
      sharedCustomers: customers.filter(b => b.markets && b.markets.length > 1).length,
      bestDeals: priceIntellData.filter(d => d.bestPrice > 0).length,
      totalPipeline: priceIntellData.reduce((acc, p) => acc + (p.sellingPrice * p.quantity), 0)
    };
  }, [suppliers, customers, priceIntellData]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const type = formData.get('type') as 'supplier' | 'buyer';
    
    const baseData = {
      name: formData.get('companyName'),
      email: formData.get('email'),
      country: formData.get('country'),
      departments: [departmentId],
      createdAt: new Date().toISOString()
    };

    if (type === 'supplier') {
      supplierService.createSupplier(db, {
        ...baseData,
        natureOfBusiness: 'Manufacturer',
        recordStatus: 'Active - Verified',
        dataCompleteness: 40,
        priorityLevel: 'Medium',
        internalRating: 3
      });
    } else {
      customerService.createCustomer(db, {
        ...baseData,
        accountStatus: 'prospect',
        accountHealth: 'healthy',
        dataCompleteness: 40,
        assignedManager: manager,
        internalRating: 3
      });
    }

    setIsQuickAddOpen(false);
    toast({ 
      title: "Entity Registered", 
      description: `New ${type} successfully added to the ${name} database.` 
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{name}</h1>
          <p className="text-muted-foreground">Managed by <strong>{manager}</strong> | Scoped Firestore Access.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/uploads">
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
          </Link>
          
          <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Quick Add</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleQuickAdd}>
                <DialogHeader>
                  <DialogTitle>Quick Register Entity</DialogTitle>
                  <DialogDescription>Add a new partner or client to this market segment instantly.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Entity Type</label>
                    <Select name="type" defaultValue="buyer">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Corporate Buyer (Customer)</SelectItem>
                        <SelectItem value="supplier">Manufacturing Partner (Supplier)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Company Name</label>
                    <Input name="companyName" required placeholder="e.g. Global Trade LLC" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Primary Email</label>
                      <Input name="email" type="email" required placeholder="contact@company.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Base Country</label>
                      <Input name="country" required placeholder="e.g. Turkey" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsQuickAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Complete Registration</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Suppliers</CardTitle>
            <Badge variant="outline" className="text-[8px]">{stats.sharedSuppliers} Shared</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{loadingSuppliers ? "..." : stats.suppliersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Active Customers</CardTitle>
            <Badge variant="outline" className="text-[8px]">{stats.sharedCustomers} Shared</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{loadingCustomers ? "..." : stats.customersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Best Deals</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.bestDeals}</div>
            <p className="text-[10px] text-green-500 flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" /> Updated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Shared Clients</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.sharedSuppliers + stats.sharedCustomers}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Cross-department</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">${(stats.totalPipeline / 1000).toFixed(1)}k</div>
            <p className="text-[10px] text-accent mt-1">Projected</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4 pt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Company Name</TableHead>
                  <TableHead>Nature</TableHead>
                  <TableHead>Markets</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Price Tier</TableHead>
                  <TableHead>Record Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSuppliers ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : suppliers.map(s => (
                  <TableRow key={s.id} className="group">
                    <TableCell>
                      <div>
                        <Link href={`/suppliers/${s.id}`} className="font-bold hover:text-primary flex items-center gap-2 group/link">
                          <span className="text-lg">{s.flag || '🏭'}</span>
                          {s.name}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </Link>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span className="font-bold">{s.contacts?.sales?.name || 'No Contact'}</span>
                          <span>•</span>
                          <span>{s.country || "Global"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs">{s.natureOfBusiness}</span></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {Array.isArray(s.markets) && s.markets.map((m: string) => (
                          <Badge key={m} variant="outline" className="text-[8px] h-4 capitalize"
                            style={{
                              color: m === 'chocolate' ? '#7B3F00' : m === 'cosmetics' ? '#C2185B' : m === 'detergents' ? '#0B5E75' : 'inherit',
                              backgroundColor: m === 'chocolate' ? '#7B3F0015' : m === 'cosmetics' ? '#C2185B15' : m === 'detergents' ? '#0B5E7515' : 'transparent',
                              borderColor: m === 'chocolate' ? '#7B3F0040' : m === 'cosmetics' ? '#C2185B40' : m === 'detergents' ? '#0B5E7540' : 'inherit'
                            }}>{m.replace('_', ' ')}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {Array.isArray(s.specializedProducts) && s.specializedProducts.slice(0, 2).map((p: string) => (
                          <Badge key={p} variant="secondary" className="text-[8px] h-4">{p}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[9px] font-bold",
                        s.pricing?.tier === 'Luxury' && "border-primary text-primary",
                        s.pricing?.tier === 'Premium' && "border-blue-500 text-blue-500",
                        s.pricing?.tier === 'Mid-Range' && "border-green-500 text-green-500"
                      )}>{s.pricing?.tier || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[9px] capitalize",
                        s.recordStatus?.includes('Verified') && "bg-green-500",
                        s.recordStatus === 'Blacklisted' && "bg-destructive",
                        s.recordStatus === 'Checking Data' && "bg-orange-500"
                      )}>{s.recordStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/suppliers/${s.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button></Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Mail className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingSuppliers && suppliers.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">No suppliers linked to this market segment.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4 pt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Markets</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCustomers ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : customers.map(c => (
                  <TableRow key={c.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">{c.name?.[0] || 'C'}</div>
                        <div>
                          <Link href={`/customers/${c.id}`} className="font-bold hover:text-primary flex items-center gap-1 group/link">
                            {c.name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </Link>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                            <span>{c.country || "Global"}</span>
                            <span>•</span>
                            <span>{c.assignedManager || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs">{c.companyType}</span></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[9px] capitalize",
                        c.accountStatus === 'active' && "bg-green-500 text-white border-none",
                        c.accountStatus === 'key account' && "bg-primary text-white border-none",
                        c.accountStatus === 'at risk' && "bg-yellow-500 text-white border-none"
                      )}>{c.accountStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {Array.isArray(c.markets) && c.markets.map((m: string) => (
                          <Badge key={m} variant="outline" className="text-[8px] h-4 capitalize"
                            style={{
                              color: m === 'chocolate' ? '#7B3F00' : m === 'cosmetics' ? '#C2185B' : m === 'detergents' ? '#0B5E75' : 'inherit',
                              backgroundColor: m === 'chocolate' ? '#7B3F0015' : m === 'cosmetics' ? '#C2185B15' : m === 'detergents' ? '#0B5E7515' : 'transparent',
                              borderColor: m === 'chocolate' ? '#7B3F0040' : m === 'cosmetics' ? '#C2185B40' : m === 'detergents' ? '#0B5E7540' : 'inherit'
                            }}>{m.replace('_', ' ')}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <HeartPulse className={cn("h-3 w-3", c.accountHealth === 'healthy' ? "text-green-500" : "text-destructive")} />
                        <span className="text-[10px] capitalize font-medium">{c.accountHealth}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <StarRating rating={c.internalRating || 0} />
                        <div className="w-16"><Progress value={c.dataCompleteness} className="h-1" /></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-xs font-bold text-primary">${(c.totalRevenue || 0).toLocaleString()}</div>
                      <div className="text-[8px] text-muted-foreground">Lifetime Value</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/customers/${c.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button></Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Mail className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingCustomers && customers.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground italic">No customers linked to this market segment.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map(p => (
              <Card key={p.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                <div className="aspect-square w-full bg-secondary flex items-center justify-center relative">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                  <Button size="icon" variant="secondary" className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <h4 className="font-bold text-xs">{p.name}</h4>
                  <div className="mt-3 flex items-center justify-between border-t pt-2">
                    <span className="text-[8px] uppercase text-muted-foreground">Market Low:</span>
                    <span className="text-xs font-bold text-accent">${priceIntellData.find(d => d.id === p.id)?.bestPrice.toFixed(2) || '0.00'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="my-8" />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Market Attachments</CardTitle>
                  <CardDescription>Reference documents and price lists for the {name}.</CardDescription>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id={`file-upload-${departmentId}`}
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <Button 
                    disabled={isUploading} 
                    onClick={() => document.getElementById(`file-upload-${departmentId}`)?.click()}
                  >
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Upload Attachment
                  </Button>
                </div>
              </div>
              {isUploading && (
                <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground">
                    <span>Transmission Progress</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" indicatorClassName="bg-primary" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((file: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {file.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {file.type?.split('/')[1] || 'file'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleFileDelete(file)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {assets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic text-xs">
                        No attachments uploaded for this market.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
