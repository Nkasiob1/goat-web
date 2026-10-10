"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");          // idle | sending | sent
  const [error, setError] = useState("");

  async function send(e) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`, // where the email link lands (works on localhost and live)
    });
    if (error) {
      setStatus("idle");
      return setError(
        error.status === 429
          ? "Too many requests. Please wait a few minutes and try again." // Supabase's rate limit
          : "Couldn't send the email. Check the address and try again."
      );
    }
    setStatus("sent");
  }

  if (status === "sent") {                               // same message whether the account exists or not (privacy)
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /> {/* envelope */}
          </svg>
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-stone">
          If an account exists for <span className="font-medium text-ink">{email.trim()}</span>, a reset link is on its way.
          It expires in 1 hour. Check your spam folder if you don't see it.
        </p>
        <button onClick={() => setStatus("idle")} className="mt-6 text-sm font-medium text-moss hover:text-forest">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={send}>
      <h1 className="text-xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-stone">Enter the email you signed up with and we'll send you a reset link.</p>

      <label className="mt-6 block text-sm font-medium text-ink" htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"                             // lets phones autofill it
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="mt-2 w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm text-ink outline-none focus:border-moss"
      />

      {error && <p className="mt-3 text-sm text-loss">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 w-full rounded-full bg-forest py-3 text-sm font-medium text-water hover:bg-moss disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send reset link"}
      </button>

      <p className="mt-6 text-center text-sm text-stone">
        Remembered it? <Link href="/login" className="font-medium text-moss hover:text-forest">Back to log in</Link>
      </p>
    </form>
  );
}