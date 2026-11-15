/** A speaker: waves when on, a cross when off. `pulse` breathes the waves while a sound is playing. */
export function SoundIcon({ on, pulse, className }: { on: boolean; pulse?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z" />
      {on ? (
        <path className={pulse ? 'motion-safe:animate-pulse' : undefined} d="M15.5 9 A4 4 0 0 1 15.5 15 M18 6.5 A7.5 7.5 0 0 1 18 17.5" />
      ) : (
        <path d="M16 9.5 L21 14.5 M21 9.5 L16 14.5" />
      )}
    </svg>
  )
}
