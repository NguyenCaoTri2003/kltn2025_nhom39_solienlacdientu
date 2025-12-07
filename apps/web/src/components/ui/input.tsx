import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full rounded-lg border border-input px-3 py-2 text-sm outline-none transition-all duration-200 ease-in-out',
        'bg-white placeholder:text-muted-foreground',
        'border-gray-300 shadow-sm hover:border-primary/60',
        'focus:border-primary focus:ring-2 focus:ring-primary/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30',
        'dark:bg-gray-900 dark:text-gray-100',
        'dark:border-gray-700 dark:placeholder:text-gray-400',
        'dark:hover:border-primary/60',
        'dark:focus:border-primary dark:focus:ring-primary/40',

        className,
      )}
      {...props}
    />
  )
}

export { Input }
