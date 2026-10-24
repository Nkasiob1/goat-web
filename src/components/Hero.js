import LivePrices from "./LivePrices";                   // the live price card on the right
import HeroCta from "./HeroCta";                         // email box for visitors, welcome back for members
import S from "./S";                                     // translated words
import WaitlistBox from "./WaitlistBox";                 // Premium waitlist

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-2"> {/* CHANGED: grid-cols-1 = one column exactly the screen width on phones; 2 on laptops */}
      <div className="min-w-0">                          {/* CHANGED: min-w-0 lets the words shrink to the screen instead of being pushed wide */}
        <p className="inline-block rounded-full border border-line px-3 py-1 text-xs text-moss"> {/* small pill tag above the headline */}
          <S k="hero.pill" />
        </p>

        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-ink break-words md:text-6xl"> {/* CHANGED: break-words = a very long word wraps instead of poking out */}
          <S k="hero.title" />
        </h1>

        <p className="mt-5 max-w-md text-lg text-stone"> {/* supporting line, kept narrow for easy reading */}
          <S k="hero.sub" />
        </p>

        <HeroCta />                                      {/* checks who's visiting */}

        <WaitlistBox source="home" />                    {/* measures interest in Premium */}
      </div>

      <div id="markets" className="min-w-0 overflow-x-auto"> {/* CHANGED: min-w-0 + overflow-x-auto = a wide price table scrolls inside its box, never stretches the page */}
        <LivePrices />
      </div>
    </section>
  );
}