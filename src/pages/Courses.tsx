import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BookOpen, Clock, Users, Star, Award } from "lucide-react";

const mockCourses = [
  {
    id: 1,
    title: "Web Development Bootcamp",
    provider: "Tech Academy",
    duration: "12 weeks",
    students: 2450,
    rating: 4.8,
    price: "₹15,000",
    type: "Paid",
    category: "Development",
  },
  {
    id: 2,
    title: "Data Science with Python",
    provider: "DataCamp Pro",
    duration: "8 weeks",
    students: 1890,
    rating: 4.7,
    price: "Free",
    type: "Free",
    category: "Data Science",
  },
];

const Courses = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <BookOpen className="mr-1 h-3 w-3" />
                  Learn New Skills
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Online{" "}
                  <span className="text-foreground display-font">
                    Courses & Workshops
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Upskill with industry-relevant courses and earn certifications.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCourses.map((course, index) => (
            <ScrollReveal key={course.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={course.type === "Free" ? "secondary" : "default"}>
                      {course.type}
                    </Badge>
                    <Badge variant="outline">{course.category}</Badge>
                  </div>
                  <h3 className="text-xl font-bold">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.provider}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{course.students}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="font-medium">{course.rating}</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">{course.price}</div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2">
                    <Award className="h-4 w-4" />
                    Enroll Now
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

export default Courses;
