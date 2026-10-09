"use client";

import { useWatchlist } from "../lib/useWatchlist";
import StarButton from "./StarButton";

export default function CoinStar({ symbol }) {           // the coin page is a server page, so the star needs its own small client part
  const { symbols, toggle } = useWatchlist();
  return (
    <StarButton active={symbols.includes(symbol)} onClick={() => toggle(symbol)} label="Add to watchlist" />
  );
}