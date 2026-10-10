export default function SentimentBar({ bullish, bearish }) { // a two-colour bar: green share vs red share
  const total = bullish + bearish;
  if (total === 0) return null;
  const bullPct = Math.round((bullish / total) * 100);

  return (
    <div className="mt-2">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-mist">
        <div className="bg-gain" style={{ width: `${bullPct}%` }}></div>       {/* bullish share */}
        <div className="bg-loss" style={{ width: `${100 - bullPct}%` }}></div> {/* bearish share */}
      </div>
      <div className="mt-1 flex justify-between text-[11px]">
        <span className="text-gain">{bullPct}% bullish</span>
        <span className="text-loss">{100 - bullPct}% bearish</span>
      </div>
    </div>
  );
}