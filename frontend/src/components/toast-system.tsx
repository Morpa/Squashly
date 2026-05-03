import { X, CheckCircle2, XCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Toast } from '@/hooks/useAppStore'
import { cn } from '@/lib/utils'

interface ToastSystemProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

const config = {
  success: { icon: CheckCircle2, className: 'bg-[var(--green-dim)] border-[rgba(74,222,128,0.3)] text-[var(--green)]' },
  error: { icon: XCircle, className: 'bg-destructive/10 border-destructive/30 text-destructive' },
  info: { icon: Info, className: 'bg-[var(--accent-glow)] border-[rgba(124,106,247,0.3)] text-[var(--accent-light)]' },
}

export function ToastSystem({ toasts, onRemove }: ToastSystemProps) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 w-80">
      {toasts.map(toast => {
        const { icon: Icon, className } = config[toast.type]
        return (
          <div key={toast.id} className={cn('animate-fade-in flex items-start gap-3 px-4 py-3 rounded-xl border bg-card shadow-xl', className)}>
            <Icon size={15} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
              {toast.message && <p className="text-xs mt-0.5 text-muted-foreground leading-relaxed">{toast.message}</p>}
            </div>
            <Button variant="ghost" size="icon" className="size-5 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => onRemove(toast.id)}>
              <X size={12} />
            </Button>
          </div>
        )
      })}
    </div>
  )
}