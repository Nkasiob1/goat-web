"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useUser } from "./useUser";

export const PROFILE_EVENT = "goat:profile-updated";     // the "announcement" name, shared by everyone

export function announceProfileChange() {               // call this after changing a photo or username
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function useProfile() {
  const user = useUser();                                // undefined = checking, null = logged out
  const [profile, setProfile] = useState(undefined);     // undefined = loading, null = no profile yet

  useEffect(() => {
    if (!user) { setProfile(user === null ? null : undefined); return; }

    let active = true;                                   // guards against updating after the component has gone
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (active) setProfile(data);
    }

    load();
    window.addEventListener(PROFILE_EVENT, load);       // listen: reload whenever the profile changes anywhere
    return () => {
      active = false;
      window.removeEventListener(PROFILE_EVENT, load);  // stop listening when this component leaves
    };
  }, [user]);

  return { user, profile };
}