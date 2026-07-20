import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Loader2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const FinancialAidCalculator = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // No persistence as per constraints
  const [coa, setCoa] = useState<number | ''>('');
  const [efc, setEfc] = useState<number | ''>('');
  const [otherAid, setOtherAid] = useState<number | ''>(0);
  
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleCalculate = async () => {
    if (coa === '' || efc === '') {
      toast.error('Please fill in COA and EFC');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/calculate-aid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          costOfAttendance: coa,
          estimatedFamilyContribution: efc,
          otherAidSecured: otherAid || 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        toast.error("Failed to calculate aid");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Clear data on close to ensure zero persistence
      setCoa('');
      setEfc('');
      setOtherAid(0);
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
          <Calculator className="h-4 w-4" />
          Aid Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Financial Aid Gap Calculator</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="coa">Estimated Cost of Attendance (COA) ($)</Label>
            <Input 
              id="coa" 
              type="number" 
              placeholder="e.g. 35000" 
              value={coa} 
              onChange={e => setCoa(e.target.value ? Number(e.target.value) : '')} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="efc">Estimated Family Contribution (EFC) ($)</Label>
            <Input 
              id="efc" 
              type="number" 
              placeholder="e.g. 5000" 
              value={efc} 
              onChange={e => setEfc(e.target.value ? Number(e.target.value) : '')} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="otherAid">Other Aid Secured ($)</Label>
            <Input 
              id="otherAid" 
              type="number" 
              placeholder="e.g. 2000" 
              value={otherAid} 
              onChange={e => setOtherAid(e.target.value ? Number(e.target.value) : '')} 
            />
          </div>

          <Button className="w-full mt-2" onClick={handleCalculate} disabled={loading || coa === '' || efc === ''}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Calculate Remaining Need
          </Button>
        </div>

        {result && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Estimated Gap</h4>
              <p className="text-3xl font-bold text-primary mt-1">
                ${result.remainingNeed?.toLocaleString() || 0}
              </p>
            </div>
            
            {result.suggestedScholarships?.length > 0 && (
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm">Suggested Scholarships to Close the Gap:</h4>
                {result.suggestedScholarships.map((s: any) => (
                  <Card key={s._id} className="cursor-pointer hover:border-primary/50" onClick={() => {
                      setOpen(false);
                      navigate(`/scholarships/${s._id}`);
                  }}>
                    <CardContent className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{s.title}</p>
                        <p className="text-xs text-muted-foreground">${s.amount?.toLocaleString()}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
