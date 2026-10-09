import { createClient } from "@supabase/supabase-js";     // the function that builds a connection

export const supabase = createClient(                      // one shared connection for the whole app
  process.env.NEXT_PUBLIC_SUPABASE_URL,                    // read from .env.local
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);