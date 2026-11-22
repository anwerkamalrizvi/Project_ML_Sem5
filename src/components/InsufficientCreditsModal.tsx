import { useAuth } from '../contexts/AuthContext';

interface InsufficientCreditsModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  onBuyCredits: () => void;
  onSignIn?: () => void;
}

export default function InsufficientCreditsModal({
  isOpen,
  onClose,
  onBuyCredits,
  onSignIn,
}: InsufficientCreditsModalProps) {
  const { credits, PLAN_CREDIT_COST, user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

        <div className="p-8">
          {/* Icon */}
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-4xl">⚡</span>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Not Enough Credits
          </h2>
          <p className="text-slate-400 text-center text-sm mb-6">
            Generating an AI trip plan costs{' '}
            <span className="text-amber-400 font-bold">{PLAN_CREDIT_COST} credits</span>.
            You currently have{' '}
            <span className="text-red-400 font-bold">{credits} credit{credits !== 1 ? 's' : ''}</span>.
          </p>

          {/* Credit package */}
          <div className="p-5 bg-gradient-to-br from-sky-500/10 to-violet-500/10 border border-sky-500/20 rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white font-bold text-lg">100 Credits</div>
                <div className="text-slate-400 text-xs mt-0.5">Never expires · Instant delivery</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-sky-400">$5</div>
                <div className="text-slate-500 text-xs">one time</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['✓ 20 trip plans', '✓ No subscription', '✓ Secure payment'].map(f => (
                <span key={f} className="text-xs text-slate-400">{f}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onBuyCredits}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl hover:from-sky-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <span>💳</span>
              Buy 100 Credits — $5
            </button>

            {!user && onSignIn && (
              <button
                onClick={onSignIn}
                className="w-full py-3 bg-slate-800 border border-slate-700 text-white font-medium rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#4285F4" d="M43.6 20H24v8h11.3C33.5 33.1 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                  <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
                  <path fill="#FBBC05" d="M24 44c5.2 0 9.9-1.8 13.6-4.7l-6.3-5.2C29.3 35.6 26.8 36 24 36c-5.1 0-9.4-2.9-11.3-7.1l-6.6 4.9C9.6 39.6 16.3 44 24 44z"/>
                  <path fill="#EA4335" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.9 6l6.3 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                Sign in to sync credits across devices
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
