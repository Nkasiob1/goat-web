import Navbar from "../../../components/Navbar";         // up three folders: [username] → u → app → src
import Footer from "../../../components/Footer";
import ProfileView from "../../../components/ProfileView";

export async function generateMetadata({ params }) {     // browser tab title, e.g. "@Tester | GOAT"
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)} | GOAT` };
}

export default async function ProfilePage({ params }) {
  const { username } = await params;                     // "Tester" from /u/Tester

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <ProfileView username={decodeURIComponent(username)} /> {/* decode turns %20-style codes back into characters */}
      </section>
      <Footer />
    </main>
  );
}