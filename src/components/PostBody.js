import Link from "next/link";
import { splitCashtags } from "../lib/cashtags";

export default function PostBody({ text, className = "" }) { // post text with every $TAG turned into a link
  return (
    <p className={`whitespace-pre-line break-words ${className}`}>
      {splitCashtags(text).map((part, i) =>
        part.type === "tag" ? (
          <Link key={i} href={`/community?coin=${part.value}`} className="font-medium text-moss hover:underline">
            {"$" + part.value}                           {/* tapping $BTC shows all BTC posts */}
          </Link>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </p>
  );
}