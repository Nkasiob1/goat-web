"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function ResetPasswordForm() {
  const [stage, setStage] = useState("checking");        // checking | ready | invalid | done
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // an expired or used link comes back with an error in the address
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
    if (params.get("error")) { setStage("invalid"); return; }

    // the Supabase client reads the link automatically and signs the user in for this reset
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setStage("ready");
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setStage("ready"); });

    const timer = setTimeout(() => setStage((s) => (s === "checking" ? "invalid" : s)), 5000); // nothing after 5s = bad link
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      return setError(
        error.code === "same_password" ? "Choose a password you haven't used before." :
        error.code === "weak_password" ? "That password is too weak. Add more characters or mix in numbers." :
        "Couldn't update your password. Please request a new link."
      );
    }
    setStage("done");
  }

  if (stage === "checking") {
    return <p className="py-10 text-center text-sm text-stone">Checking your reset link…</p>;
  }

  if (stage === "invalid") {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold text-ink">This link has expired</h1>
        <p className="mt-2 text-sm text-stone">Reset links work once and last 1 hour. Request a fresh one.</p>
        <Link href="/forgot-password" className="mt-6 inline-block rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss">
          Send a new link
        </Link>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">Password updated</h1>
        <p className="mt-2 text-sm text-stone">You're logged in with your new password.</p>
        <Link href="/dashboard" className="mt-6 inline-block rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss">
          Go to your dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={save}>
      <h1 className="text-xl font-semibold text-ink">Choose a new password</h1>
      <p className="mt-1 text-sm text-stone">At least 8 characters. Use something you don't use anywhere else.</p>

      <label className="mt-6 block text-sm font-medium text-ink" htmlFor="password">New password</label>
      <div className="relative mt-2">
        <input
          id="password"
          type={show ? "text" : "password"}
          required
          autoComplete="new-password"                    // phones offer a strong suggested password
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-line bg-mist px-4 py-3 pr-16 text-sm text-ink outline-none focus:border-moss"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-3 text-xs font-medium text-moss">
          {show ? "Hide" : "Show"}
        </button>
      </div>

      <label className="mt-4 block text-sm font-medium text-ink" htmlFor="confirm">Confirm new password</label>
      <input
        id="confirm"
        type={show ? "text" : "password"}
        required
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="mt-2 w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm text-ink outline-none focus:border-moss"
      />

      {error && <p className="mt-3 text-sm text-loss">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-forest py-3 text-sm font-medium text-water hover:bg-moss disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}