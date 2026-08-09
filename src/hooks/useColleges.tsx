import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

import { useSearchParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useColleges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "All";
  const feeRange = searchParams.get("feeRange") || "";
  const ratingMin = searchParams.get("ratingMin") || "";
  const location = searchParams.get("location") || "All";
  const course = searchParams.get("course") || "All";
  const sort = searchParams.get("sort") || "rating";

  const updateParam = (key: string, value: string, defaultValue: string = "") => {
    setSearchParams(prev => {
      if (value === defaultValue || !value) prev.delete(key);
      else prev.set(key, value);
      return prev;
    }, { replace: true });
  };

  const setSearch = (v: string) => updateParam("search", v);
  const setType = (v: string) => updateParam("type", v, "All");
  const setFeeRange = (v: string) => updateParam("feeRange", v);
  const setRatingMin = (v: string) => updateParam("ratingMin", v);
  const setLocation = (v: string) => updateParam("location", v, "All");
  const setCourse = (v: string) => updateParam("course", v, "All");
  const setSort = (v: string) => updateParam("sort", v, "rating");

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

  const getCollegeFees = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/colleges/${id}/fees`);
      if (!res.ok) throw new Error("Failed to fetch fees");
      return res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const getFeeReminder = async (id: string) => {
    if (!user) return "";
    const token = localStorage.getItem("token");
    if (!token) return "";
    try {
      const res = await fetch(`${API_URL}/api/colleges/${id}/fee-reminder`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch fee reminder");
      const data = await res.json();
      return data.note;
    } catch (e) {
      console.warn("Could not fetch fee reminder", e);
      return "";
    }
  };

  const saveFeeReminder = async (id: string, note: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/colleges/${id}/fee-reminder`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ note })
      });
      if (!res.ok) throw new Error("Failed to save fee reminder");
      return res.json();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save fee reminder");
      throw e;
    }
  };

  return {
    filters: { search, type, feeRange, ratingMin, location, course, sort },
    setSearch, setType, setFeeRange, setRatingMin, setLocation, setCourse, setSort,
    getColleges,
    getCollege,
    getCompareColleges,
    getReviews,
    getRatingBreakdown,
    getSavedColleges,
    toggleSaveCollege,
    getCollegeFees,
    getFeeReminder,
    saveFeeReminder
  };
};
