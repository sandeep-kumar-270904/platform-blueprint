import { useState, useEffect, createContext, useContext } from "react";

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  university?: string;
  degree?: string;
  graduation_year?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (credentials: any) => Promise<any>;
  signUp: (userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/auth` : "http://localhost:5000/api/auth";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/me`, { 
        headers,
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setUser({
          ...data.user,
          id: data.user._id || data.user.id
        });
      }
    } catch (err) {
      console.error("Auth check failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signIn = async (credentials: any) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error(data.message || 'Too many attempts. Try again later.');
        throw new Error(data.message || 'Login failed');
      }
      if (data.token) localStorage.setItem('token', data.token);
      setUser(data.user);
      return data; // Return full data to handle newDeviceDetails and linkedProvider in UI
    } catch (error: any) {
      throw error;
    }
  };

  const signUp = async (userData: any) => {
    try {
      // userData includes consent, captchaToken, etc.
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      if (data.token) localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
    } catch(e) {}
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};