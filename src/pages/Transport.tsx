import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bus, MapPin, Clock, DollarSign } from "lucide-react";

const mockRoutes = [];

const Transport = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Bus className="mr-1 h-3 w-3" />
                  Transportation
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Campus{" "}
                  <span className="text-foreground display-font">
                    Transport
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  View bus schedules, routes, and book campus shuttle services.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {mockRoutes.map((route, index) => (
            <ScrollReveal key={route.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <h3 className="text-xl font-bold">{route.name}</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{route.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{route.fare}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Route Stops:
                    </p>
                    <div className="space-y-1">
                      {route.stops.map((stop, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground pl-6">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span>{stop}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full">View Schedule</Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Transport;
