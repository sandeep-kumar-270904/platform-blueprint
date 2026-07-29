import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTargetCompanies, useUpdateTargetCompanies } from '@/hooks/useProgressDashboard';
import { useInterviewCompanies } from '@/hooks/useInterviewPrep';
import { Check, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const TargetCompaniesWidget = () => {
  const { data: targetCompanies = [], isLoading } = useTargetCompanies();
  const { mutate: updateTargets } = useUpdateTargetCompanies();
  const { data: allCompanies = [] } = useInterviewCompanies('', 'all');
  
  const [isEditing, setIsEditing] = useState(false);

  const toggleCompany = (companyId: string) => {
    const currentIds = targetCompanies.map((c: any) => c._id);
    const newIds = currentIds.includes(companyId)
      ? currentIds.filter((id: string) => id !== companyId)
      : [...currentIds, companyId];
    updateTargets(newIds);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Target Companies
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Done' : 'Edit Targets'}
          </Button>
        </CardTitle>
        <CardDescription>Track your readiness for specific companies</CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="flex flex-wrap gap-2">
            {allCompanies.map((comp: any) => {
              const isTargeted = targetCompanies.some((tc: any) => tc._id === comp._id);
              return (
                <Badge
                  key={comp._id}
                  variant={isTargeted ? 'default' : 'outline'}
                  className="cursor-pointer flex items-center gap-1"
                  onClick={() => toggleCompany(comp._id)}
                >
                  {isTargeted ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {comp.name}
                </Badge>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {targetCompanies.length > 0 ? (
              targetCompanies.map((comp: any) => (
                <Badge key={comp._id} variant="secondary" className="flex items-center gap-1">
                  {comp.name}
                </Badge>
              ))
            ) : (
              <div className="text-sm text-muted-foreground w-full text-center p-4 border rounded-md border-dashed">
                No target companies selected. Click Edit to add some!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
