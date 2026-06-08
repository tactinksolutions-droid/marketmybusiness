import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";

const queryClient = new QueryClient();

function Inner() {
  const { user, business, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="text-3xl animate-pulse">🌿</div>
        <p className="text-sm text-gray-400">Loading GrowIQ...</p>
      </div>
    );
  }

  return user ? <ChatPage business={business} /> : <LoginPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Inner />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
