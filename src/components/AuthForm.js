"use client";                                            // handles typing, clicks and redirects in the browser

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useLang } from "../lib/i18n/useLang";           // NEW: the visitor's language
import { AUTH } from "../lib/i18n/auth";                 // NEW: this form's words in 7 languages

const fieldClass =
  "mt-2 w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm text-ink outline-none focus:border-moss";

export default function AuthForm({ mode }) {             // mode: "login" or "signup"
  const router = useRouter();
  const params = useSearchParams();
  const lang = useLang();                                // NEW: "en", "fr", ...
  const w = AUTH[lang] || AUTH.en;                       // NEW: the words, English if a language is missing
  const [email, setEmail] = useState(params.get("email") ?? ""); // pre-fill from the homepage email box (or the link below)
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);       // is the password visible? starts hidden
  const [agreed, setAgreed] = useState(false);                   // ticked the Terms box? (sign-up only)
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(false);                   // true = show the "Almost there" box
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();                              // no full-page reload
    setError("");
    setNotice(false);

    if (password.length < 8) {
      setError(w.errShort);                              // CHANGED: translated
      return;
    }

    if (isSignup && !agreed) {                           // backup check in case the browser skips "required"
      setError(w.errAgree);                              // CHANGED: translated
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
      if (error) return setError(error.message);         // rare server errors stay in English (from Supabase)
      if (data.session) return router.push("/dashboard");
      setNotice(true);                                   // the box below covers new AND existing emails
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setPending(false);
      if (error?.code === "email_not_confirmed") {       // account exists but the email link hasn't been clicked
        return setError(w.errConfirm);                   // CHANGED: translated
      }
      if (error) return setError(w.errWrong);            // CHANGED: translated
      router.push("/dashboard");
    }
  }

  if (notice) {
    // Supabase answers the SAME way for new and existing emails (so nobody can test which emails
    // have accounts). This box therefore speaks to both, and gives a returning user a way forward.
    return (
      <div className="rounded-3xl bg-sage p-8 text-center">
        <p className="font-semibold text-ink">{w.almost}</p>
        <p className="mt-2 text-sm text-stone">{w.newEmail}</p>
        <p className="mt-4 text-sm text-stone">{w.haveAccount}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-medium">
          <Link
            href={`/login?email=${encodeURIComponent(email)}`}   // carries the email over, no retyping
            className="text-moss hover:text-forest"
          >
            {w.login}
          </Link>
          <Link href="/forgot-password" className="text-moss hover:text-forest">
            {w.forgot}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-line bg-water p-6 md:p-8">
      <label className="block text-sm font-medium text-ink">
        {w.email}
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
        {w.password}
        <div className="relative">                       {/* relative: lets the Show button sit inside the box */}
          <input
            type={showPassword ? "text" : "password"}    // text = visible, password = dots
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className={`${fieldClass} pr-20`}            // CHANGED: a bit more room, some languages have longer words
          />
          <button
            type="button"                                // "button", not "submit", so clicking it doesn't send the form
            onClick={() => setShowPassword(!showPassword)} // flip hidden ↔ visible
            aria-label={showPassword ? w.hideAria : w.showAria}
            className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-xs font-medium text-moss hover:text-forest"
          >
            {showPassword ? w.hide : w.show}
          </button>
        </div>
      </label>

      {!isSignup && (                                    // only on the login form
        <div className="mt-2 flex justify-end">          {/* right-aligned, like most apps */}
          <Link href="/forgot-password" className="text-xs font-medium text-moss hover:text-forest">
            {w.forgot}
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
            {w.agreePre}{" "}
            <Link href="/terms" target="_blank" className="font-medium text-moss hover:text-forest">{w.terms}</Link>,{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-moss hover:text-forest">{w.privacy}</Link>{" "}
            {w.and}{" "}
            <Link href="/risk" target="_blank" className="font-medium text-moss hover:text-forest">{w.risk}</Link>.
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
        {pending ? w.wait : isSignup ? w.create : w.login}
      </button>

      <p className="mt-6 text-center text-sm text-stone">
        {isSignup ? w.haveAccount : w.newHere}{" "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-moss hover:text-forest">
          {isSignup ? w.login : w.createLink}
        </Link>
      </p>
    </form>
  );
}