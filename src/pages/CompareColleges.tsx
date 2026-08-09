import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, XCircle, Star } from "lucide-react";
import { useColleges } from "@/hooks/useColleges";
import { SaveComparisonButton, SavedComparisonsDialog } from "@/components/colleges/CompareSetsActions";

const CompareColleges = () => {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get("ids");
  const { getCompareColleges } = useColleges();
  
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idsParam) {
      setLoading(false);
      return;
    }
    const ids = idsParam.split(",");
    
    const loadColleges = async () => {
      setLoading(true);
      try {
        const data = await getCompareColleges(ids);
        setColleges(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    loadColleges();
  }, [idsParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 space-y-8">
          <Skeleton className="h-8 w-[300px]" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-[500px]" />
            <Skeleton className="h-[500px]" />
            <Skeleton className="h-[500px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!idsParam || colleges.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <h2 className="text-2xl font-bold mb-2">No Colleges Selected</h2>
          <p className="text-muted-foreground mb-6">Go back and select some colleges to compare.</p>
          <Link to="/college-insights">
            <Button><ArrowLeft className="mr-2 h-4 w-4" /> Back to Colleges</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate Best Values
  let lowestFee = Infinity;
  let highestRating = -Infinity;
  let highestPlacement = -Infinity;
  
  colleges.forEach(c => {
    const totalFee = (c.fees?.tuition || 0) + (c.fees?.hostel || 0) + (c.fees?.other || 0);
    if (totalFee < lowestFee) lowestFee = totalFee;
    if (c.rating > highestRating) highestRating = c.rating;
    if (c.placementPercentage > highestPlacement) highestPlacement = c.placementPercentage;
  });

  const renderCell = (value: React.ReactNode, isBest: boolean = false) => (
    <td className={`p-4 align-top border-b border-r border-border text-sm ${isBest ? 'bg-green-500/10 font-medium' : ''}`}>
      {value}
    </td>
  );

  const getFees = (c: any) => (c.fees?.tuition || 0) + (c.fees?.hostel || 0) + (c.fees?.other || 0);

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/college-insights">
              <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Compare Colleges</h1>
              <p className="text-muted-foreground">Side-by-side comparison of {colleges.length} institutions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <SavedComparisonsDialog />
            <SaveComparisonButton collegeIds={colleges.map(c => c._id)} />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="p-4 border-b border-r border-border bg-muted/50 w-[200px] sticky left-0 z-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Feature
                </th>
                {colleges.map(c => (
                  <th key={c._id} className="p-4 border-b border-r border-border bg-card min-w-[250px] align-top text-center sticky top-0 z-8">
                    {c.rating === highestRating && highestRating > 0 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-warning text-warning-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm border border-warning/50 z-24 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" /> Recommended
                      </div>
                    )}
                    <div className="text-4xl mb-3 mt-2">{c.logoOrIcon || "🏛️"}</div>
                    <h3 className="font-bold text-lg leading-tight mb-1">{c.name}</h3>
                    <div className="text-muted-foreground font-normal text-sm">{c.location?.city}, {c.location?.state}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Type & Accreditation */}
              <tr>
                <th className="p-4 border-b border-r border-border bg-muted/50 font-semibold sticky left-0 z-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">Institution Type</th>
                {colleges.map(c => renderCell(
                  <div>
                    <div className="font-medium">{c.type}</div>
                    {c.accreditation && <div className="text-muted-foreground mt-1 text-xs">{c.accreditation}</div>}
                  </div>
                ))}
              </tr>

              {/* Rating */}
              <tr>
                <th className="p-4 border-b border-r border-border bg-muted/50 font-semibold sticky left-0 z-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">Overall Rating</th>
                {colleges.map(c => renderCell(
                  <div className="flex items-center justify-center gap-1 font-bold">
                    <span className="text-lg">{c.rating?.toFixed(1) || "N/A"}</span>
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-muted-foreground text-xs font-normal">({c.totalReviews})</span>
                  </div>,
                  c.rating === highestRating && highestRating > 0
                ))}
              </tr>

              {/* Category Ratings */}
              {[
                { key: 'avgAcademicsRating', label: 'Academics' },
                { key: 'avgFacultyRating', label: 'Faculty' },
                { key: 'avgInfrastructureRating', label: 'Infrastructure' },
                { key: 'avgPlacementsRating', label: 'Placements' },
                { key: 'avgCampusLifeRating', label: 'Campus Life' },
                { key: 'avgHostelRating', label: 'Hostel' },
                { key: 'avgLabsRating', label: 'Labs' }
              ].map(cat => {
                // Find highest for this category
                let highest = -Infinity;
                colleges.forEach(c => {
                  if (c[cat.key] > highest) highest = c[cat.key];
                });

                return (
                  <tr key={cat.key}>
                    <th className="p-4 border-b border-r border-border bg-muted/20 font-medium sticky left-0 z-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-xs text-muted-foreground">
                      ↪ {cat.label}
                    </th>
                    {colleges.map(c => renderCell(
                      <div className="flex items-center justify-center gap-1 text-sm">
                        {c[cat.key] ? (
                          <>
                            {c[cat.key].toFixed(1)} <Star className="h-3 w-3 fill-warning text-warning" />
                          </>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </div>,
                      c[cat.key] === highest && highest > 0
                    ))}
                  </tr>
                );
              })}

              {/* Total Fees */}
              <tr>
                <th className="p-4 border-b border-r border-border bg-muted/50 font-semibold sticky left-0 z-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">Total Fees (1st Year)</th>
                {colleges.map(c => renderCell(
                  `₹${(getFees(c) / 100000).toFixed(2)} Lakhs`,
                  getFees(c) === lowestFee && lowestFee > 0
                ))}
              </tr>

              {/* Placement Rate */}
              <tr>
                <th className="p-4 border-b border-r border-border bg-muted/50 font-semibold sticky left-0 z-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">Placement Rate</th>
                {colleges.map(c => renderCell(
                  c.placementPercentage ? `${c.placementPercentage}%` : "N/A",
                  c.placementPercentage === highestPlacement && highestPlacement > 0
                ))}
              </tr>

              {/* Average Package */}
              <tr>
                <th className="p-4 border-b border-r border-border bg-muted/50 font-semibold sticky left-0 z-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">Average Package</th>
                {colleges.map(c => renderCell(c.avgPackage || "N/A"))}
              </tr>

              {/* Highest Package */}
              <tr>
                <th className="p-4 border-b border-r border-border bg-muted/50 font-semibold sticky left-0 z-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">Highest Package</th>
                {colleges.map(c => renderCell(c.highestPackage || "N/A"))}
              </tr>

              {/* Facilities */}
              <tr>
                <th className="p-4 border-b border-r border-border bg-muted/50 font-semibold sticky left-0 z-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">Key Facilities</th>
                {colleges.map(c => renderCell(
                  <ul className="space-y-1">
                    {c.facilities?.slice(0, 5).map((fac: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                        <span className="truncate">{fac}</span>
                      </li>
                    ))}
                    {(!c.facilities || c.facilities.length === 0) && <span className="text-muted-foreground text-xs">No data</span>}
                  </ul>
                ))}
              </tr>

              {/* Top Courses */}
              <tr>
                <th className="p-4 border-r border-border bg-muted/50 font-semibold sticky left-0 z-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">Top Courses</th>
                {colleges.map(c => renderCell(
                  <div className="space-y-2">
                    {c.coursesOffered?.slice(0, 3).map((course: any, i: number) => (
                      <div key={i} className="bg-muted/30 p-2 rounded text-xs border border-border">
                        <div className="font-semibold mb-1">{course.name}</div>
                        <div className="text-muted-foreground flex justify-between">
                          <span>{course.duration}</span>
                          <span>{course.eligibility}</span>
                        </div>
                      </div>
                    ))}
                    {(!c.coursesOffered || c.coursesOffered.length === 0) && <span className="text-muted-foreground text-xs">No data</span>}
                  </div>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompareColleges;
