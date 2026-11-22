import { useState, useEffect } from 'react';
import { AppPage } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  onNavigate: (page: AppPage) => void;
}

const destinations = [
  {
    name: 'Paris, France',
    tag: 'City of Light',
    emoji: '🗼',
    gradient: 'from-rose-600/70 to-pink-900/90',
    highlight: 'Eiffel Tower · Louvre · Seine River',
    description: 'Romance, art, and culinary excellence await you in the most iconic city on Earth.',
    temp: '18°C',
    duration: '5-7 days',
    best: 'Apr – Oct',
    color: '#f43f5e',
  },
  {
    name: 'Bali, Indonesia',
    tag: 'Island of Gods',
    emoji: '🌴',
    gradient: 'from-emerald-600/70 to-teal-900/90',
    highlight: 'Temples · Rice Terraces · Beaches',
    description: 'Spiritual sanctuaries, emerald rice terraces and world-class surf breaks.',
    temp: '28°C',
    duration: '7-10 days',
    best: 'May – Sep',
    color: '#10b981',
  },
  {
    name: 'Tokyo, Japan',
    tag: 'Neon & Tradition',
    emoji: '⛩️',
    gradient: 'from-violet-600/70 to-indigo-900/90',
    highlight: 'Mt. Fuji · Shibuya · Cherry Blossoms',
    description: 'Ancient temples, robot restaurants, and the world\'s most reliable transit system.',
    temp: '15°C',
    duration: '7-14 days',
    best: 'Mar – May',
    color: '#8b5cf6',
  },
  {
    name: 'Dubai, UAE',
    tag: 'City of Future',
    emoji: '🏙️',
    gradient: 'from-amber-600/70 to-orange-900/90',
    highlight: 'Burj Khalifa · Desert Safari · Marina',
    description: 'Ultramodern skyline meets golden desert dunes in this city of superlatives.',
    temp: '30°C',
    duration: '4-6 days',
    best: 'Nov – Mar',
    color: '#f59e0b',
  },
  {
    name: 'Santorini, Greece',
    tag: 'Island Paradise',
    emoji: '🏛️',
    gradient: 'from-blue-600/70 to-cyan-900/90',
    highlight: 'Blue Domes · Caldera · Sunset Views',
    description: 'Iconic blue-domed churches perched on volcanic cliffs above the Aegean Sea.',
    temp: '24°C',
    duration: '5-7 days',
    best: 'May – Oct',
    color: '#3b82f6',
  },
  {
    name: 'Machu Picchu',
    tag: 'Lost City',
    emoji: '🏔️',
    gradient: 'from-sky-600/70 to-cyan-900/90',
    highlight: 'Inca Ruins · Andes · Cloud Forest',
    description: 'Mystical Inca citadel floating above the clouds in the Peruvian Andes.',
    temp: '14°C',
    duration: '5-8 days',
    best: 'May – Oct',
    color: '#06b6d4',
  },
];

const features = [
  {
    icon: '🧠',
    title: 'Gemini 2.5 Flash AI',
    desc: 'Google\'s most capable multimodal model generates rich, accurate, personalized travel itineraries in seconds.',
    color: 'border-violet-500/30 bg-violet-500/5',
    accent: 'text-violet-400',
    delay: '0ms',
  },
  {
    icon: '🌤️',
    title: 'Live Weather Data',
    desc: 'Real-time OpenWeatherMap integration bakes current conditions into every recommendation.',
    color: 'border-sky-500/30 bg-sky-500/5',
    accent: 'text-sky-400',
    delay: '100ms',
  },
  {
    icon: '💰',
    title: 'Smart Budget Engine',
    desc: 'Precise cost breakdown: flights, hotels, food, activities — zero hidden costs, real numbers.',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    accent: 'text-emerald-400',
    delay: '200ms',
  },
  {
    icon: '🛡️',
    title: 'Safety Intelligence',
    desc: 'AI-powered threat assessment covering health risks, crime levels, and natural hazards.',
    color: 'border-amber-500/30 bg-amber-500/5',
    accent: 'text-amber-400',
    delay: '300ms',
  },
  {
    icon: '📅',
    title: 'Day-by-Day Plans',
    desc: 'Morning, afternoon and evening schedules with hand-picked restaurant recommendations.',
    color: 'border-rose-500/30 bg-rose-500/5',
    accent: 'text-rose-400',
    delay: '400ms',
  },
  {
    icon: '🔬',
    title: 'ML Insights Lab',
    desc: 'Decision trees, Q-learning, neural networks and clustering analyze your unique travel DNA.',
    color: 'border-indigo-500/30 bg-indigo-500/5',
    accent: 'text-indigo-400',
    delay: '500ms',
  },
];

const stats = [
  { value: '150+', label: 'Countries', sub: 'Globally covered' },
  { value: '6', label: 'ML Models', sub: 'Powering insights' },
  { value: '< 10s', label: 'Generation', sub: 'Lightning fast' },
  { value: '24/7', label: 'AI Advisor', sub: 'Always available' },
];

const testimonials = [
  { name: 'Sarah M.', location: 'New York, USA', text: 'Generated a 10-day Japan itinerary in 8 seconds. The budget breakdown was spot-on. Absolutely incredible!', avatar: '👩‍💼', rating: 5 },
  { name: 'Ahmed K.', location: 'Dubai, UAE', text: 'The safety analysis saved me from choosing a risky neighborhood. The AI chat is like having a local expert.', avatar: '👨‍💻', rating: 5 },
  { name: 'Elena R.', location: 'Barcelona, Spain', text: 'Planned our honeymoon to Bali with real weather data and restaurant picks. Perfect trip, zero stress.', avatar: '👩‍🎨', rating: 5 },
];

export default function HomePage({ onNavigate }: HomePageProps) {
  const { user, signInWithGoogle, credits } = useAuth();
  const [activeDestIdx, setActiveDestIdx] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hoveredDest, setHoveredDest] = useState<number | null>(null);

  // Auto-cycle destinations
  useEffect(() => {
    const timer = setInterval(() => setActiveDestIdx(i => (i + 1) % destinations.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const activeDest = destinations[activeDestIdx];

  const handleStartPlanning = () => {
    onNavigate('planner');
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      onNavigate('planner');
    } catch {
      // user closed popup
    } finally {
      setIsSigningIn(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">

        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full blur-[100px] opacity-30 animate-morph"
            style={{ background: 'radial-gradient(circle, #0ea5e9 0%, #6366f1 60%, transparent 100%)' }}
          />
          <div
            className="absolute -bottom-20 -right-32 w-[500px] h-[500px] rounded-full blur-[80px] opacity-20 animate-morph"
            style={{ background: 'radial-gradient(circle, #8b5cf6 0%, #0ea5e9 60%, transparent 100%)', animationDelay: '4s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[120px] opacity-10"
            style={{ background: 'radial-gradient(ellipse, #38bdf8 0%, transparent 70%)' }}
          />
        </div>

        {/* Stars / particles background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.1,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
              }}
            />
          ))}
        </div>

        {/* Flying airplane */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="animate-fly absolute top-1/4 text-4xl opacity-60" style={{ animationDuration: '20s' }}>✈️</div>
          <div className="animate-fly-reverse absolute top-2/3 text-2xl opacity-30" style={{ animationDuration: '28s', animationDelay: '8s' }}>✈️</div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">

          {/* Destination badge — animated */}
          <div
            key={activeDestIdx}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 text-white text-sm font-medium mb-8 backdrop-blur-sm animate-fade-up"
            style={{
              background: `linear-gradient(135deg, ${activeDest.color}30, ${activeDest.color}10)`,
              borderColor: `${activeDest.color}30`,
            }}
          >
            <span className="text-xl animate-float">{activeDest.emoji}</span>
            <span className="font-bold">{activeDest.name}</span>
            <span className="text-white/40 hidden sm:block">·</span>
            <span className="text-white/70 text-xs hidden sm:block">{activeDest.highlight}</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.05] tracking-tight animate-fade-up" style={{ animationDelay: '100ms' }}>
            Discover the
            <br />
            <span
              className="bg-clip-text text-transparent animate-gradient-text"
              style={{
                backgroundImage: 'linear-gradient(135deg, #38bdf8, #818cf8, #38bdf8)',
                backgroundSize: '200% 200%',
              }}
            >
              World with AI
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed font-light animate-fade-up" style={{ animationDelay: '200ms' }}>
            Professional-grade travel planning powered by{' '}
            <span className="text-sky-400 font-semibold">Gemini 2.5 Flash AI</span>.
            Complete itineraries with live weather, smart budgets and safety analysis — in under 10 seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <button
              onClick={handleStartPlanning}
              className="group relative px-10 py-4 rounded-2xl text-lg font-bold text-white overflow-hidden transition-all duration-300 hover:scale-105 btn-glow animate-glow-ring"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
            >
              <span className="relative z-10 flex items-center gap-3">
                <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">✈️</span>
                {user ? 'Plan Your Next Trip' : 'Start Planning — Free'}
              </span>
            </button>

            {!user ? (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="px-8 py-4 glass-card text-white rounded-2xl text-lg font-semibold hover:border-white/20 transition-all duration-300 flex items-center gap-3 disabled:opacity-60"
              >
                {isSigningIn ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
                    <path fill="#4285F4" d="M43.6 20H24v8h11.3C33.5 33.1 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                    <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
                    <path fill="#FBBC05" d="M24 44c5.2 0 9.9-1.8 13.6-4.7l-6.3-5.2C29.3 35.6 26.8 36 24 36c-5.1 0-9.4-2.9-11.3-7.1l-6.6 4.9C9.6 39.6 16.3 44 24 44z"/>
                    <path fill="#EA4335" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.9 6l6.3 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                  </svg>
                )}
                Sign in with Google
              </button>
            ) : (
              <button
                onClick={() => onNavigate('chat')}
                className="px-8 py-4 glass-card text-white rounded-2xl text-lg font-semibold hover:border-white/20 transition-all duration-300 flex items-center gap-2"
              >
                <span>💬</span> AI Travel Chat
              </button>
            )}
          </div>

          {/* Credit badge for signed-in users */}
          {user && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-8 animate-fade-up">
              <span>⚡</span>
              <span>Welcome back, <strong>{user.displayName?.split(' ')[0]}</strong>! You have <strong>{credits} credits</strong></span>
            </div>
          )}

          {/* Guest credit notice */}
          {!user && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-xs mb-8 animate-fade-up">
              <span>⚡</span>
              <span><strong>{credits} free credits</strong> ready · No sign-in required</span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '400ms' }}>
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black text-sky-400">{stat.value}</div>
                <div className="text-white font-semibold text-sm mt-1">{stat.label}</div>
                <div className="text-slate-500 text-xs">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Destination dots */}
        <div className="relative z-10 flex gap-2 mt-10">
          {destinations.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveDestIdx(i)}
              className={`h-2 rounded-full transition-all duration-500 ${i === activeDestIdx ? 'w-8 bg-sky-400' : 'w-2 bg-slate-600 hover:bg-slate-500'}`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-600/70 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-3 bg-sky-400 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ DESTINATION SHOWCASE ═══════════════════ */}
      <section className="py-24 px-4" style={{ background: 'linear-gradient(180deg, #020617 0%, #0a0f1e 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-sm font-medium mb-5">
              <span>🌍</span> Popular Destinations
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-3">
              Where Will You <span className="text-sky-400">Go Next?</span>
            </h2>
            <p className="text-slate-400 text-lg">Click any destination to get a complete AI-powered travel plan</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {destinations.map((dest, i) => (
              <button
                key={dest.name}
                onClick={handleStartPlanning}
                onMouseEnter={() => setHoveredDest(i)}
                onMouseLeave={() => setHoveredDest(null)}
                className={`group relative overflow-hidden rounded-3xl text-left transition-all duration-500 tour-card ${
                  hoveredDest === i ? 'ring-2' : ''
                }`}
                style={{
                  boxShadow: hoveredDest === i ? `0 0 0 2px ${dest.color}` : 'none',
                  minHeight: '200px',
                  background: `linear-gradient(135deg, ${dest.color}30, ${dest.color}10)`,
                  borderColor: `${dest.color}20`,
                  border: `1px solid ${dest.color}20`,
                }}
              >
                {/* Animated background gradient on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, ${dest.color}25 0%, transparent 60%)` }}
                />

                <div className="relative p-6">
                  {/* Emoji + badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`text-5xl ${hoveredDest === i ? 'animate-float' : ''}`}
                      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                    >
                      {dest.emoji}
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-bold border backdrop-blur-sm"
                      style={{
                        color: dest.color,
                        background: `${dest.color}15`,
                        borderColor: `${dest.color}30`,
                      }}
                    >
                      {dest.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white mb-1">{dest.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">{dest.description}</p>

                  {/* Quick info chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-lg text-slate-400 border border-white/5">🌡️ {dest.temp}</span>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-lg text-slate-400 border border-white/5">📅 {dest.duration}</span>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-lg text-slate-400 border border-white/5">⭐ Best: {dest.best}</span>
                  </div>

                  {/* Plan button */}
                  <div
                    className="flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                    style={{ color: dest.color }}
                  >
                    Plan this trip <span>→</span>
                  </div>
                </div>

                {/* Bottom color bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${dest.color}, transparent)` }}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section className="py-24 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-sm font-medium mb-5">
              <span>✨</span> Professional-Grade Travel Intelligence
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Everything for the{' '}
              <span
                className="bg-clip-text text-transparent animate-gradient-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #38bdf8, #818cf8, #38bdf8)', backgroundSize: '200% 200%' }}
              >
                Perfect Journey
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              From budget optimization to AI safety analysis — we cover every dimension of your adventure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div
                key={f.title}
                className={`group relative p-6 rounded-2xl border backdrop-blur-sm hover:scale-[1.03] transition-all duration-300 cursor-default gradient-border ${f.color}`}
                style={{ animationDelay: f.delay }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(ellipse at top left, rgba(56,189,248,0.05), transparent 60%)' }}
                />

                <div className="relative">
                  <div className="text-4xl mb-4 group-hover:animate-float inline-block">{f.icon}</div>
                  <h3 className={`text-xl font-bold mb-2 ${f.accent}`}>{f.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ AI MODELS SECTION ═══════════════════ */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(180deg, #020617 0%, #050d1a 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Choose Your <span className="text-violet-400">AI Engine</span></h2>
            <p className="text-slate-400">Two of the world's most powerful AI models at your service</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gemini */}
            <div className="relative p-8 rounded-3xl border border-sky-500/20 overflow-hidden gradient-border group hover:border-sky-500/40 transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.05))' }}>
              <div className="absolute top-0 right-0 w-40 h-40 opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)' }} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)' }}>
                    <span className="text-2xl">✨</span>
                  </div>
                  <div>
                    <div className="font-black text-white text-xl">Google Gemini</div>
                    <div className="text-sky-400 text-sm">gemini-2.5-flash</div>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">DEFAULT</span>
                </div>
                <ul className="space-y-2 text-slate-300 text-sm">
                  {['Ultra-fast generation (< 10 seconds)', 'Excellent structured JSON accuracy', 'Google\'s latest multimodal model', 'Already configured & ready to use'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-sky-400 flex-shrink-0">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Claude */}
            <div className="relative p-8 rounded-3xl border border-violet-500/20 overflow-hidden gradient-border group hover:border-violet-500/40 transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.05))' }}>
              <div className="absolute top-0 right-0 w-40 h-40 opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                    <span className="text-2xl">🧠</span>
                  </div>
                  <div>
                    <div className="font-black text-white text-xl">Anthropic Claude</div>
                    <div className="text-violet-400 text-sm">claude-3-5-sonnet</div>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-violet-500/20 text-violet-400 text-xs font-bold rounded-full border border-violet-500/30">PREMIUM</span>
                </div>
                <ul className="space-y-2 text-slate-300 text-sm">
                  {['Superior reasoning & nuanced detail', 'More literary, human-like recommendations', 'Anthropic\'s flagship reasoning model', 'Requires ANTHROPIC_API_KEY setup'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-violet-400 flex-shrink-0">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="py-24 px-4 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Plan in <span className="text-sky-400">3 Simple Steps</span>
            </h2>
            <p className="text-slate-400 text-lg">From idea to complete itinerary in under 2 minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '🔐', title: 'Sign In Free', desc: 'Create your account with Google in one click. Get 10 free credits instantly — no card required.', color: '#38bdf8' },
              { step: '02', icon: '🗺️', title: 'Describe Your Trip', desc: 'Enter destination, travel dates, budget and interests. Pick Gemini or Claude as your AI.', color: '#8b5cf6' },
              { step: '03', icon: '🎯', title: 'Get Your Plan', desc: 'Receive a complete itinerary with live weather, safety analysis, packing list and AI chat.', color: '#10b981' },
            ].map((item, idx) => (
              <div key={item.step} className="relative text-center group">
                {/* Connector line */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-px border-t border-dashed border-slate-700" />
                )}

                <div
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${item.color}25, ${item.color}10)`, border: `1px solid ${item.color}30` }}
                >
                  {item.icon}
                  <div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}90)` }}
                  >
                    {idx + 1}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(180deg, #020617 0%, #0a0f1e 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              Loved by <span className="text-sky-400">Travelers Worldwide</span>
            </h2>
            <p className="text-slate-400">Real trips planned with Traveler AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-slate-800 hover:border-slate-600 transition-all duration-300 tour-card"
                style={{ background: 'linear-gradient(135deg, #0f172a, #0a0f1e)' }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <span key={j} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/30 to-violet-500/30 border border-slate-700 flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA SECTION ═══════════════════ */}
      <section className="py-24 px-4 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative overflow-hidden p-12 rounded-3xl border border-sky-500/20 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.08), rgba(14,165,233,0.05))' }}
          >
            {/* Animated background blobs inside CTA */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20"
                style={{ background: 'radial-gradient(circle, #38bdf8, transparent)' }} />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-3xl opacity-15"
                style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
            </div>

            <div className="relative z-10">
              <div className="text-7xl mb-6 animate-float">🌍</div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Ready to Explore?
              </h2>
              <p className="text-xl text-slate-400 mb-8 max-w-xl mx-auto">
                Join thousands of smart travelers. Your first 10 AI plans are completely free.
              </p>
              <button
                onClick={handleStartPlanning}
                className="group relative px-12 py-5 rounded-2xl text-xl font-black text-white overflow-hidden hover:scale-105 transition-all duration-300 shadow-2xl btn-glow"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
              >
                <span className="relative z-10 flex items-center gap-3 justify-center">
                  <span className="group-hover:rotate-12 transition-transform duration-300">✈️</span>
                  {user ? 'Plan My Next Trip' : 'Start Free — No Card Required'}
                </span>
              </button>
              {!user && (
                <p className="text-slate-500 text-sm mt-4">
                  🔐 Google sign-in · 10 free credits · No card required
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="py-10 px-4 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
            >✈️</div>
            <span><strong className="text-slate-400">Traveler AI</strong> · Professional Trip Planning</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Powered by Gemini 2.5 Flash & Claude AI</span>
            <span>·</span>
            <span>Live Weather by OpenWeatherMap</span>
            <span>·</span>
            <span>Payments by Stripe</span>
          </div>
          <div>© {new Date().getFullYear()} Traveler AI</div>
        </div>
      </footer>
    </div>
  );
}
