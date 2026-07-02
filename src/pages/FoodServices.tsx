import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { UtensilsCrossed, Star, MapPin, Clock, Percent } from "lucide-react";

const mockRestaurants = [
  {
    id: 1,
    name: "Campus Canteen",
    cuisine: "Indian, Chinese",
    rating: 4.2,
    distance: "Inside Campus",
    discount: "10% Student Discount",
    timing: "7 AM - 10 PM",
  },
  {
    id: 2,
    name: "Pizza Corner",
    cuisine: "Italian, Fast Food",
    rating: 4.5,
    distance: "200m from Gate",
    discount: "15% on Orders > ₹300",
    timing: "11 AM - 11 PM",
  },
];

const FoodServices = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <UtensilsCrossed className="mr-1 h-3 w-3" />
                  Food & Dining
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Discover{" "}
                  <span className="text-foreground display-font">
                    Great Food
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Find the best restaurants near campus with student discounts and reviews.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRestaurants.map((restaurant, index) => (
            <ScrollReveal key={restaurant.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <h3 className="text-xl font-bold">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="font-medium">{restaurant.rating}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{restaurant.distance}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{restaurant.timing}</span>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center">
                    <Percent className="mr-1 h-3 w-3" />
                    {restaurant.discount}
                  </Badge>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">View Menu</Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FoodServices;
