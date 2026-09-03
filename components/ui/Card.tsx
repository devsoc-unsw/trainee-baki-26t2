import type { HTMLAttributes } from "react";

type CardVariant =
  | "panel"
  | "productPanel"
  | "well"
  | "content"
  | "meal"
  | "placeholder";

type CardElement = "article" | "div" | "section";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement;
  variant: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  panel: "rounded-3xl bg-[#FFF2C0]",
  productPanel: "rounded-[20px] bg-[#FFF2C0]",
  well: "rounded-2xl bg-[#FFF9EE]",
  content: "rounded-xl bg-white",
  meal: "rounded-2xl border-2 border-[#FFE08A] bg-white",
  placeholder: "rounded-xl bg-[#FFF9EE]",
};

export default function Card({
  as: Component = "div",
  variant,
  className = "",
  ...props
}: CardProps) {
  return (
    <Component
      className={`${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
