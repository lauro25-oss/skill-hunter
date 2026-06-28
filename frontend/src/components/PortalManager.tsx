import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPortals, createPortal, deletePortal, type PortalOut } from '../api/client'
import { Share2, Plus, Copy, Check, Trash2, X, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

const BASE_URL = window.location.origin

export default function PortalManager() {
  const qc = useQueryClient()
  const [open,     setOpen]     = useState(false)
  const [creating, setCreating] = useState(false)
  const [label,    setLabel]    = useState('')
  const [copied,   setCopied]   = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: portals = [] } = useQuery({
    queryKey: ['portals'],
    queryFn:  getPortals,
    enabled:  open,
    staleTime: 10_000,
  })

  const createMut = useMutation({
    mutationFn: (l: string) => createPortal(l),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['portals'] }); setLabel(''); setCreating(false) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePortal(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['portals'] }),
  })

  const copyLink = (token: string) => {
    const url = `${BASE_URL}/shortlist/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Portal do Cliente"
        className={clsx(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          open
            ? 'bg-brand-50 text-brand-700'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-gray-200 bg-white',
        )}
      >
        <Share2 size={14} />
        <span className="hidden sm:inline">Shortlist</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-float border border-gray-100 z-50 overflow-hidden">

          {/* Header do dropdown */}
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Portal do Cliente</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Links para aprovação da shortlist</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500"><X size={14} /></button>
          </div>

          {/* Lista de portais */}
          <div className="max-h-52 overflow-y-auto">
            {portals.length === 0 && !creating && (
              <p className="text-[12px] text-gray-400 text-center py-6">Nenhum link criado ainda</p>
            )}
            {portals.map(p => (
              <PortalItem
                key={p.id}
                portal={p}
                copied={copied === p.token}
                onCopy={() => copyLink(p.token)}
                onDelete={() => deleteMut.mutate(p.id)}
                onOpen={() => window.open(`/shortlist/${p.token}`, '_blank')}
              />
            ))}
          </div>

          {/* Formulário de criação */}
          {creating ? (
            <form
              onSubmit={e => { e.preventDefault(); if (label.trim()) createMut.mutate(label.trim()) }}
              className="px-4 py-3 border-t border-gray-50 flex gap-2"
            >
              <input
                autoFocus
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Ex: Gerente de Marketing"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-400"
              />
              <button type="submit" className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded-lg font-medium hover:bg-brand-700 transition-colors">
                Criar
              </button>
              <button type="button" onClick={() => setCreating(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </form>
          ) : (
            <div className="px-4 py-3 border-t border-gray-50">
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-brand-600 font-medium hover:bg-brand-50 rounded-lg transition-colors"
              >
                <Plus size={14} /> Novo link de shortlist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PortalItem({ portal, copied, onCopy, onDelete, onOpen }: {
  portal: PortalOut; copied: boolean
  onCopy: () => void; onDelete: () => void; onOpen: () => void
}) {
  return (
    <div className="group flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">{portal.label}</p>
        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
          /shortlist/{portal.token.slice(0, 16)}…
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onOpen}   title="Abrir portal" className="p-1.5 text-gray-300 hover:text-brand-600 transition-colors"><ExternalLink size={13} /></button>
        <button onClick={onCopy}   title="Copiar link"  className={clsx('p-1.5 transition-colors', copied ? 'text-brand-600' : 'text-gray-300 hover:text-brand-600')}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
        <button onClick={onDelete} title="Excluir"      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}
