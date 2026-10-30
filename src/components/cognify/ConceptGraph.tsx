
import { useMemo, useState, useEffect } from 'react'
import { getConcepts, loadStudent } from '@/data/sampleData'

type ConceptGraphProps = {
  selectedConcept: string | null
  onSelect: (concept: string) => void
  pushLog: (message: string) => void
  onExplore?: () => void
  subject?: string
  topic?: string
}

const palette = [
  { main: '#A78BFA', light: '#D8B4FE' },
  { main: '#35D9FF', light: '#A5F3FC' },
  { main: '#FF6BC6', light: '#FBCFE8' },
  { main: '#48E0B0', light: '#A7F3D0' },
  { main: '#FFC66D', light: '#FDE68A' },
  { main: '#6D9BFF', light: '#BFDBFE' },
  { main: '#B38BFF', light: '#DDD6FE' },
  { main: '#35C7D9', light: '#A5F3FC' },
]

const SVG_WIDTH = 900
const SVG_HEIGHT = 650
const NODE_RADIUS = 61

const particles = [
  { x: 105, y: 95, r: 1.5, opacity: 0.48, color: '#35D9FF' },
  { x: 180, y: 175, r: 2, opacity: 0.28, color: '#A78BFA' },
  { x: 285, y: 105, r: 1.4, opacity: 0.55, color: '#8B5CF6' },
  { x: 390, y: 82, r: 2, opacity: 0.38, color: '#35D9FF' },
  { x: 510, y: 115, r: 1.5, opacity: 0.5, color: '#A78BFA' },
  { x: 650, y: 100, r: 2, opacity: 0.3, color: '#35D9FF' },
  { x: 785, y: 160, r: 1.5, opacity: 0.45, color: '#A78BFA' },
  { x: 75, y: 300, r: 2, opacity: 0.32, color: '#FF6BC6' },
  { x: 155, y: 420, r: 1.4, opacity: 0.5, color: '#35D9FF' },
  { x: 260, y: 535, r: 2, opacity: 0.3, color: '#A78BFA' },
  { x: 380, y: 570, r: 1.5, opacity: 0.5, color: '#35D9FF' },
  { x: 520, y: 535, r: 2, opacity: 0.3, color: '#FF6BC6' },
  { x: 680, y: 550, r: 1.5, opacity: 0.48, color: '#A78BFA' },
  { x: 820, y: 440, r: 2, opacity: 0.3, color: '#35D9FF' },
  { x: 750, y: 300, r: 1.4, opacity: 0.52, color: '#A78BFA' },
  { x: 450, y: 200, r: 1.2, opacity: 0.35, color: '#FFFFFF' },
  { x: 320, y: 340, r: 1.5, opacity: 0.4, color: '#35D9FF' },
  { x: 590, y: 390, r: 1.8, opacity: 0.35, color: '#A78BFA' },
  { x: 100, y: 540, r: 1.2, opacity: 0.35, color: '#FFFFFF' },
  { x: 830, y: 70, r: 1.2, opacity: 0.4, color: '#FFFFFF' },
]

export default function ConceptGraph({
  selectedConcept,
  onSelect,
  pushLog,
  onExplore,
  subject = 'C++',
  topic = 'Pointers',
}: ConceptGraphProps) {
  const concepts = useMemo(
    () => getConcepts(subject, topic),
    [subject, topic]
  )

  const [mastery, setMastery] = useState(() => loadStudent().mastery)

  // Refresh mastery when the graph becomes visible again.
  useEffect(() => {
    const refresh = () => setMastery(loadStudent().mastery)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)

    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const getMastery = (label: string) => {
    const match = mastery.find(
      item => item.concept.toLowerCase() === label.toLowerCase()
    )
    return match ? Math.round(match.prob * 100) : 0
  }

  const centerX = SVG_WIDTH / 2
  const centerY = SVG_HEIGHT / 2

  const positions = useMemo(() => {
    const count = concepts.length

    return concepts.map((node, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count

      return {
        ...node,
        index,
        x: centerX + Math.cos(angle) * 285,
        y: centerY + Math.sin(angle) * 220,
        color: palette[index % palette.length],
      }
    })
  }, [concepts, centerX, centerY])

  const positionMap = new Map(
    positions.map(node => [node.id, node])
  )

  const selectedNode =
    positions.find(node => node.id === selectedConcept) ?? null

  const selectedColor = selectedNode?.color ?? palette[0]

  const edges = positions.flatMap(node =>
    node.prerequisites.flatMap(prerequisiteId => {
      const parent = positionMap.get(prerequisiteId)
      if (!parent) return []

      const dx = node.x - parent.x
      const dy = node.y - parent.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1

      const startX = parent.x + (dx / distance) * NODE_RADIUS
      const startY = parent.y + (dy / distance) * NODE_RADIUS
      const endX = node.x - (dx / distance) * NODE_RADIUS
      const endY = node.y - (dy / distance) * NODE_RADIUS

      const middleX = (startX + endX) / 2
      const middleY = (startY + endY) / 2
      const curve = 28

      const controlX = middleX - (dy / distance) * curve
      const controlY = middleY + (dx / distance) * curve

      return [{
        id: `${prerequisiteId}-${node.id}`,
        parentId: prerequisiteId,
        childId: node.id,
        color: node.color.main,
        path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
      }]
    })
  )

  const getPrerequisiteLabels = (ids: string[]) =>
    ids
      .map(id => concepts.find(node => node.id === id)?.label)
      .filter((label): label is string => Boolean(label))

  const handleSelect = (id: string) => {
    const node = concepts.find(item => item.id === id)
    if (!node) return

    onSelect(id)
    pushLog(`Exploring concept: ${node.label}`)
  }

  const handleExplore = () => {
    if (!selectedNode) return

    pushLog(`Opening Learning Workspace for ${selectedNode.label}`)
    onExplore?.()
  }

  return (
    <div className="w-full space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#35D9FF]" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Neural Knowledge Map
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            {topic} <span className="text-violet-400">Network</span>
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {concepts.length} connected concepts · Select an orb to explore
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_9px_#A78BFA]" />
            Selected
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_9px_#35D9FF]" />
            Available
          </span>
        </div>
      </div>

      {/* GRAPH CANVAS */}
      <div className="relative overflow-x-auto rounded-2xl border border-violet-400/20 bg-[#070D1D]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(100,70,220,0.14), transparent 48%), radial-gradient(ellipse at 15% 15%, rgba(53,217,255,0.07), transparent 35%), radial-gradient(ellipse at 85% 85%, rgba(255,107,198,0.06), transparent 35%)',
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(130,150,210,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(130,150,210,0.18) 1px, transparent 1px)',
            backgroundSize: '35px 35px',
          }}
        />

        <div className="relative p-3 sm:p-5">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            width="100%"
            role="group"
            aria-label={`${topic} circular concept network`}
            style={{
              minWidth: '760px',
              display: 'block',
              overflow: 'visible',
            }}
          >
            <defs>
              <radialGradient id="orb-surface" cx="35%" cy="25%" r="75%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.23" />
                <stop offset="35%" stopColor="#8B7BFF" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#10152F" stopOpacity="0.98" />
              </radialGradient>

              <radialGradient id="orb-center" cx="50%" cy="45%" r="65%">
                <stop offset="0%" stopColor="#29215A" />
                <stop offset="100%" stopColor="#080D20" />
              </radialGradient>

              <filter id="orb-glow" x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="connection-glow" x="-80%" y="-80%" width="260%" height="260%" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation="4" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="particle-glow" x="-300%" y="-300%" width="700%" height="700%">
                <feGaussianBlur stdDeviation="2.5" />
              </filter>
            </defs>

            {/* CENTRAL CORE */}
            <circle cx={centerX} cy={centerY} r="115" fill="#7654FF" opacity="0.035" />
            <circle cx={centerX} cy={centerY} r="78" fill="none" stroke="#8B72FF" strokeOpacity="0.12" strokeDasharray="3 12" />

            {/* FLOATING PARTICLES */}
            {particles.map((particle, index) => (
              <g key={`particle-${index}`} pointerEvents="none">
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0; 5 -9; -3 -15; -7 -5; 0 0"
                  dur={`${7 + (index % 5) * 2}s`}
                  begin={`${-(index % 7) * 1.3}s`}
                  repeatCount="indefinite"
                />
                <circle
                  cx={particle.x}
                  cy={particle.y}
                  r={particle.r * 3}
                  fill={particle.color}
                  opacity={particle.opacity * 0.25}
                  filter="url(#particle-glow)"
                />
                <circle
                  cx={particle.x}
                  cy={particle.y}
                  r={particle.r}
                  fill={particle.color}
                  opacity={particle.opacity}
                />
              </g>
            ))}

            {/* NEON CONNECTIONS */}
            {edges.map(edge => {
              const isPrerequisiteOfSelected =
                selectedConcept !== null &&
                edge.childId === selectedConcept

              const isHighlighted = isPrerequisiteOfSelected

              return (
                <g key={edge.id}>
                  {/* Always visible dim connection */}
                  <path
                    d={edge.path}
                    fill="none"
                    stroke="#52659D"
                    strokeWidth="1.4"
                    strokeOpacity="0.32"
                    strokeLinecap="round"
                  />

                  {/* Selected connection: outer neon glow */}
                  {isHighlighted && (
                    <path
                      d={edge.path}
                      fill="none"
                      stroke={edge.color}
                      strokeWidth="12"
                      strokeOpacity="0.5"
                      strokeLinecap="round"
                      filter="url(#connection-glow)"
                    />
                  )}

                  {/* Selected connection: saturated coloured line */}
                  {isHighlighted && (
                    <path
                      d={edge.path}
                      fill="none"
                      stroke={edge.color}
                      strokeWidth="3"
                      strokeOpacity="1"
                      strokeLinecap="round"
                      filter="url(#connection-glow)"
                    />
                  )}

                  {/* Bright white inner highlight */}
                  {isHighlighted && (
                    <path
                      d={edge.path}
                      fill="none"
                      stroke="#E9E6FF"
                      strokeWidth="0.9"
                      strokeOpacity="0.95"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Small glowing connection junction */}
                  {isHighlighted && (
                    <>
                      <circle
                        cx={positionMap.get(edge.parentId)?.x}
                        cy={positionMap.get(edge.parentId)?.y}
                        r="4"
                        fill={edge.color}
                        filter="url(#connection-glow)"
                      />
                      <circle
                        cx={positionMap.get(edge.childId)?.x}
                        cy={positionMap.get(edge.childId)?.y}
                        r="3"
                        fill="#FFFFFF"
                      />
                    </>
                  )}
                </g>
              )
            })}

            {/* CONCEPT ORBS */}
            {positions.map(node => {
              const isSelected = selectedConcept === node.id
              const color = node.color.main
              const percentage = getMastery(node.label)

              const words = node.label.split(' ')
              const firstLine =
                words.length > 2
                  ? words.slice(0, Math.ceil(words.length / 2)).join(' ')
                  : node.label

              const secondLine =
                words.length > 2
                  ? words.slice(Math.ceil(words.length / 2)).join(' ')
                  : ''

              return (
                <g
                  key={node.id}
                  className="concept-orb cursor-pointer outline-none"
                  onClick={() => handleSelect(node.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${node.label}, mastery ${percentage}%`}
                  aria-pressed={isSelected}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleSelect(node.id)
                    }
                  }}
                  style={{ outline: 'none' }}
                >
                  {/* SELECTED HALO */}
                  {isSelected && (
                    <>
                      <circle cx={node.x} cy={node.y} r="88" fill={color} opacity="0.07" />
                      <circle cx={node.x} cy={node.y} r="77" fill="none" stroke={color} strokeWidth="3" opacity="0.55" filter="url(#orb-glow)" />
                    </>
                  )}

                  {/* OUTER AMBIENT GLOW */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 82 : 75}
                    fill={color}
                    opacity={isSelected ? 0.13 : 0.045}
                  />

                  {/* ORBIT RING */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 69 : 65}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeOpacity={isSelected ? 0.95 : 0.42}
                    strokeDasharray={isSelected ? 'none' : '3 7'}
                  />

                  {/* ORB BODY */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS}
                    fill="url(#orb-surface)"
                    stroke={color}
                    strokeWidth={isSelected ? 2.6 : 1.5}
                    strokeOpacity={isSelected ? 1 : 0.75}
                    filter={isSelected ? 'url(#orb-glow)' : undefined}
                  />

                  {/* INNER CORE */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="48"
                    fill="url(#orb-center)"
                    stroke={color}
                    strokeOpacity="0.2"
                  />

                  {/* SURFACE HIGHLIGHT */}
                  <ellipse
                    cx={node.x - 15}
                    cy={node.y - 34}
                    rx="24"
                    ry="10"
                    fill="white"
                    opacity="0.055"
                    transform={`rotate(-25 ${node.x - 15} ${node.y - 34})`}
                  />

                  {/* NODE NUMBER */}
                  <text
                    x={node.x}
                    y={node.y - 23}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    letterSpacing="1"
                    fill={color}
                    pointerEvents="none"
                  >
                    {String(node.index + 1).padStart(2, '0')}
                  </text>

                  {/* NODE LABEL */}
                  <text
                    x={node.x}
                    y={node.y + (secondLine ? 0 : 3)}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#FFFFFF"
                    pointerEvents="none"
                  >
                    {firstLine.length > 17 ? `${firstLine.slice(0, 15)}…` : firstLine}
                  </text>

                  {secondLine && (
                    <text
                      x={node.x}
                      y={node.y + 15}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#D8DDF5"
                      pointerEvents="none"
                    >
                      {secondLine.length > 17 ? `${secondLine.slice(0, 15)}…` : secondLine}
                    </text>
                  )}

                  {/* MASTERY PERCENTAGE */}
                  <text
                    x={node.x}
                    y={node.y + 38}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="800"
                    fill={percentage >= 70 ? '#48E0B0' : percentage >= 40 ? '#FFC66D' : '#A5B4FC'}
                    pointerEvents="none"
                  >
                    {percentage}%
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* GRAPH FOOTER */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
          <span className="text-[10px] tracking-widest text-slate-500">
            KNOWLEDGE NETWORK · {concepts.length} NODES
          </span>
          <span className="flex items-center gap-2 text-xs text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_9px_#35D9FF]" />
            Interactive network
          </span>
        </div>
      </div>

      {/* SELECTED CONCEPT DETAILS */}
      <div
        className="rounded-2xl border bg-[#0C1529] p-6 sm:p-7"
        style={{
          borderColor: `${selectedColor.main}45`,
          boxShadow: `0 0 35px ${selectedColor.main}0D`,
        }}
      >
        {selectedNode ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Selected learning concept
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      background: selectedColor.main,
                      boxShadow: `0 0 14px ${selectedColor.main}`,
                    }}
                  />
                  <h3 className="text-2xl font-semibold text-white">
                    {selectedNode.label}
                  </h3>
                </div>
              </div>

              <span
                className="rounded-full border px-3 py-2 text-xs font-semibold"
                style={{
                  color: selectedColor.main,
                  borderColor: `${selectedColor.main}66`,
                  background: `${selectedColor.main}12`,
                }}
              >
                ● NODE ACTIVE
              </span>
            </div>

            <p className="max-w-3xl text-base leading-7 text-slate-300">
              {selectedNode.description}
            </p>

            <div className="border-t border-white/[0.07] pt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                Prerequisite concepts
              </p>

              <div className="flex flex-wrap gap-3">
                {selectedNode.prerequisites.length > 0 ? (
                  getPrerequisiteLabels(selectedNode.prerequisites).map(label => (
                    <span
                      key={label}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300"
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-emerald-300">
                    ✦ Foundation concept — no prerequisites
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleExplore}
              className="btn-primary mt-2"
            >
              Explore this concept <span aria-hidden="true"> →</span>
            </button>
          </div>
        ) : (
          <div className="py-10 text-center">
            <h3 className="text-xl font-semibold text-slate-200">
              Choose a concept to begin
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Select an orb to reveal its connections, mastery and prerequisites.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
