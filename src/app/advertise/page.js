import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdvertiseForm from "../../components/AdvertiseForm";

export const metadata = { title: "Advertise | GOAT" };

export default function AdvertisePage() {
  const points = [                                         // what advertisers get, all true to how the site works
    { title: "Placement at the point of decision", text: "Your platform appears in “Where to buy” on coin pages, right when traders choose where to buy." },
    { title: "Clearly labelled", text: "Sponsored listings carry a visible tag. Honest labelling keeps our audience's trust, and that trust is what you're paying for." },
    { title: "Regulated partners only", text: "We list platforms that are licensed in the markets they serve. Tell us who regulates you." },
  ];

  return (
    <main>
      <Navbar />
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-moss">Advertise</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-5xl">
            Reach traders when they decide where to buy.
          </h1>
          <ul className="mt-10 space-y-8">
            {points.map((p) => (
              <li key={p.title}>
                <p className="font-semibold text-ink">{p.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <AdvertiseForm />
      </section>
      <Footer />
    </main>
  );
}