import { useAuth } from '../contexts/AuthContext';

interface CreditBadgeProps {
  onClick?: () => void;
  compact?: boolean;
}

export default function CreditBadge({ onClick, compact = false }: CreditBadgeProps) {
  const { credits, PLAN_CREDIT_COST } = useAuth();

  const isLow      = credits < PLAN_CREDIT_COST;
  const isVeryLow  = credits === 0;

  const colorClass = isVeryLow
    ? 'bg-red-500/20 border-red-500/50 text-red-400'
    : isLow
    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400';

  if (compact) {
    return (
      <button
        onClick={onClick}
        title={`${credits} credits remaining`}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-all hover:scale-105 ${colorClass}`}
      >
        <span className="text-base leading-none">⚡</span>
        <span>{credits}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold text-sm transition-all hover:scale-105 ${colorClass}`}
    >
      <span className="text-lg leading-none">⚡</span>
      <span>{credits} credit{credits !== 1 ? 's' : ''}</span>
      {isLow && !isVeryLow && (
        <span className="text-xs opacity-70">(low)</span>
      )}
      {isVeryLow && (
        <span className="text-xs opacity-70">(empty)</span>
      )}
    </button>
  );
}
