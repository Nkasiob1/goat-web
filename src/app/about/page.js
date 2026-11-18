// src/app/about/page.js
// NEW: "About GOAT": who runs it, how the verdicts work, what GOAT never does, and how it makes money.
// Trust page: a safety tool should never be anonymous. Uses the same layout as Terms/Privacy (English text).
import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage"; // shared layout + contact email
import { CAC_NUMBER, WHATSAPP_URL, TELEGRAM_BOT_URL } from "@/lib/site";

export const metadata = {
  title: "About GOAT | GOATWATCH TECHNOLOGIES",
  description: "Who runs GOAT, how its crypto safety verdicts work, what it never does, and how it makes money.",
  alternates: { canonical: "/about" },
};

const sections = [
  {
    id: "who",
    title: "Who runs GOAT",
    body: [
      `GOAT is built and run by Ukaegbu Nkasiobi Precious (Kasi), founder of GOATWATCH TECHNOLOGIES, a Nigerian business registered with the Corporate Affairs Commission (Business Name No. ${CAC_NUMBER}).`,
      "Kasi has traded since 2020 and built GOAT after seeing too many people lose money to rug pulls and Ponzi-style platforms. GOAT is built in public, one update at a time.",
    ],
  },
  {
    id: "what",
    title: "What GOAT does",
    body: [
      [
        "Coin check (Vet): paste a contract address and GOAT checks it for honeypots, hidden owner powers, whale wallets, thin liquidity, price crashes and copycats.",
        "Company Check: GOAT looks up SEC Nigeria warnings and approvals, the website's age and Ponzi-style promises for investment platforms.",
        `GOAT AI: answers crypto and scam questions in 10 languages on WhatsApp (${WHATSAPP_URL.replace("https://", "")}) and on this site, and can read screenshots.`,
        `Radar and rug watch: new coins and exchange listings are checked as they launch, with alerts on Telegram (${TELEGRAM_BOT_URL.replace("https://", "")} also works inside groups) and X. If a coin GOAT showed turns risky, GOAT posts a warning.`,
      ],
    ],
  },
  {
    id: "verdicts",
    title: "How the verdicts work",
    body: [
      "Every check is automated, uses public data, and describes a coin at the moment it was checked.",
      [
        "🟢 No major red flags: the contract scan found no serious problem and there is at most one minor warning. It does not mean safe. Owners can change things later.",
        "🟡 Caution: two or more warnings, one serious warning (a price crash, a fake valuation, one wallet holding most of the supply), or no contract scan data.",
        "🔴 High risk: at least one serious failure, such as a honeypot (you can buy but not sell), liquidity that can be pulled or is gone, or a classic crash pattern.",
      ],
      "Every verdict lists its reasons, so you can see exactly why. You can re-check any coin at any time.",
    ],
  },
  {
    id: "never",
    title: "What GOAT never does",
    body: [
      [
        "Never gives financial advice or tells you to buy, sell or hold anything.",
        "Never holds your money or crypto, and never trades for you.",
        "Never asks for your seed phrase, private key, password or one-time code.",
        "Never sells a verdict. Nobody can pay for a 🟢, and GOAT does not run paid coin promotions.",
        "Never calls a coin or platform \"safe\".",
      ],
    ],
  },
  {
    id: "money",
    title: "How GOAT makes money",
    body: [
      "The coin check, radar and alerts are free. GOAT AI is a paid pass (from ₦500 for 7 days) after a free trial, paid in Naira through Paystack. That is how GOAT pays for its servers and data, without selling verdicts or your data.",
    ],
  },
  {
    id: "mistakes",
    title: "Mistakes and corrections",
    body: [
      `Automated checks can be wrong. If you think a result about a coin, or about your business in Company Check, is wrong, email ${CONTACT_EMAIL} with the details. We review every report and correct mistakes promptly.`,
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [`Email ${CONTACT_EMAIL}. GOATWATCH TECHNOLOGIES, Rivers State, Nigeria.`],
  },
];

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="About"
      title="About GOAT"
      updated="19 November 2026"
      intro="GOAT helps people check crypto coins and investment platforms before they risk their money. Here is who runs it, how it works, and what it will never do."
      sections={sections}
    />
  );
}
