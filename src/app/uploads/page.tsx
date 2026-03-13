
"use client";

import React, { useState } from "react";
import { 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Search, 
  History,
  Trash2,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MOCK_UPLOAD_LOGS } from "@/lib/mock-data";
import { formatFirebaseTimestamp } from "@/lib/db-utils";

export default function BulkUploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [errors, setErrors] = useState<any[]>([]);

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      // Simulating a preview of validated data
      setPreviewData([
        { name: "Acme Chemicals", email: "sales@acme.com", country: "USA", status: "valid" },
        { name: "Bulk Spices Ltd", email: "invalid-email", country: "India", status: "error", reason: "Invalid Email" },
        { name: "Global Trade Co", email: "trade@global.com", country: "Belgium", status: "valid" },
      ]);
      setErrors([{ row: 2, reason: "Invalid Email Format" }]);
    }, 1500);
  };

  const clearPreview = () => {
    setPreviewData(null);
    setErrors([]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Data Management</h1>
        <p className="text-muted-foreground">Bulk upload and manage department-specific records.</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="w-full lg:w-[400px]">
          <TabsTrigger value="upload" className="flex-1">Bulk Upload</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Upload History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6 pt-4">
          {!previewData ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mb-2">Upload Suppliers</CardTitle>
                <CardDescription className="mb-6">
                  Drag and drop your CSV or Excel file here to import suppliers to your department.
                </CardDescription>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Template
                  </Button>
                  <Button size="sm" onClick={simulateUpload} disabled={isUploading}>
                    {isUploading ? "Validating..." : "Choose File"}
                  </Button>
                </div>
              </Card>

              <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="mb-2">Upload Buyers</CardTitle>
                <CardDescription className="mb-6">
                  Import prospective and active buyers using our standardized leads template.
                </CardDescription>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Template
                  </Button>
                  <Button size="sm" variant="accent" onClick={simulateUpload} disabled={isUploading}>
                    {isUploading ? "Validating..." : "Choose File"}
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="animate-in fade-in slide-in-from-bottom-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Validation Results</CardTitle>
                  <CardDescription>Review the data before confirming the final import.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={clearPreview}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden mb-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Company Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.country}</TableCell>
                          <TableCell>
                            {row.status === "valid" ? (
                              <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" /> Ready</Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> {row.reason}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {errors.length > 0 && (
                  <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-bold">Validation Failed for {errors.length} rows</p>
                      <p>These rows will be skipped during import. You can download the failed rows to fix them.</p>
                      <Button variant="link" className="text-destructive p-0 h-auto text-xs mt-1 font-bold underline">Download Failed Rows</Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={clearPreview}>Cancel</Button>
                  <Button onClick={clearPreview}>Confirm & Import {previewData.filter(r => r.status === "valid").length} Records</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-3 pt-6 border-t">
            <div className="space-y-2">
              <h3 className="font-bold text-sm">Duplicate Detection</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                System automatically checks for existing records by email and company name. If a match is found in another department, you'll be prompted to share the record instead of creating a duplicate.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-sm">Data Isolation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Records are strictly isolated to your department unless explicitly shared. Super admins can audit shared clients via the global overview.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-sm">Supported Formats</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We support .csv, .xls, and .xlsx formats. For best results, use our provided Excel templates which include data validation rules.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_UPLOAD_LOGS.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{formatFirebaseTimestamp(log.uploadDate)}</TableCell>
                    <TableCell className="font-medium">{log.fileName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">{log.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-green-500">{log.successCount}</span>
                        <span className="text-xs text-muted-foreground">/</span>
                        <span className="text-xs font-bold text-destructive">{log.failCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.uploadedBy}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
