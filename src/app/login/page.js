import { Suspense } from "react";
import Logo from "../../components/Logo";
import AuthForm from "../../components/AuthForm";

export const metadata = { title: "Log in | GOAT" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-8 text-center text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-stone">Log in to your GOAT account.</p>
        <div className="mt-8">
          <Suspense>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </div>
    </main>
  );
}