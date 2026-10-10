const TONES = ["bg-forest", "bg-moss", "bg-[#5B6B63]", "bg-[#7A6A4F]", "bg-[#4A5D73]"];

function toneFor(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

const SIZES = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-3xl" };

export default function Avatar({ name = "?", src = null, size = "md" }) {
  if (src) {                                             // a photo was uploaded: show it, cropped to a circle
    return (
      <img
        src={src}
        alt={`@${name}`}
        className={`shrink-0 rounded-full bg-mist object-cover ${SIZES[size]}`} // object-cover fills the circle without stretching
      />
    );
  }
  return (                                               // no photo: the coloured initial
    <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-water ${SIZES[size]} ${toneFor(name)}`}>
      {name[0]?.toUpperCase()}
    </span>
  );
}