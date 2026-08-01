import React, { useState, useMemo, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Home, MapPin, Plus, Camera, Calendar, Search, Filter, X, Send, Mail, Inbox, CheckCircle2, Heart, CheckCircle, Map, LayoutGrid, Flag, Users, User, Sparkles, Star, Bell } from "lucide-react";
import { useRoomRentals, RoomRental } from "@/hooks/useRoomRentals";
import { useRoommates } from "@/hooks/useRoommates";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { RoomRentalReviews } from "@/components/room-rentals/RoomRentalReviews";
import { RoommateProfileForm } from "@/components/room-rentals/RoommateProfileForm";
import { RoommateFinder } from "@/components/room-rentals/RoommateFinder";
import { RoommateConnections } from "@/components/room-rentals/RoommateConnections";
import { SearchAlertsPanel } from "@/components/room-rentals/SearchAlertsPanel";
import { RoomBookingManagement } from "@/components/room-rentals/RoomBookingManagement";
import { RoomBookingFlow } from "@/components/room-rentals/RoomBookingFlow";
import { RoomRentalChatView } from "@/components/room-rentals/RoomRentalChatView";
import { RoomRentalAnalytics } from "@/components/room-rentals/RoomRentalAnalytics";
import { RoomRentalFormModal } from "@/components/room-rentals/RoomRentalFormModal";

const RoomRentals = () => {
  // Phase 2: Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('All');
  const [minBeds, setMinBeds] = useState('');
  const [maxMoveInDate, setMaxMoveInDate] = useState('');
  const [includeRented, setIncludeRented] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [radius, setRadius] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { 
    getRentals, 
    createRental, 
    sendInquiry, 
    updateInquiryStatus, 
    getSentInquiries, 
    getReceivedInquiries,
    getMyListings,
    getSavedListings,
    saveListing,
    unsaveListing,
    requestVerification,
    reportListing,
    editListing,
    deleteListing
  } = useRoomRentals({
    search: debouncedQuery,
    minRent: minPrice,
    maxRent: maxPrice,
    roomType: filterRoomType,
    minBeds: minBeds,
    maxDate: maxMoveInDate,
    includeRented: includeRented,
    includeExpired: includeExpired,
    lat,
    lng,
    radius
  });
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'listings' | 'saved' | 'mylistings' | 'sent' | 'inbox' | 'roommates' | 'myprofile' | 'connections' | 'alerts' | 'bookingsSent' | 'bookingsReceived'>('listings');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const { discoverRoommates } = useRoommates();
  
  // Phase 1: Create Listing State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<RoomRental | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomRental | null>(null);
  const [previewRoom, setPreviewRoom] = useState<RoomRental | null>(null);
  
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryDate, setInquiryDate] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const hasFilters = Boolean(
    debouncedQuery || 
    minPrice || 
    maxPrice || 
    (filterRoomType !== 'All') || 
    minBeds || 
    maxMoveInDate
  );

  const rooms = getRentals.data || [];
  const isLoading = getRentals.isLoading;

  const resetFilters = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setFilterRoomType('All');
    setMinBeds('');
    setMaxMoveInDate('');
    setRadius('');
    setLat('');
    setLng('');
  };

  const handleEditClick = (room: RoomRental) => {
    setEditingListing(room);
    setIsEditOpen(true);
  };

  const handleDeleteListing = async (id: string) => {
    if (confirm("Are you sure you want to delete this listing? This cannot be undone.")) {
      try {
        await deleteListing.mutateAsync(id);
      } catch (err) {
        console.error(err);
        alert("Error deleting listing.");
      }
    }
  };

  const handleToggleStatus = async (room: RoomRental) => {
    const newStatus = room.status === 'Available' ? 'Rented' : 'Available';
    try {
      await editListing.mutateAsync({
        id: room._id,
        data: { status: newStatus }
      });
    } catch (err) {
      console.error(err);
      alert("Error updating status.");
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    try {
      await sendInquiry.mutateAsync({
        roomId: selectedRoom._id,
        message: inquiryMessage,
        moveInDate: inquiryDate || undefined
      });
      setInquirySuccess(true);
      setInquiryMessage('');
      setInquiryDate('');
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send inquiry.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Home className="mr-1 h-3 w-3" />
                  Local Rentals
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Find Your{" "}
                  <span className="text-foreground display-font">
                    Perfect Room
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Browse verified room listings near your campus. Safe, affordable, and convenient.
                </p>
                
                <Button size="lg" className="gap-2" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4" /> Post a Room Listing
                </Button>

                <RoomRentalFormModal 
                  open={isCreateOpen} 
                  onOpenChange={setIsCreateOpen} 
                />

                <RoomRentalFormModal 
                  open={isEditOpen} 
                  onOpenChange={setIsEditOpen} 
                  roomToEdit={editingListing}
                />

              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-6 border-b">
        <div className="flex space-x-2">
          <Button variant={activeTab === 'listings' ? 'default' : 'ghost'} onClick={() => setActiveTab('listings')}>
            <Home className="w-4 h-4 mr-2" /> Listings
          </Button>
          {user && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <Button variant={activeTab === 'saved' ? 'default' : 'ghost'} onClick={() => setActiveTab('saved')}>
                <Heart className="w-4 h-4 mr-2" /> Saved
              </Button>
              <Button variant={activeTab === 'mylistings' ? 'default' : 'ghost'} onClick={() => setActiveTab('mylistings')}>
                <Home className="w-4 h-4 mr-2" /> My Listings
              </Button>
              <Button variant={activeTab === 'sent' ? 'default' : 'ghost'} onClick={() => setActiveTab('sent')}>
                <Send className="w-4 h-4 mr-2" /> My Inquiries
              </Button>
              <Button variant={activeTab === 'inbox' ? 'default' : 'ghost'} onClick={() => setActiveTab('inbox')}>
                <Inbox className="w-4 h-4 mr-2" /> Owner Inbox
              </Button>
              <div className="w-px h-6 bg-border mx-2 self-center"></div>
              <Button variant={activeTab === 'bookingsSent' ? 'default' : 'ghost'} onClick={() => setActiveTab('bookingsSent')}>
                <CheckCircle className="w-4 h-4 mr-2" /> My Bookings
              </Button>
              <Button variant={activeTab === 'bookingsReceived' ? 'default' : 'ghost'} onClick={() => setActiveTab('bookingsReceived')}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Owner Bookings
              </Button>
              <div className="w-px h-6 bg-border mx-2 self-center"></div>
              <Button variant={activeTab === 'roommates' ? 'default' : 'ghost'} onClick={() => setActiveTab('roommates')}>
                <Users className="w-4 h-4 mr-2" /> Find Roommates
              </Button>
              <Button variant={activeTab === 'connections' ? 'default' : 'ghost'} onClick={() => setActiveTab('connections')}>
                <Users className="w-4 h-4 mr-2" /> Roommate Connections
              </Button>
              <Button variant={activeTab === 'myprofile' ? 'default' : 'ghost'} onClick={() => setActiveTab('myprofile')}>
                <User className="w-4 h-4 mr-2" /> My Roommate Profile
              </Button>
              <div className="w-px h-6 bg-border mx-2 self-center"></div>
              <Button variant={activeTab === 'alerts' ? 'default' : 'ghost'} onClick={() => setActiveTab('alerts')}>
                <Bell className="w-4 h-4 mr-2" /> Search Alerts
              </Button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'listings' && (
        <>
          <div className="container mx-auto px-4 py-8 border-b">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
          <div className="w-full md:w-1/3 space-y-1">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search listings..." 
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full md:flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <Label>Min Rent</Label>
              <Input type="number" placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Max Rent</Label>
              <Input type="number" placeholder="Any" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={filterRoomType} 
                onChange={e => setFilterRoomType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Single">Single</option>
                <option value="Shared">Shared</option>
                <option value="Entire Unit">Entire Unit</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Min Beds</Label>
              <Input type="number" placeholder="1" value={minBeds} onChange={e => setMinBeds(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Move-in Before</Label>
              <Input type="date" value={maxMoveInDate} onChange={e => setMaxMoveInDate(e.target.value)} />
            </div>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-1">
              <Label>Latitude</Label>
              <Input type="number" step="any" placeholder="e.g. 40.7128" value={lat} onChange={e => setLat(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Longitude</Label>
              <Input type="number" step="any" placeholder="e.g. -74.0060" value={lng} onChange={e => setLng(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Radius (Miles)</Label>
              <Input type="number" placeholder="e.g. 5" value={radius} onChange={e => setRadius(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground shrink-0">
              <X className="w-4 h-4 mr-2" /> Clear
            </Button>
            <label className="flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeRented} 
                onChange={e => setIncludeRented(e.target.checked)} 
                className="rounded border-input text-primary focus:ring-primary"
              />
              <span>Include Rented</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeExpired} 
                onChange={e => setIncludeExpired(e.target.checked)} 
                className="rounded border-input text-primary focus:ring-primary"
              />
              <span>Include Expired</span>
            </label>
            <div className="flex bg-muted rounded-md border border-input p-1">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="sm" 
                className="px-3"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" /> Grid
              </Button>
              <Button 
                variant={viewMode === 'map' ? 'default' : 'ghost'} 
                size="sm" 
                className="px-3"
                onClick={() => setViewMode('map')}
              >
                <Map className="w-4 h-4 mr-2" /> Map
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading listings...</div>
        ) : rooms.length === 0 && !hasFilters ? (
          <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/30">
            <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to post a room for rent.</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">Create a Listing</Button>
          </div>
        ) : rooms.length === 0 && hasFilters ? (
          <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/30">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No listings match your search</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters to find more rooms.</p>
            <Button onClick={resetFilters} variant="outline">Clear Filters</Button>
          </div>
        ) : viewMode === 'map' ? (
          <div className="w-full h-[600px] bg-muted/30 rounded-xl border relative overflow-hidden flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]">
            <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/World_Map_Blank.svg/2000px-World_Map_Blank.svg.png')] bg-cover bg-center"></div>
            {rooms.map((room, i) => {
              let top = 20 + ((i * 17) % 60);
              let left = 10 + ((i * 23) % 80);
              
              if (room.coordinates?.lat && room.coordinates?.lng) {
                // Basic mercator-ish mapping to percentage for the placeholder map image
                top = 50 - (room.coordinates.lat * (100 / 180));
                left = 50 + (room.coordinates.lng * (100 / 360));
              }

              return (
                <div 
                  key={room._id} 
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform z-10"
                  style={{ top: `${top}%`, left: `${left}%` }}
                  onClick={() => setPreviewRoom(room)}
                >
                  <MapPin className="w-8 h-8 text-primary fill-primary/20 drop-shadow-md" />
                </div>
              );
            })}
            {previewRoom && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 w-80">
                <Card className="shadow-2xl border-primary/20 overflow-hidden cursor-pointer" onClick={() => setSelectedRoom(previewRoom)}>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 z-10 rounded-full bg-black/20 text-white hover:bg-black/40"
                      onClick={(e) => { e.stopPropagation(); setPreviewRoom(null); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    {previewRoom.photos && previewRoom.photos.length > 0 ? (
                      <div className="h-32 w-full bg-muted">
                        <img src={previewRoom.photos[0]} alt={previewRoom.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-32 w-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Camera className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                  </div>

                  <div className="w-full h-32 bg-muted/50 rounded-lg border flex items-center justify-center relative overflow-hidden mb-4 mt-2 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/World_Map_Blank.svg/2000px-World_Map_Blank.svg.png')] bg-cover bg-center"></div>
                    <MapPin className="w-8 h-8 text-primary drop-shadow-md z-10" />
                  </div>

                  <p className="text-muted-foreground whitespace-pre-wrap mt-4">{selectedRoom.description}</p>
                  
                  <div className="flex items-center justify-between mt-8 border-t pt-4">
                    <div className="flex items-center gap-3">
                      {selectedRoom.lister.profilePicture ? (
                        <img src={selectedRoom.lister.profilePicture} alt="Poster" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {selectedRoom.lister.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">Listed by</p>
                        <p className="text-sm">{selectedRoom.lister.name}</p>
                      </div>
                    </div>
                    {user && (
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10" onClick={() => {
                        const reason = prompt("Why are you reporting this listing? (e.g. spam, scam, fake info)");
                        if (reason) {
                          reportListing.mutate({ roomId: selectedRoom._id, reason });
                          alert("Thank you for your report. Our moderation team will review it.");
                        }
                      }}>
                        <Flag className="w-4 h-4 mr-2" /> Report
                      </Button>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-1" onClick={() => setSelectedRoom(previewRoom)}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold line-clamp-1">{previewRoom.title}</h3>
                      <div className="font-bold text-primary">${previewRoom.rent}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {previewRoom.location}
                    </div>
                    {previewRoom.verificationStatus === 'Verified' && (
                      <Badge className="bg-green-500 hover:bg-green-600 border-none shadow-sm text-[10px] py-0 mt-1 px-1 h-4">Verified</Badge>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, index) => {
              const ownerProfile = discoverRoommates.data?.find(p => p.user._id === room.lister._id);
              const isExpired = new Date(room.moveInDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
              
              return (
              <ScrollReveal key={room._id} delay={0.1 * (index + 1)}>
                <Card className={`hover-scale cursor-pointer h-full flex flex-col relative ${room.status === 'Rented' || isExpired ? 'opacity-60 grayscale-[0.5]' : ''}`} onClick={() => setSelectedRoom(room)}>
                  {ownerProfile && ownerProfile.compatibilityScore && (
                    <div className="absolute top-0 left-0 bg-primary text-primary-foreground px-3 py-1 rounded-br-lg font-semibold text-sm shadow-sm flex items-center gap-1 z-30">
                      <Sparkles className="w-3 h-3" />
                      {Math.round(ownerProfile.compatibilityScore)}% Match
                    </div>
                  )}
                  {room.status === 'Rented' ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-xl pointer-events-none">
                      <Badge variant="secondary" className="px-3 py-1 text-sm border-2">Rented</Badge>
                    </div>
                  ) : isExpired ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-xl pointer-events-none">
                      <Badge variant="destructive" className="px-3 py-1 text-sm border-2">Expired</Badge>
                    </div>
                  ) : null}
                  <div className="absolute top-3 right-3 z-10 flex gap-2">
                    {room.verificationStatus === 'Verified' && (
                      <Badge className="bg-green-500 hover:bg-green-600 border-none shadow-sm"><CheckCircle className="w-3 h-3 mr-1"/>Verified</Badge>
                    )}
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-background/80 backdrop-blur shadow-sm hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          alert("Please log in to save listings.");
                          return;
                        }
                        const isSaved = getSavedListings.data?.some(s => s._id === room._id);
                        if (isSaved) {
                          unsaveListing.mutate(room._id);
                        } else {
                          saveListing.mutate(room._id);
                        }
                      }}
                    >
                      <Heart className={`w-4 h-4 ${getSavedListings.data?.some(s => s._id === room._id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                    </Button>
                  </div>
                  {room.photos && room.photos.length > 0 ? (
                    <div className="h-48 w-full overflow-hidden rounded-t-xl bg-muted">
                      <img src={room.photos[0]} alt={room.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-muted flex items-center justify-center rounded-t-xl text-muted-foreground">
                      <Camera className="w-8 h-8 opacity-50" />
                    </div>
                  )}
                  <CardHeader className="flex-none pt-4 pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="w-fit">{room.roomType}</Badge>
                      {room.reviewStats && room.reviewStats.count > 0 && (
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {room.reviewStats.avgRating.toFixed(1)} <span className="text-muted-foreground text-xs">({room.reviewStats.count})</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold line-clamp-1">{room.title}</h3>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow">
                    <div className="text-2xl font-bold text-primary">
                      ${room.rent}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                      {room.utilitiesIncluded && <span className="text-xs font-normal text-muted-foreground ml-2">(utils incl.)</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{room.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Available: {new Date(room.moveInDate).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {activeTab === 'saved' && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Saved Listings</h2>
          {getSavedListings.isLoading ? (
            <div className="text-muted-foreground">Loading saved listings...</div>
          ) : getSavedListings.data?.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/30">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No saved listings</h3>
              <p className="text-muted-foreground">Save listings you're interested in to view them later.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getSavedListings.data?.map((room, index) => (
                <ScrollReveal key={room._id} delay={0.1 * (index + 1)}>
                  <Card className="hover-scale cursor-pointer h-full flex flex-col relative" onClick={() => setSelectedRoom(room)}>
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                      {room.verificationStatus === 'Verified' && (
                        <Badge className="bg-green-500 hover:bg-green-600 border-none shadow-sm"><CheckCircle className="w-3 h-3 mr-1"/>Verified</Badge>
                      )}
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur shadow-sm hover:bg-background"
                        onClick={(e) => {
                          e.stopPropagation();
                          unsaveListing.mutate(room._id);
                        }}
                      >
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </Button>
                    </div>
                    {room.photos && room.photos.length > 0 ? (
                      <div className="h-48 w-full overflow-hidden rounded-t-xl bg-muted">
                        <img src={room.photos[0]} alt={room.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-muted flex items-center justify-center rounded-t-xl text-muted-foreground">
                        <Camera className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                    <CardHeader className="flex-none pt-4">
                      <Badge variant="secondary" className="w-fit mb-2">{room.roomType}</Badge>
                      <h3 className="text-xl font-bold line-clamp-1">{room.title}</h3>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-grow">
                      <div className="text-2xl font-bold text-primary">${room.rent}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{room.location}</span>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'mylistings' && (
          <div className="container mx-auto px-4 py-12">
            <RoomRentalAnalytics />
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">My Listings</h2>
              <Button onClick={() => setIsCreateOpen(true)}>Create Listing</Button>
            </div>
          {getMyListings.isLoading ? (
            <div className="text-muted-foreground">Loading my listings...</div>
          ) : getMyListings.data?.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/30">
              <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">You haven't posted any listings</h3>
              <p className="text-muted-foreground">Click the button above to post your first room.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getMyListings.data?.map((room, index) => (
                <ScrollReveal key={room._id} delay={0.1 * (index + 1)}>
                  <Card className="hover-scale cursor-pointer h-full flex flex-col relative" onClick={() => setSelectedRoom(room)}>
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                      {room.verificationStatus === 'Verified' && (
                        <Badge className="bg-green-500 hover:bg-green-600 border-none shadow-sm"><CheckCircle className="w-3 h-3 mr-1"/>Verified</Badge>
                      )}
                    </div>
                    {room.photos && room.photos.length > 0 ? (
                      <div className="h-48 w-full overflow-hidden rounded-t-xl bg-muted">
                        <img src={room.photos[0]} alt={room.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-muted flex items-center justify-center rounded-t-xl text-muted-foreground">
                        <Camera className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                    <CardHeader className="flex-none pt-4">
                      <Badge variant="secondary" className="w-fit mb-2">{room.roomType}</Badge>
                      <h3 className="text-xl font-bold line-clamp-1">{room.title}</h3>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-grow">
                      <div className="text-2xl font-bold text-primary">${room.rent}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Verification Status: <span className="font-bold">{room.verificationStatus}</span></p>
                        {(room.verificationStatus === 'None' || room.verificationStatus === 'Rejected') && (
                          <div className="space-y-2">
                            <Input 
                              type="file" 
                              id={`proof-${room._id}`} 
                              className="text-xs" 
                              accept="image/*,.pdf" 
                              onClick={(e) => e.stopPropagation()} 
                            />
                            <Button size="sm" variant="outline" className="w-full" onClick={async (e) => {
                              e.stopPropagation();
                              const fileInput = document.getElementById(`proof-${room._id}`) as HTMLInputElement;
                              if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                                alert("Please select a proof document first.");
                                return;
                              }
                              
                              try {
                                // Re-use the existing file upload endpoint for photos
                                const uploadData = new FormData();
                                uploadData.append('files', fileInput.files[0]);
                                const uploadRes = await api.post('/uploads/multiple', uploadData, {
                                  headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                const proofUrl = uploadRes.data.files[0].url;
                                
                                requestVerification.mutate({ roomId: room._id, proofUrl });
                              } catch (err) {
                                console.error(err);
                                alert("Failed to upload proof document.");
                              }
                            }}>
                              {requestVerification.isPending ? 'Uploading & Requesting...' : 'Upload Proof & Verify'}
                            </Button>
                          </div>
                        )}
                        {room.verificationStatus === 'Pending' && (
                          <Badge variant="secondary" className="w-full justify-center">Verification Pending</Badge>
                        )}
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button size="sm" variant="outline" className="flex-1" onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(room);
                          }}>
                            {room.status === 'Available' ? 'Mark Rented' : 'Mark Available'}
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(room);
                          }}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteListing(room._id);
                          }}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sent' && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Inquiries I've Sent</h2>
          {getSentInquiries.isLoading ? (
            <div className="text-muted-foreground">Loading inquiries...</div>
          ) : getSentInquiries.data?.length === 0 ? (
            <div className="text-muted-foreground">You haven't sent any inquiries yet.</div>
          ) : (
            <div className="space-y-4">
              {getSentInquiries.data?.map(inq => (
                <Card key={inq._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{inq.room.title}</h3>
                        <p className="text-sm text-muted-foreground">To: {inq.receiver.name}</p>
                      </div>
                      <Badge variant={inq.status === 'Responded' ? 'default' : 'secondary'}>{inq.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Your message:</p>
                      <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{inq.message}</p>
                    </div>
                    {inq.status === 'Responded' && inq.replyMessage && (
                      <div>
                        <p className="text-sm font-medium text-primary mb-1">Owner's reply:</p>
                        <p className="text-sm bg-primary/10 border border-primary/20 p-3 rounded-md whitespace-pre-wrap">{inq.replyMessage}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'roommates' && (
        <div className="container mx-auto px-4 py-12">
          <RoommateFinder />
        </div>
      )}

      {activeTab === 'myprofile' && (
        <div className="container mx-auto px-4 py-12">
          <RoommateProfileForm />
        </div>
      )}

      {activeTab === 'connections' && (
        <div className="container mx-auto px-4 py-8">
          <RoommateConnections />
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="container mx-auto px-4 py-8">
          <SearchAlertsPanel />
        </div>
      )}

      <Dialog open={!!selectedRoom} onOpenChange={(open) => {
        if (!open) {
          setSelectedRoom(null);
          setInquirySuccess(false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedRoom && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap gap-2 mb-2 items-center">
                  <Badge variant="secondary" className="w-fit">{selectedRoom.roomType}</Badge>
                  {selectedRoom.verificationStatus === 'Verified' && (
                    <Badge className="bg-green-500 hover:bg-green-600 border-none shadow-sm w-fit"><CheckCircle className="w-3 h-3 mr-1"/>Verified</Badge>
                  )}
                  {selectedRoom.reviewStats && selectedRoom.reviewStats.count > 0 && (
                    <div className="flex items-center gap-1 text-sm font-medium ml-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {selectedRoom.reviewStats.avgRating.toFixed(1)} <span className="text-muted-foreground text-xs">({selectedRoom.reviewStats.count} reviews)</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <DialogTitle className="text-2xl">{selectedRoom.title}</DialogTitle>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        alert("Please log in to save listings.");
                        return;
                      }
                      const isSaved = getSavedListings.data?.some(s => s._id === selectedRoom._id);
                      if (isSaved) {
                        unsaveListing.mutate(selectedRoom._id);
                      } else {
                        saveListing.mutate(selectedRoom._id);
                      }
                    }}
                  >
                    <Heart className={`w-4 h-4 ${getSavedListings.data?.some(s => s._id === selectedRoom._id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-primary">
                    ${selectedRoom.rent}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  {selectedRoom.utilitiesIncluded && (
                    <p className="text-sm font-medium text-green-600 mt-1 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> Utilities Included
                      {selectedRoom.utilitiesNote && <span className="text-muted-foreground ml-1 font-normal">- {selectedRoom.utilitiesNote}</span>}
                    </p>
                  )}
                  {selectedRoom.deposit > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">Deposit: ${selectedRoom.deposit}</p>
                  )}
                </div>
              </DialogHeader>
              
              {selectedRoom.photos && selectedRoom.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
                  {selectedRoom.photos.map((url, idx) => (
                    <div key={idx} className="flex-none w-64 h-48 overflow-hidden rounded-md bg-muted">
                      <img src={url} alt={`${selectedRoom.title} photo ${idx+1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{selectedRoom.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Move-in Date</p>
                    <p className="text-sm text-muted-foreground">{new Date(selectedRoom.moveInDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="w-full h-32 bg-muted/50 rounded-lg border flex items-center justify-center relative overflow-hidden mt-4 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]">
                <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/World_Map_Blank.svg/2000px-World_Map_Blank.svg.png')] bg-cover bg-center"></div>
                <MapPin className="w-8 h-8 text-primary drop-shadow-md z-10" />
              </div>

              {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.amenities.map((amenity, i) => (
                      <Badge key={i} variant="outline" className="px-3 py-1 bg-muted/50">{amenity}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRoom.houseRules && (
                <div className="mt-6 p-4 bg-muted/20 border rounded-lg">
                  <h4 className="font-semibold mb-3">House Rules</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Smoking</span>
                      <span>{selectedRoom.houseRules.smokingAllowed ? "Allowed" : "No"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Pets</span>
                      <span>{selectedRoom.houseRules.petsAllowed ? "Allowed" : "No"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Gender</span>
                      <span>{selectedRoom.houseRules.genderPreference || "Any"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Min Lease</span>
                      <span>{selectedRoom.minLease ? `${selectedRoom.minLease} months` : "Flexible"}</span>
                    </div>
                    {selectedRoom.houseRules.guestPolicy && (
                      <div className="col-span-2 pt-1 text-muted-foreground">
                        <span className="font-medium text-foreground">Guests:</span> {selectedRoom.houseRules.guestPolicy}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedRoom.description}</p>
              </div>

              {selectedRoom.lister.roommateProfileId && (
                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-semibold text-primary">Compatible Roommate?</h4>
                      <p className="text-sm text-primary/80">This lister is also looking for a compatible roommate.</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    setActiveTab('roommates');
                    setSelectedRoom(null);
                  }}>
                    View Profiles
                  </Button>
                </div>
              )}

              <div className="mt-6 p-4 bg-muted/30 border rounded-lg">
                <h4 className="font-semibold mb-2">Contact Owner</h4>
                {user ? (
                  inquirySuccess ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Your inquiry has been sent!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleInquirySubmit} className="space-y-3">
                      <div>
                        <Label>Message</Label>
                        <Textarea 
                          required 
                          placeholder={`Hi ${selectedRoom.lister.name.split(' ')[0]}, I'm interested in this room...`}
                          value={inquiryMessage}
                          onChange={e => setInquiryMessage(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Preferred Move-in Date (Optional)</Label>
                        <Input 
                          type="date" 
                          value={inquiryDate}
                          onChange={e => setInquiryDate(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button type="submit" disabled={sendInquiry.isPending} className="w-full">
                          <Mail className="w-4 h-4 mr-2" />
                          {sendInquiry.isPending ? 'Sending...' : 'Send Inquiry'}
                        </Button>
                        <div className="text-center text-xs text-muted-foreground my-2">OR</div>
                        <Button type="button" variant="secondary" className="w-full" onClick={() => setIsBookingOpen(true)}>
                          Request to Book
                        </Button>
                      </div>
                    </form>
                  )
                ) : (
                  <div className="text-center p-4">
                    <p className="text-sm text-muted-foreground mb-3">Please sign in to contact the owner.</p>
                    <Button variant="outline" onClick={() => window.location.href = '/auth'}>Sign In</Button>
                  </div>
                )}
                
                {user && (
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10" onClick={() => {
                      const reason = prompt("Why are you reporting this listing? (e.g. spam, scam, fake info)");
                      if (reason) {
                        reportListing.mutate({ roomId: selectedRoom._id, reason });
                        alert("Thank you for your report. Our moderation team will review it.");
                      }
                    }}>
                      <Flag className="w-4 h-4 mr-2" /> Report Listing
                    </Button>
                  </div>
                )}
              </div>

              <RoomRentalReviews 
                roomId={selectedRoom._id} 
                ownerId={selectedRoom.lister._id} 
                canReview={getSentInquiries.data?.some(inq => (inq.room._id === selectedRoom._id || inq.room === selectedRoom._id) && inq.status === 'Responded') || false}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Booking Flow Modal */}
      {selectedRoom && (
        <RoomBookingFlow 
          roomId={selectedRoom._id}
          roomTitle={selectedRoom.title}
          monthlyRent={selectedRoom.rent}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
    </div>
  );
};

export default RoomRentals;
