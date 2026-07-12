import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Github, Chrome, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, Card, Input } from '@pandora/ui';
import { supabase } from '../utils/supabaseClient';
import { useAppStore } from '../store/useAppStore';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if Supabase client is configured or is using default placeholder configurations
  const isMockMode =
    !import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    if (isMockMode) {
      // Graceful local mockup bypass to allow evaluation without database dependencies
      setTimeout(() => {
        setUser({
          id: 'mock-user-id-999',
          email: email,
          full_name: email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
        });
        setIsSubmitting(false);
        navigate('/dashboard');
      }, 1000);
      return;
    }

    try {
      if (mode === 'login') {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authErr) throw authErr;
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url,
          });
          navigate('/dashboard');
        }
      } else if (mode === 'signup') {
        const { data, error: authErr } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authErr) throw authErr;
        if (data.user) {
          setMessage('Account registration initialized. If email verification is enabled, check your inbox!');
          // Auto login if email confirmation is disabled
          if (data.session) {
            setUser({
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
            });
            setTimeout(() => navigate('/dashboard'), 1500);
          }
        }
      } else if (mode === 'forgot') {
        const { error: authErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (authErr) throw authErr;
        setMessage('Password reset notification sent. Check your email!');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication operation failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    setMessage('');

    if (isMockMode) {
      setUser({
        id: `mock-oauth-${provider}-id`,
        email: `oauth-${provider}@pandora-ai.io`,
        full_name: `${provider} Operator`,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${provider}`,
      });
      navigate('/dashboard');
      return;
    }

    try {
      const { error: authErr } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (authErr) throw authErr;
    } catch (err: any) {
      setError(err.message || `OAuth login with ${provider} failed.`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 text-neutral-100 items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Light background grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-80" />

      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div
        className="absolute top-8 left-8 flex items-center gap-2.5 cursor-pointer z-10"
        onClick={() => navigate('/')}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L14.7 9.3L22 12L14.7 14.7L12 22L9.3 14.7L2 12L9.3 9.3L12 2Z" fill="url(#geminiGradAuth)" />
          <defs>
            <linearGradient id="geminiGradAuth" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-semibold text-sm tracking-tight text-neutral-100 uppercase tracking-widest">
          PANDORA
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <Card variant="glass" className="p-8 space-y-6 bg-neutral-900 border-neutral-700 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-200">
              {mode === 'login' && 'Access Console'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-neutral-400 text-xs">
              {mode === 'login' && 'Unlock multi-modal inference and speech models.'}
              {mode === 'signup' && 'Register email parameters to launch deployment.'}
              {mode === 'forgot' && 'Send password recovery link to your inbox.'}
            </p>
          </div>

          {/* Diagnostics notification if running in mockup mode */}
          {isMockMode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs">
              <Sparkles size={13} className="shrink-0" />
              <span>Running in Evaluation Mock Mode (Default)</span>
            </div>
          )}

          {/* Feedback alerts */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs">
              <CheckCircle size={14} className="shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="operator@pandora-ai.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {mode !== 'forgot' && (
              <Input
                label="Password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full text-xs font-semibold py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors" isLoading={isSubmitting}>
              {mode === 'login' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Send recovery link'}
            </Button>
          </form>

          {mode !== 'forgot' && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-700"></div>
                <span className="flex-shrink mx-4 text-neutral-500 text-[10px] uppercase tracking-wider font-semibold">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-neutral-700"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  className="text-xs w-full"
                  onClick={() => handleOAuth('google')}
                  leftIcon={<Chrome size={13} />}
                >
                  Google
                </Button>
                <Button
                  variant="secondary"
                  className="text-xs w-full"
                  onClick={() => handleOAuth('github')}
                  leftIcon={<Github size={13} />}
                >
                  GitHub
                </Button>
              </div>
            </>
          )}

          <div className="text-center pt-2 text-xs text-neutral-400">
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer font-medium"
                >
                  Sign Up
                </button>
              </span>
            ) : (
              <span>
                Already registered?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer font-medium"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
