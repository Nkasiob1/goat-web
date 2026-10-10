// shown instantly while the page streams in (same idea as the coin and profile pages)
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <div className="h-64 animate-pulse rounded-3xl border border-line bg-mist"></div>
    </main>
  );
}