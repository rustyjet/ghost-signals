import type { QuickFact, Source } from '../data/types'

/** The spec sheet: a tag-style fact grid plus the list of sources every fact came from. */
export default function QuickFacts({ facts, sources }: { facts: QuickFact[]; sources: Source[] }) {
  return (
    <div className="space-y-8">
      {/* gap-px over an ink background draws the grid lines at any column count */}
      <dl className="grid grid-cols-2 gap-[2px] border-2 border-ink bg-ink md:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="bg-card p-3">
            <dt className="stamp text-ink-soft">{f.label}</dt>
            <dd className="mt-1 font-display text-lg font-bold leading-tight">{f.value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="text-xl">Where these facts come from</h3>
        <ul className="mt-3 space-y-2 text-[0.92rem]">
          {sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-2 underline-offset-2 hover:text-red-text">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
