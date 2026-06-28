import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCandidate, type CandidateListItem, type CandidateStatus } from '../api/client'
import { getAvatarBg, getInitials, timeAgo } from '../utils/format'
import { MapPin, Clock, Star, ChevronRight, X } from 'lucide-react'
import clsx from 'clsx'

const COLUMNS: { status: CandidateStatus; label: string; dot: string; ring: string }[] = [
  { status: 'novo',       label: 'Novo',       dot: 'bg-gray-300',    ring: 'ring-gray-200'    },
  { status: 'em_triagem', label: 'Em triagem',  dot: 'bg-blue-400',    ring: 'ring-blue-200'    },
  { status: 'shortlist',  label: 'Shortlist',   dot: 'bg-purple-400',  ring: 'ring-purple-200'  },
  { status: 'aprovado',   label: 'Aprovado',    dot: 'bg-brand-500',   ring: 'ring-brand-200'   },
  { status: 'rejeitado',  label: 'Rejeitado',   dot: 'bg-red-400',     ring: 'ring-red-200'     },
  { status: 'contratado', label: 'Contratado',  dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
]

interface Props {
  candidates: CandidateListItem[]
  onSelect: (id: string) => void
}

export default function KanbanView({ candidates, onSelect }: Props) {
  const qc = useQueryClient()
  const [draggingId,  setDraggingId]  = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<CandidateStatus | null>(null)

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CandidateStatus }) => updateCandidate(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['candidates-kanban'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const grouped = Object.fromEntries(
    COLUMNS.map(col => [col.status, candidates.filter(c => c.status === col.status)])
  ) as Record<CandidateStatus, CandidateListItem[]>

  const dragging = candidates.find(c => c.id === draggingId)

  const handleDrop = (toStatus: CandidateStatus) => {
    if (!draggingId || !dragging) return
    if (dragging.status !== toStatus) moveMut.mutate({ id: draggingId, status: toStatus })
    setDraggingId(null)
    setDragOverCol(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 h-full">
      {COLUMNS.map(col => (
        <div
          key={col.status}
          className="flex flex-col shrink-0 w-56"
          onDragOver={e => { e.preventDefault(); setDragOverCol(col.status) }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null) }}
          onDrop={() => handleDrop(col.status)}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className={clsx('w-1.5 h-1.5 rounded-full', col.dot)} />
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{col.label}</span>
            </div>
            <span className="text-[11px] font-semibold text-gray-300">{grouped[col.status].length}</span>
          </div>

          {/* Coluna */}
          <div className={clsx(
            'flex-1 flex flex-col gap-2 rounded-xl p-1.5 overflow-y-auto transition-all duration-150',
            dragOverCol === col.status && dragging?.status !== col.status
              ? 'bg-brand-50 ring-2 ring-dashed ring-brand-300' : 'bg-gray-50/60',
          )}>
            {grouped[col.status].map(c => (
              <KanbanCard
                key={c.id}
                candidate={c}
                isDragging={draggingId === c.id}
                onDragStart={() => setDraggingId(c.id)}
                onDragEnd={() => { setDraggingId(null); setDragOverCol(null) }}
                onClick={() => onSelect(c.id)}
                onMove={status => moveMut.mutate({ id: c.id, status })}
              />
            ))}

            {grouped[col.status].length === 0 && (
              <div className={clsx(
                'flex items-center justify-center h-16 rounded-lg text-[11px] text-gray-300 border border-dashed border-gray-200 transition-colors',
                dragOverCol === col.status ? 'border-brand-300 text-brand-400 bg-brand-50' : '',
              )}>
                Solte aqui
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────

function KanbanCard({ candidate: c, isDragging, onDragStart, onDragEnd, onClick, onMove }: {
  candidate: CandidateListItem; isDragging: boolean
  onDragStart: () => void; onDragEnd: () => void
  onClick: () => void; onMove: (s: CandidateStatus) => void
}) {
  const qc = useQueryClient()

  const shortlistMut = useMutation({
    mutationFn: () => updateCandidate(c.id, { em_shortlist: !c.em_shortlist }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['candidates-kanban'] })
    },
  })

  const colIdx    = COLUMNS.findIndex(col => col.status === c.status)
  const nextCol   = COLUMNS.slice(colIdx + 1).find(col => col.status !== 'rejeitado') ?? null
  const canReject = c.status !== 'rejeitado' && c.status !== 'contratado'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={clsx(
        'group relative bg-white rounded-lg overflow-hidden select-none',
        'cursor-grab active:cursor-grabbing',
        'shadow-card hover:shadow-float transition-all duration-150',
        isDragging && 'opacity-30 scale-95 rotate-1',
      )}
    >
      {/* Faixa status */}
      <div className={clsx('h-0.5', {
        'bg-gray-200':    c.status === 'novo',
        'bg-blue-400':    c.status === 'em_triagem',
        'bg-purple-400':  c.status === 'shortlist',
        'bg-brand-500':   c.status === 'aprovado',
        'bg-red-400':     c.status === 'rejeitado',
        'bg-emerald-500': c.status === 'contratado',
      })} />

      <div className="p-3">
        {/* Avatar + nome */}
        <div className="flex items-center gap-2 mb-2">
          <div className={clsx('w-7 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0', getAvatarBg(c.nome))}>
            {getInitials(c.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-gray-800 truncate leading-tight">{c.nome}</p>
            <p className="text-[11px] text-brand-600 truncate">{c.cargo_atual || '—'}</p>
          </div>
          {c.score_aderencia != null && (
            <span className="text-[10px] font-bold text-gray-300 shrink-0">{Math.round(c.score_aderencia)}</span>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-gray-400 mb-1.5">
          {c.localizacao && <span className="flex items-center gap-0.5"><MapPin size={9} />{c.localizacao}</span>}
          {c.anos_experiencia != null && <span className="flex items-center gap-0.5"><Clock size={9} />{c.anos_experiencia}a</span>}
          <span className="ml-auto italic text-gray-300">{timeAgo(c.criado_em)}</span>
        </div>

        {/* Skills */}
        {c.hard_skills.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-50">
            {c.hard_skills.slice(0, 2).map(s => (
              <span key={s} className="text-[9px] bg-gray-50 border border-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{s}</span>
            ))}
            {c.hard_skills.length > 2 && (
              <span className="text-[9px] bg-gray-50 border border-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md">+{c.hard_skills.length - 2}</span>
            )}
          </div>
        )}

        {/* Badge avaliação do cliente */}
        {c.em_shortlist && c.aprovado_cliente !== null && (
          <div className={clsx(
            'mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold w-fit',
            c.aprovado_cliente ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600',
          )}>
            {c.aprovado_cliente ? '✓ aprovado' : '✗ reprovado'}
          </div>
        )}
      </div>

      {/* Ações hover */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 px-3 py-2 rounded-b-lg
          opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto
          transition-opacity duration-150 bg-gradient-to-t from-white via-white/90 to-transparent"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => shortlistMut.mutate()}
          className={clsx('p-1.5 rounded-md transition-colors',
            c.em_shortlist ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'
          )}
        >
          <Star size={11} fill={c.em_shortlist ? 'currentColor' : 'none'} />
        </button>
        {nextCol && (
          <button
            onClick={() => onMove(nextCol.status)}
            className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors"
          >
            {nextCol.label} <ChevronRight size={9} />
          </button>
        )}
        {canReject && (
          <button onClick={() => onMove('rejeitado')} className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X size={11} />
          </button>
        )}
      </div>
    </div>
  )
}
