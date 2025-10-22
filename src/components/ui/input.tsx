import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-hidden ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };


