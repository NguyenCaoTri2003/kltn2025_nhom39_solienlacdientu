import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-200 ease-in-out outline-none",
        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        "border-gray-300 shadow-sm hover:border-primary/60",
        "focus:border-primary focus:ring-2 focus:ring-primary/30",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        "min-h-[100px] resize-y",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
