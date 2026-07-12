import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useColleges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [feeRange, setFeeRange] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [location, setLocation] = useState("All");
  const [course, setCourse] = useState("All");
  const [sort, setSort] = useState("rating");

  // Fetch all colleges with filters
  const getColleges = async (page = 1, limit = 12) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append("search", search);
    if (type !== "All") params.append("type", type);
    if (feeRange) params.append("feeRange", feeRange);
    if (ratingMin) params.append("ratingMin", ratingMin);
    if (location !== "All") params.append("location", location);
    if (course !== "All") params.append("course", course);
    if (sort) params.append("sort", sort);

    const res = await fetch(`${API_URL}/api/colleges?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch colleges");
    return res.json();
  };

  const getCollege = async (id: string) => {
    const res = await fetch(`${API_URL}/api/colleges/${id}`);
    if (!res.ok) throw new Error("Failed to fetch college");
    return res.json();
  };

  const getCompareColleges = async (ids: string[]) => {
    if (!ids.length) return [];
    const res = await fetch(`${API_URL}/api/colleges/compare?ids=${ids.join(",")}`);
    if (!res.ok) throw new Error("Failed to fetch comparison data");
    return res.json();
  };

  const getReviews = async (id: string, page = 1, sort = "helpful", verifiedFirst = false) => {
    const params = new URLSearchParams({ page: String(page), sort, verifiedFirst: String(verifiedFirst) });
    const res = await fetch(`${API_URL}/api/colleges/${id}/reviews?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch reviews");
    return res.json();
  };

  const getRatingBreakdown = async (id: string) => {
    const res = await fetch(`${API_URL}/api/colleges/${id}/rating-breakdown`);
    if (!res.ok) throw new Error("Failed to fetch rating breakdown");
    return res.json();
  };

  const getSavedColleges = async () => {
    if (!user) return [];
    const token = localStorage.getItem("token");
    if (!token) return [];
    try {
      const res = await fetch(`${API_URL}/api/colleges/saved/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) return []; // Gracefully handle unauthorized
      if (!res.ok) throw new Error("Failed to fetch saved colleges");
      return res.json();
    } catch (e) {
      console.warn("Could not fetch saved colleges", e);
      return [];
    }
  };

  // Mutations
  const toggleSaveCollege = useMutation({
    mutationFn: async ({ id, isSaved }: { id: string; isSaved: boolean }) => {
      const token = localStorage.getItem("token");
      const method = isSaved ? "DELETE" : "POST";
      const res = await fetch(`${API_URL}/api/colleges/${id}/save`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to save/unsave college");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedColleges"] });
    },
    onError: () => {
      toast.error("Failed to update saved colleges");
    }
  });

  return {
    filters: { search, type, feeRange, ratingMin, location, course, sort },
    setSearch, setType, setFeeRange, setRatingMin, setLocation, setCourse, setSort,
    getColleges,
    getCollege,
    getCompareColleges,
    getReviews,
    getRatingBreakdown,
    getSavedColleges,
    toggleSaveCollege
  };
};
