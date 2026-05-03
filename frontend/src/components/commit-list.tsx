import { useState } from 'react'
import { CheckSquare, Square, Clock, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Commit } from '@/lib/wails'
import { formatDate, getInitials, cn } from '@/lib/utils'

interface CommitListProps {
  commits: Commit[]
  selectedHashes: Set<string>
  onToggle: (hash: string) => void
  onSelectRange: (start: number, end: number) => void
  loading: boolean
  limit: number
  onLimitChange: (n: number) => void
}

const LIMITS = [20, 30, 50, 100]

export function CommitList({ commits, selectedHashes, onToggle, onSelectRange, loading, limit, onLimitChange }: CommitListProps) {
  const [expandedHashes, setExpandedHashes] = useState<Set<string>>(new Set())
  const [lastClickedIdx, setLastClickedIdx] = useState<number | null>(null)

  const toggleExpand = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedHashes(prev => {
      const next = new Set(prev)
      next.has(hash) ? next.delete(hash) : next.add(hash)
      return next
    })
  }

  const handleRowClick = (hash: string, idx: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedIdx !== null) {
      onSelectRange(lastClickedIdx, idx)
    } else {
      onToggle(hash)
      setLastClickedIdx(idx)
    }
  }

  return (
    // A cadeia flex-col + min-h-0 tem de existir em TODOS os níveis para o scroll funcionar
    <div className="flex flex-col min-h-0 h-full">

      {/* Header — shrink-0 para nunca encolher */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Commits</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{commits.length}</Badge>
          {selectedHashes.size > 0 && (
            <Badge variant="accent" className="text-[10px] px-1.5 py-0 h-4">{selectedHashes.size} selected</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground mr-1">Show</span>
          {LIMITS.map(n => (
            <Button
              key={n}
              variant={limit === n ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-6 px-2 text-[10px]',
                limit === n ? 'text-[var(--accent-light)] bg-[var(--accent-glow)]' : 'text-muted-foreground'
              )}
              onClick={() => onLimitChange(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      {/* Hint — shrink-0 */}
      {commits.length > 0 && selectedHashes.size === 0 && (
        <div className="flex items-center gap-2 mx-4 mt-3 px-3 py-2 rounded-md bg-muted/50 border border-border text-[10px] text-muted-foreground shrink-0">
          <Info size={11} className="shrink-0" />
          Click to select · Shift+click for range · Need 2+ to squash
        </div>
      )}

      {/* Scrollable list — flex-1 + min-h-0 + overflow-y-auto */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
        <div className="space-y-0.5">

          {loading && commits.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="size-5 rounded-full border-2 border-border border-t-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Loading commits…</span>
            </div>
          )}

          {commits.map((commit, idx) => {
            const isSelected = selectedHashes.has(commit.hash)
            const isExpanded = expandedHashes.has(commit.hash)

            return (
              <div
                key={commit.hash}
                className={cn('commit-row animate-slide-in', isSelected && 'selected')}
                style={{ animationDelay: `${Math.min(idx * 10, 200)}ms` }}
                onClick={e => handleRowClick(commit.hash, idx, e)}
              >
                {/* Checkbox */}
                <div className={cn('shrink-0 mt-0.5', isSelected ? 'text-primary' : 'text-muted-foreground')}>
                  {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className="hash-badge">{commit.shortHash}</span>
                    <span className="text-sm font-medium text-foreground leading-snug">{commit.message}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="size-4 rounded-full flex items-center justify-center text-[8px] font-bold bg-[var(--accent-glow)] text-[var(--accent-light)] border border-[rgba(124,106,247,0.2)] shrink-0">
                        {getInitials(commit.author)}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{commit.author}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock size={10} />
                      <span className="text-[11px]">{formatDate(commit.date)}</span>
                    </div>
                  </div>

                  {isExpanded && commit.body && (
                    <pre className="mt-2 px-3 py-2 rounded-md bg-background border border-border text-[11px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                      {commit.body}
                    </pre>
                  )}
                </div>

                {commit.body && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 size-6 text-muted-foreground hover:text-foreground"
                    onClick={e => toggleExpand(commit.hash, e)}
                  >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </Button>
                )}
              </div>
            )
          })}

          {!loading && commits.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <span className="text-2xl">📭</span>
              <span className="text-xs">No commits found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}