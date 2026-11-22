import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppPage } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// STRIPE CONFIGURATION
//
// HOW TO SET UP STRIPE:
// 1. Go to https://dashboard.stripe.com and create an account (free)
// 2. In the Stripe Dashboard → Developers → API Keys
// 3. Copy your "Publishable key" (starts with pk_test_ for test mode)
// 4. Add to your .env file:
//      VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
// 5. Your backend also needs the Secret Key (starts with sk_test_)
//      Add to .env: STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
// 6. For webhook testing locally, install Stripe CLI and run:
//      stripe listen --forward-to localhost:8000/api/stripe_webhook
//    Copy the webhook secret shown and add to .env:
//      STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
//
// PRODUCTION:
// - Switch to Live mode keys (pk_live_... / sk_live_...)
// - Set up a real webhook endpoint in Stripe Dashboard → Webhooks
// ─────────────────────────────────────────────────────────────────────────────

// BACKEND_URL mirrors what gemini.ts uses
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined)
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api';

interface PricingPageProps {
  onNavigate: (page: AppPage) => void;
}

const PACKAGES = [
  {
    id:      'credits_100',
    credits: 100,
    price:   5,
    label:   'Starter Pack',
    plans:   20,
    popular: true,
    color:   'from-sky-500 to-blue-600',
    badge:   '⚡ Most Popular',
  },
];

export default function PricingPage({ onNavigate }: PricingPageProps) {
  const { credits, user, signInWithGoogle, PLAN_CREDIT_COST } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleBuyCredits = async (pkg: typeof PACKAGES[0]) => {
    setIsLoading(true);
    setError(null);

    // PAYMENT FLOW:
    // 1. We call our Python backend which creates a Stripe Checkout session
    // 2. Backend returns a `url` → we redirect user to Stripe's hosted page
    // 3. User enters card details on Stripe's secure page
    // 4. Stripe redirects back to /payment/success or /payment/cancel
    // 5. Our backend webhook (stripe_webhook) confirms payment & adds credits

    try {
      const res = await fetch(`${BACKEND_URL}/create_checkout_session`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: pkg.id,
          credits:    pkg.credits,
          price_usd:  pkg.price,
          user_id:    user?.uid || 'anonymous',
          user_email: user?.email || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Payment service error (HTTP ${res.status})`);
      }

      const { url } = await res.json();
      if (!url) throw new Error('No checkout URL returned from payment server');

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  const usageExamples = [
    { icon: '✈️', action: 'Generate trip plan',    cost: 5 },
    { icon: '🔍', action: 'Browse & view plans',   cost: 0 },
    { icon: '💬', action: 'AI travel chat',         cost: 0 },
    { icon: '💾', action: 'Save trips',             cost: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-5">
            <span>⚡</span>
            Your balance: <strong>{credits} credits</strong>
            {credits < PLAN_CREDIT_COST && <span className="text-red-400 ml-1">(insufficient for a plan)</span>}
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Buy <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">Credits</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Each AI trip plan generation costs {PLAN_CREDIT_COST} credits.
            Credits never expire and are instantly available after purchase.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <div className="font-semibold mb-1">Payment Error</div>
              <div className="text-sm text-red-400/80">{error}</div>
              {error.includes('not configured') && (
                <div className="mt-2 text-xs text-red-400/60">
                  Add <code className="bg-red-900/40 px-1 rounded">STRIPE_SECRET_KEY</code> to your backend .env file.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Pricing Card */}
          <div className="lg:col-span-3">
            {PACKAGES.map(pkg => (
              <div
                key={pkg.id}
                className="relative bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
              >
                {/* Top gradient */}
                <div className={`h-1.5 bg-gradient-to-r ${pkg.color}`} />

                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold rounded-full mb-3">
                        {pkg.badge}
                      </div>
                      <h2 className="text-2xl font-black text-white">{pkg.label}</h2>
                      <p className="text-slate-400 text-sm mt-1">Perfect for {pkg.plans} complete trip plans</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-black text-white">${pkg.price}</div>
                      <div className="text-slate-500 text-sm">one-time</div>
                    </div>
                  </div>

                  {/* What you get */}
                  <div className="p-5 bg-slate-800/60 rounded-2xl mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-black text-sky-400">{pkg.credits}</div>
                        <div className="text-slate-400 text-sm">credits added to your account</div>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <div>= {pkg.plans} trip plans</div>
                        <div className="text-xs mt-1">${(pkg.price / pkg.credits * PLAN_CREDIT_COST).toFixed(2)} per plan</div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8">
                    {[
                      '✓ 100 AI credits, never expire',
                      '✓ Generate up to 20 full trip plans',
                      '✓ Includes all AI Lab insights',
                      '✓ Day-by-day itinerary + budget breakdown',
                      '✓ Safety analysis + packing lists',
                      '✓ Instant delivery after payment',
                    ].map(f => (
                      <li key={f} className="text-slate-300 text-sm">{f}</li>
                    ))}
                  </ul>

                  {/* Sign-in notice for anonymous users */}
                  {!user && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs flex items-start gap-2">
                      <span>⚠️</span>
                      <div>
                        You're not signed in. Credits purchased anonymously are stored in this browser only.
                        <button onClick={signInWithGoogle} className="ml-1 underline hover:text-amber-300">
                          Sign in with Google
                        </button>
                        {' '}to keep them safe.
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    id="buy-credits-btn"
                    onClick={() => handleBuyCredits(pkg)}
                    disabled={isLoading}
                    className={`w-full py-4 bg-gradient-to-r ${pkg.color} text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Connecting to payment...
                      </>
                    ) : (
                      <>
                        <span>💳</span>
                        Pay $5 — Get 100 Credits
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-600 mt-4">
                    🔒 Secured by Stripe · Your card details are never stored on our servers
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right sidebar — usage info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Credit usage */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">⚡ Credit Usage</h3>
              <div className="space-y-3">
                {usageExamples.map(u => (
                  <div key={u.action} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                      <span>{u.icon}</span> {u.action}
                    </span>
                    <span className={u.cost === 0 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-bold'}>
                      {u.cost === 0 ? 'FREE' : `${u.cost} credits`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">💳 Payment Info</h3>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                  <span>Accepted: Visa, Mastercard, Amex, Discover</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                  <span>Also: Apple Pay, Google Pay (if enabled)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                  <span>Payment processed by Stripe — industry standard security</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                  <span>Credits added instantly after payment confirmation</span>
                </div>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => onNavigate('planner')}
              className="w-full py-3 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 rounded-xl text-sm font-medium transition-all"
            >
              ← Back to Trip Planner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
