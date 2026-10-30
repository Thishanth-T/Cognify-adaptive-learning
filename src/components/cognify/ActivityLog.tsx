
type ActivityLogProps = {
  logs: string[]
}

export default function ActivityLog({ logs }: ActivityLogProps) {
  return (
    <section className="panel p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="section-label mb-2">SYSTEM HISTORY</p>
          <h2 className="text-xl font-semibold">Activity Timeline</h2>
          <p className="mt-1 text-sm text-secondary">
            A chronological view of actions recorded during this session.
          </p>
        </div>

        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-secondary">
          {logs.length} events
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-8 text-center">
          <div className="mb-3 text-2xl text-muted">◷</div>
          <h3 className="font-medium text-white">No activity yet</h3>
          <p className="mt-2 text-sm text-secondary">
            Your learning actions will appear here as you explore Cognify.
          </p>
        </div>
      ) : (
        <div className="relative space-y-0">
          {logs.map((log, index) => {
            const separatorIndex = log.indexOf(' — ')
            const hasTimestamp = separatorIndex !== -1

            const timestamp = hasTimestamp
              ? log.slice(0, separatorIndex)
              : null

            const message = hasTimestamp
              ? log.slice(separatorIndex + 3)
              : log

            return (
              <div
                key={`${index}-${log}`}
                className="relative flex gap-4 pb-5 last:pb-0"
              >
                {index !== logs.length - 1 && (
                  <div className="absolute left-[7px] top-4 h-full w-px bg-[var(--border-strong)]" />
                )}

                <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-[var(--warm-accent)] bg-[var(--cognify-surface)]" />

                <div className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white/[0.02] p-3">
                  {timestamp && (
                    <p className="mb-1 text-xs text-muted">{timestamp}</p>
                  )}

                  <p className="text-sm leading-relaxed text-secondary">
                    {message}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs text-muted">
        Events are stored for the current dashboard session.
      </p>
    </section>
  )
}