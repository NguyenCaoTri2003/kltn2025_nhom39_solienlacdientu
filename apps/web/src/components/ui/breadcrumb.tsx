import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export const Breadcrumb = ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
  <nav aria-label="breadcrumb" {...props} />
)

export const BreadcrumbList = ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
  <ol className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)} {...props} />
)

export const BreadcrumbItem = ({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
  <li className={cn("flex items-center gap-1", className)} {...props} />
)

export const BreadcrumbLink = ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a className={cn("hover:text-foreground", className)} {...props} />
)

export const BreadcrumbPage = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("font-medium text-foreground", className)} {...props} />
)

export const BreadcrumbSeparator = () => <ChevronRight className="h-4 w-4 text-muted-foreground" />
