import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import InstallPrompt from "@/components/InstallPrompt";   // "Get the GOAT app" banner + service worker
import SplashScreen from "@/components/SplashScreen";     // MOVED HERE: drawn once per app launch (not on every page)
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
  },
  twitter: {                                              // the preview card on X
    card: "summary_large_image",
    title: "GOAT | Check any coin before you buy",
    description: "Rug checks · Live prices · Market news",
  },
  appleWebApp: {                                          // iPhone "Add to Home Screen" settings
    capable: true,                                        // open full screen, like an app
    title: "GOAT",                                        // name under the iPhone icon
    statusBarStyle: "black-translucent",                  // content runs under the status bar (our safe-area padding handles it)
  },
};

export const viewport = {                                 // colours the phone's browser bar to match the theme
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" }, // light phones: white bar
    { media: "(prefers-color-scheme: dark)", color: "#0F1A18" },  // dark phones: lagoon night bar
  ],
  viewportFit: "cover",                                   // use the full screen on notched phones
};

// Runs in <head>, BEFORE the page paints. Two jobs:
// 1) Theme: a saved choice wins, otherwise follow the phone setting (no white flash for dark-mode users).
// 2) NEW: App detection. Tag <html class="is-app"> when GOAT runs as the installed app, so the splash shows from the
//    very first paint. Signals: standalone mode, iPhone home screen, or opened by our Android app (referrer android-app://).
//    Remembered for the session, because the referrer is gone after a reload. If the splash already played, skip it.
const bootScript = `(function(){var h=document.documentElement;try{var t=localStorage.getItem('goat-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)h.classList.add('dark');}catch(e){}try{var s=window.sessionStorage;var app=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true||document.referrer.indexOf('android-app://')===0||s.getItem('goat-is-app')==='1';if(app){h.classList.add('is-app');s.setItem('goat-is-app','1');if(s.getItem('goat-splash-seen')==='1')h.classList.add('splash-done');}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.className} ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning // the boot script adds "dark" / "is-app" before React loads; this tells React that's expected
    >
      {/* <head> may only hold tags, never text, so no comments or spaces inside it */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SplashScreen />                                  {/* NEW POSITION: first thing in the page, covers it from the first paint */}
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}