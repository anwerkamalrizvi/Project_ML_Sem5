import { AppPage, BackendStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CreditBadge from './CreditBadge';

interface NavbarProps {
  currentPage:    AppPage;
  onNavigate:     (page: AppPage) => void;
  savedCount:     number;
  backendStatus:  BackendStatus;
}

export default function Navbar({ currentPage, onNavigate, savedCount, backendStatus }: NavbarProps) {
  const { user, signOut, credits, PLAN_CREDIT_COST } = useAuth();

  const navItems: { id: AppPage; label: string; icon: string }[] = [
    { id: 'home',    label: 'Home',     icon: '🏠' },
    { id: 'planner', label: 'Plan Trip', icon: '✈️' },
    { id: 'chat',    label: 'AI Chat',  icon: '💬' },
    { id: 'saved',   label: 'My Trips', icon: '📖' },
  ];

  const statusConfig = {
    online:   { dot: 'bg-emerald-400', label: 'AI Online',      animate: 'animate-pulse', text: 'text-emerald-400' },
    offline:  { dot: 'bg-red-500',     label: 'AI Offline',     animate: '',             text: 'text-red-400' },
    checking: { dot: 'bg-amber-400',   label: 'Connecting...',  animate: 'animate-pulse', text: 'text-amber-400' },
  }[backendStatus];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 nav-shadow"
      style={{ background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-sky-500/30 transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
            >
              <span className="text-lg">✈️</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black text-lg leading-none tracking-tight">
                Traveler <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #38bdf8, #818cf8)' }}>AI</span>
              </span>
              <span className="text-slate-500 text-[9px] leading-none tracking-widest uppercase">Smart Trip Planner</span>
            </div>
          </button>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentPage === item.id
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {/* Active indicator */}
                {currentPage === item.id && (
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))', border: '1px solid rgba(56,189,248,0.2)' }}
                  />
                )}
                <span className="relative z-10">{item.icon}</span>
                <span className="relative z-10">{item.label}</span>
                {item.id === 'saved' && savedCount > 0 && (
                  <span
                    className="relative z-10 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
                  >
                    {savedCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right side: status + credits + auth */}
          <div className="hidden md:flex items-center gap-2">

            {/* Backend Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5"
              style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
              <div className="relative flex h-2 w-2">
                {(backendStatus === 'online' || backendStatus === 'checking') && (
                  <span className={`${statusConfig.animate} absolute inline-flex h-full w-full rounded-full ${statusConfig.dot} opacity-60`} />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dot}`} />
              </div>
              <span className={`text-xs ${statusConfig.text}`}>{statusConfig.label}</span>
            </div>

            {/* Credit Badge */}
            <CreditBadge
              onClick={() => onNavigate('pricing')}
              compact={credits >= PLAN_CREDIT_COST}
            />

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* User avatar */}
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-white/10"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold border border-white/10"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
                  >
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => signOut()}
                  title="Sign out"
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-all border border-white/5 hover:border-white/10"
                style={{ background: 'rgba(15, 23, 42, 0.6)' }}
              >
                <svg viewBox="0 0 48 48" className="w-4 h-4 flex-shrink-0">
                  <path fill="#4285F4" d="M43.6 20H24v8h11.3C33.5 33.1 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                  <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
                  <path fill="#FBBC05" d="M24 44c5.2 0 9.9-1.8 13.6-4.7l-6.3-5.2C29.3 35.6 26.8 36 24 36c-5.1 0-9.4-2.9-11.3-7.1l-6.6 4.9C9.6 39.6 16.3 44 24 44z"/>
                  <path fill="#EA4335" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.9 6l6.3 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                Sign in
              </button>
            )}

            <button
              onClick={() => onNavigate('planner')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-sky-500/30 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
            >
              <span>🗺️</span>
              Plan Now
            </button>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-1">
            {/* Mobile credit badge */}
            <CreditBadge onClick={() => onNavigate('pricing')} compact />

            <div className="relative flex h-2 w-2 mx-1">
              <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dot}`} />
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`p-2 rounded-xl text-lg transition-all duration-200 relative ${
                  currentPage === item.id
                    ? 'text-sky-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                {item.icon}
                {item.id === 'saved' && savedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {savedCount}
                  </span>
                )}
              </button>
            ))}
            {/* Mobile auth button */}
            {user ? (
              user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full border border-white/10 ml-1" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ml-1"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                  {(user.displayName || 'U')[0]}
                </div>
              )
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                title="Sign in"
              >
                👤
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
