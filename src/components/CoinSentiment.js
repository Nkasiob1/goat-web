"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import SentimentBar from "./SentimentBar";

export default function CoinSentiment({ coin }) {        // coin = "BTC"
  const [data, setData] = useState(undefined);           // undefined = loading, null = no posts yet

  useEffect(() => {
    supabase.from("coin_sentiment").select("*").eq("coin", coin).maybeSingle()
      .then(({ data }) => setData(data));
  }, [coin]);

  const calls = data ? data.bullish + data.bearish : 0;  // posts that picked a side

  return (
    <div className="rounded-3xl border border-line bg-water p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">Community sentiment</p>
        <span className="text-xs text-stone">Last 24h</span>
      </div>

      {data === undefined ? (
        <div className="mt-3 h-6 animate-pulse rounded bg-mist"></div>
      ) : calls === 0 ? (
        <p className="mt-2 text-sm text-stone">No bullish or bearish calls on {"$" + coin} yet.</p>
      ) : (
        <>
          <SentimentBar bullish={data.bullish} bearish={data.bearish} />
          <p className="mt-2 text-xs text-stone">Based on {calls} {calls === 1 ? "call" : "calls"} from GOAT members. Not financial advice.</p>
        </>
      )}

      <Link href={`/community?coin=${coin}`} className="mt-4 inline-block text-sm font-medium text-moss hover:text-forest">
        Discuss {"$" + coin} →
      </Link>
    </div>
  );
}