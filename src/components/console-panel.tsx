import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, Eraser, Pause, Play, Send, Terminal, Usb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatClock } from '@/lib/format';
import type { ConnectionState, LogLevel, LogLine } from '@/types/telemetry';

const LEVEL_STYLE: Record<LogLevel, string> = {
  INFO: 'text-slate-400',
  DSP: 'text-cyan-400/90',
  NN: 'text-violet-400/90',
  PREDICTION: 'text-emerald-400',
  SENSOR: 'text-sky-400/80',
  WARN: 'text-amber-400',
  ERROR: 'text-rose-400',
  SYS: 'text-slate-400',
};

/** Timestamps are de-emphasised but must still clear 4.5:1 on the console bg. */
const TIMESTAMP_STYLE = 'text-slate-400';

export function ConsolePanel({
  logs,
  paused,
  onTogglePause,
  onClear,
  onExport,
  state,
  onConnect,
  onDisconnect,
  commands,
  onSendCommand,
}: {
  logs: LogLine[];
  paused: boolean;
  onTogglePause: () => void;
  onClear: () => void;
  onExport: (format: 'csv' | 'json') => void;
  state: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
  commands: { label: string; command: string; hint: string }[];
  onSendCommand: (command: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [follow, setFollow] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Follow the tail unless the operator has scrolled away to read something.
  useEffect(() => {
    if (follow && expanded) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [logs, follow, expanded]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setFollow(atBottom);
  };

  const visible = useMemo(() => logs.slice(-400), [logs]);

  return (
    <section className="panel overflow-hidden">
      {/* Console header doubles as the disclosure control. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line/70 bg-elevated/50 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          <Terminal className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.75} />
          <span className="text-[13px] font-semibold tracking-tight text-ink">UART / Serial Console</span>
          <span className="rounded border border-line/70 bg-surface px-1 font-mono text-2xs text-muted">
            {logs.length} lines
          </span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-150',
              expanded && 'rotate-180',
            )}
          />
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          {state === 'connected' ? (
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              <Usb className="h-3 w-3" strokeWidth={2} />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onConnect}
              disabled={state === 'connecting' || state === 'unsupported'}
              title={state === 'unsupported' ? 'Web Serial is not available in this browser' : undefined}
            >
              <Usb className="h-3 w-3" strokeWidth={2} />
              {state === 'connecting' ? 'Opening…' : 'Connect via Web Serial'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onTogglePause}>
            {paused ? <Play className="h-3 w-3" strokeWidth={2} /> : <Pause className="h-3 w-3" strokeWidth={2} />}
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" size="sm" onClick={onClear} aria-label="Clear terminal">
            <Eraser className="h-3 w-3" strokeWidth={2} />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
            <Download className="h-3 w-3" strokeWidth={2} />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('json')}>
            <Download className="h-3 w-3" strokeWidth={2} />
            JSON
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 bg-elevated/30 px-3 py-2">
          <span className="mono-label">Send test command over UART</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {commands.map((c) => (
              <Button
                key={c.command}
                variant="outline"
                size="sm"
                title={c.hint}
                disabled={state !== 'connected'}
                onClick={() => onSendCommand(c.command)}
              >
                <Send className="h-3 w-3" strokeWidth={2} />
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        {expanded ? (
        <>
          <div
            ref={scrollRef}
            onScroll={onScroll}
            role="log"
            aria-live="off"
            aria-label="serial console output"
            className="scroll-thin h-64 overflow-y-auto bg-[#070A10] px-3 py-2 font-mono text-[11.5px] leading-[1.65] dark:bg-[#070A10]"
          >
            {visible.length === 0 ? (
              <p className="py-8 text-center text-slate-400">
                Console cleared. Incoming device output will appear here.
              </p>
            ) : (
              visible.map((line) => (
                <div key={line.id} className="flex gap-2 whitespace-pre-wrap break-words">
                  <span className={cn('shrink-0', TIMESTAMP_STYLE)}>{formatClock(line.timestamp)}</span>
                  <span className={cn('shrink-0', LEVEL_STYLE[line.level])}>[{line.level}]</span>
                  <span className="min-w-0 text-slate-300">{line.message}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line/70 px-3 py-1.5">
            <p className="font-mono text-2xs text-muted">
              {paused ? 'stream paused — buffering resumed output' : follow ? 'following tail' : 'scroll locked'}
            </p>
            <button
              type="button"
              onClick={() => setFollow((v) => !v)}
              className="font-mono text-2xs text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              {follow ? 'unfollow tail' : 'follow tail'}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}