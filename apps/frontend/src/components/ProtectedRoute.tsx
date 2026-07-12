import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export default function ProtectedRoute() {
  const { user, authLoading } = useAppStore();

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-black items-center justify-center p-6 text-white relative">
        {/* Glow styling */}
        <div className="absolute w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] animate-pulse" />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-10 h-10 border-4 border-t-neon-purple border-neutral-800 rounded-full animate-spin" />
          <p className="text-sm font-mono text-neutral-400">Syncing session state...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
