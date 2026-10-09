import Link from "next/link";
import TimeAgo from "./TimeAgo";
import { getNews } from "../lib/news";

export default async function NewsPreview() {            // a server component that fetches its own data
  const items = (await getNews().catch(() => [])).slice(0, 5); // just the 5 newest
  if (items.length === 0) return null;                   // no news? show nothing rather than an empty box

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-moss">News</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">What's moving markets</h2>
        </div>
        <Link href="/news" className="text-sm font-medium text-moss hover:text-forest">All news →</Link>
      </div>

      <ul className="mt-10 divide-y divide-line rounded-3xl border border-line">
        {items.map((item) => (
          <li key={item.id}>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="block px-6 py-5 hover:bg-mist">
              <p className="font-medium leading-snug text-ink">{item.title}</p>
              <p className="mt-2 text-xs text-stone">{item.source} · <TimeAgo date={item.date} /></p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}