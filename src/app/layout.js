import { GeistSans } from "geist/font/sans";             // the main font, now from node_modules, not Google
import { GeistMono } from "geist/font/mono";             // the number font
import "./globals.css";

export const metadata = {                                // the default title and description for every page
  title: "GOAT | Greatest Of All Trades",                // shown in the browser tab when a page doesn't set its own
  description: "Live crypto, forex, stock and index prices, a quality-filtered new coin scanner, and trusted places to buy.",
};

export default function RootLayout({ children }) {       // the frame every page sits inside
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {/* .variable creates --font-geist-sans and --font-geist-mono, the exact names globals.css already uses */}
        {children}                                       {/* each page's content goes here */}
      </body>
    </html>
  );
}