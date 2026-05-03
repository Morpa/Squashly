import { useAppStore } from '@/hooks/useAppStore'
import { WelcomeScreen } from '@/components/welcome-screen'
import { MainView } from '@/components/main-view'
import { ToastSystem } from '@/components/toast-system'

export default function App() {
  const store = useAppStore()

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ background: 'var(--bg-deep)' }}>
      {store.view === 'welcome' ? (
        <WelcomeScreen
          onOpenFolder={store.openFolder}
          onManualPath={store.loadRepo}
          loading={store.loading}
        />
      ) : (
        <MainView store={store} />
      )}
      <ToastSystem toasts={store.toasts} onRemove={store.removeToast} />
    </div>
  )
}