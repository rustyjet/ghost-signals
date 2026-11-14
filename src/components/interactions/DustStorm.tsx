import { useEffect, useRef, useState } from 'react'
import {
  COST_CORE,
  COST_HEATERS,
  COST_RADIO,
  TOTAL_SOLS,
  initialState,
  step,
  sunlight,
  type GameState,
  type Plan,
} from './dustStormModel'

const SOL_MS = 1800

type Phase = 'intro' | 'running' | 'paused' | 'over'

/** "Last Light": keep Opportunity warm and powered through a 40-sol dust storm. */
export default function DustStorm() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [state, setState] = useState<GameState>(initialState)
  const [plan, setPlan] = useState<Plan>({ heaters: true, radio: true })
  const [log, setLog] = useState<string[]>([])
  const planRef = useRef(plan)
  planRef.current = plan
  // The game ticks from a ref so each sol is computed exactly once (no side effects inside setState).
  const stateRef = useRef(state)

  useEffect(() => {
    if (phase !== 'running') return
    const id = window.setInterval(() => {
      const prev = stateRef.current
      const next = step(prev, planRef.current)
      stateRef.current = next
      setState(next)

      const notes = solNotes(prev, next)
      if (notes.length) setLog((l) => [...notes.reverse(), ...l].slice(0, 6))
      if (next.outcome !== 'playing') setPhase('over')
    }, SOL_MS)
    return () => window.clearInterval(id)
  }, [phase])

  function start() {
    stateRef.current = initialState()
    setState(stateRef.current)
    setPlan({ heaters: true, radio: true })
    setLog(['Sol 0: skies clear. A storm is building to the south.'])
    setPhase('running')
  }

  const sky = sunlight(state.sol)
  const spend = COST_CORE + (plan.heaters ? COST_HEATERS : 0) + (plan.radio ? COST_RADIO : 0)

  return (
    <div className="kit-card overflow-hidden">
      {/* Sky window: the sun fades as the storm thickens */}
      <div
        className="relative h-36 border-b-2 border-ink sm:h-44"
        style={{ background: `color-mix(in oklab, #e8b37a ${Math.round(sky * 100)}%, #5a3b2a)` }}
        aria-hidden="true"
      >
        <div
          className="absolute left-1/2 top-6 h-16 w-16 -translate-x-1/2 rounded-full bg-[#fff6dc] transition-opacity duration-700"
          style={{ opacity: 0.15 + sky * 0.85, boxShadow: `0 0 ${20 + sky * 40}px #fff6dc` }}
        />
        <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute bottom-0 h-12 w-full">
          <path d="M0 40 Q60 22 120 34 T240 30 T400 26 V60 H0Z" fill="#7a3a1c" />
        </svg>
        <RoverGlyph dust={state.dust} />
        {state.gust && phase === 'running' && (
          <p className="stamp absolute right-3 top-3 bg-card px-2 py-1 text-ink">Gust!</p>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {phase === 'intro' && (
          <div>
            <h3 className="text-2xl sm:text-3xl">Last Light: survive the storm</h3>
            <p className="mt-3 max-w-prose">
              A dust storm is coming. You can&rsquo;t wipe the solar panels. Keep Opportunity
              powered <em>and</em> warm for {TOTAL_SOLS} sols, and send science home when you can
              afford it. Each sol lasts about 2 seconds, and you can pause at any time.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                <strong>Heaters</strong> keep the electronics warm but use power.
              </li>
              <li>
                <strong>Radio</strong> sends one science packet home each sol, and uses the most
                power.
              </li>
              <li>If the battery runs flat or the rover freezes, the mission is over.</li>
            </ul>
            <button type="button" className="kit-button mt-5" onClick={start}>
              Start the storm
            </button>
          </div>
        )}

        {phase !== 'intro' && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-3xl font-extrabold">
                Sol {state.sol}
                <span className="text-ink-soft"> / {TOTAL_SOLS}</span>
              </p>
              <p className="stamp">
                Science sent: <span className="text-base">{state.data}</span> packets
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Gauge label="Battery" value={state.battery} warn={state.battery < 20} warnText="Low" />
              <Gauge label="Warmth" value={state.warmth} warn={state.warmth < 25} warnText="Cold" />
              <Gauge label="Clean panels" value={(1 - state.dust) * 100} warn={state.dust > 0.6} warnText="Dusty" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Switch
                label="Heaters"
                detail={`Uses ${COST_HEATERS} power a sol`}
                on={plan.heaters}
                disabled={phase === 'over'}
                onToggle={() => setPlan((p) => ({ ...p, heaters: !p.heaters }))}
              />
              <Switch
                label="Radio to Earth"
                detail={`Uses ${COST_RADIO} power a sol`}
                on={plan.radio}
                disabled={phase === 'over'}
                onToggle={() => setPlan((p) => ({ ...p, radio: !p.radio }))}
              />
            </div>
            <p className="stamp mt-2 text-ink-soft">
              Using {spend} power a sol (computer always uses {COST_CORE})
            </p>

            {phase !== 'over' && (
              <button
                type="button"
                className="kit-button mt-4"
                onClick={() => setPhase((p) => (p === 'running' ? 'paused' : 'running'))}
              >
                {phase === 'running' ? 'Pause' : 'Resume'}
              </button>
            )}

            <ul className="mt-4 space-y-1 font-mono text-sm" aria-live="polite" aria-label="Rover log">
              {log.map((line, i) => (
                <li key={`${line}-${i}`} className={i === 0 ? 'text-ink' : 'text-ink-soft'}>
                  {line}
                </li>
              ))}
            </ul>

            {phase === 'over' && <Ending state={state} onRetry={start} />}
          </>
        )}

        <p className="stamp mt-5 text-ink-soft">
          Game numbers are simplified. The real rover had many more systems to manage.
        </p>
      </div>
    </div>
  )
}

/** Log lines for one sol: storm news, lucky gusts and warnings early enough to act on. */
function solNotes(prev: GameState, next: GameState): string[] {
  const at = `Sol ${next.sol}:`
  const notes: string[] = []
  const crossed = (a: number, b: number, line: number) => a >= line && b < line
  if (crossed(sunlight(prev.sol), sunlight(next.sol), 0.75))
    notes.push(`${at} the storm has arrived. Less sunlight is reaching the panels.`)
  if (crossed(sunlight(prev.sol), sunlight(next.sol), 0.35))
    notes.push(`${at} the sky is nearly dark. Power is very low now.`)
  if (sunlight(prev.sol) < 0.5 && sunlight(next.sol) >= 0.5)
    notes.push(`${at} the dust is starting to settle. The sky is clearing!`)
  if (next.gust) notes.push(`${at} a gust of wind blew dust off the panels!`)
  if (crossed(prev.battery, next.battery, 50)) notes.push(`${at} battery at half. Think about what you can switch off.`)
  if (crossed(prev.battery, next.battery, 20)) notes.push(`${at} battery below 20%!`)
  if (crossed(prev.warmth, next.warmth, 35)) notes.push(`${at} electronics getting cold. Heaters?`)
  return notes
}

function Ending({ state, onRetry }: { state: GameState; onRetry: () => void }) {
  const won = state.outcome === 'survived'
  return (
    <div className="mt-6 border-t-2 border-dashed border-ink pt-5" role="status">
      <p className="stamp text-red-text">{won ? 'Signal holding' : 'Signal lost'}</p>
      <h3 className="mt-1 text-3xl">
        {won
          ? `You made it through, with ${state.data} packets sent.`
          : state.outcome === 'no-power'
            ? `The battery ran flat on sol ${state.sol}.`
            : `The electronics froze on sol ${state.sol}.`}
      </h3>
      <p className="mt-3 max-w-prose">
        {won
          ? 'That is what really happened in 2007. Opportunity’s team stopped driving, took few pictures and barely talked to Earth until the sky cleared. Its power fell to just 128 watt-hours a day, and it survived.'
          : 'In June 2018 a storm wrapped the whole planet, and Opportunity’s panels couldn’t recharge its batteries. Its last signal reached Earth on 10 June 2018.'}
      </p>
      <p className="mt-2 max-w-prose">
        {won
          ? 'In 2018 a much bigger storm covered all of Mars. That time, the rover went silent for good.'
          : 'In 2007, by switching almost everything off and waiting, the same rover survived a storm like this one.'}
      </p>
      <button type="button" className="kit-button mt-4" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

function Gauge({ label, value, warn, warnText }: { label: string; value: number; warn: boolean; warnText: string }) {
  const pct = Math.round(value)
  return (
    <div>
      <div className="flex justify-between">
        <span className="stamp">{label}</span>
        <span className={`stamp ${warn ? 'text-red-text' : ''}`}>
          {pct}%{warn ? ` · ${warnText}` : ''}
        </span>
      </div>
      <div
        className="mt-1 h-4 border-2 border-ink bg-card"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className="h-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: warn
              ? 'repeating-linear-gradient(45deg, var(--color-red) 0 6px, #c23417 6px 12px)'
              : 'var(--color-ink)',
          }}
        />
      </div>
    </div>
  )
}

function Switch({
  label,
  detail,
  on,
  disabled,
  onToggle,
}: {
  label: string
  detail: string
  on: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className="flex items-center justify-between gap-3 border-2 border-ink bg-card p-3 text-left shadow-[2px_2px_0_var(--color-ink)] disabled:opacity-60"
    >
      <span>
        <span className="block font-display text-lg font-bold">{label}</span>
        <span className="stamp text-ink-soft">{detail}</span>
      </span>
      <span
        className={`relative h-8 w-16 shrink-0 border-2 border-ink transition-colors ${on ? 'bg-mustard' : 'bg-paper-deep'}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 h-6 w-6 border-2 border-ink bg-card transition-[left] duration-150 ${on ? 'left-8' : 'left-0.5'}`}
        />
        <span className="stamp absolute -bottom-5 left-0 w-full text-center">{on ? 'On' : 'Off'}</span>
      </span>
    </button>
  )
}

/** A small side-view rover silhouette whose panel greys over as dust builds. */
function RoverGlyph({ dust }: { dust: number }) {
  return (
    <svg viewBox="0 0 120 70" className="absolute bottom-3 left-1/2 h-20 w-32 -translate-x-1/2">
      <rect x="10" y="22" width="100" height="6" fill="#2b4a6b" stroke="#1c1a17" strokeWidth="2" />
      <rect x="10" y="22" width="100" height="6" fill="#b89a74" opacity={dust} />
      <rect x="30" y="28" width="60" height="16" fill="#e8e0cc" stroke="#1c1a17" strokeWidth="2" />
      <line x1="80" y1="22" x2="80" y2="4" stroke="#1c1a17" strokeWidth="3" />
      <rect x="74" y="0" width="14" height="7" fill="#e8e0cc" stroke="#1c1a17" strokeWidth="2" />
      {[24, 60, 96].map((cx) => (
        <circle key={cx} cx={cx} cy="58" r="8" fill="#1c1a17" />
      ))}
      <path d="M24 58 L40 44 M60 58 L50 44 M96 58 L80 44" stroke="#1c1a17" strokeWidth="2" />
    </svg>
  )
}
