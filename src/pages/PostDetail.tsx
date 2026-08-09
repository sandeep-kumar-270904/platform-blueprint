import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ThreadView } from "@/components/community-feed/ThreadView";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50/30">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-20">
        {id ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <ThreadView postId={id} onBack={() => navigate(-1)} />
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            Invalid Post ID
          </div>
        )}
      </main>
    </div>
  );
}
