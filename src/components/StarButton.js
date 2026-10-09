"use client";

export default function StarButton({ active, onClick, label }) { // active = is it saved? label = optional text beside it
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}                              // screen readers announce "pressed" when saved
      aria-label={active ? "Remove from watchlist" : "Add to watchlist"}
      className={`inline-flex items-center gap-2 rounded-full transition ${
        label ? "border border-line px-4 py-2 text-sm font-medium hover:border-moss" : "p-1" // pill with text, or just the star
      } ${active ? "text-forest" : "text-stone hover:text-ink"}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z" /> {/* a five-point star */}
      </svg>
      {label && <span>{active ? "On your watchlist" : label}</span>}
    </button>
  );
}