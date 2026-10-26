// src/lib/appIcon.js
// ONE design for every GOAT icon (favicon, iPhone, Android, maskable): a gold tile with the deep green goat.
// Each icon file just calls renderIcon(size), so the icons can never drift apart.
import { ImageResponse } from "next/og";                 // turns a small layout into a PNG
import { readFile } from "node:fs/promises";              // reads a file from the project
import { join } from "node:path";                         // builds a path that works on every computer

let goatCache;                                            // the goat image, read once and then reused

async function goatDataUri() {
  if (!goatCache) {                                       // first time only
    const svg = await readFile(join(process.cwd(), "public", "goat-silhouette.svg"), "utf8"); // the goat head
    const deepGreen = svg.replaceAll("#1F4D36", "#103324"); // recolour: the coin's deep green, for strong contrast on gold
    goatCache = `data:image/svg+xml;base64,${Buffer.from(deepGreen).toString("base64")}`; // as text the image can use
  }
  return goatCache;
}

// size: pixels (square). maskable: shrink the goat into Android's safe zone. rounded: soft corners (favicon only).
export async function renderIcon(size, { maskable = false, rounded = false, headers } = {}) {
  const goat = await goatDataUri();
  const g = Math.round(size * (maskable ? 0.62 : 0.78));  // goat size: 62% inside the safe zone, 78% normally

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",                                // the image engine needs flex to centre things
          alignItems: "center",                           // centre top-to-bottom
          justifyContent: "center",                       // centre left-to-right
          backgroundImage: "linear-gradient(135deg, #F0D080 0%, #D9AE55 50%, #B0802C 100%)", // gold: light top-left -> deep bottom-right
          borderRadius: rounded ? "22%" : 0,              // favicon gets soft corners; phones round the others themselves
        }}
      >
        <img src={goat} width={g} height={g} style={{ marginTop: Math.round(size * 0.04) }} /> {/* nudged down a touch: the horns make the top look heavier */}
      </div>
    ),
    { width: size, height: size, headers }                // exact pixel size + optional extra headers
  );
}