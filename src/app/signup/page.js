import { Suspense } from "react";                        // needed because the form reads the URL (?email=)
import Logo from "../../components/Logo";
import AuthForm from "../../components/AuthForm";

export const metadata = { title: "Create account | GOAT" };

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-6 py-16"> {/* centred on the screen */}
      <div className="w-full max-w-md">                  {/* never wider than a comfortable card */}
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-8 text-center text-2xl font-bold tracking-tight text-ink">Create your GOAT account</h1>
        <p className="mt-2 text-center text-sm text-stone">Track markets, save coins and join the community.</p>
        <div className="mt-8">
          <Suspense>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
      </div>
    </main>
  );
}