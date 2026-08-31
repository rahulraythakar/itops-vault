import { forwardRef } from "react";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

// Hand-written, not shadcn CLI output — this sandbox has no network to run
// `npx shadcn add`. Swap for real shadcn components later once you have
// Node running locally; the class names/behavior are compatible.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" && "bg-accent text-white hover:bg-accent-hover",
        variant === "secondary" &&
          "bg-surface text-ink border border-border hover:bg-background",
        variant === "ghost" && "text-ink hover:bg-background",
        variant === "danger" && "bg-danger text-white hover:opacity-90",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
