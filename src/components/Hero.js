import LivePrices from "./LivePrices";                   // the live price card on the right
import HeroCta from "./HeroCta";                         // email box for visitors, welcome back for members
import S from "./S";                                     // translated words
import WaitlistBox from "./WaitlistBox";                 // NEW: Premium waitlist

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2"> {/* 1 column on phones, 2 on laptops */}
      <div>                                              {/* left side: the words */}
        <p className="inline-block rounded-full border border-line px-3 py-1 text-xs text-moss"> {/* small pill tag above the headline */}
          <S k="hero.pill" />
        </p>

        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-ink md:text-6xl"> {/* big headline, bigger on laptops */}
          <S k="hero.title" />
        </h1>

        <p className="mt-5 max-w-md text-lg text-stone"> {/* supporting line, kept narrow for easy reading */}
          <S k="hero.sub" />                             {/* describes GOAT v11 accurately */}
        </p>

        <HeroCta />                                      {/* checks who's visiting */}

        <WaitlistBox source="home" />                    {/* NEW: measures interest in Premium */}
      </div>

      <div id="markets">                                 {/* keeps the navbar's "Markets" link working */}
        <LivePrices />
      </div>
    </section>
  );
}