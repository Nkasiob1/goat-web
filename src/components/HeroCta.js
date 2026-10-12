"use client"; // needs to know who's logged in

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "../lib/useProfile";

export default function HeroCta() {
  const router = useRouter();
  const { user, profile } = useProfile();                 // undefined = checking, null = logged out
  const [email, setEmail] = useState("");

  if (user === undefined) {                               // still checking: hold the space so the page doesn't jump
    return <div className="mt-8 h-16 max-w-md" aria-hidden="true"></div>;
  }

  if (user) {                                             // a member: welcome them back instead of selling sign-up
    return (
      <div className="mt-8 max-w-md">
        <p className="text-sm text-stone">
          Welcome back{profile?.username ? <>, <span className="font-semibold text-ink">@{profile.username}</span></> : ""}.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss">
            Go to dashboard
          </Link>
          <Link href="/community" className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink hover:bg-mist">
            Open community
          </Link>
        </div>
      </div>
    );
  }

  function start(e) {                                     // a visitor: carry their email into the sign-up form
    e.preventDefault();
    const q = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : "";
    router.push(`/signup${q}`);
  }

  return (
    <form onSubmit={start} className="mt-8 flex max-w-md items-center gap-2 rounded-full border border-line bg-mist p-1.5">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        autoComplete="email"
        aria-label="Email address"
        className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-stone"
      />
      <button type="submit" className="shrink-0 rounded-full bg-forest px-5 py-3 text-sm font-medium text-water hover:bg-moss">
        Get started
      </button>
    </form>
  );
}