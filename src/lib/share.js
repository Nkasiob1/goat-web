// phones: open the share sheet (WhatsApp, X, Telegram…); laptops: copy the link
export async function sharePost(url, text) {
  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches; // finger, not mouse
  if (touch && navigator.share) {
    try {
      await navigator.share({ url, text });
      return "shared";
    } catch (err) {
      if (err.name === "AbortError") return "cancelled"; // they closed the sheet
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    window.prompt("Copy this link:", url);               // last resort
    return "prompted";
  }
}