// a tidy "open this" card under bot posts: icon, title, website name, arrow
export default function LinkCard({ url, title }) {
  if (!url) return null;
  let host;
  try {
    host = new URL(url).hostname.replace(/^www\./, ""); // "www.decrypt.co" → "decrypt.co"
  } catch {
    return null;                                         // broken link, so show nothing
  }

  return (
    <a
      href={url}
      target="_blank"                                    // opens in a new tab, so GOAT stays open
      rel="noopener noreferrer nofollow"                 // security + don't pass our ranking to other sites
      onClick={(e) => e.stopPropagation()}               // don't also open the post page
      className="mt-3 flex items-center gap-3 rounded-2xl border border-line px-4 py-3 transition hover:bg-mist"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage text-moss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />  {/* chain link */}
          <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{title || "Open link"}</span>
        <span className="block truncate text-xs text-stone">{host}</span>
      </span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone">
        <path d="M7 17L17 7M9 7h8v8" />                    {/* ↗ */}
      </svg>
    </a>
  );
}