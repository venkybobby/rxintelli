import * as React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variant === "destructive" &&
          "border-red-200 bg-red-50 text-red-900 [&>a]:text-red-800 [&>a]:underline [&>a]:font-medium",
        variant === "default" &&
          "border-slate-200 bg-slate-50 text-slate-800",
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

export { Alert };
