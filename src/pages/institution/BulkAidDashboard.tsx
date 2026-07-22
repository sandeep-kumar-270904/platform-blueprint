import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, FileText, CheckCircle, AlertCircle, DollarSign, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export const BulkAidDashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a CSV file first');
    
    setUploading(true);
    // Simulate API call for parsing and uploading CSV
    setTimeout(() => {
      setUploading(false);
      setFile(null);
      toast.success('Bulk aid distribution file uploaded successfully. Processing started.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bulk Aid Distribution</h1>
            <p className="text-muted-foreground mt-1">Manage institutional scholarships and mass disbursements.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" /> Download CSV Template
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full"><DollarSign className="w-8 h-8 text-primary" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Disbursed (YTD)</p>
                <h3 className="text-2xl font-bold">$1.24M</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-green-500/10 p-4 rounded-full"><Users className="w-8 h-8 text-green-500" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Students Awarded</p>
                <h3 className="text-2xl font-bold">342</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-amber-500/10 p-4 rounded-full"><TrendingUp className="w-8 h-8 text-amber-500" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Processing</p>
                <h3 className="text-2xl font-bold">12 Batches</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="upload">Upload New Batch</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Distribution CSV</CardTitle>
                <CardDescription>Upload a spreadsheet containing student IDs, amounts, and aid categories.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-6 max-w-2xl">
                  <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center bg-muted/5">
                    <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                    <Label htmlFor="csv-upload" className="text-lg font-medium cursor-pointer text-primary hover:underline">
                      Click to browse or drag and drop
                    </Label>
                    <Input 
                      id="csv-upload" 
                      type="file" 
                      accept=".csv, .xlsx" 
                      className="hidden" 
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-muted-foreground mt-2">CSV or Excel file (max 10MB)</p>
                    
                    {file && (
                      <div className="mt-6 flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-md font-medium">
                        <CheckCircle className="w-4 h-4" /> {file.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-amber-500/10 text-amber-600 p-4 rounded-md flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Important:</strong> Ensure your CSV follows the exact template structure. Any rows with invalid Student IDs or negative amounts will be rejected during processing.
                    </div>
                  </div>

                  <Button type="submit" size="lg" disabled={!file || uploading} className="w-full md:w-auto">
                    {uploading ? 'Processing...' : 'Upload & Process Batch'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Recent Batches</CardTitle>
                <CardDescription>View the status of recently uploaded bulk aid distributions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: 'BCH-892', date: 'Oct 24, 2023', total: '$45,000', students: 120, status: 'Completed' },
                    { id: 'BCH-891', date: 'Oct 15, 2023', total: '$12,500', students: 45, status: 'Completed' },
                    { id: 'BCH-890', date: 'Sep 02, 2023', total: '$85,000', students: 310, status: 'Completed' },
                  ].map((batch, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className="bg-muted p-3 rounded-md">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{batch.id}</p>
                          <p className="text-sm text-muted-foreground">Uploaded on {batch.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{batch.total}</p>
                        <p className="text-sm text-muted-foreground">{batch.students} Students</p>
                      </div>
                      <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-sm font-medium">
                        {batch.status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BulkAidDashboard;
