export default function Loading() {                      // shown instantly while the coin page loads
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="h-4 w-24 animate-pulse rounded bg-mist"></div>          {/* the "← All markets" link */}
      <div className="mt-6 h-10 w-64 animate-pulse rounded bg-mist"></div>    {/* the coin name */}
      <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-mist"></div> {/* the description */}
      <div className="mt-8 h-12 w-72 animate-pulse rounded bg-mist"></div>    {/* the big price */}

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">            {/* the four stat boxes */}
        {[1, 2, 3, 4].map((n) => (                                            // draw four grey boxes
          <div key={n} className="h-20 animate-pulse rounded-2xl bg-mist"></div>
        ))}
      </div>
    </main>
  );
}