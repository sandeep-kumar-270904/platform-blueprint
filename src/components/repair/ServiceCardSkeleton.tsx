import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ServiceCardSkeleton = () => {
  return (
    <Card className="h-full flex flex-col border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="w-full">
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-4" />

        <div className="space-y-3 mb-5">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-36 rounded-full" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
};
