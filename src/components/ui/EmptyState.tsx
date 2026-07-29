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
    <div className="flex flex-col items-center justify-center py-[64px] text-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-sm">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)]">
        <Icon className="h-8 w-8 text-[var(--color-text-secondary)]" aria-hidden="true" />
      </div>
      <h3 className="mb-2 page-heading text-[var(--color-text-primary)]">{title}</h3>
      <p className="mb-8 text-[var(--color-text-secondary)] max-w-[65ch] text-sm body-text mx-auto">
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
