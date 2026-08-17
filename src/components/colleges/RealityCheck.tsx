import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Building2, Users, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface RealityCheckProps {
  collegeId: string;
}

export const RealityCheck: React.FC<RealityCheckProps> = ({ collegeId }) => {
  const [data, setData] = useState<any>(null);
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

  if (!data) return null;

  const renderConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium"><ShieldCheck className="h-3 w-3" /> High Confidence</span>;
      case 'medium':
        return <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium"><Shield className="h-3 w-3" /> Medium Confidence</span>;
      case 'low':
      default:
        return <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium"><ShieldAlert className="h-3 w-3" /> Low Confidence</span>;
    }
  };

  const categories = [
    { key: 'academics', label: 'Academics' },
    { key: 'placements', label: 'Placements' },
    { key: 'faculty', label: 'Faculty' },
    { key: 'infrastructure', label: 'Infrastructure' },
    { key: 'hostel', label: 'Hostel' },
    { key: 'campusLife', label: 'Campus Life' },
    { key: 'valueForMoney', label: 'Value for Money' }
  ];

  return (
    <Card className="border-t-4 border-t-primary shadow-sm bg-gradient-to-br from-white to-gray-50/50 mb-8">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Reality Check
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Comparing official claims against student-reported reality.</p>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8 pt-6">
        {/* Official Data Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="flex items-center gap-2 text-blue-700 font-semibold">
              <Building2 className="h-5 w-5" /> Official Data
            </h3>
            <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">From College</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <span className="text-sm font-medium text-gray-700">Placement Rate</span>
              <span className="font-bold text-blue-700">{data.official?.placementRate ? `${data.official.placementRate}%` : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <span className="text-sm font-medium text-gray-700">Avg Package</span>
              <span className="font-bold text-blue-700">{data.official?.avgPackage ? `₹${data.official.avgPackage} LPA` : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <span className="text-sm font-medium text-gray-700">Total Fees</span>
              <span className="font-bold text-blue-700">{data.official?.fees ? `₹${(data.official.fees/100000).toFixed(2)}L` : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Student-Reported Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="flex items-center gap-2 text-purple-700 font-semibold">
              <Users className="h-5 w-5" /> Student-Reported
            </h3>
            <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">Aggregated Reviews</span>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {categories.map((cat) => {
              const stat = data.studentExperience?.[cat.key];
              if (!stat) return null;
              
              return (
                <div key={cat.key} className="flex flex-col gap-1 bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                    <span className="font-bold text-purple-700">
                      {stat.avgRating ? `${stat.avgRating}/5.0` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">{stat.sampleSize} reviews</span>
                    {renderConfidenceBadge(stat.confidence)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
