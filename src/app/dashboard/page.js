import Logo from "../../components/Logo";       // go up two folders (dashboard → app → src), then into components

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-mist p-10">
      <Logo />                                  {/* our component, used like an HTML tag */}
      <h1 className="mt-8 text-3xl font-semibold text-forest"> {/* mt-8 adds space below the logo */}
        GOAT Dashboard
      </h1>
      <p className="mt-2 text-stone">
        Your bot, at a glance.
      </p>
    </main>
  );
}