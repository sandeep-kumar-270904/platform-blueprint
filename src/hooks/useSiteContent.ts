import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface SiteNavigationGroup {
  title: string;
  items: { title: string; href: string; desc: string }[];
}

export interface SiteSettings {
  maintenanceMode: boolean;
  announcement: {
    message: string;
    isVisible: boolean;
    type: 'info' | 'warning' | 'error' | 'success';
  };
}

export interface SiteNavigation {
  versionName: string;
  isActive: boolean;
  groups: SiteNavigationGroup[];
}

export interface SiteContentResponse {
  settings: SiteSettings;
  navigation: SiteNavigation;
  pageContent: any[];
}

export const useSiteContent = (pageSlug?: string) => {
  return useQuery<SiteContentResponse>({
    queryKey: ['siteContent', pageSlug],
    queryFn: async () => {
      const url = pageSlug ? `/site-content?pageSlug=${pageSlug}` : '/site-content';
      const { data } = await api.get(url);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSpecificPageContent = (pageSlug: string) => {
  return useQuery({
    queryKey: ['pageContent', pageSlug],
    queryFn: async () => {
      const { data } = await api.get(`/site-content/page/${pageSlug}`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
