import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata = {
  title: "GOAT | Greatest Of All Trades",
  description: "Live crypto, forex, stock and index prices, a quality-filtered new coin scanner, and trusted places to buy.",
};

export const viewport = {                                  // colours the phone's browser bar to match the theme
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" }, // light phones: white bar
    { media: "(prefers-color-scheme: dark)", color: "#0B1210" },  // dark phones: GOAT night bar
  ],
};

// Runs before the page paints, so there's no white flash for dark-mode users.
// 1) a saved choice wins; 2) otherwise follow the phone/computer setting.
const themeScript = `(function(){try{var t=localStorage.getItem('goat-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.className} ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      // GeistSans.className = apply Geist to the whole page directly
      // the two .variable ones = provide --font-geist-sans and --font-geist-mono for our tokens
      suppressHydrationWarning // the script may add "dark" before React loads; this tells React that's expected
    >
      {/* <head> may only hold tags, never text, so no comments or spaces inside it */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}