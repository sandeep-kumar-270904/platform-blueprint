import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Lightbulb, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

const GENERAL_BEST_PRACTICES = [
  { id: 'bp-1', text: 'Use strong action verbs (e.g., "Spearheaded", "Architected")' },
  { id: 'bp-2', text: 'Quantify achievements (e.g., "Increased speed by 20%")' },
  { id: 'bp-3', text: 'Maintain consistent formatting and margins' },
  { id: 'bp-4', text: 'Keep length to 1 page unless you have 10+ years experience' },
  { id: 'bp-5', text: 'Avoid tables, columns, or heavy graphics that confuse parsers' },
  { id: 'bp-6', text: 'Include a link to your GitHub or portfolio' }
];

export default function CompanyResumeTips() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    fetchCompanies();
    fetchChecklistProgress();
  }, []);

  const fetchChecklistProgress = async () => {
    try {
      const res = await fetch('/api/resumes/checklist', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const checks = {};
        data.checkedItems?.forEach(item => {
          checks[item] = true;
        });
        setCheckedItems(checks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/interview-prep/companies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompanySelect = async (companyId) => {
    setSelectedCompanyId(companyId);
    if (!companyId) return;

    setLoading(true);
    setTips([]); // clear previous
    try {
      const res = await fetch(`/api/interview-prep/companies/${companyId}/resume-tips`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTips(data.tips || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = async (id) => {
    // Optimistic UI update
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));

    try {
      await fetch('/api/resumes/checklist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ itemId: id })
      });
    } catch (err) {
      console.error('Failed to toggle checklist', err);
      // Revert optimistic update
      setCheckedItems(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Left Column: Company Selector & Tips */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company-Tailored Advice</CardTitle>
            <CardDescription>Select a target company to generate AI-tailored resume tips based on what their recruiters value.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Target Company</label>
              <Select value={selectedCompanyId} onValueChange={handleCompanySelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a company..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name} ({c.companyType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Generating tailored tips using Gemini...</p>
              </div>
            ) : tips.length > 0 ? (
              <div className="space-y-3 mt-4">
                <h4 className="font-semibold text-slate-800 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2 text-amber-500" />
                  Top Insights
                </h4>
                <ul className="space-y-3">
                  {tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start bg-indigo-50/50 p-3 rounded-lg text-sm text-slate-700">
                      <ChevronRight className="w-4 h-4 text-indigo-500 mt-0.5 mr-2 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : selectedCompanyId ? (
              <div className="text-center p-6 text-slate-500">No tips found for this company.</div>
            ) : (
              <div className="text-center p-6 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                Select a company above to see tips.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: General Best Practices Checklist */}
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
              General Best Practices
            </CardTitle>
            <CardDescription>Ensure your resume meets these baseline requirements before applying anywhere.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {GENERAL_BEST_PRACTICES.map(bp => (
                <div key={bp.id} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded-md transition-colors">
                  <Checkbox 
                    id={bp.id} 
                    checked={checkedItems[bp.id] || false}
                    onCheckedChange={() => toggleCheck(bp.id)}
                    className="mt-1"
                  />
                  <label 
                    htmlFor={bp.id} 
                    className={`text-sm leading-tight cursor-pointer ${checkedItems[bp.id] ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                  >
                    {bp.text}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
              <span className="text-slate-500">Checklist Progress</span>
              <span className="font-bold text-indigo-600">
                {Object.values(checkedItems).filter(Boolean).length} / {GENERAL_BEST_PRACTICES.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
