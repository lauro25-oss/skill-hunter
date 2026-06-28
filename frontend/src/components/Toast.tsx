import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import clsx from 'clsx'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void
}

const Ctx = createContext<ToastCtx>({ toast: () => {} })
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now()
    setItems(prev => [...prev, { id, message, type }])
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {items.map(item => (
          <div
            key={item.id}
            className={clsx(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-float border text-sm font-medium min-w-[240px] max-w-[320px] bg-white',
              item.type === 'success' && 'border-brand-100',
              item.type === 'error'   && 'border-red-100',
              item.type === 'info'    && 'border-blue-100',
            )}
          >
            {item.type === 'success' && <CheckCircle size={16} className="text-brand-500 shrink-0" />}
            {item.type === 'error'   && <AlertCircle size={16} className="text-red-500 shrink-0"   />}
            {item.type === 'info'    && <Info         size={16} className="text-blue-500 shrink-0"  />}
            <span className="flex-1 text-gray-700">{item.message}</span>
            <button
              onClick={() => setItems(prev => prev.filter(t => t.id !== item.id))}
              className="text-gray-300 hover:text-gray-500 shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
