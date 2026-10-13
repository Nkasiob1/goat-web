// app/offline/page.js: what the app shows with no internet (kept ready by sw.js)
export const metadata = { title: "Offline | GOAT" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <img src="/icons/icon-192.png" alt="GOAT" width={88} height={88} />  {/* plain img: works without network */}
      <h1 className="mt-6 text-2xl font-bold text-ink">You&apos;re offline</h1>
      <p className="mt-2 text-stone">
        GOAT needs a connection for live prices and the radar. Check your data or Wi-Fi and try again.
      </p>
      <a href="/" className="mt-8 rounded-full bg-forest px-6 py-3 text-sm font-medium text-water">
        Try again
      </a>
    </main>
  );
}