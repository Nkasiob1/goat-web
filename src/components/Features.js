export default function Features() {
  const features = [                                  // one object per card; edit text here, not in the layout
    {
      number: "01",
      title: "VWAP mean reversion",
      text: "GOAT waits for price to stretch away from its volume-weighted average, then trades the return. No chasing, no guessing.",
    },
    {
      number: "02",
      title: "AI confidence filter",
      text: "A machine learning model scores every setup. Only trades it rates as high confidence are allowed through.",
    },
    {
      number: "03",
      title: "Risk controls built in",
      text: "Volatility-based stop losses, cooldowns between trades, one position per market, and a kill switch after a losing streak.",
    },
    {
      number: "04",
      title: "Indices and gold",
      text: "Focused on four liquid markets: the Dow, Nasdaq, S&P 500 and gold. Fewer markets, studied deeply.",
    },
  ];

  return (
    <section id="bot" className="bg-mist py-24">             {/* id="bot" makes the navbar's "The Bot" link scroll here */}
      <div className="mx-auto max-w-6xl px-6">               {/* same centred width as the hero, so edges line up */}
        <p className="text-sm font-medium text-moss">The Bot</p>   {/* small label above the heading */}
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Disciplined by design, so you don't have to be.
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"> {/* 1 column on phones, 2 on tablets, 4 on wide screens */}
          {features.map((f) => (                              // draw one card for each item in the list
            <div key={f.number} className="rounded-2xl border border-line bg-water p-6"> {/* white card on the mist background */}
              <span className="font-mono text-sm text-moss">{f.number}</span>          {/* 01, 02... in the number font */}
              <h3 className="mt-4 text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone">{f.text}</p>       {/* leading-relaxed adds line spacing for easy reading */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}