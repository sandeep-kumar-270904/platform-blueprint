import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Star, Phone, MapPin, Clock } from "lucide-react";

const mockServices = [
  {
    id: 1,
    name: "Quick Fix Electronics",
    category: "Electronics",
    rating: 4.7,
    reviews: 156,
    location: "Sector 21",
    phone: "+91 98765 43210",
    hours: "9 AM - 8 PM",
    services: ["Laptop Repair", "Mobile Repair", "Tablet Repair"]
  },
  {
    id: 2,
    name: "City Plumbing Services",
    category: "Plumbing",
    rating: 4.9,
    reviews: 234,
    location: "Main Market",
    phone: "+91 98765 43211",
    hours: "24/7",
    services: ["Pipe Repair", "Tap Fix", "Drainage"]
  },
  {
    id: 3,
    name: "Bright Light Electricians",
    category: "Electrical",
    rating: 4.5,
    reviews: 89,
    location: "Near College Gate",
    phone: "+91 98765 43212",
    hours: "8 AM - 9 PM",
    services: ["Wiring", "Fan Repair", "Appliance Fix"]
  }
];

const Repair = () => {
  const [selectedTab, setSelectedTab] = useState("all");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <Wrench className="mr-1 h-3 w-3" />
                  Service Directory
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Repair &{" "}
                  <span className="text-foreground display-font">
                    Maintenance
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Find reliable repair services for electronics, plumbing, electrical work, and more.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="electronics">Electronics</TabsTrigger>
            <TabsTrigger value="plumbing">Plumbing</TabsTrigger>
            <TabsTrigger value="electrical">Electrical</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {mockServices.map((service, index) => (
                <ScrollReveal key={service.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{service.name}</h3>
                          <Badge variant="secondary" className="mb-2">{service.category}</Badge>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-warning text-warning" />
                              <span className="text-sm font-medium">{service.rating}</span>
                              <span className="text-xs text-muted-foreground">({service.reviews})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{service.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{service.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{service.hours}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {service.services.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                        <Button className="w-full">
                          <Phone className="mr-2 h-4 w-4" />
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="electronics">
            <p className="text-center text-muted-foreground">Electronics repair services</p>
          </TabsContent>

          <TabsContent value="plumbing">
            <p className="text-center text-muted-foreground">Plumbing services</p>
          </TabsContent>

          <TabsContent value="electrical">
            <p className="text-center text-muted-foreground">Electrical services</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Repair;
