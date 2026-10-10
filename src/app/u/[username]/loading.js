export default function Loading() {                      // grey skeleton while the profile loads
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="h-40 animate-pulse rounded-3xl bg-mist"></div>
      <div className="mt-10 h-24 animate-pulse rounded-3xl bg-mist"></div>
      <div className="mt-4 h-24 animate-pulse rounded-3xl bg-mist"></div>
    </main>
  );
}
