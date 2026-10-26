// src/app/app-icon/[name]/route.js
// One route, three Android icons: /app-icon/192, /app-icon/512 and /app-icon/maskable-512
import { renderIcon } from "../../../lib/appIcon";       // the one shared GOAT icon design

const ICONS = {                                           // which names exist, and how to draw each
  "192": { size: 192, maskable: false },                  // small Android icon
  "512": { size: 512, maskable: false },                  // large Android icon / splash
  "maskable-512": { size: 512, maskable: true },          // goat shrunk into the safe zone for circle/squircle crops
};

export async function GET(request, { params }) {
  const { name } = await params;                          // the [name] part of the address
  const icon = ICONS[name];
  if (!icon) return new Response("Not found", { status: 404 }); // anything else: not an icon we make

  return renderIcon(icon.size, {
    maskable: icon.maskable,
    headers: { "Cache-Control": "public, max-age=86400" }, // phones may keep it for a day instead of re-asking
  });
}