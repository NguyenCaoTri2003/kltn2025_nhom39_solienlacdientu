import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LabelRequiredProps extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function LabelRequired({ children, required = false, className, ...props }: LabelRequiredProps) {
  return (
    <Label className={cn("flex items-center gap-1", className)} {...props}>
      {children}
      {required && <span className="text-red-500">*</span>}
    </Label>
  );
}