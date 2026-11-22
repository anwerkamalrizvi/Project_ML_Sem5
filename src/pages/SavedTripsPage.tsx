import { SavedTrip, AppPage } from '../types';

interface SavedTripsPageProps {
  savedTrips: SavedTrip[];
  onLoadTrip: (trip: SavedTrip) => void;
  onDeleteTrip: (id: string) => void;
  onNavigate: (page: AppPage) => void;
}

export default function SavedTripsPage({ savedTrips, onLoadTrip, onDeleteTrip, onNavigate }: SavedTripsPageProps) {
  if (savedTrips.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pt-24 px-4">
        <div className="max-w-2xl mx-auto text-center py-24">
          <div className="text-7xl mb-6">📖</div>
          <h1 className="text-3xl font-bold mb-4">No Saved Trips Yet</h1>
          <p className="text-slate-400 text-lg mb-8">
            Plan your first AI-powered trip and save it here to access it anytime!
          </p>
          <button
            onClick={() => onNavigate('planner')}
            className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl text-lg font-bold hover:from-sky-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/30"
          >
            ✈️ Plan My First Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Saved Trips</h1>
            <p className="text-slate-400 mt-1">{savedTrips.length} trip{savedTrips.length > 1 ? 's' : ''} saved</p>
          </div>
          <button
            onClick={() => onNavigate('planner')}
            className="px-5 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-400 transition-colors flex items-center gap-2"
          >
            <span>+</span> New Trip
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savedTrips.map((trip) => {
            const duration = Math.ceil(
              (new Date(trip.preferences.endDate).getTime() - new Date(trip.preferences.startDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            return (
              <div
                key={trip.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-sky-500/30 transition-all group"
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                        {trip.plan.destination}
                      </h2>
                      <p className="text-slate-500 text-sm mt-0.5">
                        From {trip.preferences.origin}
                      </p>
                    </div>
                    <div className="text-3xl">🌍</div>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
                    {trip.plan.overview}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800 rounded-xl p-3 text-center">
                      <div className="text-sky-400 font-bold">{duration}</div>
                      <div className="text-slate-500 text-xs">Days</div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-3 text-center">
                      <div className="text-emerald-400 font-bold">{trip.preferences.travelers}</div>
                      <div className="text-slate-500 text-xs">Travelers</div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-3 text-center">
                      <div className="text-amber-400 font-bold text-sm">{trip.preferences.currency} {(trip.preferences.budget / 1000).toFixed(0)}k</div>
                      <div className="text-slate-500 text-xs">Budget</div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="px-6 pb-3 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded-full">
                    📅 {trip.preferences.startDate}
                  </span>
                  <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded-full capitalize">
                    {trip.preferences.travelStyle}
                  </span>
                  {trip.preferences.interests.slice(0, 2).map((interest) => (
                    <span key={interest} className="text-xs px-2 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                      {interest.split(' ')[0]} {interest.split(' ').slice(1).join(' ')}
                    </span>
                  ))}
                </div>

                {/* Saved date */}
                <div className="px-6 pb-4 text-slate-600 text-xs">
                  Saved {new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>

                {/* Actions */}
                <div className="px-6 pb-5 flex gap-3">
                  <button
                    onClick={() => onLoadTrip(trip)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-sky-400 hover:to-blue-500 transition-all"
                  >
                    📋 View Plan
                  </button>
                  <button
                    onClick={() => {
                      onLoadTrip(trip);
                      onNavigate('chat');
                    }}
                    className="py-2.5 px-4 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors border border-slate-700"
                  >
                    💬 Chat
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete trip to ${trip.plan.destination}?`)) {
                        onDeleteTrip(trip.id);
                      }
                    }}
                    className="py-2.5 px-3 bg-red-500/10 text-red-400 rounded-xl text-sm hover:bg-red-500/20 transition-colors border border-red-500/20"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
