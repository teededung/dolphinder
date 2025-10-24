import React from "react";
import { cn } from "@/lib/utils";

export const Button = React.forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
  }
>(({ children, onClick, className, type = "button", ...props }, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "cursor-pointer rounded-full bg-white/80 px-4 py-2 text-black transition-all duration-300 hover:bg-white/90",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
