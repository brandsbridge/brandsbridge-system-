
"use client";

import React, { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { MOCK_STOCKS, MOCK_PRODUCTS, MOCK_SUPPLIERS } from "@/lib/mock-data";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const productsMap = useMemo(() => {
    const map: Record<string, string> = {};
    MOCK_PRODUCTS.forEach((p: any) => map[p.id] = p.name);
    return map;
  }, []);

  const suppliersMap = useMemo(() => {
    const map: Record<string, string> = {};
    MOCK_SUPPLIERS.forEach((s: any) => map[s.id] = s.name);
    return map;
  }, []);

  const lowestPricePerProduct = useMemo(() => {
    const map: Record<string, number> = {};
    MOCK_STOCKS.forEach((s: any) => {
      if (!map[s.productId] || s.price < map[s.productId]) {
        map[s.productId] = s.price;
      }
    });
    return map;
  }, []);

  const filteredStocks = MOCK_STOCKS.filter((s: any) => {
    const productName = productsMap[s.productId]?.toLowerCase() || "";
    const supplierName = suppliersMap[s.supplierId]?.toLowerCase() || "";
    return productName.includes(searchTerm.toLowerCase()) || supplierName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Inventory & Stocks</h1>
        <p className="text-muted-foreground">Live stock levels across all registered suppliers (Mock Data).</p>
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
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
