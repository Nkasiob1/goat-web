import { ImageResponse } from "next/og";

const BUCKET = "post-images";
const UA = "Mozilla/5.0 (compatible; GOATNewsBot/1.0; +https://goat-web-sandy.vercel.app)";
const TIMEOUT = 6000;                                    // CHANGED: 6s per download, so 3 tries fit in the time limit
const C = {
  water: "#FFFFFF", mist: "#F6F8F7", line: "#E3E9E6", stone: "#6B7A73", ink: "#121A16",
  sage: "#E8F0EB", moss: "#3D7A5A", forest: "#1F4D36", gain: "#2E8B60", loss: "#C2493F", gold: "#C9A24A",
};

const ascii = (s = "") =>                                // CHANGED: convert curly punctuation instead of deleting it
  s
    .replace(/[‘’‛′]/g, "'")                             // ’ → '
    .replace(/[“”″]/g, '"')                              // “ ” → "
    .replace(/[–—]/g, "-")                               // – — → -
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E]/g, "")                        // then drop anything the card font can't draw
    .trim();

function sniff(buf) {                                    // the file's real type from its first bytes
  const b = new Uint8Array(buf.slice(0, 12));
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  const text = String.fromCharCode(...b);
  if (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function fetchImage(url, types = ["image/png", "image/jpeg", "image/webp"]) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { "User-Agent": UA, Accept: "image/jpeg,image/png,image/webp;q=0.9,*/*;q=0.1" },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 500 || buf.byteLength > 5 * 1024 * 1024) return null;
    const header = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const type = sniff(buf) ?? header;
    return types.includes(type) ? { buf, type } : null;
  } catch {
    return null;
  }
}

export async function findArticleImage(pageUrl) {       // the article's share picture (og:image)
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { "User-Agent": UA, Accept: "text/html" },
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 300000);
    const tags = html.match(/<meta[^>]+>/gi) ?? [];
    for (const wanted of ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]) {
      for (const tag of tags) {
        const key = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
        if (key !== wanted) continue;
        const content = tag.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
        if (content) return new URL(content.replace(/&amp;/g, "&"), pageUrl).href;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function toDataUrl(img) {
  return `data:${img.type};base64,${Buffer.from(img.buf).toString("base64")}`;
}

export async function uploadImage(db, goatId, img) {
  const ext = img.type === "image/png" ? "png" : img.type === "image/webp" ? "webp" : "jpg";
  const path = `${goatId}/bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, img.buf, { contentType: img.type });
  if (error) throw error;
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeImage(db, url) {
  const i = url?.indexOf(`/${BUCKET}/`) ?? -1;
  if (i === -1) return;
  await db.storage.from(BUCKET).remove([url.slice(i + BUCKET.length + 2)]);
}

async function render(element) {
  const res = new ImageResponse(element, { width: 1200, height: 630 });
  return { buf: await res.arrayBuffer(), type: "image/png" };
}

function Frame({ mark, tag, footer, host, children }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.water, padding: 64, color: C.ink }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {mark
            ? <img src={mark} width={56} height={56} />
            : <div style={{ display: "flex", width: 56, height: 56, borderRadius: 28, background: C.gold }} />}
          <div style={{ display: "flex", marginLeft: 16, fontSize: 34, fontWeight: 700, color: C.forest }}>GOAT</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: C.moss, background: C.sage, padding: "10px 22px", borderRadius: 999, letterSpacing: 2 }}>
          {tag}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>{children}</div>

      <div style={{ display: "flex", justifyContent: "space-between", borderTop: `2px solid ${C.line}`, paddingTop: 24, fontSize: 22, color: C.stone }}>
        <div style={{ display: "flex" }}>{footer}</div>
        <div style={{ display: "flex" }}>{host}</div>
      </div>
    </div>
  );
}

export async function listingCard({ mark, logo, name, coin, network, stats, host }) {
  const title = ascii(name).slice(0, 22) || (coin ? `$${coin}` : "New token");
  return render(
    <Frame mark={mark} tag="NEW LISTING" footer="Passed the GOAT liquidity filter · Not financial advice" host={host}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {logo
          ? <img src={logo} width={128} height={128} style={{ borderRadius: 64 }} />
          : <div style={{ display: "flex", width: 128, height: 128, borderRadius: 64, background: C.forest, color: C.water, fontSize: 56, alignItems: "center", justifyContent: "center" }}>
              {title.replace("$", "").charAt(0).toUpperCase()}
            </div>}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 32 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 30, color: C.stone, marginTop: 8 }}>
            {`${coin ? `$${coin} · ` : ""}${ascii(network)}`}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", marginTop: 48 }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", flex: 1, background: C.mist, borderRadius: 24, padding: "24px 28px", marginLeft: i === 0 ? 0 : 20 }}>
            <div style={{ display: "flex", fontSize: 22, color: C.stone }}>{s.label}</div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700, marginTop: 6, color: s.color ?? C.ink }}>{s.value}</div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export async function newsCard({ mark, title, source, host }) {
  const text = ascii(title);
  return render(
    <Frame mark={mark} tag="MARKET NEWS" footer={`Source: ${ascii(source)}`} host={host}>
      <div style={{ display: "flex", fontSize: 58, fontWeight: 700, lineHeight: 1.2, color: C.ink }}>
        {text.length > 130 ? `${text.slice(0, 127)}...` : text}
      </div>
    </Frame>
  );
}

export const CARD_COLORS = C;