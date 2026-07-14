import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Folder, File, Code, Download, Star, Eye } from "lucide-react";

const mockResources = [];

const TechVault = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <Code className="mr-1 h-3 w-3" />
                  Resource Library
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Tech{" "}
                  <span className="text-foreground display-font">
                    Vault
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Access curated tech resources, documentation, code snippets, and tutorials.
                </p>
                <Button size="lg" className="hover-scale">
                  <Code className="mr-2 h-4 w-4" />
                  Upload Resource
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 max-w-4xl mx-auto">
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {mockResources.map((resource, index) => (
            <ScrollReveal key={resource.id} delay={0.1 * (index + 1)}>
              <Card className="hover-lift cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      {resource.type === "folder" ? (
                        <Folder className="h-6 w-6 text-primary" />
                      ) : (
                        <File className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <Badge variant="secondary">{resource.category}</Badge>
                  </div>
                  <h3 className="text-lg font-bold">{resource.name}</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      {resource.type === "folder" ? (
                        <span>{resource.files} files</span>
                      ) : (
                        <span>{resource.size}</span>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{resource.views || resource.downloads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          <span>{resource.stars}</span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full" size="sm" variant="outline">
                      {resource.type === "folder" ? "Open" : <><Download className="mr-2 h-3 w-3" />Download</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechVault;
