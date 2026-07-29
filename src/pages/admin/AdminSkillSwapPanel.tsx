import React from 'react';
import { Header } from '@/components/layout/Header';
import { AdminSkillSwap } from '@/components/admin/AdminSkillSwap';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminSkillSwapPanel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-200 rounded-full" aria-label="Go back to Admin Panel">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">Skill Swap Admin Panel</h1>
        </div>
        
        <AdminSkillSwap />
      </div>
    </div>
  );
}
