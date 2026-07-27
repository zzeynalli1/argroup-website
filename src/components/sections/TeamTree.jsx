import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { teamData } from '../../data/team'
import { useTranslation } from '../../lib/i18n/useTranslation'

function Avatar({ photo, name, size = 16 }) {
  const px = size === 16 ? 'w-16 h-16' : 'w-10 h-10'
  if (photo) {
    return <img src={photo} alt={name} className={`${px} rounded-full object-cover`} />
  }
  return (
    <div className={`${px} rounded-full bg-neutral-custom-400/20 flex items-center justify-center text-neutral-custom-600 shrink-0`}>
      <User size={size === 16 ? 26 : 18} />
    </div>
  )
}

function TeamCard({ person, nodeRef }) {
  return (
    <div
      ref={nodeRef}
      className="group flex flex-col items-center text-center w-32 shrink-0 rounded-lg border border-transparent p-2 transition-all duration-200 hover:scale-105 hover:border-ember-600 hover:shadow-[0_0_14px_rgba(227,30,36,0.3)]"
    >
      <Avatar photo={person.photo} name={person.name} />
      <p className="mt-2 font-heading text-sm font-semibold text-industrial-950">{person.name}</p>
      <p className="mt-0.5 text-xs text-neutral-custom-600">{person.position}</p>
      {person.company && (
        <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-neutral-custom-400/10 text-[10px] text-neutral-custom-600">
          {person.company}
        </span>
      )}
    </div>
  )
}

/** Recursive so team.js can grow to any depth without touching this component. */
function TreeNode({ node, registerRef }) {
  const hasChildren = node.children && node.children.length > 0
  return (
    <div className="flex flex-col items-center">
      <TeamCard person={node} nodeRef={registerRef(node.id)} />
      {hasChildren && (
        <div className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-16">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} registerRef={registerRef} />
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
 * shape, not just the current 3-level tree.
 */
function DesktopTree({ data }) {
  const containerRef = useRef(null)
  const nodeEls = useRef({})
  const [lines, setLines] = useState([])

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

      function walk(node) {
        const parentEl = nodeEls.current[node.id]
        if (parentEl && node.children?.length) {
          const parentRect = parentEl.getBoundingClientRect()
          const x1 = parentRect.left + parentRect.width / 2 - containerRect.left
          const y1 = parentRect.bottom - containerRect.top
          node.children.forEach((child) => {
            const childEl = nodeEls.current[child.id]
            if (childEl) {
              const childRect = childEl.getBoundingClientRect()
              const x2 = childRect.left + childRect.width / 2 - containerRect.left
              const y2 = childRect.top - containerRect.top
              const midY = (y1 + y2) / 2
              nextLines.push({ id: `${node.id}-${child.id}`, d: `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}` })
            }
          })
        }
        node.children?.forEach(walk)
      }

      walk(data)
      setLines(nextLines)
    }

    computeLines()
    window.addEventListener('resize', computeLines)
    return () => window.removeEventListener('resize', computeLines)
  }, [data])

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <svg className="absolute inset-0 w-full h-full pointer-events-none text-neutral-custom-400" aria-hidden="true">
        {lines.map((line) => (
          <path key={line.id} d={line.d} fill="none" stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>

      <div className="relative flex justify-center">
        <TreeNode node={data} registerRef={registerRef} />
      </div>
    </div>
  )
}

function MobileAccordionRow({ person, isOpen, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-3 text-left"
    >
      <Avatar photo={person.photo} name={person.name} size={10} />
      <span>
        <span className="block font-heading text-sm font-semibold text-industrial-950">{person.name}</span>
        <span className="block text-xs text-neutral-custom-600">{person.position}</span>
      </span>
      <span className={`ml-auto text-neutral-custom-400 transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
    </button>
  )
}

/** Full tree can't fit a small screen — departments become expandable rows instead. */
function MobileTree({ data }) {
  const [openId, setOpenId] = useState(null)

  return (
    <div className="md:hidden flex flex-col items-center">
      <TeamCard person={data} />

      <div className="mt-8 w-full max-w-md flex flex-col gap-3">
        {data.children.map((dept) => {
          const isOpen = openId === dept.id
          return (
            <div key={dept.id} className="border border-neutral-custom-400/20 rounded-lg overflow-hidden">
              <MobileAccordionRow
                person={dept}
                isOpen={isOpen}
                onToggle={() => setOpenId(isOpen ? null : dept.id)}
              />
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap justify-center gap-4 p-4 pt-0">
                      {dept.children.map((member) => (
                        <TeamCard key={member.id} person={member} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TeamTree() {
  const { t } = useTranslation('about')

  return (
    <section className="bg-base-50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl">
          <span className="block w-16 h-1 bg-ember-600 mb-6" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-industrial-950">{t('teamHeading')}</h2>
        </div>

        <div className="mt-16 overflow-x-auto">
          <DesktopTree data={teamData} />
          <MobileTree data={teamData} />
        </div>
      </div>
    </section>
  )
}
