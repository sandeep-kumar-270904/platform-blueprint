import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SyncStatus } from "./useQuizHub"; // Re-use type from quiz hub

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Deck {
  id: string;
  _id?: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  is_public: boolean;
  card_count: number;
  study_count: number;
  created_at: string;
  createdAt?: string;
}

export interface Flashcard {
  id: string;
  _id?: string;
  deck_id: string;
  front: string;
  back: string;
  hint: string | null;
  position: number;
}

export const useDecks = (): { decks: Deck[]; loading: boolean; status: SyncStatus; refetch: () => Promise<void> } => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SyncStatus>("live");

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/flashcards/decks`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((d: any) => ({ ...d, id: d._id, created_at: d.createdAt }));
        setDecks(data as Deck[]);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll();

    const socket = io(API_URL);
    socket.on('flashcard-decks', () => fetchAll());

    return () => {
      socket.disconnect();
    };
  }, [fetchAll]);

  return { decks, loading, status, refetch: fetchAll };
};

export const fetchCards = async (deckId: string): Promise<Flashcard[]> => {
  try {
    const res = await fetch(`${API_URL}/api/flashcards/decks/${deckId}/cards`);
    if (res.ok) {
      let data = await res.json();
      return data.map((c: any) => ({ ...c, id: c._id }));
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const createDeck = async (input: {
  title: string;
  description?: string;
  category: string;
  cards: { front: string; back: string; hint?: string }[];
}) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("Not authenticated");
  
  const res = await fetch(`${API_URL}/api/flashcards/decks`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create deck');
  }
  
  const data = await res.json();
  return { ...data, id: data._id };
};

export const reviewCard = async (cardId: string, ease: number) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("Not authenticated");
  
  // Simple SM-2-ish: ease 1-5, days = ease^2
  const days = Math.max(1, ease * ease);
  const next = new Date(Date.now() + days * 86400000).toISOString();
  
  const res = await fetch(`${API_URL}/api/flashcards/cards/${cardId}/review`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ease, next_review_at: next })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to review card');
  }
};
