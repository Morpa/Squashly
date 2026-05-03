import { useState, useEffect } from 'react'
import { Zap, X, GitMerge, Loader2, CheckCircle2, Copy, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import type { Commit, SquashResult } from '@/lib/wails'
import { formatDate } from '@/lib/utils'

interface SquashPanelProps {
  selectedCommits: Commit[]
  onSquash: (message: string, body: string) => Promise<void>
  onClear: () => void
  squashing: boolean
  squashResult: SquashResult | null
}

export function SquashPanel({ selectedCommits, onSquash, onClear, squashing, squashResult }: SquashPanelProps) {
  const [message, setMessage] = useState('')
  const [body, setBody] = useState('')
  const [showBody, setShowBody] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (selectedCommits.length > 0 && !message) {
      setMessage(selectedCommits[0].message)
    }
  }, [selectedCommits.length]) // eslint-disable-line

  const handleCopy = () => {
    if (squashResult?.newHash) {
      navigator.clipboard.writeText(squashResult.newHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReset = () => { setMessage(''); setBody(''); setShowBody(false); onClear() }

  const canSquash = selectedCommits.length >= 2 && message.trim().length > 0 && !squashing
  const sortedCommits = [...selectedCommits].reverse()

  if (selectedCommits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 p-6 text-center">
        <div className="size-14 rounded-2xl flex items-center justify-center bg-muted border border-border">
          <GitMerge size={22} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">No commits selected</p>
          <p className="text-xs text-muted-foreground mt-1">Select 2 or more commits to squash</p>
        </div>
        <div className="w-full rounded-xl bg-muted/50 border border-border p-4 text-left space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">How it works</p>
          {['① Click commits to select', '② Shift+click for range', '③ Write a new message', '④ Hit Squash!'].map(s => (
            <p key={s} className="text-xs text-muted-foreground font-mono">{s}</p>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">

        {/* Success banner */}
        {squashResult?.success && (
          <div className="rounded-xl p-4 animate-fade-in bg-[var(--green-dim)] border border-[rgba(74,222,128,0.25)]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-[var(--green)]" />
              <span className="text-sm font-semibold text-[var(--green)]">Squash complete!</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{squashResult.message}</p>
            <div className="flex items-center gap-2">
              <span className="hash-badge">{squashResult.newHash}</span>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-[var(--green)] hover:text-[var(--green)] gap-1" onClick={handleCopy}>
                <Copy size={10} />{copied ? 'Copied!' : 'Copy hash'}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground ml-auto gap-1" onClick={handleReset}>
                <RotateCcw size={10} />New squash
              </Button>
            </div>
          </div>
        )}

        {/* Selected commits */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Squashing {selectedCommits.length} commits
            </span>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground hover:text-destructive gap-1" onClick={onClear}>
              <X size={10} />Clear
            </Button>
          </div>

          <div className="space-y-1.5">
            {sortedCommits.map((commit, i) => (
              <div key={commit.hash} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <div className="flex flex-col items-center shrink-0 mt-1">
                  <div className="size-1.5 rounded-full bg-primary" />
                  {i < sortedCommits.length - 1 && <div className="w-px flex-1 mt-1 bg-border min-h-[12px]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="hash-badge" style={{ fontSize: '0.6rem' }}>{commit.shortHash}</span>
                    {i === 0 && <Badge variant="green" className="text-[9px] py-0 px-1 h-4">oldest</Badge>}
                    {i === sortedCommits.length - 1 && <Badge variant="accent" className="text-[9px] py-0 px-1 h-4">newest</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{commit.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDate(commit.date)}</p>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2 px-3 py-1">
              <div className="flex flex-col items-center ml-[2px]">
                <div className="w-px h-3 bg-primary/40" />
                <span className="text-primary text-[8px]">▼</span>
              </div>
              <span className="text-[10px] italic text-[var(--accent-light)]/60">becomes one commit</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Message editor */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Commit message *
            </label>
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="feat: your squashed message"
              className="font-mono text-xs h-9 bg-input border-border focus-visible:ring-primary/50"
              disabled={squashing || squashResult?.success}
            />
            <p className={`text-[10px] mt-1 ${message.length > 72 ? 'text-[var(--amber)]' : 'text-muted-foreground'}`}>
              {message.length} chars {message.length > 72 ? '· consider keeping under 72' : ''}
            </p>
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-muted-foreground gap-1 px-0 mb-1.5"
              onClick={() => setShowBody(v => !v)}
            >
              {showBody ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              <span className="font-bold uppercase tracking-widest">Body (optional)</span>
            </Button>

            {showBody && (
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Extended description, breaking changes…"
                className="font-mono text-xs bg-input border-border focus-visible:ring-primary/50 resize-none min-h-[80px]"
                disabled={squashing || squashResult?.success}
              />
            )}
          </div>
        </div>

        {/* Squash button */}
        {!squashResult?.success && (
          <Button
            onClick={() => onSquash(message.trim(), body.trim())}
            disabled={!canSquash}
            className="w-full gap-2 font-bold"
            size="lg"
          >
            {squashing ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            {squashing ? 'Squashing…' : `Squash ${selectedCommits.length} Commits`}
          </Button>
        )}

        {selectedCommits.length === 1 && (
          <p className="text-center text-[11px] text-[var(--amber)]">Select at least 2 commits to squash</p>
        )}
      </div>
    </div>
  )
}