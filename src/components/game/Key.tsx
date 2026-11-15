import type { ComponentProps } from 'react'

/**
 * A drawn keyboard key for the games' hints: a cream outline cap on a little lip. With data-held="true" it sinks
 * onto the lip, so a hint can show the key being held.
 */
export function Key({ className = '', ...rest }: ComponentProps<'kbd'>) {
  return (
    <kbd
      {...rest}
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-sun/10 px-1.5 font-body text-sm font-bold leading-none text-sun shadow-[inset_0_0_0_1px_rgb(242_226_194/0.4),0_3px_0_rgb(242_226_194/0.28)] transition-[transform,box-shadow] duration-100 ease-out data-[held=true]:translate-y-[2px] data-[held=true]:bg-sun/20 data-[held=true]:shadow-[inset_0_0_0_1px_rgb(242_226_194/0.6),0_1px_0_rgb(242_226_194/0.28)] ${className}`}
    />
  )
}
