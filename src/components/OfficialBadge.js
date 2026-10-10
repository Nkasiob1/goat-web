const OFFICIAL = new Set(["goat"]);                      // official accounts (lowercase)

export function isOfficial(username) {
  return OFFICIAL.has(username?.toLowerCase());
}

export default function OfficialBadge({ username, size = 16 }) {
  if (!isOfficial(username)) return null;                // everyone else: nothing
  return (
    <span title="Official GOAT account" aria-label="Official GOAT account" className="inline-flex shrink-0 text-[#B48F3E]"> {/* gold, like the coin */}
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" /> {/* rosette */}
        <path d="M8.5 12.2l2.3 2.3 4.7-4.8" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> {/* tick */}
      </svg>
    </span>
  );
}