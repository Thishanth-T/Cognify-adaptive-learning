// @ts-nocheck
import { useState } from 'react'

type AgentPanelProps = {
  pushLog: (message: string) => void
  learningData: any
  onNavigateToWorkspace?: () => void
}

const agentConfig = [
  {
    id: 'assessment',
    code: 'A1',
    name: 'Assessment Agent',
    role: 'Semantic Evaluation & Scoring',
    color: '#0D9488',
    description: 'Evaluates student explanations against semantic AI criteria and curriculum rubrics. Distinguishes demonstrated, partial, missing, and incorrect criteria.',
  },
  {
    id: 'misconception',
    code: 'A2',
    name: 'Misconception Detector',
    role: 'Cognitive Gap Tracking',
    color: '#F43F5E',
    description: 'Analyzes student explanations to isolate genuine conceptual misconceptions and track recurring misunderstandings over time.',
  },
  {
    id: 'twin',
    code: 'A3',
    name: 'Learning Twin Agent',
    role: 'Cognitive State Engine',
    color: '#2563EB',
    description: 'Updates exponential Bayesian mastery, estimates statistical confidence, and maintains verified assessment history.',
  },
  {
    id: 'planner',
    code: 'A4',
    name: 'Learning Planner',
    role: 'Prerequisite Optimization',
    color: '#059669',
    description: 'Traverses the prerequisite DAG to calculate the optimal next study activity based on current mastery and prerequisites.',
  },
  {
    id: 'tutor',
    code: 'A5',
    name: 'AI Tutor',
    role: 'Pedagogical Explanation',
    color: '#D97706',
    description: 'Provides contextual Socratic explanations, code examples, and follow-up guidance tailored to the student\'s verified understanding.',
  },
]

export default function AgentPanel({ pushLog, learningData, onNavigateToWorkspace }: AgentPanelProps) {
  const { agentLogs, twin, plan, askTutor, concepts } = learningData
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [testQuestion, setTestQuestion] = useState('')
  const [testingTutor, setTestingTutor] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleTestTutor = async () => {
    if (!testQuestion.trim() || testingTutor) return
    setTestingTutor(true)
    setTestResult(null)
    const targetConcept = concepts[0]?.label || 'Pointers'

    try {
      pushLog(`Running live test on AI Tutor for: "${testQuestion}"`)
      const res = await askTutor(targetConcept, testQuestion)
      setTestResult(res.answer)
      pushLog('AI Tutor responded successfully.')
    } catch (e: any) {
      setTestResult('Tutor test could not complete. Check network or server connection.')
    } finally {
      setTestingTutor(false)
    }
  }

  // Calculate live stats for each agent
  const agentStats = agentConfig.map((agent) => {
    const logs = agentLogs.filter((l: any) => l.agent === agent.id)
    const count = logs.length
    const lastLog = logs[0] || null

    const avgLatency =
      count > 0
        ? Math.round(logs.reduce((acc: number, l: any) => acc + (l.ms || 0), 0) / count)
        : null

    const isActive = count > 0

    return {
      ...agent,
      count,
      lastLog,
      avgLatency,
      isActive,
    }
  })

  const totalExecutions = agentLogs.length
  const activeAgentsCount = agentStats.filter((a) => a.isActive).length

  return (
    <section className="relative space-y-6">
      {/* COMMAND CENTER HEADER */}
      <div className="cognify-card p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">
                Multi-Agent Orchestration Layer
              </p>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
              Autonomous Agent Command Center
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Live status, execution latencies, and cooperative pipeline traces for Cognify's 5 specialized agents.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300">
                PIPELINE ONLINE
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              Gemini 3.8 Flash + Supabase
            </p>
          </div>
        </div>

        {/* SYSTEM TELEMETRY METRICS */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5">
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-display">5</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Configured Agents</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5">
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-display">{activeAgentsCount}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Active Agents</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-display">{totalExecutions}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Session Executions</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5">
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-display">{twin.misconceptions.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tracked Misconceptions</p>
          </div>
        </div>
      </div>

      {/* AGENT DIRECTORY CARDS */}
      <div className="cognify-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Agent Roles
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white font-display">Autonomous Agent Directory</h3>
          </div>
          <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300 font-mono">
            5 Cooperative Roles
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agentStats.map((agent) => {
            const isExpanded = expandedAgent === agent.id

            return (
              <div
                key={agent.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 transition hover:border-slate-300 dark:hover:border-slate-700 p-5"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold"
                    style={{
                      color: agent.color,
                      backgroundColor: `${agent.color}18`,
                      border: `1px solid ${agent.color}40`,
                    }}
                  >
                    {agent.code}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[11px] font-bold tracking-wider text-slate-400">
                        {agent.code}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold font-mono ${
                          agent.isActive
                            ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {agent.isActive ? 'ACTIVE' : 'READY'}
                      </span>
                    </div>

                    <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate font-display">
                      {agent.name}
                    </h4>
                    <p className="text-xs font-semibold" style={{ color: agent.color }}>
                      {agent.role}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
                  {agent.description}
                </p>

                {/* Telemetry info */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>Executions: <strong className="text-slate-900 dark:text-white font-mono">{agent.count}</strong></span>
                  {agent.avgLatency !== null && (
                    <span>Latency: <strong className="text-teal-600 dark:text-teal-400 font-mono">{agent.avgLatency}ms</strong></span>
                  )}
                </div>

                {agent.lastLog && (
                  <div className="mt-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                    <span className="font-semibold text-slate-400">Output: </span>
                    {agent.lastLog.summary}
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: agent.color }}
                  >
                    {isExpanded ? 'Collapse ↑' : 'Inspect Role Details →'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                    <p><strong className="text-slate-900 dark:text-white">Role:</strong> {agent.description}</p>
                    <p>
                      <strong className="text-slate-900 dark:text-white">Status:</strong>{' '}
                      {agent.isActive
                        ? `Active (${agent.count} execution${agent.count === 1 ? '' : 's'} recorded)`
                        : 'Standby — evaluates on relevant user triggers.'}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* LIVE INTERACTIVE AGENT TEST PANEL */}
      <div className="cognify-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Live Agent Diagnostic Test</h3>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Submit a prompt to test Agent 5 (AI Tutor) with live Gemini execution and trace logging.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={testQuestion}
            onChange={(e) => setTestQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTestTutor()
            }}
            placeholder="e.g. Why does dereferencing nullptr cause an undefined behavior crash?"
            className="min-w-[280px] flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <button
            onClick={handleTestTutor}
            disabled={!testQuestion.trim() || testingTutor}
            className="btn-primary"
          >
            {testingTutor ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Running Agent...</span>
              </span>
            ) : (
              <span>Execute Diagnostic Query →</span>
            )}
          </button>
        </div>

        {testResult && (
          <div className="mt-4 rounded-xl border border-teal-500/30 bg-teal-500/5 p-4 text-xs text-slate-800 dark:text-slate-200">
            <p className="font-semibold text-teal-700 dark:text-teal-400 mb-1.5 font-display">Agent Execution Output:</p>
            <p className="whitespace-pre-line leading-relaxed">{testResult}</p>
          </div>
        )}
      </div>

      {/* LIVE MULTI-AGENT EXECUTION TRACE LOG */}
      <div className="cognify-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Pipeline Stream
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white font-display">Live Execution Traces</h3>
          </div>
          <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
            {agentLogs.length} traces logged
          </span>
        </div>

        {agentLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>No agent executions logged in this session yet.</p>
            <p className="mt-1 text-slate-500">
              Submit an explanation in the Learning Workspace or run a diagnostic test to see real-time multi-agent execution traces.
            </p>
            {onNavigateToWorkspace && (
              <button
                onClick={onNavigateToWorkspace}
                className="mt-4 btn-secondary text-xs"
              >
                Open Learning Workspace →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {agentLogs.map((log: any) => {
              const agentItem = agentConfig.find((a) => a.id === log.agent)
              const color = agentItem?.color || '#0D9488'

              return (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3 text-xs transition hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold"
                      style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}
                    >
                      {agentItem?.code || '••'}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {agentItem?.name || log.agent}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {log.summary}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 shrink-0">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">{log.ms}ms</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
