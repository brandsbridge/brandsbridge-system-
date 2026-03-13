"use client";

import React, { useEffect, useState } from "react";
import { Package, Search, Filter, ArrowUpDown } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { subscribeToCollection } from "@/lib/db-utils";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [suppliers, setSuppliers] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubStocks = subscribeToCollection("stocks", (data) => setStocks(data));
    const unsubProducts = subscribeToCollection("products", (data) => {
      const map: Record<string, string> = {};
      data.forEach(p => map[p.id] = p.name);
      setProducts(map);
    });
    const unsubSuppliers = subscribeToCollection("suppliers", (data) => {
      const map: Record<string, string> = {};
      data.forEach(s => map[s.id] = s.name);
      setSuppliers(map);
    });

    return () => {
      unsubStocks();
      unsubProducts();
      unsubSuppliers();
    };
  }, []);

  // Find lowest price per product to highlight
  const lowestPricePerProduct: Record<string, number> = {};
  stocks.forEach(s => {
    if (!lowestPricePerProduct[s.productId] || s.price < lowestPricePerProduct[s.productId]) {
      lowestPricePerProduct[s.productId] = s.price;
    }
  });

  const filteredStocks = stocks.filter(s => {
    const productName = products[s.productId]?.toLowerCase() || "";
    const supplierName = suppliers[s.supplierId]?.toLowerCase() || "";
    return productName.includes(searchTerm.toLowerCase()) || supplierName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Inventory & Stocks</h1>
        <p className="text-muted-foreground">Live stock levels across all registered suppliers.</p>
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
            {filteredStocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No inventory data available.
                </TableCell>
              </TableRow>
            ) : (
              filteredStocks.map((stock) => {
                const isBestPrice = stock.price === lowestPricePerProduct[stock.productId];
                return (
                  <TableRow key={stock.id} className={cn(isBestPrice && "bg-primary/5")}>
                    <TableCell>
                      <div className="font-medium">{products[stock.productId] || "Unknown Product"}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{stock.productId}</div>
                    </TableCell>
                    <TableCell>{suppliers[stock.supplierId] || "Unknown Supplier"}</TableCell>
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
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
