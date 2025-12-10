import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full min-h-[100px] resize-y rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 ease-in-out",
        "bg-white border border-gray-300 text-foreground placeholder:text-muted-foreground",
        "shadow-sm hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/30",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder:text-neutral-400",
        "dark:hover:border-primary/70 dark:focus:border-primary dark:focus:ring-primary/40",

        className
      )}
      {...props}
    />
  );
}

export { Textarea };
