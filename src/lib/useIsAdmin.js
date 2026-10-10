"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useUser } from "./useUser";

// returns { isAdmin, pending }: pending = posts waiting for review (hidden or reported)
export function useIsAdmin() {
  const user = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setPending(0); return; } // logged out = not admin
    let active = true;

    async function check() {
      const { data: admin } = await supabase.rpc("is_admin"); // the database decides, not the browser
      if (!active) return;
      setIsAdmin(Boolean(admin));
      if (!admin) return;
      const { data: queue } = await supabase.rpc("moderation_queue"); // same list the /admin page shows
      if (active) setPending(queue?.length ?? 0);
    }

    check();
    return () => { active = false; };
  }, [user]);

  return { isAdmin, pending };
}