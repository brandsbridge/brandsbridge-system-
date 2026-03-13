"use client";

import React, { useMemo, useState } from "react";
import { Search, ArrowUpDown, Loader2, Package, Warehouse } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOCK_STOCKS, MOCK_PRODUCTS, MOCK_SUPPLIERS } from "@/lib/mock-data";
import { useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const db = useFirestore();

  // Firestore Collections
  const { data: fbProducts = [], loading: loadingProducts } = useCollection(collection(db, "products"));
  const { data: fbStocks = [], loading: loadingStocks } = useCollection(collection(db, "stocks"));
  const { data: fbSuppliers = [], loading: loadingSuppliers } = useCollection(collection(db, "suppliers"));

  const products = fbProducts.length > 0 ? fbProducts : MOCK_PRODUCTS;
  const stocks = fbStocks.length > 0 ? fbStocks : MOCK_STOCKS;
  const suppliers = fbSuppliers.length > 0 ? fbSuppliers : MOCK_SUPPLIERS;

  const productsMap = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach((p: any) => map[p.id] = p.name);
    return map;
  }, [products]);

  const suppliersMap = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach((s: any) => map[s.id] = s.name);
    return map;
  }, [suppliers]);

  const lowestPricePerProduct = useMemo(() => {
    const map: Record<string, number> = {};
    stocks.forEach((s: any) => {
      if (!map[s.productId] || s.price < map[s.productId]) {
        map[s.productId] = s.price;
      }
    });
    return map;
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    return stocks.filter((s: any) => {
      const productName = productsMap[s.productId]?.toLowerCase() || "";
      const supplierName = suppliersMap[s.supplierId]?.toLowerCase() || "";
      return productName.includes(searchTerm.toLowerCase()) || supplierName.includes(searchTerm.toLowerCase());
    });
  }, [stocks, productsMap, suppliersMap, searchTerm]);

  const inventoryValue = useMemo(() => {
    return stocks.reduce((acc: number, s: any) => acc + (s.price * s.quantity), 0);
  }, [stocks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Inventory & Stocks</h1>
          <p className="text-muted-foreground">Live stock levels across all registered suppliers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Warehouse className="mr-2 h-4 w-4" /> Manage Warehouses</Button>
          <Button><Package className="mr-2 h-4 w-4" /> Add Stock Entry</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${inventoryValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Unique Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Suppliers with Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.from(new Set(stocks.map((s: any) => s.supplierId))).length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter by product or supplier..." 
            className="pl-9" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <ArrowUpDown className="mr-2 h-4 w-4" /> Sort by Price
        </Button>
      </div>

      <Card>
        {(loadingProducts || loadingStocks || loadingSuppliers) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Synchronizing live inventory data...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.map((stock: any) => {
                const isBestPrice = stock.price === lowestPricePerProduct[stock.productId];
                return (
                  <TableRow key={stock.id} className={cn(isBestPrice && "bg-primary/5")}>
                    <TableCell>
                      <div className="font-medium">{productsMap[stock.productId] || "Unknown Product"}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{stock.productId}</div>
                    </TableCell>
                    <TableCell>{suppliersMap[stock.supplierId] || "Unknown Supplier"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{stock.quantity}</span>
                        {stock.quantity < 10 && <Badge variant="destructive" className="h-4 text-[8px] px-1 uppercase">Low</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-accent">${stock.price.toFixed(2)}</span>
                        {isBestPrice && <Badge className="bg-green-500 text-[8px] h-4 px-1 uppercase">Best Price</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{stock.leadTime} days</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {stock.quantity > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredStocks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No matching stock records found.
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
