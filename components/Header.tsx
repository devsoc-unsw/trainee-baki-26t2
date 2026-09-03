import Image from "next/image";
import Link from "next/link";

// Keep the nav labels together so they are easy to update later.
const navItems = ["List", "Meal Prep", "What can I make?"];

export default function Header() {
  return (
    <header className="flex h-36 w-full flex-row items-center justify-between gap-4 bg-[#FFF2C0] px-5 sm:px-8 lg:px-12">
      {/* The image and name stay together on the left. */}
      <div className="flex shrink-0 items-center gap-4">
        <Image
          src="/images/bears-lethimcook.png"
          alt="Bears saying let him cook"
          width={130}
          height={128}
          priority
          className="h-20 w-auto shrink-0 rounded-lg object-cover sm:h-26"
        />
        <span className="font-special-elite text-3xl leading-none text-black sm:text-5xl">
          <span className="block">LetHim</span>
          <span className="block">Cook</span>
        </span>
      </div>

      {/* This fills the space left over and spreads the links across it. */}
      <nav
        aria-label="Main navigation"
        className="ml-6 flex min-w-0 flex-1 flex-wrap items-center justify-between gap-y-2 sm:ml-10 sm:flex-nowrap lg:ml-16"
      >
        {navItems.map((item) =>
          item === "Meal Prep" || item === "What can I make?" ? (
            <Link
              key={item}
              href={
                item === "Meal Prep" ? "/meal-prep" : "/what-can-i-make"
              }
              className="font-special-elite text-base leading-tight text-black sm:text-xl lg:text-2xl"
            >
              {item}
            </Link>
          ) : (
            <span
              key={item}
              className="font-special-elite text-base leading-tight text-black sm:text-xl lg:text-2xl"
            >
              {item}
            </span>
          ),
        )}
      </nav>
    </header>
  );
}
