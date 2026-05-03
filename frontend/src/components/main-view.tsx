import { Titlebar } from './title-bar'
import { CommitList } from './commit-list'
import { SquashPanel } from './squash-panel'
import { Separator } from '@/components/ui/separator'
import type { useAppStore } from '@/hooks/useAppStore'

interface MainViewProps {
  store: ReturnType<typeof useAppStore>
}

export function MainView({ store }: MainViewProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      <Titlebar
        repoInfo={store.repoInfo}
        loading={store.loading}
        onRefresh={store.refreshCommits}
        onChangeRepo={() => store.setView('welcome')}
        onOpenFolder={store.openFolder}
      />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col">
          <CommitList
            commits={store.commits}
            selectedHashes={store.selectedHashes}
            onToggle={store.toggleCommit}
            onSelectRange={store.selectRange}
            loading={store.loading}
            limit={store.commitLimit}
            onLimitChange={store.setCommitLimit}
          />
        </div>
        <Separator orientation="vertical" />
        <div className="w-[320px] shrink-0 flex flex-col bg-card">
          <div className="px-4 py-2.5 border-b border-border">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Squash</span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <SquashPanel
              selectedCommits={store.selectedCommits}
              onSquash={store.squash}
              onClear={store.clearSelection}
              squashing={store.squashing}
              squashResult={store.squashResult}
            />
          </div>
        </div>
      </div>
    </div>
  )
}