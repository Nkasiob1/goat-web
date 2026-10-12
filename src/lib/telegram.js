// lib/telegram.js: post to the @Goatsradar channel, with a picture when we have one

// Telegram's HTML mode breaks on raw < > &, so escape them
export function escapeHtml(text = "") {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Call any Telegram method and throw a clear error if it refuses
async function callTelegram(token, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description}`); // e.g. "wrong file identifier"
  return json;
}

// Send an alert: photo + caption if photoUrl is given, otherwise plain text.
// Returns { skipped: true } when the keys are missing.
export async function sendTelegram(html, photoUrl) {
  const token = process.env.TELEGRAM_BOT_TOKEN; // the bot's token (server only)
  const chat = process.env.TELEGRAM_CHANNEL;    // @Goatsradar
  if (!token || !chat) return { skipped: true };

  if (photoUrl) {
    try {
      return await callTelegram(token, "sendPhoto", {
        chat_id: chat,
        photo: photoUrl,       // Telegram downloads the card from this URL
        caption: html,         // the alert text sits under the picture (max 1024 characters)
        parse_mode: "HTML",
      });
    } catch {
      // Picture failed (site asleep, bad image…): fall through and send text instead
    }
  }

  return callTelegram(token, "sendMessage", {
    chat_id: chat,
    text: html,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}