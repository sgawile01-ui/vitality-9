import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
  size?: "default" | "lg" | "icon";
};
export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "default"
          ? "bg-primary text-primary-foreground"
          : variant === "secondary"
            ? "bg-secondary text-secondary-foreground"
            : "bg-transparent",
        size === "lg" && "min-h-12",
        size === "icon" && "min-w-11 px-2",
        className,
      )}
      {...props}
    />
  );
}
