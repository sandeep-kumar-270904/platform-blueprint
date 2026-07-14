import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Upload, Video, FileText, Image, TrendingUp, Eye, Heart } from "lucide-react";

const mockContent = [];

const CreatorsZone = () => {
  const [selectedTab, setSelectedTab] = useState("browse");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Content Creation
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Creators{" "}
                  <span className="text-foreground display-font">
                    Zone
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Share your knowledge, build your audience, and showcase your creative work.
                </p>
                <Button size="lg" className="hover-scale">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Content
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="mycontent">My Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {mockContent.map((content, index) => (
                <ScrollReveal key={content.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift cursor-pointer overflow-hidden">
                    <div className="aspect-video bg-primary text-primary-foreground flex items-center justify-center text-6xl">
                      {content.thumbnail}
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">
                          {content.type === "video" && <Video className="h-3 w-3 mr-1" />}
                          {content.type === "article" && <FileText className="h-3 w-3 mr-1" />}
                          {content.type === "gallery" && <Image className="h-3 w-3 mr-1" />}
                          {content.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{content.uploadedAt}</span>
                      </div>
                      <h3 className="font-bold mb-1">{content.title}</h3>
                      <p className="text-sm text-muted-foreground">by {content.creator}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{content.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            <span>{content.likes}</span>
                          </div>
                        </div>
                        <span className="text-xs">
                          {content.duration || content.readTime || `${content.images} images`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mycontent">
            <div className="text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Start creating content to build your portfolio</p>
              <Button>Upload Your First Content</Button>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <TrendingUp className="h-8 w-8 mb-3 text-primary" />
                  <p className="text-2xl font-bold mb-1">0</p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Heart className="h-8 w-8 mb-3 text-destructive" />
                  <p className="text-2xl font-bold mb-1">0</p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <FileText className="h-8 w-8 mb-3 text-accent" />
                  <p className="text-2xl font-bold mb-1">0</p>
                  <p className="text-sm text-muted-foreground">Content Pieces</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatorsZone;
