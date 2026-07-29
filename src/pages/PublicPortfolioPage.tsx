import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AchievementTimeline } from '@/components/portfolio/AchievementTimeline';

export const PublicPortfolioPage = () => {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get(`/portfolios/public/${slug}`);
        setPortfolio(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Portfolio not found');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [slug]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="flex h-screen items-center justify-center text-xl text-muted-foreground">{error}</div>;

  const data = portfolio.syncMode === 'sync-from-resume' ? portfolio.syncedResume : portfolio;

  // Render logic based on theme
  const themeClass = portfolio.theme === 'modern' ? 'bg-slate-50 text-slate-900' : 
                     portfolio.theme === 'creative' ? 'bg-amber-50 text-amber-900' : 
                     'bg-white text-black';

  return (
    <div className={`min-h-screen py-16 px-4 ${themeClass}`}>
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight">
            {data?.personalInfo?.fullName || 'My Portfolio'}
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto">
            {data?.personalInfo?.professionalSummary || 'Welcome to my professional portfolio.'}
          </p>
          <div className="flex justify-center gap-4 text-sm opacity-70">
            {data?.personalInfo?.email && <span>{data.personalInfo.email}</span>}
            {data?.personalInfo?.location && <span>{data.personalInfo.location}</span>}
          </div>
        </header>

        {data?.experience && data.experience.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Experience</h2>
            <div className="space-y-6">
              {data.experience.map((exp: any, i: number) => (
                <Card key={i} className="bg-white/50 backdrop-blur-sm border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{exp.title}</h3>
                        <p className="opacity-80">{exp.company}</p>
                      </div>
                      <span className="text-sm opacity-60">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                    </div>
                    <ul className="list-disc list-inside mt-4 space-y-1 opacity-80">
                      {exp.bulletPoints?.map((bp: string, j: number) => (
                        <li key={j}>{bp}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {data?.projects && data.projects.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Projects</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {data.projects.map((proj: any, i: number) => (
                <Card key={i} className="bg-white/50 backdrop-blur-sm border-none shadow-sm h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{proj.name}</h3>
                    <p className="opacity-80 mb-4">{proj.description}</p>
                    <ul className="list-disc list-inside space-y-1 opacity-80 text-sm">
                      {proj.bulletPoints?.map((bp: string, j: number) => (
                        <li key={j}>{bp}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Footer contact etc */}
      </div>
    </div>
  );
};

export default PublicPortfolioPage;
