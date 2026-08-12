/**
 * Per-service technical line illustrations for ServicesGrid — replaces the
 * single stock photo every card used to share (same image, different crop).
 * Each variant is a small schematic diagram in the same line-art language as
 * WallPenetrationIllustration: thin neutral-custom-400 line work, with the
 * ember-600 accent reserved for one or two elements that are the actual
 * point of the diagram (a coating layer, a fixing point, a force vector).
 * Abstract/schematic on purpose, not literal engineering drawings.
 */

const STROKE = 1.25

function Lines({ children }) {
  return (
    <g className="text-neutral-custom-400" stroke="currentColor" strokeWidth={STROKE} fill="none" strokeLinecap="round">
      {children}
    </g>
  )
}

function Accent({ children }) {
  return (
    <g className="text-ember-600" stroke="currentColor" strokeWidth={STROKE} fill="none" strokeLinecap="round">
      {children}
    </g>
  )
}

function FireStopSystems() {
  return (
    <>
      <Lines>
        <line x1="70" y1="10" x2="70" y2="140" />
        <line x1="130" y1="10" x2="130" y2="140" />
        <line x1="70" y1="30" x2="82" y2="18" />
        <line x1="70" y1="60" x2="82" y2="48" />
        <line x1="70" y1="100" x2="82" y2="88" />
        <line x1="70" y1="130" x2="82" y2="118" />
        <line x1="20" y1="70" x2="180" y2="70" />
        <line x1="20" y1="80" x2="180" y2="80" />
        <circle cx="100" cy="75" r="18" />
      </Lines>
      <Accent>
        <circle cx="100" cy="75" r="26" strokeDasharray="3 6" />
        <circle cx="100" cy="57" r="2" fill="currentColor" />
        <circle cx="100" cy="93" r="2" fill="currentColor" />
      </Accent>
    </>
  )
}

function FireproofingSystems() {
  return (
    <>
      <Lines>
        <line x1="100" y1="25" x2="100" y2="125" />
        <rect x="72" y="20" width="56" height="10" />
        <rect x="72" y="120" width="56" height="10" />
      </Lines>
      <Accent>
        <rect x="58" y="12" width="84" height="126" rx="6" strokeDasharray="4 5" />
      </Accent>
    </>
  )
}

function CableProtection() {
  return (
    <>
      <Lines>
        <line x1="25" y1="45" x2="175" y2="45" />
        <line x1="25" y1="105" x2="175" y2="105" />
        {[35, 55, 75, 95, 115, 135, 155].map((x) => (
          <line key={x} x1={x} y1="45" x2={x} y2="105" />
        ))}
        <path d="M25,62 Q100,52 175,62" />
        <path d="M25,88 Q100,98 175,88" />
      </Lines>
      <Accent>
        <path d="M25,75 Q100,65 175,75" />
      </Accent>
    </>
  )
}

function Testing() {
  return (
    <>
      <Lines>
        <rect x="45" y="90" width="110" height="45" />
        <line x1="70" y1="90" x2="82" y2="78" />
        <line x1="100" y1="90" x2="112" y2="78" />
        <line x1="130" y1="90" x2="142" y2="78" />
        <line x1="100" y1="90" x2="100" y2="45" />
        <path d="M92,55 L100,45 L108,55" />
        <circle cx="150" cy="55" r="16" />
        <line x1="150" y1="55" x2="158" y2="47" />
      </Lines>
      <Accent>
        <line x1="100" y1="45" x2="100" y2="25" />
        <path d="M93,32 L100,22 L107,32" />
      </Accent>
    </>
  )
}

function Construction() {
  return (
    <>
      <Lines>
        <rect x="30" y="55" width="140" height="80" />
        <line x1="30" y1="70" x2="45" y2="55" />
        <line x1="30" y1="100" x2="45" y2="85" />
        <line x1="30" y1="130" x2="45" y2="115" />
        <circle cx="140" cy="100" r="20" strokeDasharray="3 5" />
      </Lines>
      <Accent>
        <circle cx="90" cy="95" r="22" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const x1 = 90 + Math.cos(angle) * 22
          const y1 = 95 + Math.sin(angle) * 22
          const x2 = 90 + Math.cos(angle) * 27
          const y2 = 95 + Math.sin(angle) * 27
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}
      </Accent>
    </>
  )
}

function Industrial() {
  return (
    <>
      <Lines>
        <line x1="45" y1="130" x2="45" y2="55" />
        <line x1="155" y1="130" x2="155" y2="55" />
        <line x1="35" y1="55" x2="165" y2="55" />
        <line x1="30" y1="80" x2="170" y2="80" />
        <line x1="30" y1="105" x2="170" y2="105" />
        <circle cx="120" cy="80" r="9" />
      </Lines>
      <Accent>
        <path d="M60,72 a8,8 0 0 1 0,16" />
        <path d="M60,97 a8,8 0 0 1 0,16" />
      </Accent>
    </>
  )
}

function Marine() {
  return (
    <>
      <Lines>
        <path d="M25,60 C60,110 140,110 175,60" />
        <line x1="20" y1="125" x2="45" y2="120" />
        <line x1="55" y1="125" x2="80" y2="120" />
        <line x1="90" y1="125" x2="115" y2="120" />
        <line x1="125" y1="125" x2="150" y2="120" />
        <line x1="160" y1="125" x2="180" y2="120" />
      </Lines>
      <Accent>
        <path d="M32,64 C64,108 136,108 168,64" strokeDasharray="4 5" />
      </Accent>
    </>
  )
}

function DesignEngineering() {
  return (
    <>
      <Lines>
        <rect x="45" y="30" width="90" height="65" />
        <line x1="45" y1="55" x2="135" y2="55" />
        <line x1="80" y1="55" x2="80" y2="95" />
        <line x1="45" y1="112" x2="135" y2="112" />
        <line x1="45" y1="108" x2="45" y2="116" />
        <line x1="135" y1="108" x2="135" y2="116" />
      </Lines>
      <Accent>
        <path d="M150,120 A22,22 0 0 0 150,76" />
        <line x1="150" y1="98" x2="168" y2="98" />
      </Accent>
    </>
  )
}

const VARIANTS = {
  fireStopSystems: FireStopSystems,
  fireproofingSystems: FireproofingSystems,
  cableProtection: CableProtection,
  testing: Testing,
  construction: Construction,
  industrial: Industrial,
  marine: Marine,
  designEngineering: DesignEngineering,
}

export default function ServiceIllustration({ variant, className = '' }) {
  const Diagram = VARIANTS[variant]
  if (!Diagram) return null

  return (
    <svg viewBox="0 0 200 150" className={className} aria-hidden="true">
      <Diagram />
    </svg>
  )
}
