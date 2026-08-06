import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, ArrowRight } from "lucide-react";

export const RoommatesDashboardWidget = () => {
  return (
    <Card className="bg-card border-border shadow-sm rounded-xl hover:shadow-md transition-shadow h-full flex flex-col">
      <CardContent className="p-5 flex flex-col items-start gap-4 flex-1">
        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <Home className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-[15px] font-medium mb-1">Roommate Finder</h3>
          <p className="text-[13px] text-muted-foreground line-clamp-1">Find compatible roommates and housing.</p>
        </div>
        <div className="mt-auto w-full pt-2">
          <Button variant="outline" asChild className="w-full justify-between h-8 text-[13px]">
            <Link to="/roommates">
              Find Roommates <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
