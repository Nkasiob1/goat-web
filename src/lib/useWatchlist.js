"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { useUser } from "./useUser";

export function useWatchlist() {
  const router = useRouter();
  const user = useUser();
  const [symbols, setSymbols] = useState([]);            // the saved coins, e.g. ["BTCUSDT", "SOLUSDT"]

  useEffect(() => {
    if (!user) { setSymbols([]); return; }               // logged out (or still checking): nothing saved to show
    supabase
      .from("watchlist")
      .select("symbol")                                  // RLS means this only returns THIS user's rows
      .then(({ data }) => setSymbols((data ?? []).map((row) => row.symbol)));
  }, [user]);

  async function toggle(symbol) {
    if (user === undefined) return;                      // still checking who's logged in; ignore the tap
    if (user === null) return router.push("/login");     // logged out: send them to log in

    const saved = symbols.includes(symbol);

    setSymbols((prev) => (saved ? prev.filter((s) => s !== symbol) : [...prev, symbol])); // optimistic: update the star now

    const { error } = saved
      ? await supabase.from("watchlist").delete().eq("symbol", symbol) // remove (RLS limits it to their own row)
      : await supabase.from("watchlist").insert({ symbol });          // add (user_id fills in automatically)

    if (error) {                                         // the save failed: flip the star back
      console.error(error);
      setSymbols((prev) => (saved ? [...prev, symbol] : prev.filter((s) => s !== symbol)));
    }
  }

  return { symbols, toggle };
}
