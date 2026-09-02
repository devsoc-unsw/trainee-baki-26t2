import Header from "../../components/Header";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Let Him Cook</h1>
          <p className="mt-2 text-gray-500">
            We're gonna have the main page here
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            href="/recipes"
            className="rounded-lg border px-6 py-4 transition hover:bg-gray-50"
          >
            <div className="font-medium">I want to look for a recipe</div>
          </Link>
        </div>
      </main>
    </>
  );
}
