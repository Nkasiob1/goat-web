import { Suspense } from "react";                        // needed because the form reads the URL (?email=)
import Logo from "../../components/Logo";
import AuthForm from "../../components/AuthForm";
import AuthHeading from "../../components/AuthHeading";  // NEW: translated title + subtitle

export const metadata = { title: "Log in | GOAT" };      // browser tab title (stays English: set on the server)

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-6 py-16"> {/* centred on the screen */}
      <div className="w-full max-w-md">                  {/* never wider than a comfortable card */}
        <div className="flex justify-center"><Logo /></div>
        <AuthHeading mode="login" />                     {/* CHANGED: was hard-coded English */}
        <div className="mt-8">
          <Suspense>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </div>
    </main>
  );
}