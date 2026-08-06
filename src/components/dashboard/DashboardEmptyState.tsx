import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  tier?: "primary" | "secondary" | "tertiary";
}

export const DashboardEmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  actionIcon: ActionIcon,
  tier = "secondary"
}: DashboardEmptyStateProps) => {
  if (tier === "tertiary") {
    return (
      <div className="py-4 text-center">
        <p className="text-[13px] text-muted-foreground">{title}</p>
      </div>
    );
  }

  if (tier === "secondary") {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed border-border gap-3">
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-[13px] text-muted-foreground font-medium">{title}</p>
        </div>
        {actionLabel && (
          actionHref ? (
            <Link to={actionHref}>
              <Button variant="outline" size="sm" className="h-7 text-[12px]">
                {ActionIcon && <ActionIcon className="h-3 w-3 mr-1" />}
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={onAction}>
              {ActionIcon && <ActionIcon className="h-3 w-3 mr-1" />}
              {actionLabel}
            </Button>
          )
        )}
      </div>
    );
  }

  // Primary
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-xl border border-dashed border-border">
      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 mb-3 shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-[15px] font-medium mb-1">{title}</h3>
      {description && <p className="text-[13px] text-muted-foreground max-w-[400px] mb-4">{description}</p>}
      {actionLabel && (
        actionHref ? (
          <Link to={actionHref}>
            <Button className="h-8 text-[13px]">
              {ActionIcon && <ActionIcon className="h-3 w-3 mr-1.5" />}
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button className="h-8 text-[13px]" onClick={onAction}>
            {ActionIcon && <ActionIcon className="h-3 w-3 mr-1.5" />}
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
};
