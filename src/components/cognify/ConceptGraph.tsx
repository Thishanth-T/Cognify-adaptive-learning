// @ts-nocheck
import { useMemo, useState } from 'react'

type ConceptGraphProps = {
  selectedConcept: string | null
  onSelect: (concept: string) => void
  pushLog: (message: string) => void
  onExplore?: () => void
  subject?: string
  topic?: string
  learningData: any
}

type LockedInfo = {
  nodeName: string
  prerequisites: Array<{ id: string; label: string; mastery: number | null; required: number; met: boolean }>
}

const palette = [
  { main: '#0D9488', light: '#99F6E4', name: 'teal' },
  { main: '#2563EB', light: '#BFDBFE', name: 'blue' },
  { main: '#D97706', light: '#FDE68A', name: 'amber' },
  { main: '#059669', light: '#A7F3D0', name: 'emerald' },
  { main: '#4F46E5', light: '#C7D2FE', name: 'indigo' },
  { main: '#0284C7', light: '#BAE6FD', name: 'sky' },
  { main: '#E11D48', light: '#FECDD3', name: 'rose' },
  { main: '#0891B2', light: '#A5F3FC', name: 'cyan' },
]

const SVG_WIDTH = 900
const SVG_HEIGHT = 650
const NODE_RADIUS = 58

const particles = [
  { x: 105, y: 95, r: 1.2, opacity: 0.35, color: '#14B8A6' },
  { x: 180, y: 175, r: 1.5, opacity: 0.25, color: '#3B82F6' },
  { x: 285, y: 105, r: 1.2, opacity: 0.35, color: '#0D9488' },
  { x: 390, y: 82, r: 1.5, opacity: 0.3, color: '#F59E0B' },
  { x: 510, y: 115, r: 1.2, opacity: 0.35, color: '#10B981' },
  { x: 650, y: 100, r: 1.5, opacity: 0.25, color: '#3B82F6' },
  { x: 785, y: 160, r: 1.2, opacity: 0.35, color: '#14B8A6' },
  { x: 75, y: 300, r: 1.5, opacity: 0.25, color: '#F43F5E' },
  { x: 155, y: 420, r: 1.2, opacity: 0.35, color: '#0D9488' },
  { x: 260, y: 535, r: 1.5, opacity: 0.25, color: '#3B82F6' },
  { x: 380, y: 570, r: 1.2, opacity: 0.35, color: '#F59E0B' },
  { x: 520, y: 535, r: 1.5, opacity: 0.25, color: '#10B981' },
  { x: 680, y: 550, r: 1.2, opacity: 0.35, color: '#14B8A6' },
  { x: 820, y: 440, r: 1.5, opacity: 0.25, color: '#3B82F6' },
  { x: 750, y: 300, r: 1.2, opacity: 0.35, color: '#0D9488' },
]

export default function ConceptGraph({
  selectedConcept,
  onSelect,
  pushLog,
  onExplore,
  subject = 'C++',
  topic = 'Pointers',
  learningData,
}: ConceptGraphProps) {
  const { concepts, twin, plan } = learningData
  const [lockedNotice, setLockedNotice] = useState<string | null>(null)
  const [lockedInfo, setLockedInfo] = useState<LockedInfo | null>(null)

  const nodeMap = useMemo(() => {
    return new Map(twin.nodes.map((n: any) => [n.id, n]))
  }, [twin])

  const centerX = SVG_WIDTH / 2
  const centerY = SVG_HEIGHT / 2

  const positions = useMemo(() => {
    const count = concepts.length
    return concepts.map((node: any, index: number) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
      const nodeState = nodeMap.get(node.id)

      return {
        ...node,
        index,
        x: centerX + Math.cos(angle) * 285,
        y: centerY + Math.sin(angle) * 220,
        color: palette[index % palette.length],
        state: nodeState?.state || 'available',
        mastery: nodeState?.mastery ?? null,
        confidence: nodeState?.confidence ?? 0,
        attempts: nodeState?.attempts ?? 0,
      }
    })
  }, [concepts, nodeMap, centerX, centerY])

  const positionMap = useMemo(() => {
    return new Map(positions.map((node) => [node.id, node]))
  }, [positions])

  const selectedNode =
    positions.find((node) => node.id === selectedConcept || node.label.toLowerCase() === selectedConcept?.toLowerCase()) ??
    positions[0] ??
    null

  const selectedColor = selectedNode?.color ?? palette[0]

  const edges = useMemo(() => {
    return positions.flatMap((node) =>
      node.prerequisites.flatMap((prerequisiteId: string) => {
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

        return [
          {
            id: `${prerequisiteId}-${node.id}`,
            parentId: prerequisiteId,
            childId: node.id,
            color: node.color.main,
            path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
            isLocked: node.state === 'locked',
          },
        ]
      })
    )
  }, [positions, positionMap])

  const handleSelect = (id: string) => {
    const node = positions.find((item) => item.id === id)
    if (!node) return

    if (node.state === 'locked') {
      const prereqDetails = node.prerequisites
        .map((pId: string) => positionMap.get(pId))
        .filter(Boolean)
        .map((p: any) => ({
          id: p.id,
          label: p.label,
          mastery: p.mastery,
          required: 60,
          met: p.mastery !== null && p.mastery >= 60,
        }))

      setLockedInfo({ nodeName: node.label, prerequisites: prereqDetails })
      const missingNames = prereqDetails.filter((p) => !p.met).map((p) => `${p.label} (${p.mastery ?? 0}% / 60%)`)
      const msg = `🔒 ${node.label} is locked. Prerequisites needed: ${missingNames.join(', ')}.`
      setLockedNotice(msg)
      pushLog(msg)
      return
    }

    setLockedNotice(null)
    setLockedInfo(null)
    onSelect(id)
    pushLog(`Selected concept: ${node.label} (${node.mastery !== null ? `${node.mastery}% mastery` : 'Not yet attempted'})`)
  }

  const handleExplore = () => {
    if (!selectedNode || selectedNode.state === 'locked') return
    pushLog(`Navigating to Learning Workspace for ${selectedNode.label}`)
    onExplore?.()
  }

  const isRecommendedNext = (id: string) => plan.next && plan.next.id === id

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">
              Topological Knowledge Network
            </p>
          </div>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            {topic} <span className="text-teal-600 dark:text-teal-400">Concept Map</span>
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Directed prerequisite dependency graph. Nodes unlock dynamically as your Bayesian mastery advances.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Mastered (≥75%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
            Learning (40-74%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Needs Attention (&lt;40%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
            Locked
          </span>
        </div>
      </div>

      {/* LOCKED CONCEPT DETAIL */}
      {lockedInfo && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Prerequisite Gate</span>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {lockedInfo.nodeName} Locked
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Demonstrate conceptual competency (≥60% assessed mastery) on prerequisite nodes to unlock this topic.
              </p>
            </div>
            <button
              onClick={() => { setLockedNotice(null); setLockedInfo(null) }}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm"
              aria-label="Dismiss prerequisite notification"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            {lockedInfo.prerequisites.map((prereq) => (
              <div
                key={prereq.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                  prereq.met
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                    : 'border-amber-500/20 bg-amber-500/5 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${prereq.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {prereq.met ? '✓ READY' : '◇ REQUIRED'}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {prereq.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Current: {prereq.mastery !== null ? `${prereq.mastery}%` : 'Not attempted'} · Threshold: {prereq.required}%
                    </p>
                  </div>
                </div>
                {!prereq.met && onExplore && (
                  <button
                    onClick={() => {
                      setLockedNotice(null)
                      setLockedInfo(null)
                      onSelect(prereq.id)
                      onExplore()
                    }}
                    className="rounded-lg border border-teal-500/40 bg-teal-500/15 px-3 py-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-500/25 whitespace-nowrap"
                  >
                    Study Prerequisite →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {lockedNotice && !lockedInfo && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-400">Prerequisite Notice:</span>
            <span>{lockedNotice}</span>
          </div>
          <button
            onClick={() => setLockedNotice(null)}
            className="text-amber-700 hover:text-slate-900 dark:text-amber-300 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* GRAPH CANVAS */}
      <div className="relative overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md">
        {/* Architectural subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
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
              <radialGradient id="node-gradient-normal" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0B0F17" stopOpacity="0.98" />
              </radialGradient>

              <radialGradient id="node-gradient-locked" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0B0F17" stopOpacity="0.9" />
              </radialGradient>

              <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Central Cartographic Axis */}
            <circle cx={centerX} cy={centerY} r="140" fill="none" stroke="#334155" strokeOpacity="0.2" strokeDasharray="2 6" />
            <circle cx={centerX} cy={centerY} r="85" fill="none" stroke="#0D9488" strokeOpacity="0.15" strokeDasharray="3 9" />
            <circle cx={centerX} cy={centerY} r="4" fill="#0D9488" opacity="0.4" />

            {/* Subtle topological particles */}
            {particles.map((particle, index) => (
              <circle
                key={`particle-${index}`}
                cx={particle.x}
                cy={particle.y}
                r={particle.r}
                fill={particle.color}
                opacity={particle.opacity}
              />
            ))}

            {/* Directed Prerequisite Curves */}
            {edges.map((edge) => {
              const isChildSelected = selectedNode && edge.childId === selectedNode.id
              const strokeColor = edge.isLocked ? '#475569' : edge.color

              return (
                <g key={edge.id}>
                  <path
                    d={edge.path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isChildSelected ? '2.5' : '1.5'}
                    strokeOpacity={edge.isLocked ? '0.25' : isChildSelected ? '0.9' : '0.4'}
                    strokeDasharray={edge.isLocked ? '4 5' : 'none'}
                    strokeLinecap="round"
                  />
                </g>
              )
            })}

            {/* Concept Nodes */}
            {positions.map((node) => {
              const isSelected = selectedNode && (selectedNode.id === node.id || selectedNode.label === node.label)
              const isNext = isRecommendedNext(node.id)
              const isLocked = node.state === 'locked'

              const statusColor =
                isLocked
                  ? '#64748B'
                  : node.state === 'mastered'
                  ? '#10B981'
                  : node.state === 'weak'
                  ? '#F43F5E'
                  : node.state === 'learning'
                  ? '#14B8A6'
                  : '#3B82F6'

              const words = node.label.split(' ')
              const firstLine = words.length > 2 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : node.label
              const secondLine = words.length > 2 ? words.slice(Math.ceil(words.length / 2)).join(' ') : ''

              return (
                <g
                  key={node.id}
                  className={`concept-orb cursor-pointer outline-none transition-transform duration-200 ${isLocked ? 'opacity-65' : ''}`}
                  onClick={() => handleSelect(node.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.label}, state: ${node.state}`}
                >
                  {/* RECOMMENDED NEXT PULSE */}
                  {isNext && (
                    <>
                      <circle cx={node.x} cy={node.y} r="80" fill="#F59E0B" opacity="0.06" />
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="72"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        opacity="0.8"
                      />
                    </>
                  )}

                  {/* SELECTED HIGHLIGHT */}
                  {isSelected && (
                    <>
                      <circle cx={node.x} cy={node.y} r="74" fill={node.color.main} opacity="0.08" />
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="66"
                        fill="none"
                        stroke={node.color.main}
                        strokeWidth="2.5"
                        opacity="0.8"
                      />
                    </>
                  )}

                  {/* NODE BODY */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS}
                    fill={isLocked ? 'url(#node-gradient-locked)' : 'url(#node-gradient-normal)'}
                    stroke={statusColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeOpacity={isLocked ? 0.4 : 0.8}
                  />

                  {/* TOP BADGE: INDEX OR STATUS */}
                  <text
                    x={node.x}
                    y={node.y - 22}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="var(--font-display)"
                    fontWeight="700"
                    letterSpacing="0.05em"
                    fill={isLocked ? '#94A3B8' : statusColor}
                    pointerEvents="none"
                  >
                    {isLocked ? 'LOCKED' : isNext ? 'NEXT UP' : `#${String(node.index + 1).padStart(2, '0')}`}
                  </text>

                  {/* LABEL LINE 1 */}
                  <text
                    x={node.x}
                    y={node.y + (secondLine ? 0 : 3)}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="var(--font-sans)"
                    fontWeight="600"
                    fill={isLocked ? '#94A3B8' : '#F8FAFC'}
                    pointerEvents="none"
                  >
                    {firstLine.length > 17 ? `${firstLine.slice(0, 15)}…` : firstLine}
                  </text>

                  {/* LABEL LINE 2 */}
                  {secondLine && (
                    <text
                      x={node.x}
                      y={node.y + 14}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="var(--font-sans)"
                      fontWeight="500"
                      fill={isLocked ? '#64748B' : '#CBD5E1'}
                      pointerEvents="none"
                    >
                      {secondLine.length > 17 ? `${secondLine.slice(0, 15)}…` : secondLine}
                    </text>
                  )}

                  {/* REAL MASTERY SCORE */}
                  <text
                    x={node.x}
                    y={node.y + 36}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                    fill={statusColor}
                    pointerEvents="none"
                  >
                    {isLocked
                      ? '🔒'
                      : node.mastery !== null
                      ? `${node.mastery}%`
                      : 'READY'}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs bg-slate-950/70">
          <span className="font-mono text-[11px] text-slate-400">
            KNOWLEDGE GRAPH · {concepts.length} CURRICULUM NODES · DYNAMIC PREREQUISITES
          </span>
          <span className="flex items-center gap-2 font-medium text-teal-400">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            Live State Synchronized
          </span>
        </div>
      </div>

      {/* SELECTED CONCEPT DETAIL CARD */}
      {selectedNode && (
        <div className="cognify-card p-6 sm:p-7">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Concept Inspector
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      background: selectedColor.main,
                      boxShadow: `0 0 10px ${selectedColor.main}60`,
                    }}
                  />
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                    {selectedNode.label}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: selectedColor.main,
                    borderColor: `${selectedColor.main}50`,
                    background: `${selectedColor.main}15`,
                  }}
                >
                  {selectedNode.state}
                </span>
                <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
                  {selectedNode.mastery !== null ? `${selectedNode.mastery}% Mastery` : 'Unassessed'}
                </span>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {selectedNode.description}
            </p>

            {/* Prerequisites */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Prerequisites Check:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 ? (
                  selectedNode.prerequisites.map((pId: string) => {
                    const pNode = positionMap.get(pId)
                    const pMastered = pNode && pNode.mastery !== null && pNode.mastery >= 60

                    return (
                      <span
                        key={pId}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                          pMastered
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {pMastered ? '✓' : '◇'} {pNode?.label || pId} ({pNode?.mastery ?? 0}% / 60%)
                      </span>
                    )
                  })
                ) : (
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                    ✦ Foundation concept — no prerequisites required
                  </span>
                )}
              </div>
            </div>

            {selectedNode.state === 'locked' ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                  Prerequisites Required: Achieve ≥60% mastery on prerequisites to unlock this concept
                </span>
                {(() => {
                  const firstUnmet = selectedNode.prerequisites
                    ?.map((pId) => positionMap.get(pId))
                    ?.find((p) => !p || p.mastery === null || p.mastery < 60)
                  if (firstUnmet) {
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(firstUnmet.id)
                          onExplore?.()
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <span>Study Prerequisite: {firstUnmet.label}</span>
                        <span>→</span>
                      </button>
                    )
                  }
                  return null
                })()}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleExplore}
                className="btn-primary mt-2 flex items-center gap-2"
              >
                <span>Explore {selectedNode.label} in Workspace</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
