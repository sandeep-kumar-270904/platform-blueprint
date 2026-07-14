import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { FileText, Eye, Download, FolderOpen } from "lucide-react";
import { formatStat } from "@/lib/utils";

interface NotesStatsBarProps {
  totalNotes: number;
  totalViews: number;
  totalDownloads: number;
  totalSubjects: number;
  isLoading?: boolean;
}

export const NotesStatsBar = ({
  totalNotes,
  totalViews,
  totalDownloads,
  totalSubjects,
  isLoading = false,
}: NotesStatsBarProps) => {
  const stats = [
    { icon: FileText, label: "Total Notes", value: totalNotes, zeroState: "0" },
    { icon: Eye, label: "Total Views", value: totalViews, zeroState: "0" },
    { icon: Download, label: "Downloads", value: totalDownloads, zeroState: "0" },
    { icon: FolderOpen, label: "Subjects", value: totalSubjects, zeroState: "0" },
  ];

  return (
    <ScrollReveal>
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-[16px]">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-sm">
            <CardContent className="p-[24px] flex flex-col md:flex-row items-start md:items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-[var(--color-bg)] border border-[var(--color-border)]">
                <stat.icon className="h-4 w-4 text-[var(--color-text-primary)]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="stat-number text-[var(--color-text-primary)]">{formatStat(stat.value, !isLoading, stat.zeroState)}</p>
                <p className="stat-label text-[var(--color-text-secondary)] mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollReveal>
  );
};
