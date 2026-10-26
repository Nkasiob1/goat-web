// src/app/apple-icon.js
// Next.js turns this into the iPhone "Add to Home Screen" icon. It overrides the old PNG automatically.
import { renderIcon } from "../lib/appIcon";

export const size = { width: 180, height: 180 };          // Apple's standard home-screen size
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon(180);                                 // square corners: iPhone rounds them itself
}