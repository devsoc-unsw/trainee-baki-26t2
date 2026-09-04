import Header from "../../components/Header";
import ShoppingListCard from "../../components/ShoppingListCard";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-start bg-white p-8">
        <ShoppingListCard />
      </main>
    </>
  );
}
