import { RefreshCw, GitBranch, Loader2, AlertTriangle, ChevronLeft, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { RepoInfo } from '@/lib/wails'
import { SquashlyLogo } from './squashly-logo'

interface TitlebarProps {
  repoInfo: RepoInfo | null
  loading: boolean
  onRefresh: () => void
  onChangeRepo: () => void
  onOpenFolder: () => void
}

export function Titlebar({ repoInfo, loading, onRefresh, onChangeRepo, onOpenFolder }: TitlebarProps) {
  return (
    <div
      className="titlebar-drag flex items-center h-12 shrink-0 bg-card border-b border-border"
      style={{ paddingLeft: 'max(var(--macos-traffic-lights), 16px)', paddingRight: '12px' }}
    >
      <div className="no-drag flex items-center gap-2.5 px-4">
        <SquashlyLogo size={22} />
        <span className="text-sm font-bold tracking-tight text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>
          Squashly
        </span>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <div className="flex-1 flex items-center justify-center gap-2.5 select-none pointer-events-none">
        {repoInfo && (
          <>
            <span className="text-xs font-semibold text-muted-foreground">{repoInfo.name}</span>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1.5">
              <GitBranch size={11} className="text-primary" />
              <span className="text-xs text-[var(--accent-light)] font-mono">{repoInfo.currentBranch}</span>
            </div>
            {repoInfo.hasUncommitted && (
              <Badge variant="amber" className="gap-1 py-0 text-[10px]">
                <AlertTriangle size={9} />
                DIRTY
              </Badge>
            )}
          </>
        )}
      </div>

      <div className="no-drag flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={onRefresh} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin text-primary" /> : <RefreshCw size={14} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh commits</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={onOpenFolder}>
              <FolderOpen size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open folder</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 mx-1" />

        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary" onClick={onChangeRepo}>
          <ChevronLeft size={12} />
          Change repo
        </Button>
      </div>
    </div>
  )
}