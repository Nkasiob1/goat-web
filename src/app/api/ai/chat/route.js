// src/app/api/ai/chat/route.js
// The website's GOAT AI chat. GET = my GOAT ID + access status. POST { message, lang } = one reply.
// Logged-in users only: the browser sends its Supabase login token, and we check it on the server.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { askGoat } from "../../../../lib/goatAgent";
import { a } from "../../../../lib/i18n/ai";                   // NEW: the "ask more" hint in their language
import { getAccess, gate, webAllowed, bumpUsage, loadHistory, saveTurn, saveNickname, isPaid, FREE_AI_CHATS } from "../../../../lib/aiAccess";

export const maxDuration = 60;                              // expert answers + tools can take a while

const LANGS = ["en", "fr", "es", "pt", "ar", "hi", "fa", "ha", "yo", "ig"];

// Who is asking? (null if not logged in)
async function currentUser(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!token) return null;
  const { data } = await supabaseAdmin().auth.getUser(token); // Supabase checks the token is real and not expired
  return data?.user || null;
}

// What the chat window shows about access
const status = (row) => ({
  code: row.code,
  paid: isPaid(row),
  paidUntil: row.paid_until || null,
  freeLeft: Math.max(0, FREE_AI_CHATS - (row.free_used || 0)),
});

export async function GET(request) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ loggedIn: false });
  const row = await getAccess({ userId: user.id });
  return NextResponse.json({ loggedIn: true, ...status(row) });
}

export async function POST(request) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const message = String(body.message || "").trim().slice(0, 1000);   // cap the length
  const lang = LANGS.includes(body.lang) ? body.lang : "en";
  if (!message) return NextResponse.json({ error: "empty" }, { status: 400 });

  const row = await getAccess({ userId: user.id });
  const access = gate(row);
  if (!access.ok) return NextResponse.json({ locked: access.reason, ...status(row) }); // trial over / daily cap / AI off

  const history = await loadHistory(row.code, "web");
  const last = history[history.length - 1];
  if (last?.role === "user") last.content += "\n" + message;
  else history.push({ role: "user", content: message });

  let ans;
  try {
    ans = await askGoat({ history, lang, nickname: row.nickname, allowWeb: webAllowed(row), channel: "web" });
  } catch (err) {
    console.error("GOAT AI web error:", err.message);
    return NextResponse.json({ error: "ai" }, { status: 502 });
  }
  if (!ans.text && !ans.coins && !ans.report) return NextResponse.json({ error: "ai" }, { status: 502 });

  if (ans.nickname) await saveNickname(row, ans.nickname);
  await saveTurn(row.code, "web", message, [ans.text, ans.memo].filter(Boolean).join("\n"));
  await bumpUsage(row, ans.searches || 0);

  const after = { ...row, free_used: isPaid(row) ? row.free_used : (row.free_used || 0) + 1 };
  return NextResponse.json({
    text: ans.truncated ? `${ans.text}\n\n${a("more", lang)}` : ans.text, // NEW: say so when it was cut short
    coins: (ans.coins || []).slice(0, 8).map((c) => ({ symbol: c.symbol, chain: c.chainLabel, official: c.official, copycat: c.copycat, address: c.address })),
    report: ans.report ? { symbol: ans.report.token.symbol, chain: ans.report.token.chainLabel, verdict: ans.report.verdict, address: ans.report.token.address } : null,
    ...status(after),
  });
}
