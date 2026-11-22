import { AppPage } from '../types';

interface PaymentCancelPageProps {
  onNavigate: (page: AppPage) => void;
}

export default function PaymentCancelPage({ onNavigate }: PaymentCancelPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">↩️</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Payment Cancelled</h1>
        <p className="text-slate-400 mb-8">
          No charge was made. You can try again whenever you're ready.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onNavigate('pricing' as AppPage)}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl hover:from-sky-400 hover:to-blue-500 transition-all"
          >
            💳 Try Again
          </button>
          <button
            onClick={() => onNavigate('planner')}
            className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Continue without buying
          </button>
        </div>
      </div>
    </div>
  );
}
