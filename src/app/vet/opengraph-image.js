// src/app/vet/opengraph-image.js
// The picture apps show when someone shares /vet (LinkedIn, WhatsApp, Telegram, X).
import { ImageResponse } from "next/og";                 // turns JSX into a PNG
import { readFile } from "node:fs/promises";             // read our logo from disk
import { join } from "node:path";                        // build the file path safely on any OS

export const alt = "GOAT Token Safety Checker: is this coin a trap?"; // text for screen readers
export const size = { width: 1200, height: 630 };        // the standard share-card size
export const contentType = "image/png";

export default async function Image() {
  // the round gold coin logo, turned into a data URL so the image needs no network
  const png = await readFile(join(process.cwd(), "public", "icons", "icon-512.png"));
  const logo = `data:image/png;base64,${png.toString("base64")}`;

  const verdicts = [                                     // the three traffic lights
    ["#3FBF84", "Passed"],
    ["#E5B93C", "Caution"],
    ["#E2675D", "High risk"],
  ];
  const checks = ["Honeypots", "Taxes", "Minting", "Freeze", "Liquidity", "Copycats"]; // what we check

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",                               // logo on the left, words on the right
          alignItems: "center",
          padding: "0 80px",
          backgroundColor: "#0B1210",                    // GOAT dark green
          backgroundImage: "radial-gradient(circle at 22% 50%, #1b3a28 0%, #0B1210 55%)", // soft glow behind the coin
          color: "#E8EFEB",
        }}
      >
        {/* left: the coin, with a gold glow */}
        <img
          src={logo}
          width={300}
          height={300}
          style={{ borderRadius: 9999, boxShadow: "0 0 90px rgba(201,162,74,0.45)" }}
        />

        {/* right: the words */}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 70, flex: 1 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#C9A24A", fontWeight: 700 }}>
            GOAT
          </div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.05, marginTop: 10 }}>
            Token Safety Checker
          </div>
          <div style={{ display: "flex", fontSize: 38, color: "#8FA199", marginTop: 14 }}>
            Is this coin a trap? Find out in seconds.
          </div>

          {/* the three verdicts as coloured pills */}
          <div style={{ display: "flex", marginTop: 34 }}>
            {verdicts.map(([color, label]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginRight: 16,
                  padding: "10px 20px",
                  borderRadius: 9999,
                  border: `2px solid ${color}`,
                  fontSize: 26,
                  color,
                }}
              >
                <div style={{ display: "flex", width: 18, height: 18, borderRadius: 9999, backgroundColor: color, marginRight: 10 }} />
                {label}
              </div>
            ))}
          </div>

          {/* what we check, as one quiet line */}
          <div style={{ display: "flex", fontSize: 24, color: "#8FA199", marginTop: 30 }}>
            {checks.join("  ·  ")}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#C9A24A", marginTop: 10 }}>
            Free · No sign-up · 7 languages
          </div>
        </div>
      </div>
    ),
    size                                                  // 1200 × 630
  );
}