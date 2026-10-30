// @ts-nocheck -- imported from original Cognify project (looser TS settings)

import { useState } from 'react'
import { demoAgents } from '@/data/sampleData'

type AgentPanelProps = {
  pushLog: (message: string) => void
}

const agentAccents = [
  {
    color: '#9B7CFF',
    glow: 'rgba(155,124,255,0.16)',
    border: 'rgba(155,124,255,0.3)',
    role: 'Learning analysis',
    icon: '◈',
  },
  {
    color: '#35D9FF',
    glow: 'rgba(53,217,255,0.16)',
    border: 'rgba(53,217,255,0.3)',
    role: 'Knowledge mapping',
    icon: '⌘',
  },
  {
    color: '#FF6BC6',
    glow: 'rgba(255,107,198,0.16)',
    border: 'rgba(255,107,198,0.3)',
    role: 'Practice generation',
    icon: '✳',
  },
  {
    color: '#48E0B0',
    glow: 'rgba(72,224,176,0.16)',
    border: 'rgba(72,224,176,0.3)',
    role: 'Progress analysis',
    icon: '↗',
  },
  {
    color: '#FFC66D',
    glow: 'rgba(255,198,109,0.16)',
    border: 'rgba(255,198,109,0.3)',
    role: 'Learning support',
    icon: '✧',
  },
]

export default function AgentPanel({ pushLog }: AgentPanelProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [inspectedAgents, setInspectedAgents] = useState<string[]>([])
  const [showArchitecture, setShowArchitecture] = useState(true)

  const handleInspect = (agent: (typeof demoAgents)[number]) => {
    const isExpanded = expandedAgent === agent.id

    setExpandedAgent(isExpanded ? null : agent.id)

    if (!isExpanded) {
      setInspectedAgents((previous) =>
        previous.includes(agent.id) ? previous : [...previous, agent.id]
      )

      pushLog(`Inspected ${agent.name}: ${agent.task}`)
    }
  }

  const activeAgent = demoAgents.find(
    (agent) => agent.id === expandedAgent
  )

  return (
    <section className="relative space-y-5">

      {/* PAGE HEADER */}
      <div className="panel relative overflow-hidden p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full"
          style={{
            background: 'rgba(53,217,255,0.09)',
            filter: 'blur(55px)',
          }}
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#35D9FF]" />
              <p className="section-label">COGNIFY INTELLIGENCE SYSTEM</p>
            </div>

            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              AI Agent Command Center
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary">
              Explore the specialized agents designed to support your
              personalized learning journey.
            </p>
          </div>

          <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold text-amber-300">
                PROTOTYPE MODE
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Live AI not connected
            </p>
          </div>
        </div>

        {/* SYSTEM METRICS */}
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Designed agents',
              value: demoAgents.length,
              color: '#9B7CFF',
            },
            {
              label: 'Inspected agents',
              value: inspectedAgents.length,
              color: '#35D9FF',
            },
            {
              label: 'Available workflows',
              value: 1,
              color: '#48E0B0',
            },
            {
              label: 'Live executions',
              value: 0,
              color: '#FFC66D',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"
            >
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ARCHITECTURE / WORKFLOW */}
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-label">SYSTEM ARCHITECTURE</p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              Multi-agent workflow
            </h3>
            <p className="mt-1 text-xs text-secondary">
              How the specialized learning roles are organized
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowArchitecture(!showArchitecture)}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.05]"
          >
            {showArchitecture ? 'Collapse ↑' : 'Expand ↓'}
          </button>
        </div>

        {showArchitecture && (
          <div className="mt-5">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.045] p-4 text-center">
              <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-300">
                INPUT
              </span>
              <h4 className="mt-1 text-sm font-semibold text-white">
                Learner activity and responses
              </h4>
              <p className="mt-1 text-[11px] text-slate-400">
                Learning activity · Selected concepts · Practice responses
              </p>
            </div>

            <div className="flex justify-center py-2">
              <div className="h-6 w-px bg-gradient-to-b from-cyan-400 to-violet-400" />
            </div>

            <div className="rounded-xl border border-violet-400/25 bg-violet-400/[0.05] p-4 text-center">
              <span className="text-[10px] font-bold tracking-[0.2em] text-violet-300">
                COGNIFY ORCHESTRATION
              </span>
              <h4 className="mt-1 text-sm font-semibold text-white">
                Agent coordination layer
              </h4>
              <p className="mt-1 text-[11px] text-slate-400">
                Organizes the learning workflow across specialized roles
              </p>
            </div>

            <div className="flex justify-center py-2">
              <div className="h-6 w-px bg-gradient-to-b from-violet-400 to-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {demoAgents.map((agent, index) => {
                const accent = agentAccents[index % agentAccents.length]

                return (
                  <div
                    key={agent.id}
                    className="rounded-xl border p-3 text-center"
                    style={{
                      borderColor: accent.border,
                      background: accent.glow,
                    }}
                  >
                    <span
                      className="text-xl"
                      style={{ color: accent.color }}
                    >
                      {accent.icon}
                    </span>
                    <p className="mt-2 text-xs font-semibold text-white">
                      {agent.name}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Agent {index + 1}
                    </p>
                  </div>
                )
              })}
            </div>

            <p className="mt-3 text-center text-[10px] text-slate-500">
              Conceptual architecture · Workflow execution is not yet connected
            </p>
          </div>
        )}
      </div>

      {/* AGENT DIRECTORY */}
      <div className="panel p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-label">SPECIALIZED INTELLIGENCE</p>
            <h3 className="mt-1 text-xl font-semibold text-white">
              Agent directory
            </h3>
            <p className="mt-1 text-xs text-secondary">
              Inspect each agent's assigned role and predefined findings.
            </p>
          </div>

          <span className="rounded-lg border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1.5 text-xs text-violet-300">
            {demoAgents.length} configured
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {demoAgents.map((agent, index) => {
            const isExpanded = expandedAgent === agent.id
            const accent = agentAccents[index % agentAccents.length]
            const isInspected = inspectedAgents.includes(agent.id)

            return (
              <div
                key={agent.id}
                className="group relative overflow-hidden rounded-2xl border transition-all duration-300"
                style={{
                  borderColor: isExpanded
                    ? accent.border
                    : 'rgba(255,255,255,0.09)',
                  background: isExpanded
                    ? `linear-gradient(145deg, ${accent.glow}, rgba(10,15,32,0.95))`
                    : 'rgba(255,255,255,0.02)',
                  boxShadow: isExpanded
                    ? `0 0 25px ${accent.glow}`
                    : 'none',
                }}
              >
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-50"
                  style={{
                    background: accent.glow,
                    filter: 'blur(35px)',
                  }}
                />

                <div className="relative p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-xl font-bold"
                      style={{
                        color: accent.color,
                        borderColor: accent.border,
                        background: accent.glow,
                        boxShadow: `0 0 18px ${accent.glow}`,
                      }}
                    >
                      {accent.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className="text-[10px] font-bold tracking-widest"
                          style={{ color: accent.color }}
                        >
                          AGENT 0{index + 1}
                        </span>

                        <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1 text-[9px] text-amber-300">
                          SIMULATED
                        </span>
                      </div>

                      <h4 className="mt-1 text-base font-semibold text-white">
                        {agent.name}
                      </h4>

                      <p className="mt-1 text-[11px] font-medium" style={{ color: accent.color }}>
                        {accent.role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/10 p-3">
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500">
                      ASSIGNED RESPONSIBILITY
                    </p>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {agent.task}
                    </p>
                  </div>

                  {isExpanded && (
                    <div
                      className="mt-3 animate-fade-in rounded-xl border p-4"
                      style={{
                        borderColor: accent.border,
                        background: 'rgba(0,0,0,0.18)',
                      }}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span style={{ color: accent.color }}>◈</span>
                        <p
                          className="text-[10px] font-bold tracking-widest"
                          style={{ color: accent.color }}
                        >
                          AGENT FINDINGS
                        </p>
                      </div>

                      <p className="text-xs leading-relaxed text-slate-300">
                        {agent.findings}
                      </p>

                      <div className="mt-4 border-t border-white/[0.07] pt-3">
                        <p className="text-[10px] leading-relaxed text-slate-500">
                          These findings are predefined demonstration content,
                          not generated by a live AI agent.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[10px] text-slate-500">
                      {isInspected ? 'Previously inspected' : 'Not inspected yet'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleInspect(agent)}
                      className="rounded-lg border px-4 py-2 text-xs font-semibold transition-all duration-200 hover:brightness-125"
                      style={{
                        color: accent.color,
                        borderColor: accent.border,
                        background: accent.glow,
                      }}
                    >
                      {isExpanded ? 'Close details ↑' : 'Inspect agent →'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SELECTED AGENT SUMMARY */}
      <div className="panel p-5">
        <p className="section-label">INSPECTION CONSOLE</p>

        {activeAgent ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">
                {activeAgent.name}
              </h3>
              <p className="mt-1 text-xs text-secondary">
                {activeAgent.task}
              </p>
            </div>

            <span className="rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1.5 text-[10px] text-violet-300">
              Details open
            </span>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 p-5 text-center">
            <div className="text-2xl text-slate-500">⌘</div>
            <p className="mt-2 text-sm font-medium text-slate-300">
              No agent selected
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Select Inspect agent on a card to view its findings here.
            </p>
          </div>
        )}
      </div>

      {/* TRANSPARENCY NOTE */}
      <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.035] p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg text-amber-300">ⓘ</span>
          <div>
            <h4 className="text-xs font-semibold text-amber-200">
              About this prototype
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              This page demonstrates Cognify's proposed multi-agent
              architecture. Agent roles and findings are sample content.
              No live model calls, autonomous execution, or real-time
              agent coordination are currently taking place.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
