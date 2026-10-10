import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import TimeAgo from "../../components/TimeAgo";
import { getNewPools, RULES } from "../../lib/scanner";
import { formatPrice, volumeFormat } from "../../lib/format";

export const metadata = { title: "New Coin Scanner | GOAT" };

export default async function ScannerPage() {
  const pools = await getNewPools();                     // coins from the last 24h that passed every check

  const nameCounts = {};                                 // NEW: how many tokens share each name
  for (const p of pools) {
    const key = p.name.toLowerCase();                    // "Quantum Inu" and "quantum inu" count as the same
    nameCounts[key] = (nameCounts[key] ?? 0) + 1;
  }

  const percent = new Intl.NumberFormat("en-US", {       // NEW: +54.9% stays; +297250.5% becomes +297K%
    notation: "compact",
    maximumFractionDigits: 1,
    signDisplay: "always",                               // always show + or −
  });

  const checks = [                                       // the rules, written for humans, shown as pills
    `Listed in the last ${RULES.maxAgeHours}h`,
    `${volumeFormat.format(RULES.minLiquidity)}+ liquidity`,
    `${volumeFormat.format(RULES.minVolume)}+ daily volume`,
    `${RULES.minTrades}+ trades`,
    "Not collapsed",
    "One pool per token",
  ];

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-medium text-moss">Scanner</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-5xl">
          New coins from the last 24 hours.
        </h1>
        <p className="mt-4 max-w-xl text-stone">
          GOAT scans new and trending pools across every major blockchain each minute,
          and only shows coins listed in the last day that pass every check.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">        {/* flex-wrap lets the pills drop to a new line on phones */}
          {checks.map((c) => (
            <span key={c} className="rounded-full bg-sage px-3 py-1 text-xs text-moss">✓ {c}</span>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-mist p-4 text-sm text-stone">
          <span className="font-semibold text-loss">Still high risk.</span> Passing these checks
          does not make a coin safe. New coins can lose most of their value in minutes. This list
          is information, not a recommendation.
        </div>

        {pools.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-line p-16 text-center">
            <p className="font-semibold text-ink">No new coins passed GOAT's checks just now.</p>
            <p className="mt-2 text-sm text-stone">That's normal. Most launches don't. The scanner checks again every minute.</p>
          </div>
        ) : (
          <div className="mt-10 overflow-x-auto rounded-3xl border border-line bg-water">
            <table className="w-full text-left">
              <thead className="border-b border-line text-xs text-stone">
                <tr>
                  <th className="px-6 py-4 font-medium">Token</th>
                  <th className="px-6 py-4 text-right font-medium">Price</th>
                  <th className="px-6 py-4 text-right font-medium">24h</th>
                  <th className="hidden px-6 py-4 text-right font-medium md:table-cell">Liquidity</th>
                  <th className="hidden px-6 py-4 text-right font-medium lg:table-cell">Volume</th>
                  <th className="hidden px-6 py-4 text-right font-medium lg:table-cell">Trades</th>
                  <th className="px-6 py-4 text-right font-medium">Listed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pools.map((p) => {
                  const up = p.change >= 0;
                  const copycat = nameCounts[p.name.toLowerCase()] > 1; // NEW: another token uses this name

                  return (
                    <tr key={p.id} className="hover:bg-mist">
                       <td className="min-w-[12rem] px-6 py-4">
                        {/* name links to the full pool data on GeckoTerminal, in a new tab */}
                        <a
                          href={`https://www.geckoterminal.com/${p.networkId}/pools/${p.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-ink hover:text-moss"
                        >
                          {p.name}
                        </a>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone">
                          <span className="font-mono">{p.symbol}</span>
                          <span>·</span>
                          <span>{p.network}</span>
                          {copycat && (
                            <span className="rounded-full bg-mist px-2 py-0.5 text-loss">Name used by multiple tokens</span>
                          )}
                        </div>
                        {/* phones only: the stats hidden as columns; md:hidden removes this line on bigger screens */}
                        <div className="mt-1 font-mono text-xs text-stone md:hidden">
                          Liq {volumeFormat.format(p.liquidity)} · Vol {volumeFormat.format(p.volume)} · {p.txns} trades
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-ink">
                        {formatPrice(p.price)}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono text-sm ${up ? "text-gain" : "text-loss"}`}>
                        {percent.format(p.change)}%
                      </td>
                      <td className="hidden px-6 py-4 text-right font-mono text-sm text-stone md:table-cell">
                        {volumeFormat.format(p.liquidity)}
                      </td>
                      <td className="hidden px-6 py-4 text-right font-mono text-sm text-stone lg:table-cell">
                        {volumeFormat.format(p.volume)}
                      </td>
                      <td className="hidden px-6 py-4 text-right font-mono text-sm text-stone lg:table-cell">
                        {p.txns}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-stone">
                        <TimeAgo date={p.createdAt} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-stone">Data from GeckoTerminal. Refreshed about once a minute.</p>
      </section>
      <Footer />
    </main>
  );
}