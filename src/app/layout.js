import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import InstallPrompt from "@/components/InstallPrompt";   // "Get the GOAT app" banner + service worker
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://goatwatch.app"),         // full site address, so preview images get a complete https:// link
  title: "GOAT | Check any coin before you buy",          // leads with what's live today
  description: "Free rug-pull checks for new crypto coins, live prices for crypto, forex, stocks and indices, and the news that moves markets.",
  applicationName: "GOAT",                                // app name for browsers
  openGraph: {                                            // the preview card on WhatsApp, Telegram, Facebook, LinkedIn
    title: "GOAT | Check any coin before you buy",
    description: "Rug checks · Live prices · Market news",
    url: "/",                                             // becomes https://goatwatch.app thanks to metadataBase
    siteName: "GOAT",
    type: "website",
    // the image itself comes from src/app/opengraph-image.js automatically
  },
  twitter: {                                              // the preview card on X
    card: "summary_large_image",                          // big image card, not the small square one
    title: "GOAT | Check any coin before you buy",
    description: "Rug checks · Live prices · Market news",
    // the image comes from src/app/twitter-image.js automatically
  },
  appleWebApp: {                                          // iPhone "Add to Home Screen" settings
    capable: true,                                        // open full screen, like an app
    title: "GOAT",                                        // name under the iPhone icon
    statusBarStyle: "black-translucent",                  // content runs under the status bar (our safe-area padding handles it)
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",                 // iPhone home-screen icon
  },
};

export const viewport = {                                 // colours the phone's browser bar to match the theme
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFDF8" }, // CHANGED: light phones: bright warm white bar
    { media: "(prefers-color-scheme: dark)", color: "#0F1A18" },  // dark phones: lagoon night bar
  ],
  viewportFit: "cover",                                   // use the full screen on notched phones (safe-area padding needs this)
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
      <body className="min-h-full flex flex-col">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}