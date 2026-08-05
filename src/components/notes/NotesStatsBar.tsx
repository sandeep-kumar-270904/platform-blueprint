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
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-none mb-1.5">{stat.label}</p>
                <p className="text-2xl font-bold tracking-tight leading-none text-[var(--color-text-primary)]">{formatStat(stat.value, !isLoading, stat.zeroState)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollReveal>
  );
};
