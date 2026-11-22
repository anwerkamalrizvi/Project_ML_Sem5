import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppPage } from '../types';

interface AuthPageProps {
  onNavigate:   (page: AppPage) => void;
  redirectAfter?: AppPage;
}

export default function AuthPage({ onNavigate, redirectAfter = 'planner' }: AuthPageProps) {
  const { signInWithGoogle, user, credits } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Already signed in → redirect
  if (user) {
    onNavigate(redirectAfter);
    return null;
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onNavigate(redirectAfter);
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    { icon: '⚡', title: 'Credits persist forever',   desc: 'Never lose credits even if you clear your browser' },
    { icon: '🌍', title: 'Access on any device',       desc: 'Your credits and saved trips sync across all devices' },
    { icon: '💳', title: 'Buy credits securely',       desc: 'Payment linked to your Google account' },
    { icon: '💾', title: 'Trip plans synced to cloud', desc: 'Access your saved trips from anywhere' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16"
      style={{ background: 'linear-gradient(180deg, #020617 0%, #0a0f1e 100%)' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 animate-morph"
          style={{ background: 'radial-gradient(circle, #0ea5e9, #6366f1, transparent)' }} />
        <div className="absolute top-2/3 left-1/3 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      </div>

      <div className="relative w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12">
        {/* Left side — benefits */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-sm font-medium mb-6">
            <span>⚡</span> You have {credits} credits available
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Sign in to unlock<br/>
            <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              the full experience
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-10">
            Keep your credits and trip plans safe. Access your travel plans from any device, anytime.
          </p>

          <div className="space-y-4">
            {benefits.map(b => (
              <div key={b.title} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl flex-shrink-0">
                  {b.icon}
                </div>
                <div>
                  <div className="text-white font-semibold">{b.title}</div>
                  <div className="text-slate-500 text-sm mt-0.5">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side — sign in card */}
        <div>
          <div className="glass-card gradient-border rounded-3xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">✈️</div>
              <h2 className="text-2xl font-bold text-white">Welcome to Traveler AI</h2>
              <p className="text-slate-400 text-sm mt-2">Sign in with your Google account to continue</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Google Sign-In Button */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
                  <path fill="#4285F4" d="M43.6 20H24v8h11.3C33.5 33.1 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                  <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
                  <path fill="#FBBC05" d="M24 44c5.2 0 9.9-1.8 13.6-4.7l-6.3-5.2C29.3 35.6 26.8 36 24 36c-5.1 0-9.4-2.9-11.3-7.1l-6.6 4.9C9.6 39.6 16.3 44 24 44z"/>
                  <path fill="#EA4335" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.9 6l6.3 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
              )}
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-600 text-xs">or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Continue anonymously */}
            <button
              onClick={() => onNavigate('planner')}
              className="w-full py-3 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors border border-slate-800 hover:border-slate-700 rounded-xl"
            >
              Continue with {credits} free credits (no sign-in)
            </button>

            <p className="text-center text-xs text-slate-600 mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy.
              We only request your basic Google profile information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
