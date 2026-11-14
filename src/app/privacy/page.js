import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage"; // shared layout + contact email

export const metadata = { title: "Privacy Policy | GOAT" };

const sections = [
  {
    id: "who",
    title: "Who we are",
    body: [
      // CHANGED: the registered business name
      "GOAT is operated by GOATWATCH TECHNOLOGIES (Business Name Reg. No. 9998471), Nigeria. We are responsible for the personal data described in this policy and we handle it in line with the Nigeria Data Protection Act 2023.",
    ],
  },
  {
    id: "collect",
    title: "What we collect",
    body: [
      [
        "Account details: your email address, username and password (we only ever store an encrypted version of the password).",
        "Profile details you choose to add, such as a display name, bio and avatar.",
        "Content you create: posts, replies, images, likes and follows.",
        "Safety records: reports you make or receive, and moderation decisions.",
        // NEW: WhatsApp and Telegram bots
        "WhatsApp and Telegram bots: we use your phone number only to reply to you and never store it. Instead we store a scrambled ID made from it, your chosen language, and which coins were checked (not your message text).",
        // NEW: GOAT AI
        "GOAT AI chats: the messages you send to GOAT AI and its replies, kept for 24 hours so it can follow the conversation, then deleted automatically. We also store your GOAT ID, the name you ask GOAT AI to call you, and how many chats you have used.",
        // NEW: payments
        "Payments: when you buy GOAT AI, Paystack processes the payment. We store the payment reference, plan, amount, status and date. We do not store your card details or your email address; Paystack holds those under its own privacy policy.",
        "Basic technical data our hosting providers record, such as IP address, browser type and error logs.",
      ],
      "We don't collect your bank details, card numbers, wallet private keys or seed phrases. GOAT will never ask for them. If you share a seed phrase or password in a chat by mistake, move your funds to a new wallet straight away.",
    ],
  },
  {
    id: "use",
    title: "How we use it",
    body: [
      [
        "To create and run your account and keep you signed in.",
        "To show your posts and profile to other members.",
        "To send notifications, such as replies, likes, follows and password resets.",
        "To answer your coin checks and GOAT AI questions in your language.", // NEW
        "To run your GOAT AI free trial and subscription, and to stop abuse of it.", // NEW
        "To keep the community safe: reviewing reports, removing scams and preventing abuse.",
        "To fix bugs and improve GOAT.",
      ],
      "We process this data to provide the service you signed up for, to keep it secure (our legitimate interest), and to meet our legal obligations.",
    ],
  },
  {
    id: "public",
    title: "What is public",
    body: [
      "Your username, avatar, profile and posts are public on GOAT. Your email address is never shown to other members. GOAT AI chats and bot messages are private.",
    ],
  },
  {
    id: "share",
    title: "Who we share it with",
    body: [
      "We don't sell your personal data. We only share it with the services that run GOAT for us:",
      [
        "Supabase: database, sign-in and file storage.",
        "Vercel: website hosting.",
        "Meta (WhatsApp): delivers messages between you and the GOAT WhatsApp bot.", // NEW
        "Telegram: delivers bot messages, and GOAT's team gets a private notice when a new account is created.",
        "Anthropic: processes GOAT AI messages to write the replies. Under its commercial terms, Anthropic does not use this data to train its models.", // NEW
        "Paystack: processes GOAT AI payments.", // NEW
      ],
      "These providers may store data outside Nigeria. We only use providers that protect data with recognised security standards. We may also disclose data if the law requires it.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies and storage",
    body: [
      "We use essential cookies and browser storage to keep you signed in and remember simple settings. We don't use advertising cookies.",
    ],
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: [
      [
        "Account data: while your account is open. When you delete your account, we delete or anonymise your personal data within 30 days, unless we must keep some of it to meet a legal obligation or to deal with abuse.",
        "GOAT AI messages: 24 hours, then deleted automatically.", // NEW
        "Bot message IDs (used to avoid answering the same message twice): 3 days.", // NEW
        "Payment records: as long as Nigerian tax and accounting law requires.", // NEW
      ],
    ],
  },
  {
    id: "rights",
    title: "Your rights",
    body: [
      "Under Nigerian data protection law, you can:",
      [
        "Ask for a copy of your personal data.",
        "Correct data that is wrong.",
        "Ask us to delete your data.",
        "Object to, or ask us to limit, how we use it.",
        "Withdraw consent where we rely on it.",
        "Complain to the Nigeria Data Protection Commission (NDPC).",
      ],
      `To use any of these rights, email ${CONTACT_EMAIL}. For bot or GOAT AI data, include your GOAT ID so we can find it. We'll reply within 30 days.`,
    ],
  },
  {
    id: "security",
    title: "Security",
    body: [
      "We use encrypted connections, access controls in our database, and secret keys that never reach your browser. No system is perfectly secure, so please use a strong, unique password.",
    ],
  },
  {
    id: "children",
    title: "Children",
    body: [
      "GOAT, its bots and GOAT AI are only for people aged 18 and over. If we learn that a child has created an account or is using GOAT AI, we will delete their data.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: [
      "We'll update this page when our practices change and show the new date at the top. If the changes are significant, we'll tell you on the platform.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [`Privacy questions or requests: ${CONTACT_EMAIL}.`],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="14 November 2026"
      intro="This policy explains what personal data GOAT collects, why we collect it, and the choices you have."
      sections={sections}
    />
  );
}
