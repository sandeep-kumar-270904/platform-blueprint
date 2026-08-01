import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Trash2, Home, MapPin, Flag, FileText } from "lucide-react";
import { useRoomRentals } from "@/hooks/useRoomRentals";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AdminRoomRentalsPanel() {
  const { getAdminListings, adminVerifyListing, adminDeleteListing } = useRoomRentals({
    search: '', minRent: '', maxRent: '', roomType: 'All', minBeds: '', maxMoveInDate: ''
  });

  if (getAdminListings.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading listings...</div>;
  }

  const listings = getAdminListings.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Room Rentals Moderation</h1>
        <p className="text-muted-foreground">Approve verification requests and manage reported listings.</p>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No room listings found on the platform.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {listings.map(listing => (
            <Card key={listing._id} className={listing.reports && listing.reports.length > 0 ? "border-red-200" : ""}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {listing.title}
                      {listing.verificationStatus === 'Verified' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {listing.verificationStatus === 'Pending' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Verification Pending</Badge>}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Home className="w-3 h-3" /> {listing.roomType} &nbsp;&bull;&nbsp; 
                      <MapPin className="w-3 h-3" /> {listing.location} &nbsp;&bull;&nbsp; 
                      ${listing.rent}/mo
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {listing.verificationStatus === 'Pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => adminVerifyListing.mutate({ roomId: listing._id, status: 'Verified' })}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50" onClick={() => adminVerifyListing.mutate({ roomId: listing._id, status: 'Rejected' })}>
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </>
                    )}
                    {listing.verificationStatus === 'Verified' && (
                      <Button size="sm" variant="outline" onClick={() => adminVerifyListing.mutate({ roomId: listing._id, status: 'None' })}>
                        Revoke Verification
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => {
                      if (confirm("Are you sure you want to permanently delete this listing?")) {
                        adminDeleteListing.mutate(listing._id);
                      }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Lister Information</h4>
                    <p className="text-sm text-muted-foreground">{listing.lister.name} ({listing.lister.email})</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{listing.description}</p>
                    
                    {listing.verificationStatus === 'Pending' && listing.verificationProof && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2 text-yellow-600">Submitted Proof</h4>
                        <div className="w-32 h-32 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                          {listing.verificationProof.toLowerCase().endsWith('.pdf') ? (
                            <a href={listing.verificationProof} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex flex-col items-center">
                              <FileText className="w-8 h-8 mb-2 text-muted-foreground" />
                              <span className="text-xs">View PDF</span>
                            </a>
                          ) : (
                            <a href={listing.verificationProof} target="_blank" rel="noreferrer" className="block w-full h-full">
                              <img src={listing.verificationProof} alt="Proof" className="w-full h-full object-cover" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {listing.reports && listing.reports.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-md p-3">
                      <h4 className="text-sm font-semibold text-red-800 flex items-center gap-1 mb-2">
                        <Flag className="w-4 h-4" /> Reports ({listing.reports.length})
                      </h4>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="reports" className="border-b-0">
                          <AccordionTrigger className="py-0 text-xs text-red-600 hover:text-red-700 hover:no-underline">View Details</AccordionTrigger>
                          <AccordionContent className="pt-2">
                            <ul className="space-y-2">
                              {listing.reports.map((report, idx) => (
                                <li key={idx} className="text-xs bg-white p-2 rounded border border-red-100">
                                  <span className="font-semibold">{report.reason}</span>
                                  <span className="text-muted-foreground block mt-1">Reported at {new Date(report.createdAt).toLocaleDateString()}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
