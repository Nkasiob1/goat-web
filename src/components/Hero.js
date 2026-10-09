export default function Hero() {
  const markets = [                                          // the instruments your bot actually trades
    { symbol: "US30", name: "Dow Jones 30" },
    { symbol: "USTEC", name: "Nasdaq 100" },
    { symbol: "US500", name: "S&P 500" },
    { symbol: "XAUUSD", name: "Gold" },
  ];

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2"> {/* 1 column on phones, 2 on laptops */}
      <div>                                                  {/* left side: the words */}
        <p className="inline-block rounded-full border border-line px-3 py-1 text-xs text-moss"> {/* small pill tag above the headline */}
          Algorithmic trading, built calmly
        </p>

        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-ink md:text-6xl"> {/* big headline, bigger on laptops */}
          Trade with patience. Let GOAT do the watching.
        </h1>

        <p className="mt-5 max-w-md text-lg text-stone">     {/* supporting line, kept narrow for easy reading */}
          A rules-driven bot with an AI filter, trading indices and gold
          while you get on with your day.
        </p>

        <form action="/signup" className="mt-8 flex max-w-md rounded-full bg-mist p-1.5"> {/* sends the email to /signup when submitted */}
          <input
            type="email"                                     // phone keyboards show the @ key
            name="email"                                     // arrives at /signup as ?email=...
            placeholder="Email address"
            className="flex-1 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-stone" /* fills the space, no default box */
          />
          <button
            type="submit"
            className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss"
          >
            Get started
          </button>
        </form>
      </div>

      <div id="markets" className="rounded-3xl border border-line bg-water p-6 shadow-sm"> {/* right side: the market card */}
        <p className="text-sm font-medium text-stone">Markets GOAT trades</p>
        <ul className="mt-4 divide-y divide-line">          {/* a thin line between each row */}
          {markets.map((m) => (                              // loop over the list and draw one row per market
            <li key={m.symbol} className="flex items-center justify-between py-4"> {/* key helps React track each row */}
              <span className="font-mono font-semibold text-ink">{m.symbol}</span> {/* symbol in the number font */}
              <span className="text-sm text-stone">{m.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}