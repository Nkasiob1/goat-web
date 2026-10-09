"use client";                                            // hooks run in the browser

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useUser() {                              // any component can now ask: "who's logged in?"
  const [user, setUser] = useState(null);                // null = logged out (or not checked yet)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null)); // check once on load
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);                    // update instantly on login / logout
    });
    return () => listener.subscription.unsubscribe();    // stop listening when the component leaves
  }, []);

  return user;                                           // hand back the user (or null)
}

