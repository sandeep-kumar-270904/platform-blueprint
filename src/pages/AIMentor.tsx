import React, { useEffect, useState } from 'react';
import { OnboardingForm } from '@/components/mentor/OnboardingForm';
import { MentorChat } from '@/components/mentor/MentorChat';
import { useMentor, StudentProfile, ChatMessage } from '@/hooks/useMentor';
import { Loader2 } from 'lucide-react';

const AIMentor = () => {
  const { getHistory, saveProfile, loading: profileLoading } = useMentor();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getHistory();
      setProfile(data.profile);
      setMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (formData: StudentProfile) => {
    try {
      const newProfile = await saveProfile(formData);
      setProfile(newProfile);
      setIsEditing(false);
    } catch (e) {
      // handled by hook
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Phase A: Onboarding or Editing
  if (!profile || isEditing) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to AI Mentor</h1>
          <p className="text-muted-foreground">Your personalized, data-driven college and career advisor.</p>
        </div>
        <OnboardingForm 
          initialData={profile} 
          onSave={handleSaveProfile} 
          loading={profileLoading} 
        />
      </div>
    );
  }

  // Phase B: Chat
  return (
    <div className="container py-6 max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <MentorChat 
        initialHistory={messages} 
        onEditProfile={() => setIsEditing(true)} 
      />
    </div>
  );
};

export default AIMentor;
