import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface FeedPost {
  _id: string;
  content: string;
  user_id: {
    _id: string;
    full_name: string;
    username: string;
    avatar?: string;
    profile_picture?: string;
    current_role?: string;
    headline?: string;
  };
  collegeId?: string;
  parentPostId?: string;
  category?: string;
  isAnonymous?: boolean;
  pollOptions?: { text: string; voteCount: number }[];
  pollVoters?: { userId: string; optionIndex: number }[];
  like_count: number;
  comment_count: number;
  createdAt: string;
  image_urls?: string[];
}

export const useCommunityFeed = () => {
  const [loading, setLoading] = useState(false);

  const getHeaders = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchGeneralFeed = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/community-feed/general?page=${page}&limit=${limit}`);
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch general feed');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCollegeFeed = useCallback(async (collegeId: string, page = 1, limit = 20) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/community-feed/college/${collegeId}?page=${page}&limit=${limit}`);
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch college feed');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = async (
    content: string, 
    collegeId?: string, 
    parentPostId?: string, 
    image_urls?: string[],
    category?: string,
    pollOptions?: { text: string }[],
    isAnonymous?: boolean
  ) => {
    try {
      const res = await axios.post(`${API_URL}/api/community-feed`, {
        content,
        collegeId,
        parentPostId,
        image_urls,
        category,
        pollOptions,
        isAnonymous
      }, getHeaders());
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create post');
      return null;
    }
  };

  const fetchThread = useCallback(async (postId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/community-feed/post/${postId}/thread`);
      return res.data; // { post, replies }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch thread');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const likePost = async (postId: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/community-feed/post/${postId}/like`, {}, getHeaders());
      return res.data.like_count;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to like post');
      return null;
    }
  };

  const toggleFollowCollege = async (collegeId: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/community-feed/follow/college/${collegeId}`, {}, getHeaders());
      return res.data.following; // boolean
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to follow college');
      return null;
    }
  };

  const toggleFollowUser = async (userId: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/community-feed/follow/user/${userId}`, {}, getHeaders());
      return res.data.following; // boolean
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to follow user');
      return null;
    }
  };

  const votePoll = async (postId: string, optionIndex: number) => {
    try {
      const res = await axios.post(`${API_URL}/api/community-feed/post/${postId}/vote`, { optionIndex }, getHeaders());
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to vote');
      return null;
    }
  };

  return {
    loading,
    fetchGeneralFeed,
    fetchCollegeFeed,
    createPost,
    fetchThread,
    likePost,
    toggleFollowCollege,
    toggleFollowUser,
    votePoll
  };
};
