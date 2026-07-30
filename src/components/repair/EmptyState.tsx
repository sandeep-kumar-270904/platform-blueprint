import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  category: string;
  onClearFilter: () => void;
}

export const EmptyState = ({ category, onClearFilter }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4 animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
        <Wrench className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
      <h3 className="text-2xl font-bold mb-2">No providers found</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        We couldn't find any service providers in the <span className="font-semibold capitalize text-foreground">{category}</span> category at the moment. Please check back later.
      </p>
      <Button onClick={onClearFilter} variant="outline">
        View All Services
      </Button>
    </div>
  );
};
