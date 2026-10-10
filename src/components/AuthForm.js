"use client";                                            // handles typing, clicks and redirects in the browser

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

const fieldClass =
  "mt-2 w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm text-ink outline-none focus:border-moss";

export default function AuthForm({ mode }) {             // mode: "login" or "signup"
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? ""); // pre-fill from the homepage email box
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);       // NEW: is the password visible? starts hidden
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();                              // no full-page reload
    setError("");
    setNotice("");

    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    setPending(true);

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setPending(false);
      if (error) return setError(error.message);
      if (data.session) return router.push("/dashboard");
      setNotice("Check your email and click the link to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setPending(false);
      if (error?.code === "email_not_confirmed") {       // account exists but the email link hasn't been clicked
        return setError("Please confirm your email first. Check your inbox and spam folder.");
      }
      if (error) return setError("Email or password is incorrect.");
      router.push("/dashboard");
    }
  }

  if (notice) {
    return (
      <div className="rounded-3xl bg-sage p-8 text-center">
        <p className="font-semibold text-ink">Almost there</p>
        <p className="mt-2 text-sm text-stone">{notice}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-line bg-water p-6 md:p-8">
      <label className="block text-sm font-medium text-ink">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className={fieldClass}
        />
      </label>

      <label className="mt-5 block text-sm font-medium text-ink">
        Password
        <div className="relative">                       {/* relative: lets the Show button sit inside the box */}
          <input
            type={showPassword ? "text" : "password"}    // text = visible, password = dots
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className={`${fieldClass} pr-16`}            // pr-16 leaves room on the right so text doesn't run under the button
          />
          <button
            type="button"                                // "button", not "submit", so clicking it doesn't send the form
            onClick={() => setShowPassword(!showPassword)} // flip hidden ↔ visible
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-xs font-medium text-moss hover:text-forest" /* pinned to the right, centred vertically */
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      {error && <p className="mt-4 text-sm text-loss">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss disabled:opacity-60"
      >
        {pending ? "Please wait…" : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="mt-6 text-center text-sm text-stone">
        {isSignup ? "Already have an account? " : "New to GOAT? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-moss hover:text-forest">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}