import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostThread from "@/components/PostThread";

export const metadata = { title: "Post | GOAT" }; // browser tab title

export default async function PostPage({ params }) {
  const { id } = await params; // /post/42 → id = "42"
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <PostThread id={id} />
      </main>
      <Footer />
    </>
  );
}