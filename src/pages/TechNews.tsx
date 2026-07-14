import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Newspaper, Clock, Bookmark, Share2, TrendingUp } from "lucide-react";

const mockNews = [];

const TechNews = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Newspaper className="mr-1 h-3 w-3" />
                  Latest Updates
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  AI & Tech{" "}
                  <span className="text-foreground display-font">
                    News Feed
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Stay updated with the latest in AI, technology, and innovation.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockNews.map((article, index) => (
            <ScrollReveal key={article.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{article.category}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">{article.title}</h3>
                  <p className="text-xs text-muted-foreground">{article.publishedAt}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechNews;
