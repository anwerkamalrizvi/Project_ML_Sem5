import { useState } from 'react';
import { TripPlan, TripPreferences, AppPage } from '../types';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';


interface ResultsPageProps {
  plan: TripPlan | null;
  preferences: TripPreferences | null;
  onNavigate: (page: AppPage) => void;
  onSaveTrip: () => void;
  isSaved: boolean;
  isLoading: boolean;
}

type TabType = 'overview' | 'itinerary' | 'budget' | 'attractions' | 'safety' | 'requirements' | 'packing' | 'ailab';

const THREAT_COLORS = { Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30', High: 'text-red-400 bg-red-500/10 border-red-500/30' };
const BUDGET_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#f472b6', '#a78bfa', '#fb923c'];

export default function ResultsPage({ plan, preferences, onNavigate, onSaveTrip, isSaved, isLoading }: ResultsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 px-4"
        style={{ background: 'linear-gradient(180deg, #020617 0%, #0a0f1e 100%)' }}>
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        </div>

        <div className="relative text-center max-w-md">
          {/* Animated globe */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 animate-spin border-t-sky-500" />
            <div className="absolute inset-2 rounded-full border-2 border-violet-500/20 animate-spin border-b-violet-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-5xl">✈️</div>
          </div>

          <h2 className="text-3xl font-black text-white mb-2">Crafting Your Perfect Trip</h2>
          <p className="text-slate-400 mb-8">AI is analyzing your preferences and building a personalized plan...</p>

          {/* Sequential progress steps */}
          <div className="space-y-3 text-left">
            {[
              { icon: '🌍', text: 'Analyzing destination details...', delay: '0s' },
              { icon: '💰', text: 'Calculating smart budget breakdown...', delay: '0.4s' },
              { icon: '🌤️', text: 'Fetching live weather conditions...', delay: '0.8s' },
              { icon: '🛡️', text: 'Running safety threat assessment...', delay: '1.2s' },
              { icon: '🎯', text: 'Discovering hidden gems & attractions...', delay: '1.6s' },
              { icon: '🧪', text: 'Computing ML insights & predictions...', delay: '2.0s' },
            ].map((step, i) => (
              <div key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 animate-fade-up"
                style={{
                  animationDelay: step.delay,
                  background: 'rgba(15, 23, 42, 0.5)',
                }}>
                <span className="text-xl animate-pulse" style={{ animationDelay: step.delay }}>{step.icon}</span>
                <span className="text-slate-400 text-sm">{step.text}</span>
                <div className="ml-auto w-4 h-4 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin flex-shrink-0" />
              </div>
            ))}
          </div>

          <p className="text-slate-600 text-xs mt-6">Powered by Gemini 2.5 Flash · Usually takes 4–10 seconds</p>
        </div>
      </div>
    );
  }


  if (!plan || !preferences) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-white mb-3">No Trip Plan Found</h2>
          <p className="text-slate-400 mb-6">Let's start by creating your personalized trip plan.</p>
          <button onClick={() => onNavigate('planner')} className="px-6 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-400 transition-colors">
            Plan a Trip →
          </button>
        </div>
      </div>
    );
  }

  const budgetData = [
    { name: 'Flights',       value: plan.budget.flights        ?? 0 },
    { name: 'Accommodation', value: plan.budget.accommodation  ?? 0 },
    { name: 'Food',          value: plan.budget.food           ?? 0 },
    { name: 'Activities',    value: plan.budget.activities     ?? 0 },
    { name: 'Transport',     value: plan.budget.transportation ?? 0 },
    { name: 'Shopping',      value: plan.budget.shopping       ?? 0 },
    { name: 'Emergency',     value: plan.budget.emergencyFund  ?? 0 },
  ].filter(d => d.value > 0);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview',     label: 'Overview',     icon: '🌍' },
    { id: 'itinerary',    label: 'Itinerary',    icon: '📅' },
    { id: 'budget',       label: 'Budget',       icon: '💰' },
    { id: 'attractions',  label: 'Attractions',  icon: '🏛️' },
    { id: 'safety',       label: 'Safety',       icon: '🛡️' },
    { id: 'requirements', label: 'Requirements', icon: '📋' },
    { id: 'packing',      label: 'Packing',      icon: '🎒' },
    { id: 'ailab',        label: 'AI Lab',       icon: '🧪' },
  ];

  return (
    <div className="min-h-screen text-white pt-20 pb-12" style={{ background: '#020617' }}>
      {/* Hero Header */}
      <div className="relative border-b border-white/5"
        style={{ background: 'linear-gradient(180deg, rgba(14,165,233,0.05) 0%, rgba(2,6,23,0.95) 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sky-400 text-sm mb-2">
                <button onClick={() => onNavigate('planner')} className="hover:text-sky-300 transition-colors">← Edit Trip</button>
                <span>/</span>
                <span>Your Plan</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{plan.destination}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-400 text-sm">
                <span>📅 {preferences.startDate} → {preferences.endDate}</span>
                <span>👥 {preferences.travelers} traveler(s)</span>
                <span>🌐 {plan.language}</span>
                <span>🕐 {plan.timezone}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('chat')}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                💬 Ask AI
              </button>
              <button
                onClick={onSaveTrip}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  isSaved
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : 'text-white hover:scale-105 btn-glow'
                }`}
                style={!isSaved ? { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' } : {}}
              >
                {isSaved ? '✓ Saved' : '💾 Save Trip'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide gap-1 pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 p-6 bg-slate-900 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-sky-400 mb-3">🌍 About {plan.destination}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{plan.overview}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Best Time', value: plan.bestTimeToVisit, icon: '☀️' },
                    { label: 'Local Currency', value: plan.localCurrency, icon: '💵' },
                    { label: 'Language', value: plan.language, icon: '🗣️' },
                    { label: 'Timezone', value: plan.timezone, icon: '🕐' },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-slate-800 rounded-xl">
                      <div className="text-slate-500 text-xs mb-1">{item.icon} {item.label}</div>
                      <div className="text-white font-medium">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-amber-400 mb-3">🌤️ Weather</h2>
                <p className="text-slate-300 text-sm leading-relaxed">{plan.weatherInfo}</p>
              </div>
            </div>

            {/* Budget Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Budget', value: `${preferences.currency} ${plan.budget.total?.toLocaleString() || preferences.budget.toLocaleString()}`, icon: '💰', color: 'text-sky-400' },
                { label: 'Per Person', value: `${preferences.currency} ${plan.budget.perPerson?.toLocaleString() || Math.round(preferences.budget / preferences.travelers).toLocaleString()}`, icon: '👤', color: 'text-emerald-400' },
                { label: 'Duration', value: `${plan.itinerary?.length || 0} Days`, icon: '📅', color: 'text-violet-400' },
                { label: 'Attractions', value: `${plan.attractions?.length || 0} Places`, icon: '🏛️', color: 'text-amber-400' },
              ].map(card => (
                <div key={card.label} className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-center">
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-slate-500 text-xs mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Nearby Destinations */}
            {plan.nearbyDestinations?.length > 0 && (
              <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-4">🗺️ Nearby Day Trips</h2>
                <div className="flex flex-wrap gap-3">
                  {plan.nearbyDestinations.map((dest, i) => (
                    <span key={i} className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full text-sm">
                      📍 {dest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Course Insights */}
            {plan.ai_insights && (
              <div className="p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl">
                <h2 className="text-xl font-bold text-indigo-400 mb-4">🧠 AI Course Insights (Python Backend)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plan.ai_insights.classification && (
                    <div className="p-4 bg-slate-900 rounded-xl">
                      <div className="text-xs text-slate-400 mb-1">Supervised Learning (Decision Tree)</div>
                      <div className="font-bold text-white">{plan.ai_insights.classification.classification}</div>
                    </div>
                  )}
                  {plan.ai_insights.weather_probability && (
                    <div className="p-4 bg-slate-900 rounded-xl">
                      <div className="text-xs text-slate-400 mb-1">Probabilistic Reasoning (Bayes)</div>
                      {/* BUG-03 fix: toFixed(1) prevents raw float like 0.42000002 */}
                      <div className="font-bold text-white">
                        Rain Probability: {(plan.ai_insights.weather_probability.probability_of_rain * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {plan.ai_insights.itinerary_score && (
                    <div className="p-4 bg-slate-900 rounded-xl">
                      <div className="text-xs text-slate-400 mb-1">Neural Network (Feed-forward)</div>
                      <div className="font-bold text-amber-400">Score: {plan.ai_insights.itinerary_score.score_out_of_10} / 10.0</div>
                    </div>
                  )}
                  {/* BUG-01 fix: agent_rationality is an object, not a number */}
                  {plan.ai_insights.agent_rationality && (
                    <div className="p-4 bg-slate-900 rounded-xl">
                      <div className="text-xs text-slate-400 mb-1">Intelligent Agents</div>
                      <div className="font-bold text-emerald-400">
                        Rationality: {plan.ai_insights.agent_rationality.rationality_percent?.toFixed(1) ?? 'N/A'}%
                      </div>
                    </div>
                  )}
                  {/* BUG-02 fix: correct path is rl_route.optimized_route, not rl_optimized_route */}
                  {plan.ai_insights.rl_route?.optimized_route?.length > 0 && (
                    <div className="p-4 bg-slate-900 rounded-xl col-span-1 md:col-span-2">
                      <div className="text-xs text-slate-400 mb-1">Reinforcement Learning (Q-Learning) Optimized Route</div>
                      <div className="text-sm text-white">
                        {plan.ai_insights.rl_route.optimized_route.join(' → ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Sustainability Tips */}
            {plan.sustainabilityTips?.length > 0 && (
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                <h2 className="text-xl font-bold text-emerald-400 mb-4">🌱 Sustainable Travel Tips</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.sustainabilityTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Contacts */}
            {plan.emergencyContacts?.length > 0 && (
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <h2 className="text-xl font-bold text-red-400 mb-4">🆘 Emergency Contacts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plan.emergencyContacts.map((contact, i) => (
                    <div key={i} className="p-3 bg-slate-900/60 rounded-xl">
                      <div className="text-slate-400 text-xs mb-1">{contact.name}</div>
                      <div className="text-white font-bold text-lg">{contact.number}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Itinerary Tab */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">📅 Day-by-Day Itinerary</h2>
              <span className="text-slate-400 text-sm">{plan.itinerary?.length || 0} days planned</span>
            </div>
            {plan.itinerary?.map((day) => (
              <div key={day.day} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
                      {day.day}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">{day.title}</div>
                      <div className="text-slate-500 text-sm">{day.date} · Est. {preferences.currency} {day.estimatedCost?.toLocaleString()}</div>
                    </div>
                  </div>
                  <span className={`text-slate-400 transition-transform duration-300 ${expandedDay === day.day ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {expandedDay === day.day && (
                  <div className="px-5 pb-5 border-t border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mb-4">
                      {[
                        { time: '🌅 Morning', activity: day.morning },
                        { time: '☀️ Afternoon', activity: day.afternoon },
                        { time: '🌙 Evening', activity: day.evening },
                      ].map(({ time, activity }) => (
                        <div key={time} className="p-4 bg-slate-800/50 rounded-xl">
                          <div className="text-sky-400 text-xs font-semibold mb-2">{time}</div>
                          <p className="text-slate-300 text-sm leading-relaxed">{activity}</p>
                        </div>
                      ))}
                    </div>

                    {/* Meals */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { meal: '🥐 Breakfast', rec: day.meals?.breakfast },
                        { meal: '🥗 Lunch', rec: day.meals?.lunch },
                        { meal: '🍽️ Dinner', rec: day.meals?.dinner },
                      ].map(({ meal, rec }) => (
                        <div key={meal} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                          <div className="text-amber-400 text-xs font-semibold mb-1">{meal}</div>
                          <p className="text-slate-400 text-xs leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    {day.tips?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {day.tips.map((tip, i) => (
                          <span key={i} className="text-xs px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full">
                            💡 {tip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">💰 Budget Breakdown</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={budgetData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3}>
                      {budgetData.map((_, i) => <Cell key={i} fill={BUDGET_COLORS[i % BUDGET_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${preferences.currency} ${Number(v).toLocaleString()}`, '']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
                    <Legend formatter={(v) => <span className="text-slate-400 text-sm">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Flights',         key: 'flights',       icon: '✈️' },
                  { label: 'Accommodation',   key: 'accommodation', icon: '🏨' },
                  { label: 'Food & Dining',   key: 'food',          icon: '🍜' },
                  { label: 'Activities',      key: 'activities',    icon: '🎭' },
                  { label: 'Local Transport', key: 'transportation',icon: '🚗' },
                  { label: 'Shopping',        key: 'shopping',      icon: '🛍️' },
                  { label: 'Emergency Fund',  key: 'emergencyFund', icon: '🆘' },
                ].map((item, i) => {
                  const value = (plan.budget[item.key as keyof typeof plan.budget] as number) ?? 0;
                  // BUG-04 fix: guard against total = 0 to prevent division-by-zero NaN
                  const total = plan.budget.total || preferences.budget || 1;
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-300 text-sm flex items-center gap-2">
                          <span>{item.icon}</span> {item.label}
                        </span>
                        <span className="text-white font-semibold text-sm">
                          {preferences.currency} {value.toLocaleString()} <span className="text-slate-500">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: BUDGET_COLORS[i % BUDGET_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sky-400 font-bold">Total</span>
                    <span className="text-white font-bold text-xl">{preferences.currency} {(plan.budget.total || preferences.budget).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-400 text-sm mt-1">
                    ≈ {preferences.currency} {(plan.budget.perPerson || Math.round(preferences.budget / preferences.travelers)).toLocaleString()} per person
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attractions Tab */}
        {activeTab === 'attractions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">🏛️ Top Attractions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.attractions?.map((attraction, i) => (
                <div key={i} className="p-5 bg-slate-900 rounded-2xl border border-slate-800 hover:border-sky-500/30 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">{attraction.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">{attraction.type}</span>
                        {attraction.mustSee && (
                          <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">⭐ Must See</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 font-bold shrink-0">
                      ★ {attraction.rating}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-3">{attraction.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-slate-500">
                      <span>💵</span> Entry: <span className="text-slate-300">{attraction.entryFee}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <span>⏰</span> Best: <span className="text-slate-300">{attraction.bestTime}</span>
                    </div>
                    {attraction.address && (
                      <div className="col-span-2 flex items-center gap-1 text-slate-500">
                        <span>📍</span> <span className="text-slate-400">{attraction.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Tab */}
        {activeTab === 'safety' && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold">🛡️ Safety & Threat Analysis</h2>
                <p className="text-slate-400 mt-1">Honest risk assessment for {plan.destination}. Always check official government travel advisories before your trip.</p>
              </div>
            </div>

            {/* Local Tips */}
            {plan.localTips?.length > 0 && (
              <div className="p-6 bg-sky-500/5 border border-sky-500/20 rounded-2xl">
                <h3 className="font-bold text-sky-400 mb-4">💡 Local Insider Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.localTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                      <span className="text-sky-400 flex-shrink-0 font-bold">{i + 1}.</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.threats?.map((threat, i) => (
                <div key={i} className={`p-5 rounded-2xl border ${THREAT_COLORS[threat.level]}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{threat.icon}</span>
                      <h3 className="font-bold text-white">{threat.category}</h3>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold border ${THREAT_COLORS[threat.level]}`}>
                      {threat.level} Risk
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3 leading-relaxed">{threat.description}</p>
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precautions:</div>
                    {threat.precautions?.map((p, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements Tab */}
        {activeTab === 'requirements' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">📋 Travel Requirements</h2>
            <p className="text-slate-400">Everything you need to prepare before your trip to {plan.destination}.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.requirements?.map((req, i) => (
                <div key={i} className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                  <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                    <span className="text-2xl">{req.icon}</span>
                    {req.category}
                  </h3>
                  <ul className="space-y-2">
                    {req.items?.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-slate-300 text-sm">
                        <span className="text-sky-400 mt-0.5 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Packing Tab */}
        {activeTab === 'packing' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">🎒 Smart Packing List</h2>
            <p className="text-slate-400">Personalized packing list for your trip to {plan.destination}.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {plan.packingList?.map((item, i) => (
                <label key={i} className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer group transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded accent-sky-500" />
                  <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {/* AI Lab Tab — BUG-05 fix: was missing entirely */}
        {activeTab === 'ailab' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">🧪 AI Lab — ML Insights</h2>
              <span className="text-xs px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">Python Backend</span>
            </div>

            {!plan.ai_insights ? (
              <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 text-center">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-xl font-bold text-white mb-2">No AI Insights Available</h3>
                <p className="text-slate-400">AI Lab data is generated by the Python backend. Make sure it is running and regenerate your plan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Decision Tree */}
                {plan.ai_insights.classification && (
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                    <h3 className="font-bold text-violet-400 mb-1">🌳 Decision Tree Classifier</h3>
                    <p className="text-xs text-slate-500 mb-3">Supervised Learning · Travel experience classification</p>
                    <div className="text-2xl font-black text-white mb-2">{plan.ai_insights.classification.classification}</div>
                    <div className="text-sm text-slate-400">Daily budget/person: <span className="text-sky-400 font-semibold">{preferences.currency} {plan.ai_insights.classification.daily_budget_per_person?.toFixed(0)}</span></div>
                    {plan.ai_insights.classification.auc !== undefined && (
                      <div className="text-sm text-slate-400 mt-1">Model AUC: <span className="text-emerald-400 font-semibold">{plan.ai_insights.classification.auc.toFixed(3)}</span></div>
                    )}
                  </div>
                )}

                {/* Bayesian Weather */}
                {plan.ai_insights.weather_probability && (
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                    <h3 className="font-bold text-sky-400 mb-1">🌦️ Naive Bayes Weather Model</h3>
                    <p className="text-xs text-slate-500 mb-3">Probabilistic Reasoning · Rain/dry forecast</p>
                    <div className="flex gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-black text-blue-400">{(plan.ai_insights.weather_probability.probability_of_rain * 100).toFixed(1)}%</div>
                        <div className="text-xs text-slate-500">Rain prob.</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-black text-amber-400">{(plan.ai_insights.weather_probability.probability_of_dry * 100).toFixed(1)}%</div>
                        <div className="text-xs text-slate-500">Dry prob.</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-300">{plan.ai_insights.weather_probability.forecast}</div>
                    <div className="text-xs text-slate-500 mt-1">{plan.ai_insights.weather_probability.climate_type} · {plan.ai_insights.weather_probability.travel_month}</div>
                  </div>
                )}

                {/* Neural Network Score */}
                {plan.ai_insights.itinerary_score && (
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                    <h3 className="font-bold text-amber-400 mb-1">🧠 Neural Network Itinerary Scorer</h3>
                    <p className="text-xs text-slate-500 mb-3">Feed-forward NN · Quality score</p>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-4xl font-black text-amber-400">{plan.ai_insights.itinerary_score.score_out_of_10}</span>
                      <span className="text-slate-400 mb-1">/ 10.0</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-1000"
                        style={{ width: `${(plan.ai_insights.itinerary_score.score_out_of_10 / 10) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Architecture: {plan.ai_insights.itinerary_score.network_architecture}</div>
                  </div>
                )}

                {/* Agent Rationality */}
                {plan.ai_insights.agent_rationality && (
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                    <h3 className="font-bold text-emerald-400 mb-1">🤝 Intelligent Agent Rationality</h3>
                    <p className="text-xs text-slate-500 mb-3">Utility-based agent · Planning rationality</p>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-4xl font-black text-emerald-400">
                        {plan.ai_insights.agent_rationality.rationality_percent?.toFixed(1) ?? 'N/A'}%
                      </span>
                    </div>
                    <div className="text-sm text-slate-400">Rationality score: <span className="text-white font-semibold">{plan.ai_insights.agent_rationality.rationality_score?.toFixed(3)}</span></div>
                  </div>
                )}

                {/* RL Route */}
                {plan.ai_insights.rl_route && (
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 md:col-span-2">
                    <h3 className="font-bold text-rose-400 mb-1">🗺️ Q-Learning Route Optimizer</h3>
                    <p className="text-xs text-slate-500 mb-3">Reinforcement Learning · Optimal attraction order</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.ai_insights.rl_route.optimized_route?.map((stop, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-sm">{stop}</span>
                          {i < (plan.ai_insights!.rl_route.optimized_route.length - 1) && (
                            <span className="text-slate-600">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 mt-3">
                      Converged at episode {plan.ai_insights.rl_route.convergence_episode} / {plan.ai_insights.rl_route.total_episodes}
                    </div>
                  </div>
                )}

                {/* K-Means Clustering */}
                {plan.ai_insights.clustering && (
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                    <h3 className="font-bold text-indigo-400 mb-1">🔵 K-Means Cluster</h3>
                    <p className="text-xs text-slate-500 mb-3">Unsupervised Learning · Traveler profile</p>
                    <div className="text-xl font-bold text-indigo-300 mb-1">{plan.ai_insights.clustering.assigned_cluster_name}</div>
                    <div className="text-sm text-slate-400">{plan.ai_insights.clustering.cluster_description}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
