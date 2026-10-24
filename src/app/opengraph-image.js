// src/app/opengraph-image.js
// Next.js runs this and turns the result into the 1200x630 link preview picture (WhatsApp, Telegram, Facebook).
import { ImageResponse } from "next/og";                 // the tool that "photographs" a layout into a PNG
import { readFile } from "node:fs/promises";              // reads a file from the project
import { join } from "node:path";                         // builds a file path that works on every computer

export const alt = "GOAT: Check any coin before you buy"; // text description of the picture (for screen readers)
export const size = { width: 1200, height: 630 };         // the standard preview size
export const contentType = "image/png";                   // we send a PNG picture

export default async function Image() {
  const svg = await readFile(join(process.cwd(), "public", "goat-mark.svg")); // our current GOAT coin
  const coin = `data:image/svg+xml;base64,${svg.toString("base64")}`;          // turn it into text the picture can use

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",                                // RULE: boxes with several children must be flex
          alignItems: "center",                           // centre everything top-to-bottom
          justifyContent: "space-between",                // words on the left, coin on the right
          padding: "0 80px",                              // space from the left and right edges
          backgroundColor: "#0B1210",                     // deep lagoon night
          backgroundImage:
            "radial-gradient(circle at 74% 50%, rgba(240,190,110,0.55) 0%, rgba(217,142,74,0.25) 30%, rgba(11,18,16,0) 60%)", // warm sunset glow behind the coin
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>          {/* left side: the words, stacked */}
          <div style={{ fontSize: 112, fontWeight: 700, color: "#F3EBDD" }}>GOAT</div>              {/* name, warm sand */}
          <div style={{ fontSize: 46, fontWeight: 600, color: "#D98E4A", marginTop: 16 }}>Check any coin</div> {/* clay amber */}
          <div style={{ fontSize: 46, fontWeight: 600, color: "#F3EBDD" }}>before you buy.</div>
          <div style={{ fontSize: 28, color: "#A9B8B2", marginTop: 36 }}>Rug checks · Live prices · Market news</div> {/* evening mist */}
          <div style={{ fontSize: 28, color: "#5FA39A", marginTop: 48 }}>goatwatch.app</div>        {/* sea teal */}
        </div>

        <img
          src={coin}                                      // the GOAT coin
          width={380}
          height={380}
          style={{
            borderRadius: "50%",                          // round, so the glow follows the coin's edge
            boxShadow: "0 0 70px 20px rgba(255,210,130,0.55)", // the golden glow around the coin
          }}
        />
      </div>
    ),
    { ...size }                                           // make the picture exactly 1200x630
  );
}