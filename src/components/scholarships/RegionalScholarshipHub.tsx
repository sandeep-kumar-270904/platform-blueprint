import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const RegionalScholarshipHub = () => {
    const [locationQuery, setLocationQuery] = useState("");
    const [scholarships, setScholarships] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!locationQuery.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/scholarships/regional?location=${encodeURIComponent(locationQuery)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setScholarships(data);
            }
        } catch (err) {
            console.error("Error fetching regional scholarships", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-indigo-500/5 to-transparent shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-indigo-500" />
                    Regional & Local Scholarships
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Discover smaller, lower-competition scholarships specific to your city, county, or state.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input 
                        placeholder="Enter your city, county, or state (e.g. 'Austin, TX')" 
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={loading || !locationQuery.trim()} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Find Local
                    </Button>
                </div>

                {searched && (
                    <div className="mt-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : scholarships.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No local scholarships found for "{locationQuery}".</p>
                                <p className="text-sm mt-1">Try broadening your search (e.g., search by state instead of city).</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 max-h-80 overflow-y-auto pr-2">
                                {scholarships.map(s => (
                                    <div key={s._id} className="border p-3 rounded-md bg-background flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold">{s.title}</h4>
                                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 shrink-0">
                                                Local Scope
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Award: ${s.amount?.min?.toLocaleString() || 'Varies'}</span>
                                            <span>Deadline: {new Date(s.deadline).toLocaleDateString()}</span>
                                            {s.applicationCount !== undefined && (
                                                <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    Low Competition ({s.applicationCount} applicants)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
