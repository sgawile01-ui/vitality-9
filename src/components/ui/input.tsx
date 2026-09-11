import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("min-w-0 w-full rounded-lg border border-border p-2", className)}
      {...props}
    />
  );
}
