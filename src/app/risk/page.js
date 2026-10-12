import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage"; // shared layout + contact email

export const metadata = { title: "Risk Disclosure | GOAT" };

const sections = [
  {
    id: "crypto",
    title: "Crypto is high risk",
    body: [
      "Crypto prices can rise or fall sharply within minutes. You can lose some or all of the money you put in.",
      "Only trade with money you can afford to lose completely.",
    ],
  },
  {
    id: "new-coins",
    title: "New coins carry extreme risk",
    body: [
      "The coins shown on the Launch Radar and the Scanner are often only hours old. Many fail, and some are scams. Common dangers include:",
      [
        "Rug pulls: the creators remove the liquidity and the price drops to almost zero.",
        "Honeypots: you can buy the coin but can't sell it.",
        "Hidden taxes, blacklists or owner controls added to the contract.",
        "Thin liquidity, so even a small trade moves the price a lot.",
        "Pump-and-dump schemes promoted on social media.",
      ],
    ],
  },
  {
    id: "checks",
    title: "What our safety checks can and can't do",
    body: [
      "The Launch Radar scans contracts with third-party security data from GoPlus, and applies liquidity, volume and age filters. A 🟢 badge only means that none of the red flags we check for were found at the time of the check.",
      [
        "Checks can miss risks, and the data behind them can be wrong or incomplete.",
        "A contract or its liquidity can change after we check it.",
        "A 🟢 badge is not a guarantee, an audit or a recommendation.",
      ],
    ],
  },
  {
    id: "listings",
    title: "Exchange listing alerts",
    body: [
      "Listing alerts tell you that a coin has appeared on an exchange such as Binance, Bybit or OKX. Prices around new listings are extremely volatile. An alert is not an endorsement of the coin or the exchange.",
    ],
  },
  {
    id: "data",
    title: "Market data and automated posts",
    body: [
      "Prices, charts and news come from third parties and may be delayed or wrong. Posts by @GOAT and alerts in our Telegram channel are generated automatically. Always check information at the original source before you act on it.",
    ],
  },
  {
    id: "community",
    title: "Community posts",
    body: [
      "Members' posts are their own opinions, not GOAT's. Treat any promise of guaranteed or quick profits as a warning sign.",
    ],
  },
  {
    id: "scams",
    title: "Protect yourself from scams",
    body: [
      [
        "GOAT never holds your funds and never asks you to send money or crypto.",
        "GOAT staff will never ask for your password, private keys or seed phrase.",
        "Anyone offering \"account recovery\", \"guaranteed signals\" or investment management in GOAT's name is a scammer. Please report them.",
      ],
    ],
  },
  {
    id: "you",
    title: "Your responsibility",
    body: [
      "You are responsible for your own trading decisions and for any taxes or legal duties that come with them in your country. If you need advice, speak to a licensed financial professional.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [`Spotted something wrong, or a scam using GOAT's name? Email ${CONTACT_EMAIL}.`],
  },
];

export default function RiskPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Risk Disclosure"
      updated="13 October 2026"
      intro="Please read this before you use GOAT's market tools, the Launch Radar or the community. It explains the risks of trading crypto, especially new coins."
      sections={sections}
    />
  );
}
