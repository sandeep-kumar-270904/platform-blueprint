import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Team {
  _id: string;
  title: string;
  description: string;
  creator: {
    _id: string;
    username?: string;
    full_name?: string;
    avatar?: string;
  };
  teamSize: {
    current: number;
    max: number;
  };
  requiredRoles: string[];
  requiredSkills: string[];
  category: string;
  status: string;
  deadline?: string;
  tags: string[];
  createdAt: string;
  pendingApplications?: number; // Only present in detail view
  matchScore?: number;
  matchDetails?: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
  };
}

export interface Application {
  _id: string;
  team: string;
  applicant: {
    _id: string;
    username?: string;
    full_name?: string;
    avatar?: string;
    email?: string;
  };
  message: string;
  skillsOffered: string[];
  status: string;
  appliedAt: string;
}

export const useTeams = (params: { search?: string, category?: string, status?: string, role?: string, skill?: string, page?: number, limit?: number }) => {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: async () => {
      const { data } = await api.get('/teams', { params });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 mins
  });
};

export const useTeam = (id: string) => {
  return useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/teams/${id}`);
      return data.data as Team;
    },
    enabled: !!id,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamData: Partial<Team>) => {
      const { data } = await api.post('/teams', teamData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useApplyToTeam = () => {
  return useMutation({
    mutationFn: async ({ teamId, message, skillsOffered }: { teamId: string, message: string, skillsOffered: string[] }) => {
      const { data } = await api.post(`/teams/${teamId}/apply`, { message, skillsOffered });
      return data.data;
    }
  });
};

export const useTeamApplicants = (teamId: string) => {
  return useQuery({
    queryKey: ['team-applicants', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data } = await api.get(`/teams/${teamId}/applicants`);
      return data.data as Application[];
    },
    enabled: !!teamId,
  });
};

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, applicationId, status }: { teamId: string, applicationId: string, status: string }) => {
      const { data } = await api.put(`/teams/${teamId}/applicants/${applicationId}`, { status });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-applicants', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useCompleteTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const { data } = await api.put(`/teams/${teamId}/complete`);
      return data.data;
    },
    onSuccess: (_, teamId) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useDisbandTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, reason }: { teamId: string, reason: string }) => {
      const { data } = await api.put(`/teams/${teamId}/disband`, { disbandReason: reason });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string, userId: string }) => {
      const { data } = await api.put(`/teams/${teamId}/members/${userId}/remove`);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-applicants', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
    },
  });
};

export const useInviteMember = () => {
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string, userId: string }) => {
      const { data } = await api.post(`/teams/${teamId}/invites`, { invitedUserId: userId });
      return data.data;
    },
  });
};

export const useMyTeams = () => {
  return useQuery({
    queryKey: ['my-teams'],
    queryFn: async () => {
      const { data } = await api.get('/teams/me');
      return data.data;
    }
  });
};

export const useMyApplications = () => {
  return useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const { data } = await api.get('/teams/applications/me');
      return data.data;
    }
  });
};

export const useMyInvites = () => {
  return useQuery({
    queryKey: ['my-invites'],
    queryFn: async () => {
      const { data } = await api.get('/invites/me');
      return data.data;
    }
  });
};

export const useRespondToInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteId, status }: { inviteId: string, status: string }) => {
      const { data } = await api.put(`/invites/${inviteId}/respond`, { status });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invites'] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
    },
  });
};

export const useCreateReview = () => {
  return useMutation({
    mutationFn: async ({ teamId, revieweeId, rating, comment }: { teamId: string, revieweeId: string, rating: number, comment: string }) => {
      const { data } = await api.post(`/teams/${teamId}/reviews`, { revieweeId, rating, comment });
      return data.data;
    }
  });
};

export const useRecommendedTeams = () => {
  return useQuery({
    queryKey: ['teams-recommended'],
    queryFn: async () => {
      const { data } = await api.get('/teams/recommended');
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTeamMatchScore = (teamId: string) => {
  return useQuery({
    queryKey: ['team-match', teamId],
    queryFn: async () => {
      const { data } = await api.get(`/teams/${teamId}/match-score`);
      return data.data;
    },
    enabled: !!teamId,
  });
};

export const useReportTeam = () => {
  return useMutation({
    mutationFn: async ({ teamId, reason, details }: { teamId: string, reason: string, details?: string }) => {
      const { data } = await api.post(`/teams/${teamId}/report`, { reason, details });
      return data;
    }
  });
};

export const useTeamMatchExplanation = (teamId: string) => {
  return useQuery({
    queryKey: ['team-match-explanation', teamId],
    queryFn: async () => {
      const { data } = await api.get(`/teams/${teamId}/match-explanation`);
      return data;
    },
    enabled: !!teamId,
  });
};

export const useTeamMessages = (teamId: string) => {
  return useQuery({
    queryKey: ['team-messages', teamId],
    queryFn: async () => {
      const { data } = await api.get(`/teams/${teamId}/messages`);
      return data;
    },
    enabled: !!teamId,
  });
};

export const useStartCall = () => {
  return useMutation({
    mutationFn: async ({ teamId, external_video_url }: { teamId: string, external_video_url: string }) => {
      const { data } = await api.post(`/teams/${teamId}/calls/start`, { external_video_url });
      return data;
    }
  });
};

export const useJoinCall = () => {
  return useMutation({
    mutationFn: async ({ teamId, sessionId }: { teamId: string, sessionId: string }) => {
      const { data } = await api.post(`/teams/${teamId}/calls/${sessionId}/join`);
      return data;
    }
  });
};

export const useLeaveCall = () => {
  return useMutation({
    mutationFn: async ({ teamId, sessionId }: { teamId: string, sessionId: string }) => {
      const { data } = await api.post(`/teams/${teamId}/calls/${sessionId}/leave`);
      return data;
    }
  });
};

export const useUploadTeamMessageFile = () => {
  return useMutation({
    mutationFn: async ({ teamId, file }: { teamId: string, file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/teams/${teamId}/messages/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    }
  });
};

export const useTeamLeaderboard = (institution?: string) => {
  return useQuery({
    queryKey: ['team-leaderboard', institution],
    queryFn: async () => {
      const { data } = await api.get('/teams/leaderboard', { params: { institution } });
      return data.data;
    }
  });
};

export const useUserLeaderboard = (institution?: string) => {
  return useQuery({
    queryKey: ['user-leaderboard', institution],
    queryFn: async () => {
      const { data } = await api.get('/teams/users-leaderboard', { params: { institution } });
      return data.data;
    }
  });
};

export const useTeamAnalytics = (teamId: string) => {
  return useQuery({
    queryKey: ['team-analytics', teamId],
    queryFn: async () => {
      const { data } = await api.get(`/teams/${teamId}/analytics`);
      return data.data;
    },
    enabled: !!teamId,
  });
};
