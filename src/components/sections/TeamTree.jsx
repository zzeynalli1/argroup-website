import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, Mail, Phone, User } from 'lucide-react'
import { useTeam } from '../../hooks/useTeam'
import GridTexture from '../ui/GridTexture'
import TechnicalLines from '../ui/TechnicalLines'
import { useTranslation } from '../../lib/i18n/useTranslation'

/** Root gets a larger layered frame with a partial ember arc; everyone else
 * gets the plain hairline/dashed ring. Circle = verified individual, dashed
 * square = real role with no verified individual attached — the shape
 * itself carries that distinction, not just the caption text. A role's
 * icon is always the generic person glyph (no per-department icon) since
 * CMS roles are dynamic/data-driven — nothing to key a specific icon off
 * of the way the old hardcoded local `id`s allowed. */
function Avatar({ photo, name, isRoot = false, hasPerson = true }) {
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
          <img src={photo} alt={name} loading="lazy" className="h-20 w-20 rounded-full object-cover" />
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
  const Icon = User

  if (photo) {
    return <img src={photo} alt={name} loading="lazy" className={`h-16 w-16 ${shape} ${ring} object-cover`} />
  }
  return (
    <div className={`flex h-16 w-16 shrink-0 items-center justify-center ${shape} ${ring} bg-neutral-custom-400/10 text-neutral-custom-600`}>
      <Icon size={hasPerson ? 26 : 22} strokeWidth={1.5} />
    </div>
  )
}

/** One clickable contact line (tel:/mailto:) — never rendered for a missing
 * value (see ContactInfo below, which is the thing that actually decides
 * presence). `truncate` + a fixed max-width keeps a long phone/email from
 * ever growing the card or breaking the hierarchy layout; `title` surfaces
 * the untruncated value on hover since the visible text may be cut off. */
function ContactLine({ icon: Icon, href, value, tone }) {
  return (
    <a
      href={href}
      title={value}
      className={`flex max-w-full items-center gap-1 text-[10px] leading-tight transition-colors hover:text-ember-600 ${tone}`}
    >
      <Icon size={10} strokeWidth={2} className="shrink-0" />
      <span className="min-w-0 truncate">{value}</span>
    </a>
  )
}

/** Renders nothing when neither field is set (never an empty row/icon —
 * see the approved spec). Kept visually secondary to name/position via
 * smaller text + muted tone, and capped to the same width the card itself
 * uses so contact info can never widen a node or overflow it. */
function ContactInfo({ phone, email, tone = 'light' }) {
  if (!phone && !email) return null
  const textTone = tone === 'dark' ? 'text-neutral-custom-400' : 'text-neutral-custom-500'

  return (
    <div className="mt-1.5 flex w-full max-w-[8.5rem] flex-col items-center gap-0.5">
      {phone && <ContactLine icon={Phone} href={`tel:${phone}`} value={phone} tone={textTone} />}
      {email && <ContactLine icon={Mail} href={`mailto:${email}`} value={email} tone={textTone} />}
    </div>
  )
}

/** `person.name` is null wherever no verified individual is attached to
 * that role — the card then shows only the role label, never an invented
 * or blank name. `person.position` is CMS free text (position_<locale>,
 * already locale-resolved by useTeam/adaptTeamMemberRow) — no more
 * positionKey/translation-key lookup. Root additionally gets a dark
 * compact info plate instead of plain text. `person.phone`/`person.email`
 * are optional CMS fields (never invented — see cms/teamMembers.js) shown
 * via ContactInfo, which itself decides whether either is present.
 * `person.category` (see useTeam.js) is a purely organizational label —
 * it plays no part in where this node sits in the tree, which is entirely
 * parent_id-driven; a small muted tag is the only thing it adds here. */
function CategoryBadge({ category, tone = 'light' }) {
  if (!category) return null
  const toneClasses = tone === 'dark' ? 'bg-base-50/10 text-neutral-custom-400' : 'bg-industrial-950/5 text-neutral-custom-500'

  return (
    <span
      title={category}
      className={`mt-1 max-w-full truncate rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] ${toneClasses}`}
    >
      {category}
    </span>
  )
}

function TeamCard({ person, nodeRef, isRoot = false }) {
  const title = person.position

  return (
    <div ref={nodeRef} className="flex w-36 shrink-0 flex-col items-center text-center">
      <Avatar photo={person.photo} name={person.name ?? title} isRoot={isRoot} hasPerson={Boolean(person.name)} />

      {isRoot ? (
        <div className="relative mt-4 flex flex-col items-center gap-0.5 bg-industrial-950 px-5 py-2.5">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-ember-600" />
          {person.name && <p className="font-heading text-sm font-semibold text-base-50">{person.name}</p>}
          <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-custom-400">{title}</p>
          <CategoryBadge category={person.category} tone="dark" />
          <ContactInfo phone={person.phone} email={person.email} tone="dark" />
        </div>
      ) : person.name ? (
        <>
          <span aria-hidden="true" className="mt-3 h-1 w-1 rounded-full bg-ember-600" />
          <p className="mt-1.5 font-heading text-sm font-semibold text-industrial-950">{person.name}</p>
          <p className="mt-0.5 text-xs text-neutral-custom-600">{title}</p>
          <CategoryBadge category={person.category} />
          <ContactInfo phone={person.phone} email={person.email} />
        </>
      ) : (
        <>
          <span aria-hidden="true" className="mt-3 h-1 w-1 rounded-full bg-metal-500" />
          <p className="mt-1.5 font-heading text-sm font-semibold text-neutral-custom-600">{title}</p>
          <CategoryBadge category={person.category} />
          <ContactInfo phone={person.phone} email={person.email} />
        </>
      )}
    </div>
  )
}

/** Same drag-to-scroll row PartnersSection.jsx already uses for its
 * fixed-width logo row (see that file's own comment) — reused here instead
 * of flex-wrap so a sibling group that's too wide for the viewport scrolls
 * horizontally in place rather than wrapping onto a second row. Wrapping
 * was the actual problem: once a level's siblings spilled onto a second
 * row, a wrapped sibling's own (potentially deep) subtree rendered ABOVE
 * later same-level siblings, breaking the top-to-bottom level reading and
 * producing exactly the confusing/crossing look the task warns against.
 * A single non-wrapping row keeps every sibling — and everything nested
 * under it — at one consistent horizontal band, at any width. */
function ScrollableRow({ children, className = '' }) {
  const scrollerRef = useRef(null)
  const dragRef = useRef({ isDown: false, startX: 0, startScrollLeft: 0 })

  function handleMouseDown(event) {
    const scroller = scrollerRef.current
    if (!scroller) return
    dragRef.current = { isDown: true, startX: event.pageX, startScrollLeft: scroller.scrollLeft }
    scroller.style.cursor = 'grabbing'
  }

  function handleMouseMove(event) {
    const drag = dragRef.current
    if (!drag.isDown) return
    event.preventDefault()
    scrollerRef.current.scrollLeft = drag.startScrollLeft - (event.pageX - drag.startX)
  }

  function handleMouseUpOrLeave() {
    dragRef.current.isDown = false
    if (scrollerRef.current) scrollerRef.current.style.cursor = ''
  }

  return (
    <div
      ref={scrollerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      className={`no-scrollbar flex flex-nowrap items-start gap-x-12 overflow-x-auto cursor-grab ${className}`}
    >
      {children}
    </div>
  )
}

/** Recursive so the tree can grow to any depth (any number of CMS-added
 * roles/levels) without touching this component. */
function TreeNode({ node, registerRef, isRoot = false }) {
  const hasChildren = node.children && node.children.length > 0
  return (
    <div className="flex flex-col items-center">
      <TeamCard person={node} nodeRef={registerRef(node.id)} isRoot={isRoot} />
      {hasChildren && (
        <ScrollableRow className="mt-16 justify-center px-2">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} registerRef={registerRef} />
          ))}
        </ScrollableRow>
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
function DesktopTree({ data }) {
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
    // Capture phase so scrolling any nested ScrollableRow (which doesn't
    // bubble a 'scroll' event) still triggers a recompute — connectors are
    // drawn from live getBoundingClientRect positions, so they'd otherwise
    // drift out of sync with a dragged/scrolled row.
    const container = containerRef.current
    container?.addEventListener('scroll', computeLines, { capture: true, passive: true })
    return () => {
      window.removeEventListener('resize', computeLines)
      container?.removeEventListener('scroll', computeLines, { capture: true })
    }
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
        <TreeNode node={data} registerRef={registerRef} isRoot />
      </div>
    </div>
  )
}

/** Recursive so any hierarchy depth stays reachable on mobile (the old
 * version only ever rendered root + direct children, silently dropping
 * grandchildren+). Each node with children gets its own expand/collapse
 * toggle — depth 1 (root's direct reports) defaults open since that's the
 * same 2-level structure the page has always shown; anything nested past
 * that (depth 2+) defaults collapsed so a large org chart doesn't dump
 * every level onto the screen at once. Nested branches indent with a
 * dashed guide line instead of computed elbow connectors (not worth it at
 * mobile width). */
function MobileBranch({ node, depth, t }) {
  const hasChildren = node.children && node.children.length > 0
  const [expanded, setExpanded] = useState(depth <= 1)

  return (
    <div className="flex flex-col items-center">
      <TeamCard person={node} />
      {hasChildren && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="mt-2.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-custom-600 transition-colors hover:text-ember-600"
          >
            <ChevronDown size={12} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? t('leadership.collapse') : t('leadership.expand')}
          </button>
          {expanded && (
            <div className="mt-4 flex flex-col items-center gap-6 border-l border-dashed border-neutral-custom-400/30 pl-5">
              {node.children.map((child) => (
                <MobileBranch key={child.id} node={child} depth={depth + 1} t={t} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Small screens can't fit the connector-line tree — root card on top, its
 * direct reports below in a simple wrapped grid (unchanged from before),
 * each of which recurses via MobileBranch for any deeper levels. */
function MobileTree({ data, t }) {
  const hasChildren = data.children && data.children.length > 0

  return (
    <div className="md:hidden flex flex-col items-center">
      <TeamCard person={data} isRoot />
      {hasChildren && (
        <>
          <span aria-hidden="true" className="mt-3 h-8 w-px bg-neutral-custom-400/30" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10">
            {data.children.map((child) => (
              <MobileBranch key={child.id} node={child} depth={1} t={t} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function TeamTree() {
  const { t, locale } = useTranslation('about')
  const { root, loading } = useTeam(locale)

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

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-industrial-950/15 border-t-ember-600" />
          </div>
        ) : (
          root && (
            <div className="overflow-x-auto">
              <DesktopTree data={root} />
              <MobileTree data={root} t={t} />
            </div>
          )
        )}
      </div>
    </section>
  )
}
