import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ApplicantFeedbackForm = ({ scholarshipId, providerName }: { scholarshipId: string, providerName: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState("");
    const [confusingSteps, setConfusingSteps] = useState<string[]>([]);

    const toggleStep = (step: string) => {
        setConfusingSteps(prev => 
            prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]
        );
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please provide a rating");
            return;
        }
        
        try {
            const res = await fetch(`${API_URL}/api/scholarships/feedback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scholarshipId,
                    providerName,
                    clarityRating: rating,
                    comments,
                    confusingSteps
                })
            });
            
            if (res.ok) {
                toast.success("Feedback submitted successfully. Thank you!");
                setIsOpen(false);
            } else {
                toast.error("Failed to submit feedback");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error submitting feedback");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Rate Application
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Application Experience Feedback</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                    <div className="space-y-3">
                        <Label>How clear was the application process?</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                    key={star} 
                                    className={`h-8 w-8 cursor-pointer transition-colors ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400/50'}`}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <Label>Were any of these steps confusing? (Optional)</Label>
                        <div className="grid gap-2">
                            {['Essay Requirements', 'Eligibility Criteria', 'Document Uploads', 'Deadlines', 'Financial Info'].map(step => (
                                <div key={step} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={step} 
                                        checked={confusingSteps.includes(step)}
                                        onCheckedChange={() => toggleStep(step)}
                                    />
                                    <label htmlFor={step} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {step}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Additional Comments (Optional)</Label>
                        <Textarea 
                            placeholder="Help the provider improve their application process privately..." 
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                        />
                    </div>
                    
                    <Button onClick={handleSubmit} className="w-full">Submit Feedback</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// quickApply simplified singleStep form
