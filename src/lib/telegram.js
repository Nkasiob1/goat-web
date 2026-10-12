// lib/telegram.js: post a message to the @Goatsradar channel

// Telegram's HTML mode breaks on raw < > &, so escape them
export function escapeHtml(text = "") {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Send one HTML message; returns { skipped: true } when keys are missing
export async function sendTelegram(html) {
  const token = process.env.TELEGRAM_BOT_TOKEN;   // the bot's token (server only)
  const chat = process.env.TELEGRAM_CHANNEL;      // @Goatsradar
  if (!token || !chat) return { skipped: true };  // not set up → do nothing

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,                    // where to post
      text: html,                       // the message
      parse_mode: "HTML",               // allow <b>, <a>, <code>
      disable_web_page_preview: true,   // keep posts compact
    }),
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Telegram: ${json.description}`); // e.g. "chat not found"
  return json;
}