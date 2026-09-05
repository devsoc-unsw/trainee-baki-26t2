import Header from "../../components/Header";
import ShoppingListCard from "../../components/ShoppingListCard";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex min-w-0 flex-1 items-center justify-start bg-white p-4 sm:p-8">
        <ShoppingListCard />
      </main>
    </>
  );
}
