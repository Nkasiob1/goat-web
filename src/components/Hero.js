import Image from "next/image";                          // NEW: Next.js image (loads fast, keeps its space reserved)
import LivePrices from "./LivePrices";                   // the live price card
import HeroCta from "./HeroCta";                         // the coin box + welcome back / sign-up link
import S from "./S";                                     // translated words
import WaitlistBox from "./WaitlistBox";                 // Premium waitlist

// NEW: the glowing GOAT coin, reused at two sizes (small on phones, large on laptops)
function Coin({ size }) {
  return (
    <div className="coin-stage" style={{ width: size, height: size }}> {/* the stage carries the breathing halo */}
      <Image
        src="/goat-mark.svg"                             // the current GOAT coin from /public
        alt="GOAT coin"
        width={size}
        height={size}
        priority                                         // load it first: it's the first thing people see
        unoptimized                                      // SVGs are already sharp at any size, no need to process them
      />
    </div>
  );
}

export default function Hero() {
  return (
    <div className="overflow-hidden">                    {/* the halo can never cause sideways scrolling on phones */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-8 pb-14 md:grid-cols-2 md:py-24"> {/* CHANGED: less top space on phones so the coin box is visible straight away */}
        <div className="min-w-0">                        {/* min-w-0 lets the words shrink to the screen */}
          <div className="flex items-center gap-3">      {/* NEW: small coin + pill side by side */}
            <div className="md:hidden">                  {/* phones only: the big coin lives on the right on laptops */}
              <Coin size={52} />
            </div>
            <p className="inline-block rounded-full border border-line px-3 py-1 text-xs font-medium text-moss">
              <S k="hero.pill" />                        {/* "Free crypto safety checks" */}
            </p>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-ink break-words md:text-6xl"> {/* the promise */}
            <S k="hero.title" />
          </h1>

          <p className="mt-5 max-w-md text-lg text-stone"> {/* supporting line, kept narrow for easy reading */}
            <S k="hero.sub" />
          </p>

          <HeroCta />                                    {/* the coin box: the first thing anyone can DO */}

          <WaitlistBox source="home" />                  {/* measures interest in Premium */}
        </div>

        <div className="hidden justify-center md:flex">  {/* NEW: laptops: the big glowing coin is the hero's visual anchor */}
          <Coin size={340} />
        </div>
      </section>

      <section id="markets" className="mx-auto max-w-6xl px-6 pb-16"> {/* MOVED: live prices get their own row ("Markets" link still works) */}
        <div className="min-w-0 overflow-x-auto md:max-w-2xl">          {/* a wide table scrolls inside its box, never stretches the page */}
          <LivePrices />
        </div>
      </section>
    </div>
  );
}