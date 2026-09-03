export default function ShoppingListCard() {
  return (
    <section className="ml-0 w-full max-w-120 rounded-3xl bg-[#FFF2C0] p-6 sm:ml-4 lg:ml-8">
      <h2 className="mb-4 font-island-moments text-5xl leading-none text-black sm:text-6xl">
        Shopping List
      </h2>

      <div className="rounded-2xl bg-[#FFF9EE] p-6">
        <ul className="space-y-4 font-indie-flower text-3xl text-black">
          <li>8 x Eggs</li>
          <li>150g Butter</li>
          <li>600ml Milk</li>
          <li>200g Sugar</li>
        </ul>
      </div>
    </section>
  );
}
