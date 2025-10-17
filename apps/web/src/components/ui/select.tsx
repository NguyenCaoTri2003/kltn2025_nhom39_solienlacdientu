'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root {...props} />
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default'
}) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex items-center justify-between gap-2 w-full rounded-lg border px-3 text-sm shadow-sm outline-none transition-all duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'default' && 'h-10 py-2',
        size === 'sm' && 'h-8 py-1.5 text-xs',
        'border-gray-300 bg-background hover:border-primary/60',
        'focus:border-primary focus:ring-2 focus:ring-primary/30',
        'data-[placeholder]:text-muted-foreground',

        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      {/* <SelectPrimitive.Content
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg animate-in fade-in-80 zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content> */}

      <SelectPrimitive.Content
  className={cn(
    'z-50 w-[var(--radix-select-trigger-width)] max-h-60 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-lg animate-in fade-in-80 zoom-in-95',
    'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
    className,
  )}
  position={position}
  {...props}
>
  <SelectScrollUpButton />
  <SelectPrimitive.Viewport className="p-1">
    {children}
  </SelectPrimitive.Viewport>
  <SelectScrollDownButton />
</SelectPrimitive.Content>

    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none transition-colors',
        'focus:bg-primary/10 focus:text-primary',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-2 flex items-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn('px-2 py-1.5 text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={cn('my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn('flex items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronUpIcon className="h-4 w-4 opacity-50" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn('flex items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </SelectPrimitive.ScrollDownButton>
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group {...props} />
}

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectValue,
  SelectGroup,
}
