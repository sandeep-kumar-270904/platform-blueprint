import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useSpecificPageContent } from "@/hooks/useSiteContent";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const StaticPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useSpecificPageContent(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Expecting a section called 'main' with markdown or HTML content
  const mainContent = data?.find((c: any) => c.section === "main")?.content;

  if (!mainContent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The content for this page has not been created yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Optional Hero Section */}
      {mainContent.heroTitle && (
        <div className="bg-muted py-16 text-center border-b border-border/40">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{mainContent.heroTitle}</h1>
          {mainContent.heroSubtitle && <p className="text-xl text-muted-foreground">{mainContent.heroSubtitle}</p>}
        </div>
      )}

      {/* Main Body */}
      <div className="container mx-auto px-4 py-12 max-w-4xl prose prose-invert">
        {mainContent.body ? (
          <ReactMarkdown>{mainContent.body}</ReactMarkdown>
        ) : (
          <p>No body content.</p>
        )}
      </div>
    </div>
  );
};

export default StaticPage;
