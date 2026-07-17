import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface NewsArticle {
  _id: string;
  title: string;
  summary: string;
  contentSnippet?: string;
  sourceLink: string;
  sourceName: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  publishedAt: string;
  status: 'live' | 'pending' | 'rejected' | 'archived';
  submissionType: 'automatic' | 'user_submitted';
  viewCount: number;
  saveCount: number;
  shareCount: number;
  submittedBy?: {
    _id: string;
    username: string;
    full_name: string;
  };
  isFeatured: boolean;
  createdAt: string;
  isNew?: boolean; 
}

// MAIN FEED HOOK
export function useNews(category: string = 'All', tags: string[] = [], forYou: boolean = false, searchQuery: string = '') {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Real-time updates
  useEffect(() => {
    const socket: Socket = io(API_URL);
    
    socket.on('new_article', (newArticle: NewsArticle) => {
      // Don't eagerly prepend in forYou mode (since we don't sync client prefs here perfectly)
      if (forYou) return;
      
      // Simple filter check
      if (category === 'All' || newArticle.category === category) {
        if (tags.length > 0 && !tags.some(t => newArticle.tags?.includes(t))) return;
        
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!newArticle.title.toLowerCase().includes(q) && !newArticle.summary.toLowerCase().includes(q)) {
            return; 
          }
        }
        
        setArticles(prev => {
          if (prev.some(a => a._id === newArticle._id)) return prev;
          return [{...newArticle, isNew: true}, ...prev];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [category, tags, forYou, searchQuery]);

  const fetchNews = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '15'
      });
      if (category !== 'All') queryParams.append('category', category);
      if (tags.length > 0) queryParams.append('tags', tags.join(','));
      if (searchQuery) queryParams.append('search', searchQuery);
      if (forYou) queryParams.append('forYou', 'true');

      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/news?${queryParams.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        
        if (append) {
          setArticles(prev => [...prev, ...data.articles]);
        } else {
          setArticles(data.articles);
        }
        
        setHasMore(data.currentPage < data.totalPages);
        setPage(data.currentPage);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, tags, forYou, searchQuery]);

  useEffect(() => {
    setPage(1);
    fetchNews(1, false);
  }, [fetchNews]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNews(page + 1, true);
    }
  };

  return { articles, loading, loadingMore, hasMore, loadMore, refetch: () => fetchNews(1, false) };
}

// TRENDING NEWS HOOK
export function useTrendingNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_URL}/api/news/trending`);
        if (res.ok) setArticles(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return { articles, loading };
}

// RELATED NEWS HOOK
export function useRelatedNews(articleId: string | null) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!articleId) return;
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/news/${articleId}/related`);
        if (res.ok) setArticles(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [articleId]);

  return { articles, loading };
}

// SAVED ARTICLE IDs HOOK
export function useSavedArticleIds(userId?: string) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const fetchIds = useCallback(async () => {
    if (!userId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/news/saved/ids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: string[] = await res.json();
        setSavedIds(new Set(data));
      }
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    fetchIds();
  }, [fetchIds]);

  const toggleLocalSavedId = (id: string, isSaved: boolean) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isSaved) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return { savedIds, toggleLocalSavedId, refetch: fetchIds };
}

// MUTATIONS
export async function trackArticleView(id: string) {
  const token = localStorage.getItem('token');
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  await fetch(`${API_URL}/api/news/${id}/view`, { method: 'POST', headers });
}

export async function toggleBookmark(id: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/news/${id}/bookmark`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to toggle bookmark');
  return res.json();
}

export async function updateNewsPreferences(followedCategories: string[], followedTags: string[]) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/news/preferences`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ followedCategories, followedTags })
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  return res.json();
}


// ADMIN/SUBMIT HOOKS
export function useAdminNews(status: string = 'all', page: number = 1) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminNews = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/news/admin?status=${status}&page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles);
      }
    } catch (err) {
      console.error('Error fetching admin news:', err);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchAdminNews();
  }, [fetchAdminNews]);

  return { articles, loading, refetch: fetchAdminNews };
}

export async function submitNewsArticle(data: Partial<NewsArticle>) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/news`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to submit article');
  }

  return await res.json();
}

export async function updateNewsStatus(id: string, status: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/news/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function toggleFeatured(id: string, isFeatured: boolean) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/news/${id}/feature`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ isFeatured })
  });
  if (!res.ok) throw new Error('Failed to update feature status');
  return res.json();
}

export async function deleteNews(id: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/news/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete article');
  return res.json();
}

// REPORTING & LOGGING HOOKS
export async function reportArticle(id: string, reason: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/news/${id}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify({ reason })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to report article');
  }

  return await res.json();
}

export function useNewsReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/news/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, refetch: fetchReports };
}

export async function updateReportStatus(id: string, status: string, adminNote?: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/news/admin/reports/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify({ status, adminNote })
  });

  if (!res.ok) throw new Error('Failed to update report status');
  return await res.json();
}

export function useIngestionLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/news/admin/ingestion-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error('Error fetching ingestion logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}

