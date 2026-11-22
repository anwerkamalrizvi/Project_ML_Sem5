import { useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { TripPreferences, TripPlan, SavedTrip, AppPage, BackendStatus } from './types';
import { generateTripPlan, checkBackendHealth } from './services/gemini';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import InsufficientCreditsModal from './components/InsufficientCreditsModal';
import HomePage from './pages/HomePage';
import PlannerPage from './pages/PlannerPage';
import ResultsPage from './pages/ResultsPage';
import ChatPage from './pages/ChatPage';
import SavedTripsPage from './pages/SavedTripsPage';
import AuthPage from './pages/AuthPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';

const STORAGE_KEY   = 'traveler_ai_saved_trips';
const LAST_PLAN_KEY = 'traveler_ai_last_plan';

function loadSavedTrips(): SavedTrip[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveTripToStorage(trips: SavedTrip[]) {
  try {
    const lean = trips.map(t => ({ ...t, plan: { ...t.plan, ai_insights: undefined } }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lean));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trips.slice(0, trips.length - 1).map(t => ({ ...t, plan: { ...t.plan, ai_insights: undefined } }))));
      } catch { /* still full */ }
    }
  }
}

interface EBState { hasError: boolean; error: string }
class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, EBState> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-6">{this.state.error}</p>
            <button onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
              className="px-6 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-400 transition-colors">
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Auth Guard Modal ──────────────────────────────────────────────────────────
function AuthRequiredModal({ onSignIn, onClose }: { onSignIn: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500" />
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Sign in to Continue</h2>
          <p className="text-slate-400 text-sm mb-2 leading-relaxed">
            A free account is required to generate AI trip plans. This ensures your{' '}
            <span className="text-sky-400 font-semibold">10 free credits</span> are securely saved and never lost.
          </p>
          <p className="text-slate-500 text-xs mb-7">
            Sign-in also prevents abuse and keeps the AI available for everyone.
          </p>
          <button onClick={onSignIn}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-lg mb-3">
            <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
              <path fill="#4285F4" d="M43.6 20H24v8h11.3C33.5 33.1 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
              <path fill="#FBBC05" d="M24 44c5.2 0 9.9-1.8 13.6-4.7l-6.3-5.2C29.3 35.6 26.8 36 24 36c-5.1 0-9.4-2.9-11.3-7.1l-6.6 4.9C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#EA4335" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.9 6l6.3 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Sign in with Google — It's Free
          </button>
          <button onClick={onClose} className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inner App ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { credits, deductCredits, PLAN_CREDIT_COST, user, signInWithGoogle, isAuthLoading } = useAuth();

  const [currentPage,      setCurrentPage]      = useState<AppPage>('home');
  const [savedTrips,       setSavedTrips]        = useState<SavedTrip[]>(loadSavedTrips);
  const [currentPlan,      setCurrentPlan]       = useState<TripPlan | null>(null);
  const [currentPrefs,     setCurrentPrefs]      = useState<TripPreferences | null>(null);
  const [isLoading,        setIsLoading]         = useState(false);
  const [error,            setError]             = useState<string | null>(null);
  const [isSaved,          setIsSaved]           = useState(false);
  const [backendStatus,    setBackendStatus]     = useState<BackendStatus>('checking');
  const [showCreditModal,  setShowCreditModal]   = useState(false);
  const [showAuthModal,    setShowAuthModal]     = useState(false);
  // AI model selection state — passed down to PlannerPage
  const [selectedAiModel,  setSelectedAiModel]  = useState<'gemini' | 'claude'>('gemini');

  // Handle payment redirect
  useEffect(() => {
    const search = window.location.search;
    if (search.includes('session_id') || search.includes('status=success')) {
      setCurrentPage('payment-success');
    } else if (search.includes('status=cancel')) {
      setCurrentPage('payment-cancel');
    }
  }, []);

  // Backend health polling
  useEffect(() => {
    let abortCtrl: AbortController | null = null;
    let mounted = true;
    const poll = async () => {
      abortCtrl = new AbortController();
      try {
        const ok = await checkBackendHealth(abortCtrl.signal);
        if (mounted) setBackendStatus(ok ? 'online' : 'offline');
      } catch { /* abort */ }
    };
    poll();
    const interval = setInterval(poll, 15_000);
    return () => { mounted = false; clearInterval(interval); abortCtrl?.abort(); };
  }, []);

  // Restore last plan
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_PLAN_KEY);
      if (saved) {
        const { plan, prefs } = JSON.parse(saved);
        setCurrentPlan(plan);
        setCurrentPrefs(prefs);
      }
    } catch { /* corrupted */ }
  }, []);

  const handleNavigate = useCallback((page: AppPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Plan Generation with Credit Gate (No Mandatory Auth) ───────────────
  const handlePlanGenerated = useCallback(async (prefs: TripPreferences) => {
    // Credit check
    if (credits < PLAN_CREDIT_COST) {
      setShowCreditModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSaved(false);
    setCurrentPrefs(prefs);
    handleNavigate('results');

    try {
      const deducted = await deductCredits(PLAN_CREDIT_COST);
      if (!deducted) {
        setShowCreditModal(true);
        handleNavigate('planner');
        setIsLoading(false);
        return;
      }
      // Inject selected AI model into prefs
      const enrichedPrefs = { ...prefs, aiModel: selectedAiModel };
      const plan = await generateTripPlan(enrichedPrefs);
      setCurrentPlan(plan);
      try { localStorage.setItem(LAST_PLAN_KEY, JSON.stringify({ plan, prefs: enrichedPrefs })); } catch { /* quota */ }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate trip plan';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [credits, deductCredits, PLAN_CREDIT_COST, user, handleNavigate, selectedAiModel]);

  const handleSaveTrip = useCallback(() => {
    if (!currentPlan || !currentPrefs) return;
    const newTrip: SavedTrip = { id: Date.now().toString(), preferences: currentPrefs, plan: currentPlan, createdAt: new Date().toISOString() };
    const updated = [newTrip, ...savedTrips];
    setSavedTrips(updated);
    saveTripToStorage(updated);
    setIsSaved(true);
  }, [currentPlan, currentPrefs, savedTrips]);

  const handleLoadTrip = useCallback((trip: SavedTrip) => {
    setCurrentPlan(trip.plan);
    setCurrentPrefs(trip.preferences);
    setIsSaved(true);
    handleNavigate('results');
  }, [handleNavigate]);

  const handleDeleteTrip = useCallback((id: string) => {
    const updated = savedTrips.filter(t => t.id !== id);
    setSavedTrips(updated);
    saveTripToStorage(updated);
  }, [savedTrips]);

  const retryBackend = useCallback(async () => {
    setBackendStatus('checking');
    const ok = await checkBackendHealth();
    setBackendStatus(ok ? 'online' : 'offline');
  }, []);

  // Auth loading skeleton
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading Traveler AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-['Inter',sans-serif]">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} savedCount={savedTrips.length} backendStatus={backendStatus} />

      {/* Auth Required Modal */}
      {showAuthModal && (
        <AuthRequiredModal
          onSignIn={async () => { setShowAuthModal(false); await signInWithGoogle(); }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onBuyCredits={() => { setShowCreditModal(false); handleNavigate('pricing'); }}
        onSignIn={!user ? () => { setShowCreditModal(false); handleNavigate('auth'); } : undefined}
      />

      {/* Backend offline banner */}
      {backendStatus === 'offline' && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-red-500/95 backdrop-blur text-white text-sm px-4 py-2 flex items-center justify-center gap-3">
          <span>⚠️</span>
          <span><strong>Python backend is offline.</strong> Start: <code className="bg-red-700/60 px-2 py-0.5 rounded font-mono">cd backend && python app.py</code></span>
          <button onClick={retryBackend} className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors">Retry</button>
        </div>
      )}
      {backendStatus === 'checking' && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-slate-800/95 backdrop-blur text-slate-300 text-sm px-4 py-2 flex items-center justify-center gap-2">
          <div className="w-3 h-3 border border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to AI backend...</span>
        </div>
      )}

      {/* Pages */}
      <ErrorBoundary>{currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}</ErrorBoundary>
      <ErrorBoundary>
        {currentPage === 'planner' && (
          <PlannerPage
            onPlanGenerated={handlePlanGenerated}
            isLoading={isLoading}
            error={error}
            onNavigate={handleNavigate}
            backendStatus={backendStatus}
            selectedAiModel={selectedAiModel}
            onAiModelChange={setSelectedAiModel}
          />
        )}
      </ErrorBoundary>
      <ErrorBoundary>
        {currentPage === 'results' && (
          <ResultsPage plan={currentPlan} preferences={currentPrefs} onNavigate={handleNavigate} onSaveTrip={handleSaveTrip} isSaved={isSaved} isLoading={isLoading} />
        )}
      </ErrorBoundary>
      <ErrorBoundary>{currentPage === 'chat' && <ChatPage tripPlan={currentPlan} onNavigate={handleNavigate} />}</ErrorBoundary>
      <ErrorBoundary>
        {currentPage === 'saved' && (
          <SavedTripsPage savedTrips={savedTrips} onLoadTrip={handleLoadTrip} onDeleteTrip={handleDeleteTrip} onNavigate={handleNavigate} />
        )}
      </ErrorBoundary>
      <ErrorBoundary>{currentPage === 'auth' && <AuthPage onNavigate={handleNavigate} />}</ErrorBoundary>
      <ErrorBoundary>{currentPage === 'pricing' && <PricingPage onNavigate={handleNavigate} />}</ErrorBoundary>
      <ErrorBoundary>{currentPage === 'payment-success' && <PaymentSuccessPage onNavigate={handleNavigate} />}</ErrorBoundary>
      <ErrorBoundary>{currentPage === 'payment-cancel' && <PaymentCancelPage onNavigate={handleNavigate} />}</ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  );
}
