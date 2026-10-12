import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage"; // shared layout + contact email

export const metadata = { title: "Privacy Policy | GOAT" };

const sections = [
  {
    id: "who",
    title: "Who we are",
    body: [
      "GOAT is run from Abuja, Nigeria. We are responsible for the personal data described in this policy and we handle it in line with the Nigeria Data Protection Act 2023.",
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
        "Basic technical data our hosting providers record, such as IP address, browser type and error logs.",
      ],
      "We don't collect your bank details, card numbers, wallet private keys or seed phrases. GOAT will never ask for them.",
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
      "Your username, avatar, profile and posts are public on GOAT. Your email address is never shown to other members.",
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
        "Telegram: GOAT's team gets a private notice when a new account is created.",
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
      "We keep your account data while your account is open. When you delete your account, we delete or anonymise your personal data within 30 days, unless we must keep some of it to meet a legal obligation or to deal with abuse.",
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
      `To use any of these rights, email ${CONTACT_EMAIL}. We'll reply within 30 days.`,
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
      "GOAT is only for people aged 18 and over. If we learn that a child has created an account, we will delete it.",
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
      updated="13 October 2026"
      intro="This policy explains what personal data GOAT collects, why we collect it, and the choices you have."
      sections={sections}
    />
  );
}
