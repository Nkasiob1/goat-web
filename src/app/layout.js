import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata = {
  title: "GOAT | Greatest Of All Trades",
  description: "Live crypto, forex, stock and index prices, a quality-filtered new coin scanner, and trusted places to buy.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.className} ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      // GeistSans.className = apply Geist to the whole page directly (the NEW part)
      // the two .variable ones = still provide --font-geist-sans and --font-geist-mono for our tokens
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}