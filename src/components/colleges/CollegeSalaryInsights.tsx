import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, Briefcase, IndianRupee, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CollegeSalaryInsightsProps {
  collegeId: string;
}

export const CollegeSalaryInsights = ({ collegeId }: CollegeSalaryInsightsProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalaryData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/salary/colleges/${collegeId}/stats`);
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (err) {
        console.error("Failed to fetch salary stats", err);
      } finally {
        setLoading(false);
      }
    };
    if (collegeId) fetchSalaryData();
  }, [collegeId]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || !data.sampleSize || data.sampleSize === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-1">No Salary Data Yet</h3>
          <p>We don't have enough verified salary entries for this college yet. If you're an alum, you can contribute securely from your profile settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Verified Submissions</p>
              <h3 className="text-2xl font-bold">{data.sampleSize}</h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Highest Median Band</p>
              <h3 className="text-2xl font-bold text-green-600">
                {data.aggregate?.filter((a:any) => a.hasEnoughData).sort((a:any,b:any) => b.medianBand?.localeCompare(a.medianBand))[0]?.medianBand || "N/A"}
              </h3>
            </div>
            <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aggregate Salary Insights</CardTitle>
          <CardDescription>
            Median CTC bands across branches and graduation years. Only groups with 5+ verified entries are displayed to protect anonymity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-t-md">
                <tr>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 font-medium">Graduation Year</th>
                  <th className="px-4 py-3 font-medium">Median CTC Band</th>
                  <th className="px-4 py-3 font-medium">Sample Size</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.aggregate.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No aggregates available yet. Need minimum 5 entries per group.</td></tr>
                ) : (
                  data.aggregate.map((agg: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{agg.branch}</td>
                      <td className="px-4 py-3">{agg.graduationYear}</td>
                      <td className="px-4 py-3">
                        {agg.hasEnoughData ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900">
                            {agg.medianBand}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Not enough data (&lt; 5 entries)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{agg.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Verified Submissions</CardTitle>
          <CardDescription>
            Individual salary submissions. Identifying details are kept hidden unless the alum explicitly opted to share them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.entries.slice(0, 10).map((entry: any) => (
              <div key={entry._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/10 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={entry.user?.avatar} />
                    <AvatarFallback className="bg-muted">
                      {entry.user ? entry.user.name.charAt(0).toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-sm">
                      {entry.user ? entry.user.name : "Anonymous Alum"}
                      <span className="text-muted-foreground font-normal ml-2">
                        {entry.graduationYear}
                      </span>
                    </h4>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span>{entry.currentRole}</span>
                      {entry.currentCompany && (
                        <>
                          <span>•</span>
                          <span className="font-medium">{entry.currentCompany}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {entry.ctcBand}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{entry.yearsOfExperience} YOE</span>
                </div>
              </div>
            ))}
            
            {data.entries.length > 10 && (
              <Button variant="outline" className="w-full mt-4">
                View All {data.entries.length} Submissions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
