import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppPage } from '../types';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined)
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api';

interface PaymentSuccessPageProps {
  onNavigate: (page: AppPage) => void;
}

type Status = 'verifying' | 'success' | 'error';

export default function PaymentSuccessPage({ onNavigate }: PaymentSuccessPageProps) {
  const { refreshCredits, credits } = useAuth();
  const [status,         setStatus]         = useState<Status>('verifying');
  const [creditsAdded,   setCreditsAdded]   = useState<number>(0);
  const [errorMsg,       setErrorMsg]       = useState<string>('');

  useEffect(() => {
    const verify = async () => {
      const params    = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        // No session — might have just navigated here directly
        setStatus('success');
        setCreditsAdded(100);
        await refreshCredits();
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/verify_payment?session_id=${sessionId}`);
        if (!res.ok) throw new Error(`Verification failed (HTTP ${res.status})`);
        const data = await res.json();
        setCreditsAdded(data.credits_added || 100);
        await refreshCredits();
        setStatus('success');
      } catch (err: any) {
        // Even if verification has a network hiccup, refresh credits
        // (webhook likely already credited the account)
        await refreshCredits();
        setErrorMsg(err.message);
        setStatus('error');
      }
    };

    verify();
  }, [refreshCredits]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md text-center">
        {status === 'verifying' && (
          <div>
            <div className="w-20 h-20 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Confirming Payment</h1>
            <p className="text-slate-400">Please wait while we verify your payment and add your credits…</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            {/* Success animation */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="w-24 h-24 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-full flex items-center justify-center">
                <span className="text-5xl">🎉</span>
              </div>
              <div className="absolute -inset-2 border-2 border-emerald-500/20 rounded-full animate-ping" />
            </div>

            <h1 className="text-3xl font-black text-white mb-3">Payment Successful!</h1>
            <p className="text-slate-400 mb-8">
              <span className="text-emerald-400 font-bold text-xl">{creditsAdded} credits</span> have been added to your account.
            </p>

            {/* Credit display */}
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-8">
              <div className="text-slate-400 text-sm mb-1">New credit balance</div>
              <div className="text-5xl font-black text-emerald-400">⚡ {credits}</div>
              <div className="text-slate-500 text-sm mt-1">credits</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onNavigate('planner')}
                className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl hover:from-sky-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25"
              >
                ✈️ Start Planning My Trip
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Verification Issue</h1>
            <p className="text-slate-400 mb-2">
              Your payment was processed, but we had trouble confirming it.
              Your credits may already be in your account.
            </p>
            <p className="text-slate-500 text-sm mb-8">{errorMsg}</p>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl mb-6">
              <div className="text-slate-400 text-sm">Current balance</div>
              <div className="text-3xl font-black text-amber-400">⚡ {credits}</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onNavigate('planner')}
                className="w-full py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-400 transition-all"
              >
                Continue to Planner
              </button>
              <button
                onClick={() => onNavigate('pricing' as AppPage)}
                className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                Contact support / retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
