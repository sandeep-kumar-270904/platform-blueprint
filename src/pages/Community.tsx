import { Header } from "@/components/layout/Header";
import { FeedLayout } from "@/components/community-feed/FeedLayout";

const Community = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <FeedLayout 
          title="Global Community" 
          description="A cross-college space to share ideas, ask questions, and connect with peers everywhere." 
        />
      </div>
    </div>
  );
};

export default Community;
