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
  const [email, setEmail] = useState(params.get("email") ?? ""); // pre-fill from the homepage email box (or the link below)
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);       // is the password visible? starts hidden
  const [agreed, setAgreed] = useState(false);                   // ticked the Terms box? (sign-up only)
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(false);                   // CHANGED: true = show the "Almost there" box
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();                              // no full-page reload
    setError("");
    setNotice(false);

    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    if (isSignup && !agreed) {                           // backup check in case the browser skips "required"
      setError("Please confirm you're 18+ and agree to the Terms to continue.");
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
      setNotice(true);                                   // CHANGED: the box below covers new AND existing emails
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
    // CHANGED: Supabase answers the SAME way for new and existing emails (so nobody can test which emails
    // have accounts). This box therefore speaks to both, and gives a returning user a way forward.
    return (
      <div className="rounded-3xl bg-sage p-8 text-center">
        <p className="font-semibold text-ink">Almost there</p>
        <p className="mt-2 text-sm text-stone">
          If this email is new to GOAT, check your inbox (and spam folder) and click the link to confirm your account.
        </p>
        <p className="mt-4 text-sm text-stone">Already have an account?</p>
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-medium">
          <Link
            href={`/login?email=${encodeURIComponent(email)}`}   // carries the email over, no retyping
            className="text-moss hover:text-forest"
          >
            Log in
          </Link>
          <Link href="/forgot-password" className="text-moss hover:text-forest">
            Forgot password?
          </Link>
        </div>
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
            className={`${fieldClass} pr-16`}            // room on the right so text doesn't run under the button
          />
          <button
            type="button"                                // "button", not "submit", so clicking it doesn't send the form
            onClick={() => setShowPassword(!showPassword)} // flip hidden ↔ visible
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-xs font-medium text-moss hover:text-forest"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      {!isSignup && (                                    // only on the login form
        <div className="mt-2 flex justify-end">          {/* right-aligned, like most apps */}
          <Link href="/forgot-password" className="text-xs font-medium text-moss hover:text-forest">
            Forgot password?
          </Link>
        </div>
      )}

      {isSignup && (                                     // agreement box, sign-up only
        <label className="mt-5 flex items-start gap-3 text-sm text-stone">
          <input
            type="checkbox"
            required                                     // the browser won't submit until it's ticked
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-forest" // accent-forest: GOAT green tick
          />
          <span className="leading-relaxed">
            I&apos;m 18 or older and agree to the{" "}
            <Link href="/terms" target="_blank" className="font-medium text-moss hover:text-forest">Terms</Link>,{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-moss hover:text-forest">Privacy Policy</Link> and{" "}
            <Link href="/risk" target="_blank" className="font-medium text-moss hover:text-forest">Risk Disclosure</Link>.
            {/* target="_blank": opens in a new tab so the half-filled form isn't lost */}
          </span>
        </label>
      )}

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