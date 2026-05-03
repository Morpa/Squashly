import { useState } from 'react'
import { FolderOpen, ArrowRight, Terminal, GitBranch, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SquashlyLogo } from './squashly-logo'

interface WelcomeScreenProps {
  onOpenFolder: () => Promise<void>
  onManualPath: (path: string) => Promise<void>
  loading: boolean
}

export function WelcomeScreen({ onOpenFolder, onManualPath, loading }: WelcomeScreenProps) {
  const [manualPath, setManualPath] = useState('')
  const [showManual, setShowManual] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualPath.trim()) onManualPath(manualPath.trim())
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full opacity-[0.07] blur-3xl bg-primary pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl blur-2xl opacity-30 bg-primary scale-150 pointer-events-none" />
            <div className="relative p-4 rounded-2xl bg-card border border-border">
              <SquashlyLogo size={52} />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>
              Squashly
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              Git Commit Squasher
            </p>
          </div>
        </div>

        <p className="text-center max-w-xs text-sm text-muted-foreground leading-relaxed">
          Select a repository, pick commits to squash,<br />and craft the perfect commit message.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-stretch gap-2.5 w-72">
          <Button size="lg" onClick={onOpenFolder} disabled={loading} className="gap-2 font-semibold">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
            Open Repository
            <ArrowRight size={14} className="ml-auto opacity-60" />
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowManual(v => !v)} className="gap-2 text-muted-foreground hover:text-foreground">
            <Terminal size={13} />
            Enter path manually
          </Button>

          {showManual && (
            <form onSubmit={handleSubmit} className="flex gap-2 animate-fade-in">
              <Input
                value={manualPath}
                onChange={e => setManualPath(e.target.value)}
                placeholder="/path/to/repo"
                className="font-mono text-xs"
                autoFocus
              />
              <Button type="submit" size="icon" disabled={!manualPath.trim() || loading}>
                <ArrowRight size={14} />
              </Button>
            </form>
          )}
        </div>

        <div className="flex gap-6 mt-1">
          {[{ icon: GitBranch, label: 'Branch aware' }, { icon: FolderOpen, label: 'Any git repo' }].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon size={11} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}