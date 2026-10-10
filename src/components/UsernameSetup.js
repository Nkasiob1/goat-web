"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { announceProfileChange } from "../lib/useProfile";

export default function UsernameSetup() {                // used on the dashboard for members without a profile yet
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  async function save(e) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("profiles").insert({ username: username.trim() });
    if (!error) return announceProfileChange();          // everyone refreshes; the dashboard shows the full profile
    if (error.code === "23505") setError("That username is taken.");
    else if (error.code === "23514") setError("Use 3–20 letters, numbers or underscores.");
    else { console.error(error); setError("Something went wrong. Please try again."); }
  }

  return (
    <form onSubmit={save} className="rounded-3xl border border-line bg-water p-6">
      <p className="font-semibold text-ink">Set up your profile</p>
      <p className="mt-1 text-sm text-stone">Pick a username. It's how you'll appear across GOAT. Your email stays private.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. goat_trader"
          required
          className="w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm text-ink outline-none focus:border-moss"
        />
        <button type="submit" className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss">Save</button>
      </div>
      {error && <p className="mt-3 text-sm text-loss">{error}</p>}
    </form>
  );
}