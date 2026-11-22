import { useState } from 'react';
import { TripPreferences, AppPage, BackendStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface PlannerPageProps {
  onPlanGenerated: (prefs: TripPreferences) => void;
  isLoading: boolean;
  error: string | null;
  onNavigate: (page: AppPage) => void;
  backendStatus: BackendStatus;
  selectedAiModel: 'gemini' | 'claude';
  onAiModelChange: (model: 'gemini' | 'claude') => void;
}

const INTERESTS = [
  '🏖️ Beach & Water', '🏔️ Mountains & Hiking', '🎭 Culture & Arts', '🍜 Food & Cuisine',
  '🏛️ History & Heritage', '🌿 Nature & Wildlife', '🛍️ Shopping', '🎉 Nightlife',
  '🧘 Wellness & Spa', '🏄 Adventure Sports', '📸 Photography', '🎵 Music & Festivals',
  '🍷 Wine & Spirits', '⛷️ Winter Sports', '🤿 Diving & Snorkeling', '🚴 Cycling',
];

const TRAVEL_STYLES = [
  { value: 'budget', label: '💚 Budget Traveler', desc: 'Hostels, street food, free attractions' },
  { value: 'mid-range', label: '💙 Mid-Range Explorer', desc: '3-star hotels, local restaurants' },
  { value: 'luxury', label: '💜 Luxury Traveler', desc: '5-star resorts, fine dining' },
  { value: 'backpacker', label: '🎒 Backpacker', desc: 'Flexible, adventure-focused' },
  { value: 'family', label: '👨‍👩‍👧 Family Friendly', desc: 'Kid-safe, educational, fun' },
  { value: 'solo', label: '🧳 Solo Adventure', desc: 'Independent, flexible, social' },
];

const ACCOMMODATIONS = [
  { value: 'hostel', label: '🛏️ Hostel' },
  { value: 'budget-hotel', label: '🏨 Budget Hotel' },
  { value: 'mid-range-hotel', label: '🏩 Mid-Range Hotel' },
  { value: 'luxury-hotel', label: '🏰 Luxury Hotel' },
  { value: 'resort', label: '🌴 Resort' },
  { value: 'airbnb', label: '🏠 Airbnb/Apartment' },
  { value: 'boutique', label: '✨ Boutique Hotel' },
  { value: 'camping', label: '⛺ Camping/Glamping' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'INR', 'SGD', 'AED'];

export default function PlannerPage({ onPlanGenerated, isLoading, error, onNavigate, backendStatus, selectedAiModel, onAiModelChange }: PlannerPageProps) {
  const { credits, PLAN_CREDIT_COST } = useAuth();
  const hasEnoughCredits = credits >= PLAN_CREDIT_COST;
  const CLAUDE_ENABLED = import.meta.env.VITE_CLAUDE_ENABLED === 'true';
  const WEATHER_ENABLED = Boolean(import.meta.env.VITE_OPENWEATHER_API_KEY && import.meta.env.VITE_OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY_HERE');
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [prefs, setPrefs] = useState<TripPreferences>({
    destination: '',
    origin: '',
    startDate: nextWeek,
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    travelers: 2,
    budget: 3000,
    currency: 'USD',
    interests: [],
    travelStyle: 'mid-range',
    accommodationType: 'mid-range-hotel',
    dietaryRestrictions: '',
    mobilityNeeds: '',
    specialRequests: '',
  });

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const toggleInterest = (interest: string) => {
    setPrefs(p => ({
      ...p,
      interests: p.interests.includes(interest)
        ? p.interests.filter(i => i !== interest)
        : [...p.interests, interest],
    }));
  };

  // BUG-12 fix: ensure end date is not before start date
  const datesValid =
    prefs.startDate &&
    prefs.endDate &&
    prefs.endDate >= prefs.startDate;

  const canProceed = () => {
    if (step === 1)
      return prefs.destination.trim() && prefs.origin.trim() && datesValid;
    if (step === 2) return prefs.budget > 0;
    if (step === 3) return prefs.interests.length > 0;
    return true;
  };

  // BUG-11 fix: App.tsx owns navigation — no double-navigate here
  const handleSubmit = () => {
    onPlanGenerated(prefs);
  };

  const duration = prefs.startDate && prefs.endDate
    ? Math.max(0, Math.ceil((new Date(prefs.endDate).getTime() - new Date(prefs.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Backend Status Warning */}
        {backendStatus === 'offline' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
            <span className="text-red-400 text-xl mt-0.5">⚠️</span>
            <div>
              <div className="text-red-400 font-semibold mb-1">Python Backend is Offline</div>
              <div className="text-red-300/70 text-sm">Trip generation requires the backend. Run: <code className="bg-red-900/40 px-2 py-0.5 rounded font-mono text-xs">cd backend &amp;&amp; python app.py</code></div>
            </div>
          </div>
        )}
        {/* AI Model + Weather Status Banner */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* AI Model Selector */}
          <div className="p-4 bg-slate-900/80 border border-slate-700/50 rounded-2xl">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">🤖 AI Model</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAiModelChange('gemini')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  selectedAiModel === 'gemini'
                    ? 'bg-sky-500/20 border-sky-500/60 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="text-lg">✨</span>
                <div className="text-left">
                  <div>Gemini</div>
                  <div className="text-xs opacity-60">Google · Default</div>
                </div>
              </button>
              <button
                onClick={() => onAiModelChange('claude')}
                title={!CLAUDE_ENABLED ? 'Add ANTHROPIC_API_KEY to backend .env to enable Claude' : ''}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all relative ${
                  selectedAiModel === 'claude'
                    ? 'bg-violet-500/20 border-violet-500/60 text-violet-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="text-lg">🧠</span>
                <div className="text-left">
                  <div>Claude</div>
                  <div className="text-xs opacity-60">Anthropic · Premium</div>
                </div>
                {!CLAUDE_ENABLED && (
                  <span className="absolute top-1 right-1 text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">KEY NEEDED</span>
                )}
              </button>
            </div>
          </div>

          {/* Status indicators */}
          <div className="p-4 bg-slate-900/80 border border-slate-700/50 rounded-2xl space-y-2">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">📡 Service Status</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">AI Backend</span>
              <span className={`flex items-center gap-1 font-semibold ${
                backendStatus === 'online' ? 'text-emerald-400' : backendStatus === 'offline' ? 'text-red-400' : 'text-amber-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  backendStatus === 'online' ? 'bg-emerald-400' : backendStatus === 'offline' ? 'bg-red-400' : 'bg-amber-400'
                }`} />
                {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Connecting...'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Live Weather</span>
              <span className={`flex items-center gap-1 font-semibold ${WEATHER_ENABLED ? 'text-emerald-400' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${WEATHER_ENABLED ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                {WEATHER_ENABLED ? 'Active' : 'API key needed'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Claude AI</span>
              <span className={`flex items-center gap-1 font-semibold ${CLAUDE_ENABLED ? 'text-violet-400' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${CLAUDE_ENABLED ? 'bg-violet-400' : 'bg-slate-600'}`} />
                {CLAUDE_ENABLED ? 'Ready' : 'API key needed'}
              </span>
            </div>
          </div>
        </div>

        {backendStatus === 'online' && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" /></span>
            <span className="text-emerald-400 text-sm font-medium">
              AI Backend Connected — Using <strong>{selectedAiModel === 'claude' ? 'Claude (claude-3-5-sonnet)' : 'Gemini (gemini-2.5-flash)'}</strong>
              {WEATHER_ENABLED && <span className="ml-2 text-sky-400">· 🌤️ Live weather enabled</span>}
            </span>
          </div>
        )}
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-sm font-medium mb-5">
            <span>🗺️</span> AI Trip Planner
          </div>
          <h1 className="text-4xl font-black mb-3">
            Plan Your{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #38bdf8, #818cf8)' }}>
              Dream Trip
            </span>
          </h1>
          <p className="text-slate-400 text-lg">
            Tell us your preferences and AI will craft a personalized itinerary in seconds
          </p>
        </div>


        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                    i + 1 < step
                      ? 'bg-sky-500 border-sky-500 text-white'
                      : i + 1 === step
                      ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                      : 'border-slate-700 text-slate-600 bg-slate-800'
                  }`}
                >
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${i + 1 < step ? 'bg-sky-500' : 'bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Destination</span>
            <span>Budget</span>
            <span>Interests</span>
            <span>Preferences</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card gradient-border rounded-3xl p-8 shadow-2xl">
          {/* Step 1: Destination & Dates */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">🗺️</span> Destination & Dates
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Where are you going? *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bali, Indonesia"
                    value={prefs.destination}
                    onChange={e => setPrefs(p => ({ ...p, destination: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Where are you flying from? *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New York, USA"
                    value={prefs.origin}
                    onChange={e => setPrefs(p => ({ ...p, origin: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Start Date *</label>
                  <input
                    type="date"
                    min={today}
                    value={prefs.startDate}
                    onChange={e => setPrefs(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">End Date *</label>
                  <input
                    type="date"
                    min={prefs.startDate || today}
                    value={prefs.endDate}
                    onChange={e => setPrefs(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Travelers</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={prefs.travelers}
                    onChange={e => setPrefs(p => ({ ...p, travelers: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* BUG-12 fix: warn when end date is before start date */}
              {prefs.startDate && prefs.endDate && prefs.endDate < prefs.startDate && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  <span>End date cannot be before start date. Please adjust your dates.</span>
                </div>
              )}
              {duration > 0 && datesValid && (
                <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 text-sm flex items-center gap-2">
                  <span>📅</span>
                  <span>
                    <strong>{duration} days</strong> trip with <strong>{prefs.travelers}</strong> traveler(s)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Budget */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">💰</span> Budget Planning
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {CURRENCIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setPrefs(p => ({ ...p, currency: c }))}
                    className={`py-2 px-3 rounded-xl text-sm font-semibold border transition-all ${
                      prefs.currency === c
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Total Budget ({prefs.currency}) *
                </label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={prefs.budget}
                  onChange={e => setPrefs(p => ({ ...p, budget: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-2xl font-bold focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-colors"
                />
                <p className="text-slate-500 text-sm mt-1">
                  ≈ {prefs.currency} {Math.round(prefs.budget / prefs.travelers).toLocaleString()} per person
                </p>
              </div>

              {/* Budget slider */}
              <div>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={prefs.budget}
                  onChange={e => setPrefs(p => ({ ...p, budget: parseInt(e.target.value) }))}
                  className="w-full accent-sky-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Budget</span>
                  <span>Mid-Range</span>
                  <span>Luxury</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Travel Style</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TRAVEL_STYLES.map(style => (
                    <button
                      key={style.value}
                      onClick={() => setPrefs(p => ({ ...p, travelStyle: style.value }))}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        prefs.travelStyle === style.value
                          ? 'bg-sky-500/10 border-sky-500/50 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-semibold text-sm">{style.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">🎯</span> Your Interests
              </h2>
              <p className="text-slate-400">Select all that apply to get a personalized experience (choose at least 1)</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INTERESTS.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                      prefs.interests.includes(interest)
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              {prefs.interests.length > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                  ✓ {prefs.interests.length} interest{prefs.interests.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preferences */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">⚙️</span> Additional Preferences
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Accommodation Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ACCOMMODATIONS.map(acc => (
                    <button
                      key={acc.value}
                      onClick={() => setPrefs(p => ({ ...p, accommodationType: acc.value }))}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all text-center ${
                        prefs.accommodationType === acc.value
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Dietary Restrictions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vegetarian, Halal, Gluten-free"
                    value={prefs.dietaryRestrictions}
                    onChange={e => setPrefs(p => ({ ...p, dietaryRestrictions: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Mobility Needs
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wheelchair accessible"
                    value={prefs.mobilityNeeds}
                    onChange={e => setPrefs(p => ({ ...p, mobilityNeeds: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Special Requests or Notes
                </label>
                <textarea
                  placeholder="e.g. Honeymoon trip, prefer fewer tourist crowds, interested in local experiences..."
                  value={prefs.specialRequests}
                  onChange={e => setPrefs(p => ({ ...p, specialRequests: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                <h3 className="font-semibold text-sky-400 mb-3">📋 Trip Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-400">Destination:</div>
                  <div className="text-white font-medium">{prefs.destination}</div>
                  <div className="text-slate-400">Duration:</div>
                  <div className="text-white font-medium">{duration} days</div>
                  <div className="text-slate-400">Travelers:</div>
                  <div className="text-white font-medium">{prefs.travelers} people</div>
                  <div className="text-slate-400">Budget:</div>
                  <div className="text-white font-medium">{prefs.budget.toLocaleString()} {prefs.currency}</div>
                  <div className="text-slate-400">Style:</div>
                  <div className="text-white font-medium capitalize">{prefs.travelStyle}</div>
                  <div className="text-slate-400">Interests:</div>
                  <div className="text-white font-medium">{prefs.interests.length} selected</div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-2">
              <span>⚠️</span>
              <div>
                <strong>Error:</strong> {error}
                <div className="mt-1 text-red-400/70">Please check your Gemini API key in the .env file (VITE_GEMINI_API_KEY)</div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : onNavigate('home')}
              className="px-6 py-3 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl font-medium transition-all"
            >
              ← Back
            </button>

            {step < totalSteps ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:from-sky-400 hover:to-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                Continue →
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                {/* Credit cost notice */}
                <div className={`text-xs flex items-center gap-1 ${hasEnoughCredits ? 'text-slate-500' : 'text-red-400 font-semibold'}`}>
                  ⚡ Costs {PLAN_CREDIT_COST} credits · You have {credits}
                  {!hasEnoughCredits && (
                    <button
                      onClick={() => onNavigate('pricing')}
                      className="ml-1 underline hover:text-red-300"
                    >
                      Buy credits
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !canProceed() || !hasEnoughCredits}
                  className="px-8 py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg flex items-center gap-2 btn-glow hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>🚀 Generate My Trip Plan</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
