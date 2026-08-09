import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface RealityCheckProps {
  collegeId: string;
}

export const RealityCheck: React.FC<RealityCheckProps> = ({ collegeId }) => {
  const [data, setData] = useState<{ pros: any[]; cons: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealityCheck = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/colleges/${collegeId}/reality-check`);
        setData(res.data);
      } catch (error) {
        console.error("Failed to load reality check data");
      } finally {
        setLoading(false);
      }
    };
    
    if (collegeId) {
      fetchRealityCheck();
    }
  }, [collegeId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Reality Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || (data.pros.length === 0 && data.cons.length === 0)) {
    return null; // Don't show if there isn't enough review data
  }

  return (
    <Card className="border-t-4 border-t-primary shadow-sm bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Reality Check
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Aggregated insights from verified student reviews</p>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
        {/* Pros Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 font-semibold border-b pb-2">
            <TrendingUp className="h-5 w-5" /> What Students Love
          </div>
          {data.pros.length > 0 ? (
            <ul className="space-y-3">
              {data.pros.map((pro, idx) => (
                <li key={idx} className="flex gap-2 text-sm bg-green-50/50 p-3 rounded-lg border border-green-100">
                  <span className="text-green-500 font-bold mt-0.5">•</span>
                  <span className="text-gray-700 leading-relaxed">"{pro.text}"</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not enough data yet.</p>
          )}
        </div>

        {/* Cons Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-orange-600 font-semibold border-b pb-2">
            <TrendingDown className="h-5 w-5" /> Common Criticisms
          </div>
          {data.cons.length > 0 ? (
            <ul className="space-y-3">
              {data.cons.map((con, idx) => (
                <li key={idx} className="flex gap-2 text-sm bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                  <span className="text-orange-500 font-bold mt-0.5">•</span>
                  <span className="text-gray-700 leading-relaxed">"{con.text}"</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not enough data yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
