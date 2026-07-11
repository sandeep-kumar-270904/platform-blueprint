import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonCollegeCard = () => {
  return (
    <Card className="flex flex-col h-full border-border bg-card">
      <CardHeader className="relative pb-2">
        <div className="absolute top-4 right-4 flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-7 w-3/4 mt-1 mb-2" />
        <div className="flex items-center gap-2 mt-1">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Skeleton className="h-10 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
};
