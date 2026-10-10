import { supabase } from "./supabase";

export const NOTIFS_READ = "goat:notifications-read"; // browser event: "I've read everything, reset the bell"

export async function markAllRead(userId) {
  await supabase
    .from("notifications")
    .update({ is_read: true })              // the only column we're allowed to change
    .eq("user_id", userId)
    .eq("is_read", false);                  // only touch the unread ones
  window.dispatchEvent(new Event(NOTIFS_READ)); // every bell on the page drops to 0
}