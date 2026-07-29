import React from 'react';
import { Header } from '@/components/layout/Header';
import { ScholarshipBuddy } from '@/components/scholarships/ScholarshipBuddy';
import ScholarshipCircles from '@/components/scholarships/ScholarshipCircles';
import { ScholarshipCoach } from '@/components/scholarships/ScholarshipCoach';

export default function ScholarshipCommunity() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Scholarship Community</h1>
        <p className="text-muted-foreground mb-8">Connect with peers, find accountability buddies, and join study circles to boost your scholarship success.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ScholarshipBuddy />
          </div>
          <div>
            <ScholarshipCircles />
          </div>
        </div>
      </div>
      <ScholarshipCoach />
    </div>
  );
}
