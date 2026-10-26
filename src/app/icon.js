// src/app/icon.js
// Next.js turns this into the browser-tab icon (favicon) and adds the <link> tag automatically.
import { renderIcon } from "../lib/appIcon";             // the one shared GOAT icon design

export const size = { width: 64, height: 64 };            // small but sharp on high-resolution screens
export const contentType = "image/png";

export default function Icon() {
  return renderIcon(64, { rounded: true });               // soft corners look neater in a tab
}