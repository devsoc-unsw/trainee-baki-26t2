import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "tab"
  | "toggle"
  | "secondary"
  | "remove";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant;
  active?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "rounded-xl border-0 bg-[#FFC518] font-indie-flower text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500",
  tab: "rounded-xl px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none",
  toggle:
    "rounded-3xl border-2 border-black px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none",
  secondary:
    "rounded-xl bg-[#A5D8F3] px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none",
  remove:
    "rounded font-indie-flower leading-none text-black focus:ring-2 focus:ring-black focus:outline-none",
};

export default function Button({
  variant,
  active = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const activeClasses =
    variant === "tab"
      ? active
        ? "bg-[#FFC518]"
        : "bg-[#FFF2C0]"
      : variant === "toggle"
        ? active
          ? "bg-[#FFC518]"
          : "bg-white"
        : "";

  return (
    <button
      type={type}
      className={`${variantClasses[variant]} ${activeClasses} ${className}`}
      {...props}
    />
  );
}
