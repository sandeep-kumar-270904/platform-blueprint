import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 border border-primary/10">
        <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mb-6 text-[var(--color-text-secondary)] max-w-[500px] text-sm mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="shadow-[var(--shadow-resting)] hover:shadow-[var(--shadow-hover)]">
          {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" aria-hidden="true" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
