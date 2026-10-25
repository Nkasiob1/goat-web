"use client"; // needs to know who's logged in, and handles typing in the coin box

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "../lib/useProfile";
import S from "./S";                                      // NEW: translated words

export default function HeroCta() {
  const router = useRouter();
  const { user, profile } = useProfile();                 // undefined = checking, null = logged out
  const [address, setAddress] = useState("");             // CHANGED: the coin box (was the email box)

  function check(e) {                                     // NEW: open the Vet page with the pasted address
    e.preventDefault();                                   // stop the browser reloading the page
    const q = address.trim();                             // remove spaces people paste by accident
    router.push(q ? `/vet?q=${encodeURIComponent(q)}` : "/vet"); // same link format the Telegram bot uses
  }

  return (
    <div className="mt-8 max-w-md">
      {/* NEW: the coin box, the first thing everyone can DO on GOAT */}
      <form onSubmit={check} className="flex items-center gap-2 rounded-full border border-line bg-mist p-1.5">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Paste a contract address (0x… or Solana)"
          aria-label="Contract address"
          autoComplete="off"                              // addresses aren't worth remembering in the browser
          spellCheck={false}                              // no red squiggles under long addresses
          className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-stone"
        />
        <button type="submit" className="shrink-0 rounded-full bg-forest px-5 py-3 text-sm font-medium text-water hover:bg-moss">
          <S k="hero.vetBtn" />                           {/* "Check coin" in the visitor's language */}
        </button>
      </form>

      {user === undefined && <div className="mt-4 h-11" aria-hidden="true"></div>} {/* still checking: hold the space so the page doesn't jump */}

      {user && (                                          /* a member: welcome back + their shortcuts */
        <>
          <p className="mt-4 text-sm text-stone">
            Welcome back{profile?.username ? <>, <span className="font-semibold text-ink">@{profile.username}</span></> : ""}.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-mist">
              Go to dashboard
            </Link>
            <Link href="/community" className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-mist">
              Open community
            </Link>
          </div>
        </>
      )}

      {user === null && (                                 /* a visitor: sign-up comes second, after they've seen what GOAT does */
        <Link href="/signup" className="mt-4 inline-block text-sm font-medium text-moss hover:text-ink">
          <S k="hero.signup" />
        </Link>
      )}
    </div>
  );
}