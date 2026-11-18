"use client"; // runs in the browser: the floating "Ask GOAT AI" chat on every page

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";            // to hide the chat on the payment pages
import { supabase } from "@/lib/supabase";                 // to read the visitor's login token
import { useUser } from "@/lib/useUser";                   // undefined = checking, null = logged out, object = logged in
import { useLang } from "@/lib/i18n/useLang";              // current site language
import { a } from "@/lib/i18n/ai";                         // this window's words, 10 languages

// Turn plain text into text + safe links (full https links, and site paths like /vet or /pay)
function Linkify({ text, onNavigate }) {
  const parts = String(text).split(/(https?:\/\/[^\s)]+|(?<![\w/])\/(?:vet|radar|scanner|markets|charts|news|community|dashboard|download|signup|login|pay|terms|privacy|risk|advertise|notifications)(?:[/?][^\s)]*)?)/g);
  return parts.map((p, i) => {
    if (/^https?:\/\//.test(p)) return <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all text-forest underline">{p}</a>;
    if (p.startsWith("/")) return <Link key={i} href={p} onClick={onNavigate} className="text-forest underline">{p}</Link>; // CHANGED: closes the chat
    return <span key={i}>{p}</span>;
  });
}

// The browser's login token, sent so the server knows who is asking
async function authHeader() {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

const VERDICT = { red: "🔴", yellow: "🟡", green: "🟢" };

// NEW: shrink a picture in the browser before sending (max 1568px on the long side, JPEG).
// Keeps uploads small and fast; 1568px is as much detail as the AI uses anyway.
// Returns { data: base64, mediaType, preview: dataURL } or null if it isn't a readable image.
async function shrinkImage(file) {
  if (!file || !file.type.startsWith("image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);                       // decode the picture
    const scale = Math.min(1, 1568 / Math.max(bitmap.width, bitmap.height)); // never make it bigger
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const preview = canvas.toDataURL("image/jpeg", 0.85);               // "data:image/jpeg;base64,...."
    return { data: preview.split(",")[1], mediaType: "image/jpeg", preview };
  } catch {
    return null;                                                        // e.g. a HEIC file the browser can't open
  }
}

export default function AiChat() {
  const user = useUser();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);                    // { role: "user" | "bot", text, coins?, report? }
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(null);                  // { code, paid, paidUntil, freeLeft, locked? }
  const [linkInfo, setLinkInfo] = useState(null);          // NEW: { text: "LINK 482913", whatsapp } while linking WhatsApp
  const [shot, setShot] = useState(null);                  // NEW: the screenshot waiting to be sent { data, mediaType, preview }
  const listRef = useRef(null);
  const fileRef = useRef(null);                            // NEW: the hidden file picker
  const pathname = usePathname();                          // CHANGED: kept, to know when we're already on /vet
  const onPayPage = pathname?.startsWith("/pay");          // the floating button would cover the Pay button there

  // NEW: "View full check" / a coin in the list. The chat covers the page on phones, so close it first.
  // Already on /vet? The page doesn't reload for a new ?q=, so update the address and tell the page to check.
  function openCheck(e, address) {
    setOpen(false);
    if (pathname !== "/vet") return;                       // anywhere else: the normal link loads /vet?q=...
    e.preventDefault();
    window.history.pushState(null, "", `/vet?q=${encodeURIComponent(address)}`); // the address bar shows the coin
    window.dispatchEvent(new CustomEvent("goat:vet", { detail: address }));      // VetView runs the check
  }

  // When opened by a logged-in visitor: load their GOAT ID and free chats left
  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const res = await fetch("/api/ai/chat", { headers: await authHeader() });
      if (res.ok) setInfo(await res.json());
    })();
  }, [open, user]);

  // Keep the newest message in view
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  // NEW: "Link WhatsApp" -> ask the server for a one-time code, then they send it to the WhatsApp bot
  async function startLink() {
    try {
      const res = await fetch("/api/ai/link", { method: "POST", headers: await authHeader() });
      const data = await res.json();
      if (res.ok && data.text) setLinkInfo(data);
      else setMsgs((m) => [...m, { role: "bot", text: a("error", lang) }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: a("error", lang) }]);
    }
  }

  // NEW: a picture was chosen -> shrink it and show a small preview above the message box
  async function pickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";                                   // so the same file can be picked again later
    if (!file) return;
    const img = await shrinkImage(file);
    if (img) setShot(img);
    else setMsgs((m) => [...m, { role: "bot", text: a("badImage", lang) }]); // couldn't read it
  }

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    const image = shot;                                    // NEW: the screenshot going with this message (if any)
    if ((!text && !image) || busy) return;
    setInput("");
    setShot(null);
    setMsgs((m) => [...m, { role: "user", text, preview: image?.preview }]); // the preview stays in this window only
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ message: text, lang, image: image ? { data: image.data, mediaType: image.mediaType } : undefined }),
      });
      const data = await res.json();
      if (data.locked) setInfo(data);                      // trial over or daily limit: show the upgrade box
      else if (!res.ok || data.error) setMsgs((m) => [...m, { role: "bot", text: a("error", lang) }]);
      else {
        setMsgs((m) => [...m, { role: "bot", text: data.text, coins: data.coins, report: data.report }]);
        setInfo(data);
      }
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: a("error", lang) }]);
    } finally {
      setBusy(false);
    }
  }

  if (onPayPage) return null;                              // no chat on /pay and /pay/done (after the hooks, as React requires)

  const locked = info?.locked;
  const payHref = `/pay${info?.code ? `?id=${info.code}` : ""}`;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] end-3 z-40 flex items-center gap-2 rounded-full bg-forest px-4 py-3 text-sm font-semibold text-water shadow-lg hover:bg-moss md:bottom-6 md:end-6"
        >
          <span aria-hidden="true">🐐</span> {a("open", lang)}
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label={a("title", lang)}
          className="fixed inset-x-0 bottom-0 top-14 z-50 flex flex-col overflow-hidden rounded-t-3xl border border-line bg-water shadow-2xl md:inset-x-auto md:top-auto md:bottom-6 md:end-6 md:h-[600px] md:w-[400px] md:rounded-3xl"
        >
          {/* header */}
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span aria-hidden="true" className="text-2xl">🐐</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{a("title", lang)}</p>
              <p className="truncate text-xs text-stone">
                {info?.paid ? a("activeUntil", lang, { date: new Date(info.paidUntil).toLocaleDateString() })
                  : info ? a("freeLeft", lang, { n: info.freeLeft }) : a("subtitle", lang)}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={a("close", lang)} className="grid h-11 w-11 place-items-center rounded-full text-stone hover:bg-mist">✕</button>
          </div>

          {/* NEW: link this account with WhatsApp, so one pass works in both places */}
          {info?.code && !info.linked && (
            <div className="border-b border-line px-4 py-2 text-sm">
              {!linkInfo ? (
                <button type="button" onClick={startLink} className="min-h-11 font-medium text-forest underline">
                  📱 {a("linkWa", lang)}
                </button>
              ) : (
                <div className="space-y-2 py-1">
                  <p className="text-stone">{a("linkHelp", lang)}</p>
                  <p className="font-mono text-lg font-semibold tracking-wider text-ink">{linkInfo.text}</p>
                  <a href={linkInfo.whatsapp} target="_blank" rel="noopener noreferrer"
                     className="inline-flex min-h-11 items-center rounded-full bg-forest px-5 font-semibold text-water hover:bg-moss">
                    {a("linkOpen", lang)}
                  </a>
                </div>
              )}
            </div>
          )}
          {info?.linked && (
            <p className="border-b border-line px-4 py-1.5 text-xs text-forest">{a("linked", lang)}</p>
          )}

          {/* messages */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            <p className="max-w-[85%] rounded-2xl bg-mist px-3 py-2 text-ink">{a("welcome", lang)}</p>
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 ${m.role === "user" ? "bg-forest text-water" : "bg-mist text-ink"}`}>
                  {m.preview && (                                               // NEW: the screenshot they sent
                    // eslint-disable-next-line @next/next/no-img-element -- a local preview, not a hosted image
                    <img src={m.preview} alt={a("shot", lang)} className="mb-1 max-h-48 rounded-xl" />
                  )}
                  {m.role === "user" ? m.text : <Linkify text={m.text} onNavigate={() => setOpen(false)} />}
                  {m.coins?.length > 0 && (                                     // coin matches: each opens its full check
                    <ul className="mt-2 space-y-1">
                      {m.coins.map((c) => (
                        <li key={c.address}>
                          <Link href={`/vet?q=${encodeURIComponent(c.address)}`} onClick={(e) => openCheck(e, c.address)} className="flex justify-between gap-2 rounded-xl border border-line bg-water px-3 py-2 hover:border-forest">
                            <span className="font-medium">{c.official ? "✓ " : ""}{c.symbol} <span className="text-stone">· {c.chain}</span></span>
                            <span className={`text-xs ${c.copycat ? "text-clay" : "text-stone"}`}>{c.official ? a("official", lang) : c.copycat ? `⚠ ${a("copycat", lang)}` : ""}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.report && (                                                // a coin check: link to the full report
                    <Link href={`/vet?q=${encodeURIComponent(m.report.address)}`} onClick={(e) => openCheck(e, m.report.address)} className="mt-2 block rounded-xl border border-line bg-water px-3 py-2 font-medium hover:border-forest">
                      {VERDICT[m.report.verdict] || "•"} {m.report.symbol} · {m.report.chain} → {a("viewCheck", lang)}
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {busy && <p className="text-stone">{a("thinking", lang)}</p>}
          </div>

          {/* footer: login, upgrade, or the message box */}
          <div className="border-t border-line p-3">
            {user === null ? (
              <div className="space-y-2 text-sm">
                <p className="text-stone">{a("loginTitle", lang)}</p>
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1 rounded-full bg-forest px-4 py-2.5 text-center font-medium text-water">{a("login", lang)}</Link>
                  <Link href="/signup" className="flex-1 rounded-full border border-line px-4 py-2.5 text-center font-medium text-ink">{a("signup", lang)}</Link>
                </div>
              </div>
            ) : locked ? (
              <div className="space-y-2 text-sm">
                <p className="text-stone">{locked === "cap" ? a("capped", lang) : a("locked", lang)}</p>
                {locked !== "cap" && <Link href={payHref} className="block rounded-full bg-forest px-4 py-2.5 text-center font-medium text-water">{a("subscribe", lang)}</Link>}
              </div>
            ) : (
              <form onSubmit={send} className="flex flex-wrap gap-2">
                {shot && (                                                      // NEW: the screenshot waiting to be sent
                  <div className="flex w-full items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a local preview, not a hosted image */}
                    <img src={shot.preview} alt={a("shot", lang)} className="h-14 rounded-lg border border-line" />
                    <button type="button" onClick={() => setShot(null)} aria-label={a("close", lang)} className="grid h-11 w-11 place-items-center rounded-full text-stone hover:bg-mist">✕</button>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  aria-label={a("attach", lang)}
                  title={a("attach", lang)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-lg text-stone hover:bg-mist disabled:opacity-50"
                >
                  📎
                </button>
                <label htmlFor="goat-ai-input" className="sr-only">{a("placeholder", lang)}</label>
                <input
                  id="goat-ai-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={1000}
                  placeholder={a("placeholder", lang)}
                  className="min-w-0 flex-1 rounded-full border border-line bg-mist px-4 py-2.5 text-sm text-ink outline-none focus:border-forest"
                />
                <button type="submit" disabled={busy || (!input.trim() && !shot)}className="rounded-full bg-forest px-4 py-2.5 text-sm font-medium text-water disabled:opacity-50">{a("send", lang)}</button>
              </form>
            )}
            <p className="mt-2 text-center text-[11px] text-stone">{a("disclaimer", lang)}</p>
          </div>
        </section>
      )}
    </>
  );
}
