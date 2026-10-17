import S from "./S";                                     // NEW: translated words

export default function Features() {
  const features = ["01", "02", "03", "04"];             // card numbers; text lives in home.js as f1..f4

  return (
    <section id="bot" className="bg-mist py-24">             {/* id="bot" makes the navbar's "The Bot" link scroll here */}
      <div className="mx-auto max-w-6xl px-6">               {/* same centred width as the hero, so edges line up */}
        <p className="text-sm font-medium text-moss"><S k="bot.label" /></p>   {/* small label above the heading */}
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-ink md:text-4xl">
          <S k="bot.title" />
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"> {/* 1 column on phones, 2 on tablets, 4 on wide screens */}
          {features.map((num, i) => (                         // one card per number: f1, f2, f3, f4
            <div key={num} className="rounded-2xl border border-line bg-water p-6"> {/* white card on the mist background */}
              <span className="font-mono text-sm text-moss">{num}</span>              {/* 01, 02... in the number font */}
              <h3 className="mt-4 text-lg font-semibold text-ink"><S k={`f${i + 1}.title`} /></h3>
              <p className="mt-2 text-sm leading-relaxed text-stone"><S k={`f${i + 1}.text`} /></p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}