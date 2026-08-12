import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { HardHat, User, Wrench } from 'lucide-react'
import { teamData } from '../../data/team'
import GridTexture from '../ui/GridTexture'
import TechnicalLines from '../ui/TechnicalLines'
import { useTranslation } from '../../lib/i18n/useTranslation'

// Department nodes (no verified individual, see data/team.js) get a function
// icon instead of the generic person glyph, so the shape+icon together make
// clear this is a team/role, never implying an invented person. Keyed by
// node id since team.js intentionally carries no UI/icon data.
const DEPARTMENT_ICONS = {
  siteTeam: HardHat,
  installation: Wrench,
}

/** Root gets a larger layered frame with a partial ember arc; everyone else
 * gets the plain hairline/dashed ring. Circle = verified individual, dashed
 * square = real role with no verified individual attached — the shape
 * itself carries that distinction, not just the caption text. */
function Avatar({ photo, name, isRoot = false, hasPerson = true, DeptIcon }) {
  if (isRoot) {
    return (
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
        <svg viewBox="0 0 112 112" className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="56" cy="56" r="52" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-custom-400/25" />
          <circle
            cx="56"
            cy="56"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52 * 0.72} ${2 * Math.PI * 52}`}
            className="text-ember-600"
          />
        </svg>
        {photo ? (
          <img src={photo} alt={name} className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-custom-400/10 text-neutral-custom-600">
            <User size={34} strokeWidth={1.5} />
          </div>
        )}
      </div>
    )
  }

  const shape = hasPerson ? 'rounded-full' : 'rounded-md'
  const ring = hasPerson ? 'border border-neutral-custom-400/30' : 'border border-dashed border-metal-500/50'
  const Icon = hasPerson ? User : DeptIcon || User

  if (photo) {
    return <img src={photo} alt={name} className={`h-16 w-16 ${shape} ${ring} object-cover`} />
  }
  return (
    <div className={`flex h-16 w-16 shrink-0 items-center justify-center ${shape} ${ring} bg-neutral-custom-400/10 text-neutral-custom-600`}>
      <Icon size={hasPerson ? 26 : 22} strokeWidth={1.5} />
    </div>
  )
}

/** `person.name` is null wherever the KB has no verified individual for that
 * role — the card then shows only the role label, never an invented name.
 * Root additionally gets a dark compact info plate instead of plain text. */
function TeamCard({ person, t, nodeRef, isRoot = false }) {
  const title = t(`leadership.items.${person.positionKey}.title`)
  const DeptIcon = DEPARTMENT_ICONS[person.id]

  return (
    <div ref={nodeRef} className="flex w-36 shrink-0 flex-col items-center text-center">
      <Avatar photo={person.photo} name={person.name ?? title} isRoot={isRoot} hasPerson={Boolean(person.name)} DeptIcon={DeptIcon} />

      {isRoot ? (
        <div className="relative mt-4 flex flex-col items-center gap-0.5 bg-industrial-950 px-5 py-2.5">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-ember-600" />
          <p className="font-heading text-sm font-semibold text-base-50">{person.name}</p>
          <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-custom-400">{title}</p>
        </div>
      ) : person.name ? (
        <>
          <span aria-hidden="true" className="mt-3 h-1 w-1 rounded-full bg-ember-600" />
          <p className="mt-1.5 font-heading text-sm font-semibold text-industrial-950">{person.name}</p>
          <p className="mt-0.5 text-xs text-neutral-custom-600">{title}</p>
        </>
      ) : (
        <>
          <span aria-hidden="true" className="mt-3 h-1 w-1 rounded-full bg-metal-500" />
          <p className="mt-1.5 font-heading text-sm font-semibold text-neutral-custom-600">{title}</p>
        </>
      )}
    </div>
  )
}

/** Recursive so team.js can grow to any depth without touching this component. */
function TreeNode({ node, registerRef, t, isRoot = false }) {
  const hasChildren = node.children && node.children.length > 0
  return (
    <div className="flex flex-col items-center">
      <TeamCard person={node} t={t} nodeRef={registerRef(node.id)} isRoot={isRoot} />
      {hasChildren && (
        <div className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-16">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} registerRef={registerRef} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Measures each rendered node's position relative to the container and
 * draws orthogonal ("elbow") SVG connector lines between parent and child —
 * recomputed on mount and on resize so it stays correct at any width/data
 * shape, not just the current 2-level structure. Child junction dots are
 * ember (verified individual) or metal (department/role) to match the node
 * type; a hollow marker sits at the point each branch leaves its parent.
 */
function DesktopTree({ data, t }) {
  const containerRef = useRef(null)
  const nodeEls = useRef({})
  const [lines, setLines] = useState([])
  const [junctions, setJunctions] = useState([])

  const registerRef = useCallback(
    (id) => (el) => {
      if (el) nodeEls.current[id] = el
      else delete nodeEls.current[id]
    },
    []
  )

  useLayoutEffect(() => {
    function computeLines() {
      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      const nextLines = []
      const nextJunctions = []

      function walk(node) {
        const parentEl = nodeEls.current[node.id]
        if (parentEl && node.children?.length) {
          const parentRect = parentEl.getBoundingClientRect()
          const x1 = parentRect.left + parentRect.width / 2 - containerRect.left
          const y1 = parentRect.bottom - containerRect.top
          nextJunctions.push({ id: `${node.id}-junction`, x: x1, y: y1 })
          node.children.forEach((child) => {
            const childEl = nodeEls.current[child.id]
            if (childEl) {
              const childRect = childEl.getBoundingClientRect()
              const x2 = childRect.left + childRect.width / 2 - containerRect.left
              const y2 = childRect.top - containerRect.top
              const midY = (y1 + y2) / 2
              nextLines.push({
                id: `${node.id}-${child.id}`,
                d: `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}`,
                x2,
                y2,
                hasPerson: Boolean(child.name),
              })
            }
          })
        }
        node.children?.forEach(walk)
      }

      walk(data)
      setLines(nextLines)
      setJunctions(nextJunctions)
    }

    computeLines()
    window.addEventListener('resize', computeLines)
    return () => window.removeEventListener('resize', computeLines)
  }, [data])

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {lines.map((line) => (
          <path key={line.id} d={line.d} fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-custom-400/50" />
        ))}
        {junctions.map((j) => (
          <circle key={j.id} cx={j.x} cy={j.y} r="3" className="fill-concrete-200 stroke-current text-neutral-custom-400/60" strokeWidth="1.5" />
        ))}
        {lines.map((line) => (
          <circle
            key={`${line.id}-child-dot`}
            cx={line.x2}
            cy={line.y2}
            r="2.5"
            className={line.hasPerson ? 'fill-ember-600' : 'fill-metal-500'}
          />
        ))}
      </svg>

      <div className="relative flex justify-center">
        <TreeNode node={data} registerRef={registerRef} t={t} isRoot />
      </div>
    </div>
  )
}

/** Small screens can't fit the connector-line tree — root card on top, its
 * direct reports below in a simple wrapped grid, joined by a plain vertical
 * stem instead of computed elbow connectors. No accordion: with only 2
 * levels of real, verified structure there's nothing to expand into. */
function MobileTree({ data }) {
  const { t } = useTranslation('about')
  const hasChildren = data.children && data.children.length > 0

  return (
    <div className="md:hidden flex flex-col items-center">
      <TeamCard person={data} t={t} isRoot />
      {hasChildren && (
        <>
          <span aria-hidden="true" className="mt-3 h-8 w-px bg-neutral-custom-400/30" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10">
            {data.children.map((child) => (
              <TeamCard key={child.id} person={child} t={t} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function TeamTree() {
  const { t } = useTranslation('about')

  return (
    <section className="relative overflow-hidden bg-concrete-200 py-14 md:py-20">
      <GridTexture className="text-industrial-950" opacity="opacity-[0.07]" />
      <TechnicalLines className="text-industrial-950" opacity="opacity-[0.03]" angle={-18} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rotate-12 border border-ember-600/10"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <span className="mb-10 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-neutral-custom-400">
          <span aria-hidden="true" className="h-px w-8 bg-neutral-custom-400/40" />
          {t('leadership.heading')}
        </span>

        <div className="overflow-x-auto">
          <DesktopTree data={teamData} t={t} />
          <MobileTree data={teamData} />
        </div>
      </div>
    </section>
  )
}
