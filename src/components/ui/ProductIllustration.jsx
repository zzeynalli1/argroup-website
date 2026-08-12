/**
 * Per-category technical line illustrations for the Products catalogue —
 * same visual language as ServiceIllustration (thin neutral-custom-400 line
 * work, ember-600 reserved for the one element that's the actual point),
 * distinct compositions so each product category reads as its own diagram.
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

function PassiveFireProtection() {
  return (
    <>
      <Lines>
        <line x1="30" y1="20" x2="30" y2="130" />
        <line x1="30" y1="45" x2="45" y2="30" />
        <line x1="30" y1="85" x2="45" y2="70" />
        <line x1="30" y1="115" x2="45" y2="100" />
        <line x1="30" y1="75" x2="170" y2="75" />
      </Lines>
      <Accent>
        <path d="M50,60 q12,15 0,30" />
        <path d="M62,55 q16,20 0,40" />
        <path d="M74,60 q12,15 0,30" />
      </Accent>
    </>
  )
}

function PipingSystems() {
  return (
    <>
      <Lines>
        <line x1="20" y1="65" x2="80" y2="65" />
        <line x1="20" y1="85" x2="80" y2="85" />
        <line x1="120" y1="65" x2="180" y2="65" />
        <line x1="120" y1="85" x2="180" y2="85" />
        <line x1="80" y1="50" x2="80" y2="100" />
        <line x1="120" y1="50" x2="120" y2="100" />
      </Lines>
      <Accent>
        <rect x="82" y="45" width="36" height="60" rx="4" />
      </Accent>
    </>
  )
}

function VibrationAcoustic() {
  return (
    <>
      <Lines>
        <line x1="40" y1="45" x2="160" y2="45" />
        <path d="M55,45 v10 l14,8 l14,-8 l14,8 l14,-8 l14,8 v9" />
        <line x1="40" y1="110" x2="160" y2="110" />
      </Lines>
      <Accent>
        <rect x="70" y="90" width="60" height="20" rx="2" />
      </Accent>
    </>
  )
}

function ThermalInsulation() {
  return (
    <>
      <Lines>
        <circle cx="100" cy="75" r="16" />
        <circle cx="100" cy="75" r="32" />
        <circle cx="100" cy="75" r="48" strokeDasharray="3 6" />
      </Lines>
      <Accent>
        <path d="M100,20 v14" />
        <path d="M143,42 l-10,10" />
        <path d="M57,42 l10,10" />
      </Accent>
    </>
  )
}

function VentilationSystems() {
  return (
    <>
      <Lines>
        <rect x="30" y="35" width="140" height="80" />
        <circle cx="100" cy="75" r="26" />
      </Lines>
      <Accent>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2
          const x2 = 100 + Math.cos(angle) * 24
          const y2 = 75 + Math.sin(angle) * 24
          return <line key={i} x1="100" y1="75" x2={x2} y2={y2} />
        })}
      </Accent>
    </>
  )
}

function MarineAnticorrosion() {
  return (
    <>
      <Lines>
        <rect x="45" y="38" width="110" height="62" />
        <path d="M25,115 q12,-8 24,0 t24,0 t24,0 t24,0 t24,0" />
      </Lines>
      <Accent>
        <line x1="45" y1="38" x2="155" y2="38" strokeWidth={3} />
      </Accent>
    </>
  )
}

const VARIANTS = {
  passiveFireProtection: PassiveFireProtection,
  pipingSystems: PipingSystems,
  vibrationAcoustic: VibrationAcoustic,
  thermalInsulation: ThermalInsulation,
  ventilationSystems: VentilationSystems,
  marineAnticorrosion: MarineAnticorrosion,
}

export default function ProductIllustration({ variant, className = '' }) {
  const Diagram = VARIANTS[variant]
  if (!Diagram) return null

  return (
    <svg viewBox="0 0 200 150" className={className} aria-hidden="true">
      <Diagram />
    </svg>
  )
}
