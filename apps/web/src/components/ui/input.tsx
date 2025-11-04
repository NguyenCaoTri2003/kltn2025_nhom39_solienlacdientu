import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm transition-all duration-200 ease-in-out outline-none',
        'placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:cursor-not-allowed disabled:opacity-50',

        'border-gray-300 shadow-sm hover:border-primary/60',

        'focus:border-primary focus:ring-2 focus:ring-primary/30',

        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30',

        className,
      )}
      {...props}
    />
  )
}

export { Input }
