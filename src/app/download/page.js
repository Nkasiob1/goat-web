// src/app/download/page.js
// goatwatch.app/download: get GOAT on Android (APK) or iPhone (Add to Home Screen).
// Explains Android's install warnings BEFORE people see them, so they trust the process.
import Image from "next/image";                          // the glowing GOAT coin
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata = {                                // the tab title + the link preview text for this page
  title: "Download GOAT | Android app and iPhone",
  description: "Get GOAT on your phone: check any coin before you buy, right from your home screen. Free.",
};

const APK = "/apk/goat.apk";                             // the file in public/apk/
const VERSION = "1.0.0";                                 // shown on the page; change it when you ship a new APK
const SIZE = "1.4 MB";

const ANDROID_STEPS = [                                  // each step: [title, explanation]
  ["Tap Download", "Your phone saves goat.apk (1.4 MB) in Downloads."],
  ["Open the file", "Tap the download notification, or find goat.apk in your Files app."],
  ["Allow the install", "Android asks to allow installs from your browser. This is normal for apps not yet on the Play Store. Allow it once."],
  ["Tap “Install anyway”", "Play Protect may warn that it doesn't recognise the developer, because GOAT isn't on the Play Store yet. The app is signed by GOAT and opens goatwatch.app, nothing else."],
];

const IPHONE_STEPS = [
  ["Open goatwatch.app in Safari", "It must be Safari: other iPhone browsers can't add apps to the home screen."],
  ["Tap the Share button", "The square with an arrow pointing up, at the bottom of the screen."],
  ["Tap “Add to Home Screen”", "Scroll down the share sheet if you don't see it, then tap Add."],
];

const FEATURES = [                                       // what the app gives you
  ["🔎", "Share → GOAT", "Long-press any message with a contract in Telegram or WhatsApp, share it to GOAT, and get the verdict."],
  ["📡", "Radar", "New coins posted only after they pass the full safety check."],
  ["📈", "Live markets", "Crypto, forex, stocks and indices, plus the news that moves them."],
  ["🔔", "Alerts", "Notifications straight to your phone."],
];

// A numbered list of steps (used for Android and iPhone)
function Steps({ steps }) {
  return (
    <ol className="mt-6 space-y-5">
      {steps.map(([title, text], i) => (
        <li key={title} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-bold text-water">
            {i + 1}                                       {/* the step number in a circle */}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{title}</p>
            <p className="mt-1 text-sm text-stone">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function DownloadPage() {
  return (
    <main>
      <Navbar />

      {/* 1. The hook: the glowing coin + one big button */}
      <section className="overflow-hidden">              {/* the halo can never cause sideways scrolling */}
        <div className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-12 pb-10 text-center">
          <div className="coin-stage" style={{ width: 120, height: 120 }}> {/* same glowing coin as the homepage */}
            <Image src="/goat-mark.svg" alt="GOAT coin" width={120} height={120} priority unoptimized />
          </div>

          <h1 className="mt-8 text-4xl font-bold tracking-tight text-ink text-balance md:text-5xl">
            Get <span className="text-shimmer">GOAT</span> on your phone
          </h1>
          <p className="mt-4 max-w-xl text-lg text-stone">
            Check any coin before you buy, right from your home screen. Free, no sign-up needed.
          </p>

          <a
            href={APK}
            download="goat.apk"                          // tells the browser: save this file, don't open it
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-forest px-8 py-4 text-base font-semibold text-water hover:bg-moss"
          >
            <span aria-hidden="true">⬇️</span>
            Download for Android
          </a>
          <p className="mt-3 text-xs text-stone">
            Version {VERSION} · APK · {SIZE} · Play Store version coming soon
          </p>
          <a href="#iphone" className="mt-4 text-sm font-medium text-moss hover:text-ink">
            On iPhone? Here's how →                      {/* jumps to the iPhone section below */}
          </a>
        </div>
      </section>

      {/* 2. What you get */}
      <section className="mx-auto max-w-5xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map(([icon, title, text]) => (
            <div key={title} className="rounded-2xl border border-line bg-mist p-5">
              <p className="text-2xl" aria-hidden="true">{icon}</p>
              <p className="mt-3 font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-stone">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Install steps, side by side on laptops, stacked on phones */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-12 md:grid-cols-2">
        <div className="rounded-2xl border border-line p-6">
          <h2 className="text-xl font-bold text-ink">Install on Android</h2>
          <Steps steps={ANDROID_STEPS} />
        </div>

        <div id="iphone" className="scroll-mt-24 rounded-2xl border border-line p-6"> {/* scroll-mt-24: the navbar won't cover the heading after the jump */}
          <h2 className="text-xl font-bold text-ink">Install on iPhone</h2>
          <Steps steps={IPHONE_STEPS} />
          <p className="mt-6 text-sm text-stone">
            GOAT then opens full-screen from your home screen, like any other app.
          </p>
        </div>
      </section>

      {/* 4. Why you can trust it */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-2xl bg-sage p-6">
          <h2 className="text-lg font-bold text-ink">Why the app is safe to install</h2>
          <ul className="mt-3 space-y-2 text-sm text-stone">
            <li>✓ It's the same goatwatch.app you already know, packaged as an app. It opens nothing else.</li>
            <li>✓ It's signed by GOAT, and goatwatch.app publicly confirms that signature, so no one else can publish an update in its name.</li>
            <li>✓ It updates itself whenever the website does. No re-downloading for new features.</li>
            <li>✓ It asks for no special permissions: no contacts, no location, no files.</li>
          </ul>
          <p className="mt-4 text-sm text-stone">
            Questions? Ask in our <Link href="https://t.me/Goat_watchmen" className="font-medium text-moss hover:text-ink">Telegram community</Link>.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}