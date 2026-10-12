import LivePrices from "./LivePrices";                   // the live price card on the right
import HeroCta from "./HeroCta";                         // NEW: email box for visitors, welcome back for members

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2"> {/* 1 column on phones, 2 on laptops */}
      <div>                                              {/* left side: the words */}
        <p className="inline-block rounded-full border border-line px-3 py-1 text-xs text-moss"> {/* small pill tag above the headline */}
          Algorithmic trading, built calmly
        </p>

        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-ink md:text-6xl"> {/* big headline, bigger on laptops */}
          Trade with patience. Let GOAT do the watching.
        </h1>

        <p className="mt-5 max-w-md text-lg text-stone"> {/* supporting line, kept narrow for easy reading */}
          A rules-driven bot with an AI filter, trading indices and gold
          while you get on with your day.
        </p>

        <HeroCta />                                      {/* CHANGED: was a fixed sign-up form; now it checks who's visiting */}
      </div>

      <div id="markets">                                 {/* keeps the navbar's "Markets" link working */}
        <LivePrices />
      </div>
    </section>
  );
}