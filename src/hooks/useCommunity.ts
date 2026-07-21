
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface CommunityPost {
  _id?: string;
  id?: string;
  user_id: string;
  content: string;
  image_url: string | null;
  image_urls?: string[];
  tags: string[];
  status?: 'active' | 'pending_review' | 'hidden' | 'deleted';
  auto_flag_reason?: string;
  link_preview?: {
    title: string;
    description: string;
    image: string;
    siteName: string;
    url: string;
  };
  like_count: number;
  comment_count: number;
  liked_by?: string[];
  reactions?: {
    like: number;
    celebrate: number;
    insightful: number;
    support: number;
  };
  user_reaction?: string | null;
  is_saved?: boolean;
  poll?: {
    options: {
      text: string;
      votes: number;
    }[];
  };
  user_voted_option_index?: number | null;
  is_pinned?: boolean;
  view_count?: number;
  created_at?: string;
  createdAt?: string;
  author?: { _id?: string; username: string | null; full_name: string | null; avatar_url: string | null; adminRole?: string | null; communityTitle?: string | null; institutionVerified?: boolean; role?: string; } | null;
}

export interface CommunityComment {
  _id?: string;
  id?: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at?: string;
  createdAt?: string;
  author?: { _id?: string; username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export function useCommunityFeed(sort = "newest", tag = "", searchQuery = "", currentUserId?: string) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState("live");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [queuedPosts, setQueuedPosts] = useState<CommunityPost[]>([]);

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
        sort
      });
      if (tag && tag !== 'saved') params.append("tag", tag);
      if (searchQuery) params.append("search", searchQuery);

      let url = `${API_URL}/api/community/posts?${params.toString()}`;
      if (tag === 'saved') {
        url = `${API_URL}/api/community/saved-posts?${params.toString()}`;
      }

      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        let data = await res.json();
        data = data.map((p: any) => ({ ...p, id: p._id, created_at: p.createdAt }));
        
        if (data.length < 20) setHasMore(false);
        else setHasMore(true);

        if (append) {
          setPosts(prev => {
            const newPosts = data.filter((d: any) => !prev.some(p => p.id === d.id));
            return [...prev, ...newPosts];
          });
        } else {
          setPosts(data);
          setQueuedPosts([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, tag]);

  // Initial fetch when sort/tag/search changes
  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [sort, tag, searchQuery, fetchPosts]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  const flushQueue = () => {
    setPosts(prev => [...queuedPosts, ...prev]);
    setQueuedPosts([]);
  };

  useEffect(() => {
    const socket = io(API_URL);
    
    socket.on("connect", () => setStatus("live"));
    socket.on("disconnect", () => setStatus("offline"));

    socket.on("community_post_created", (newPost) => {
      // If we are sorted by newest and not filtered by tag (or post has tag), we can show/queue it
      const matchesTag = !tag || (newPost.tags && newPost.tags.includes(tag));
      const matchesSearch = !searchQuery || newPost.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (sort === "newest" && matchesTag && matchesSearch) {
        const postToAdd = { ...newPost, id: newPost._id, created_at: newPost.createdAt };
        if (currentUserId && newPost.user_id === currentUserId) {
          setPosts(prev => [postToAdd, ...prev]);
        } else {
          setQueuedPosts(prev => [postToAdd, ...prev]);
        }
      }
    });

    socket.on("community_post_updated", ({ postId, content, tags, edited_at }: any) => {
      setPosts(prev => prev.map(p => (p.id === postId || p._id === postId) ? { ...p, content, tags, edited_at, isEditedLocal: true } : p));
    });

    socket.on("community_post_liked", ({ postId, like_count }: any) => {
      setPosts(prev => prev.map(p => (p.id === postId || p._id === postId) ? { ...p, like_count } : p));
    });

    socket.on("community_post_commented", ({ postId, comment_count }: any) => {
      setPosts(prev => prev.map(p => (p.id === postId || p._id === postId) ? { ...p, comment_count } : p));
    });

    socket.on("community_post_deleted", (postId) => {
      setPosts(prev => prev.filter(p => p.id !== postId && p._id !== postId));
      setQueuedPosts(prev => prev.filter(p => p.id !== postId && p._id !== postId));
    });

    return () => {
      socket.disconnect();
    };
  }, [sort, tag, searchQuery, currentUserId]);

  return { posts, setPosts, loading, loadingMore, status, hasMore, loadMore, refetch: () => fetchPosts(1, false), queuedPosts, flushQueue };
}

export async function createPost(input: { content: string; tags?: string[]; image_url?: string | null; image_urls?: string[] }) {
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please sign in"); return null; }
  if (!input.content.trim()) { toast.error("Post cannot be empty"); return null; }
    try {
      const res = await fetch(`${API_URL}/api/community/posts`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to post");
      }
      toast.success("Posted successfully");
      return await res.json();
    } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function editPost(postId: string, content: string) {
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please sign in"); return null; }
  if (!content.trim()) { toast.error("Post cannot be empty"); return null; }
  
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error("Failed to edit post");
    toast.success("Post updated");
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function deletePost(postId: string) {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to delete post");
    toast.success("Post deleted");
    return true;
  } catch (err: any) {
    toast.error(err.message);
    return false;
  }
}

export async function pinPost(postId: string) {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/pin`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to toggle pin");
    const data = await res.json();
    toast.success(data.message);
    return data.is_pinned;
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function viewPost(postId: string) {
  const token = localStorage.getItem("token");
  // We can track views even if unauthenticated if backend allows, but let's send token if present
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/view`, {
      method: "POST",
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function reportPost(postId: string, reason?: string) {
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please sign in"); return false; }
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/report`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: reason ? JSON.stringify({ reason }) : undefined
    });
    if (!res.ok) throw new Error("Failed to report post");
    toast.success("Post reported for review");
    return true;
  } catch (err: any) {
    toast.error(err.message);
    return false;
  }
}

export async function togglePostLike(postId: string, type: string = 'like') {
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please sign in"); return; }
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/like`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    });
    return await res.json();
  } catch (err: any) {
    console.error("Like toggle failed", err);
  }
}

export async function toggleSavePost(postId: string) {
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please sign in"); return; }
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/save`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    return await res.json();
  } catch (err: any) {
    console.error("Save toggle failed", err);
  }
}

export async function votePoll(postId: string, option_index: number) {
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please sign in"); return; }
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/vote`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ option_index })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to vote');
    return data;
  } catch (err: any) {
    toast.error(err.message);
    throw err;
  }
}

export async function toggleFollowUser(userId: string) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/community/users/${userId}/follow`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function checkFollowStatus(userId: string) {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const res = await fetch(`${API_URL}/api/community/users/${userId}/follow-status`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.following;
  } catch {
    return false;
  }
}

export async function updateUserInterests(tags: string[]) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/community/users/interests`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tags })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getUserInterests() {
  const token = localStorage.getItem("token");
  if (!token) return [];
  try {
    const res = await fetch(`${API_URL}/api/community/users/interests`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.tags || [];
  } catch {
    return [];
  }
}

export async function getSimilarPosts(postId: string) {
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/similar`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getPostReactions(postId: string) {
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/reactions`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch reactions", err);
  }
  return [];
}

export function usePostComments(postId: string | null, page = 1) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!postId) { setComments([]); setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/community/posts/${postId}/comments?page=${page}&limit=10`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((c: any) => ({ ...c, id: c._id, created_at: c.createdAt }));
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    fetchComments();

    const socket = io(API_URL);
    socket.emit("join_community_post", postId);
    
    socket.on("community_comment_created", (newComment) => {
      fetchComments();
    });

    return () => {
      socket.emit("leave_community_post", postId);
      socket.disconnect();
    };
  }, [postId, fetchComments]);

    return { comments, loading, setComments, refetch: fetchComments };
}

export async function postComment(postId: string, text: string, parentId?: string) {
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please sign in"); return null; }
  if (!text.trim()) { toast.error("Comment cannot be empty"); return null; }
  
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), parent_id: parentId })
    });
    if (!res.ok) throw new Error("Failed to post comment");
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function toggleMuteUser(userId: string) {
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please sign in"); return null; }
  
  try {
    const res = await fetch(`${API_URL}/api/users/${userId}/mute`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Failed to mute user");
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function toggleBlockUser(userId: string) {
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please sign in"); return null; }
  
  try {
    const res = await fetch(`${API_URL}/api/users/${userId}/block`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Failed to block user");
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function resolveQuestion(postId: string) {
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please sign in"); return null; }
  
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/resolve`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Failed to resolve question");
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

