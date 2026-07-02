import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Star, MapPin, Clock, Phone } from "lucide-react";

const mockShops = [
  {
    id: 1,
    name: "Student Xerox Center",
    category: "Xerox",
    rating: 4.6,
    reviews: 234,
    location: "Near Main Gate",
    hours: "8 AM - 10 PM",
    phone: "+91 98765 43213",
    offers: ["Bulk discounts", "Fast service"]
  },
  {
    id: 2,
    name: "Quick Stitch Tailors",
    category: "Tailor",
    rating: 4.8,
    reviews: 189,
    location: "Market Complex",
    hours: "9 AM - 8 PM",
    phone: "+91 98765 43214",
    offers: ["Student discount", "Same day service"]
  },
  {
    id: 3,
    name: "Style Hub Salon",
    category: "Salon",
    rating: 4.5,
    reviews: 156,
    location: "Main Street",
    hours: "10 AM - 9 PM",
    phone: "+91 98765 43215",
    offers: ["Student packages", "Expert stylists"]
  },
  {
    id: 4,
    name: "Campus Cafe",
    category: "Cafe",
    rating: 4.7,
    reviews: 312,
    location: "College Road",
    hours: "7 AM - 11 PM",
    phone: "+91 98765 43216",
    offers: ["Free WiFi", "Study space"]
  }
];

const Shopping = () => {
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
                  <ShoppingBag className="mr-1 h-3 w-3" />
                  Local Services
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Shopping &{" "}
                  <span className="text-foreground display-font">
                    Services
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Discover local shops and services - from xerox centers to cafes, tailors to salons.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="xerox">Xerox</TabsTrigger>
            <TabsTrigger value="tailor">Tailor</TabsTrigger>
            <TabsTrigger value="salon">Salon</TabsTrigger>
            <TabsTrigger value="cafe">Cafe</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {mockShops.map((shop, index) => (
                <ScrollReveal key={shop.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{shop.name}</h3>
                          <Badge variant="secondary" className="mb-2">{shop.category}</Badge>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-warning text-warning" />
                              <span className="text-sm font-medium">{shop.rating}</span>
                              <span className="text-xs text-muted-foreground">({shop.reviews})</span>
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
                            <span>{shop.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{shop.hours}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{shop.phone}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {shop.offers.map((offer) => (
                            <Badge key={offer} variant="outline" className="text-xs">
                              {offer}
                            </Badge>
                          ))}
                        </div>
                        <Button className="w-full">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </TabsContent>

          {["xerox", "tailor", "salon", "cafe"].map((category) => (
            <TabsContent key={category} value={category}>
              <p className="text-center text-muted-foreground capitalize">{category} services will appear here</p>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Shopping;
