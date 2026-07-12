import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import EvaluationPage from './pages/EvaluationPage';
import PromptLibraryPage from './pages/PromptLibraryPage';
import PlaygroundPage from './pages/PlaygroundPage';
import FilesPage from './pages/FilesPage';
import AgentPage from './pages/AgentPage';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './utils/supabaseClient';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const { setUser, setAuthLoading } = useAppStore();

  useEffect(() => {
    const isMockMode =
      !import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

    if (isMockMode) {
      setAuthLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
          });
        }
      } catch (error) {
        console.error('Session hydration failed:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, [setUser, setAuthLoading]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />}>
          {/* Default redirect to home */}
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="agent" element={<AgentPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="playground" element={<PlaygroundPage />} />
          <Route path="evaluation" element={<EvaluationPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="prompts" element={<PromptLibraryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
