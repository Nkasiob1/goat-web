import Image from "next/image";                 // Next.js's image tag
import Link from "next/link";                   // Next.js's link tag: changes pages without a full reload

export default function Logo() {                // a reusable component named Logo
  return (
    <Link href="/" className="flex items-center gap-2">  {/* clicking the logo goes home; items sit in a row with a small gap */}
      <Image
        src="/goat-mark.svg"                    // the gold coin logo in public/
        alt="GOAT"                              // text for screen readers and if the image fails
        width={32}                              // display width in pixels
        height={32}                             // display height in pixels
        priority                                // load this first, since it's at the top of every page
        unoptimized                             // NEW: serve the SVG as-is (vectors are already sharp at any size)
      />
      <span className="text-xl font-bold tracking-tight text-forest"> {/* bold, tightly spaced, forest green */}
        GOAT
      </span>
    </Link>
  );
}