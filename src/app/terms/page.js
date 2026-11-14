import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage"; // shared layout + contact email

export const metadata = { title: "Terms of Use | GOAT" };          // browser tab title

const sections = [                                                 // each section: id (for the link), title, body
  {
    id: "about",
    title: "About GOAT",
    body: [
      // CHANGED: names the business and the newer products
      "GOAT (Greatest Of All Trades) is operated by GOATWATCH TECHNOLOGIES (Business Name Reg. No. 9998471), Nigeria. It is a market-information, safety and community platform: market prices, charts, news, coin safety checks, the Launch Radar, Company Check, the GOAT WhatsApp and Telegram bots, GOAT AI and a community feed.",
      "GOAT is not a broker, exchange, bank or investment adviser. We never hold your money or crypto, and we never place trades for you.",
    ],
  },
  {
    id: "eligibility",
    title: "Who can use GOAT",
    body: [
      "You must be at least 18 years old and legally able to agree to these terms where you live.",
      "You are responsible for making sure that using crypto services is legal in your country.",
    ],
  },
  {
    id: "account",
    title: "Your account",
    body: [
      "Keep your password private. You are responsible for everything done through your account.",
      "Give accurate sign-up details and choose a username that doesn't impersonate another person, brand or GOAT itself.",
      "Tell us straight away if you think someone else has accessed your account.",
    ],
  },
  {
    id: "community",
    title: "Community rules",
    body: [
      "When you post, comment or upload images, you agree not to:",
      [
        "Post wallet addresses, payment QR codes or requests for money.",
        "Promote scams, pump-and-dump schemes, fake giveaways or guaranteed returns.",
        "Impersonate GOAT staff, the @GOAT account or anyone else.",
        "Harass, threaten or abuse other people, or post hateful content.",
        "Share other people's private information.",
        "Post spam, malware or anything illegal.",
      ],
      "We may hide or remove content and suspend or close accounts that break these rules. Posts reported by several members may be hidden automatically while we review them.",
    ],
  },
  {
    id: "content",
    title: "Your content",
    body: [
      "You keep ownership of what you post. By posting, you give GOAT a free, worldwide licence to store, display and share it on the platform and on GOAT's official channels (such as our Telegram channel).",
      "Only post content you have the right to share. Public posts can be seen by anyone who visits GOAT.",
    ],
  },
  {
    id: "no-advice",
    title: "No financial advice",
    body: [
      "Everything on GOAT is general information only. That includes prices, charts, news, scanner results, Launch Radar alerts, safety checks, Company Check results, GOAT AI answers, @GOAT posts and community posts.",
      "Nothing on GOAT is a recommendation to buy, sell or hold any asset. Always do your own research, and never invest money you cannot afford to lose. Please read our Risk Disclosure.",
    ],
  },
  {
    id: "automated",
    title: "Automated features",
    body: [
      "The Launch Radar, safety checks, Company Check, the bots and the @GOAT account are automated. They rely on third-party data that can be late, incomplete or wrong.",
      "\"No major red flags\" means our checks found no major warning signs at that moment. It does not mean a coin or platform is safe, and owners can change things later. An exchange-listing alert is not an endorsement.",
      "Company Check reports public records (such as SEC Nigeria notices) and signs found on a website. If a platform is not in our records, that is not proof it is legitimate. If you believe a result about your business is wrong, email us and we will review it promptly.",
    ],
  },
  {
    id: "goat-ai",                                                   // NEW
    title: "GOAT AI",
    body: [
      "GOAT AI is an AI assistant on WhatsApp and goatwatch.app. It explains crypto, runs GOAT's checks and can search the web for news.",
      "AI can make mistakes. Check important facts with the sources it gives you or with official sources before acting. GOAT AI does not give financial, legal or tax advice.",
      "Never share seed phrases, private keys, passwords or one-time codes with GOAT AI or anyone else.",
      "To keep the service fair and affordable, we apply a free-trial limit and daily fair-use limits, and we may block use that is abusive or automated.",
    ],
  },
  {
    id: "payments",                                                  // NEW
    title: "GOAT AI subscriptions and refunds",
    body: [
      [
        "GOAT AI is sold as prepaid passes (for example 7 days or 30 days), at the prices shown on goatwatch.app/pay. Prices are in Nigerian naira.",
        "Payments are processed securely by Paystack. A pass starts as soon as the payment is confirmed, and buying again adds time on top of any time you have left.",
        "Passes do not renew automatically. Nothing is charged again unless you choose to buy another pass.",
        "One pass works for one GOAT ID, on both WhatsApp and the website.",
      ],
      `Refunds: if you were charged but your pass was not switched on, or you were charged twice for the same purchase, email ${CONTACT_EMAIL} with your GOAT ID and payment reference and we will activate the pass or refund you. Because a pass starts straight away, we don't refund unused days, unless GOAT AI was unavailable for a long period through our fault or the law requires a refund.`,
    ],
  },
  {
    id: "partner-links",
    title: "Partner links",
    body: [
      "Some links on GOAT may be partner (referral or affiliate) links, for example to an exchange. They are always labelled \"Partner link\".",
      "If you sign up or trade through a partner link, GOAT may earn a commission from the partner. This costs you nothing extra.",
      "Partners never pay for a safety verdict: a coin's 🟢, 🟡 or 🔴 result comes only from our automated checks. A partner link is not a recommendation to use that service; check that it is available and legal where you live.",
      "When you click a partner link, we count the click (which partner and which page) to measure what's useful. We do not record who clicked.",
    ],
  },
  {
    id: "third-party",
    title: "Third-party links and data",
    body: [
      "GOAT links to and uses data from other services, such as exchanges, DexScreener, GeckoTerminal, Birdeye, GoPlus, CoinGecko, SEC Nigeria, news publishers, Telegram, WhatsApp, Anthropic and Paystack.",
      "We don't control those services and aren't responsible for their content, availability or actions. Your use of them is governed by their own terms.",
    ],
  },
  {
    id: "warranty",
    title: "No warranty",
    body: [
      "GOAT is provided \"as is\" and \"as available\". We work hard to keep it accurate and online, but we don't promise it will always be available, error-free or up to date.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: [
      "To the fullest extent allowed by law, GOAT and its team are not liable for any trading or investment losses, lost profits, or indirect damages that arise from using the platform or relying on its information, including GOAT AI answers.",
      "Nothing in these terms limits liability that cannot be limited under the law.",
    ],
  },
  {
    id: "ending",
    title: "Ending your use",
    body: [
      "You can stop using GOAT and ask us to delete your account at any time.",
      "We may suspend or close accounts that break these terms or put other users at risk.",
    ],
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: [
      "We may update these terms as GOAT grows. The date at the top of this page shows the latest version. If the changes are significant, we will let you know on the platform.",
    ],
  },
  {
    id: "law",
    title: "Governing law",
    body: [
      "These terms are governed by the laws of the Federal Republic of Nigeria.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [`Questions about these terms? Email ${CONTACT_EMAIL}.`],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Use"
      updated="14 November 2026"
      intro="These terms explain the rules for using GOAT. By creating an account, using the site or the bots, or buying GOAT AI, you agree to them."
      sections={sections}
    />
  );
}
