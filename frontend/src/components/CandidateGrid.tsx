import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCandidate, type CandidateListItem, type CandidateStatus, type Stats } from '../api/client'
import { getAvatarBg, getInitials, timeAgo } from '../utils/format'
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, TrendingUp, Star, CheckCircle, X } from 'lucide-react'
import clsx from 'clsx'

const STATUS_STYLE: Record<string, string> = {
  novo:       'text-gray-500   bg-gray-100',
  em_triagem: 'text-blue-600   bg-blue-50',
  shortlist:  'text-purple-600 bg-purple-50',
  aprovado:   'text-brand-700  bg-brand-50',
  rejeitado:  'text-red-600    bg-red-50',
  contratado: 'text-emerald-700 bg-emerald-50',
}

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo', em_triagem: 'Em triagem', shortlist: 'Shortlist',
  aprovado: 'Aprovado', rejeitado: 'Rejeitado', contratado: 'Contratado',
}

const NEXT: Partial<Record<CandidateStatus, { status: CandidateStatus; label: string }>> = {
  novo:       { status: 'em_triagem', label: 'Em triagem' },
  em_triagem: { status: 'shortlist',  label: 'Shortlist'  },
  shortlist:  { status: 'aprovado',   label: 'Aprovado'   },
  aprovado:   { status: 'contratado', label: 'Contratado' },
}

interface Props {
  candidates: CandidateListItem[]
  total: number; page: number; perPage: number
  selectedId: string | null
  onSelect: (id: string) => void
  onPageChange: (p: number) => void
  stats?: Stats
}

export default function CandidateGrid({ candidates, total, page, perPage, selectedId, onSelect, onPageChange, stats }: Props) {
  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="flex flex-col gap-8">

      {/* ── KPIs ─────────────────────────────────────── */}
      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard icon={<Users size={15} />}       label="Total de CVs"  value={stats.total}      color="brand"   />
            <KpiCard icon={<TrendingUp size={15} />}  label="Em triagem"    value={stats.em_triagem} color="blue"    />
            <KpiCard icon={<Star size={15} />}        label="Na shortlist"  value={stats.shortlist}  color="purple"  />
            <KpiCard icon={<CheckCircle size={15} />} label="Contratados"   value={stats.contratado} color="emerald" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FunnelChart stats={stats} />
            {stats.timeline?.length > 0 && <TimelineChart stats={stats} />}
          </div>
        </>
      )}

      {/* Contador */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-gray-700">{total}</span>{' '}
          candidato{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Cards ────────────────────────────────────── */}
      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
          <Users size={32} className="text-gray-200" />
          <p className="text-sm">Nenhum candidato encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map(c => (
            <CandidateCard key={c.id} candidate={c} selected={selectedId === c.id} onSelect={onSelect} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-1.5">
            <button className="btn-secondary py-1.5 px-3 text-xs" disabled={page <= 1}          onClick={() => onPageChange(page - 1)}><ChevronLeft  size={14} /></button>
            <button className="btn-secondary py-1.5 px-3 text-xs" disabled={page >= totalPages}  onClick={() => onPageChange(page + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────

function CandidateCard({ candidate: c, selected, onSelect }: {
  candidate: CandidateListItem; selected: boolean; onSelect: (id: string) => void
}) {
  const qc = useQueryClient()

  const shortlistMut = useMutation({
    mutationFn: () => updateCandidate(c.id, { em_shortlist: !c.em_shortlist }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['candidates'] }); qc.invalidateQueries({ queryKey: ['candidates-kanban'] }) },
  })

  const moveMut = useMutation({
    mutationFn: (status: CandidateStatus) => updateCandidate(c.id, { status }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['candidates-kanban'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const next      = NEXT[c.status] ?? null
  const canReject = c.status !== 'rejeitado' && c.status !== 'contratado'

  return (
    <div
      onClick={() => onSelect(c.id)}
      className={clsx(
        'group relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-200',
        'shadow-card hover:shadow-float hover:-translate-y-0.5',
        selected && 'ring-2 ring-brand-500',
      )}
    >
      {/* Faixa superior colorida */}
      <div className={clsx('h-[3px] w-full', {
        'bg-gray-200':    c.status === 'novo',
        'bg-blue-400':    c.status === 'em_triagem',
        'bg-purple-400':  c.status === 'shortlist',
        'bg-brand-500':   c.status === 'aprovado',
        'bg-red-400':     c.status === 'rejeitado',
        'bg-emerald-500': c.status === 'contratado',
      })} />

      <div className="p-5 pb-10">
        {/* Linha 1: avatar + nome + status */}
        <div className="flex items-start gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0',
            getAvatarBg(c.nome),
          )}>
            {getInitials(c.nome)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{c.nome}</p>
                <p className="text-[12px] text-brand-600 font-medium truncate mt-0.5">{c.cargo_atual || '—'}</p>
              </div>
              <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide', STATUS_STYLE[c.status])}>
                {STATUS_LABELS[c.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Linha 2: meta info */}
        <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400">
          {c.localizacao && <span className="flex items-center gap-1"><MapPin size={10} />{c.localizacao}</span>}
          {c.anos_experiencia != null && <span className="flex items-center gap-1"><Clock size={10} />{c.anos_experiencia}a</span>}
          {c.score_aderencia != null && (
            <span className="ml-auto flex items-center gap-0.5 text-[11px] font-bold text-gray-400">
              <span className="text-[9px] font-medium text-gray-300">score</span>
              {Math.round(c.score_aderencia)}
            </span>
          )}
        </div>

        {/* Linha 3: skills */}
        {c.hard_skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-50">
            {c.hard_skills.slice(0, 3).map(s => (
              <span key={s} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md font-medium">
                {s}
              </span>
            ))}
            {c.hard_skills.length > 3 && (
              <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                +{c.hard_skills.length - 3}
              </span>
            )}
            <span className="ml-auto text-[10px] text-gray-300 italic self-center">{timeAgo(c.criado_em)}</span>
          </div>
        )}

        {/* Badge avaliação do cliente */}
        {c.em_shortlist && c.aprovado_cliente !== null && (
          <div className={clsx(
            'mt-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold w-fit',
            c.aprovado_cliente ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600',
          )}>
            {c.aprovado_cliente ? '✓ Cliente aprovou' : '✗ Cliente reprovou'}
          </div>
        )}
      </div>

      {/* ── Ações rápidas (hover) ─────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 px-4 py-2.5
          opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto
          transition-opacity duration-150 bg-gradient-to-t from-white via-white/98 to-transparent"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => shortlistMut.mutate()}
          title={c.em_shortlist ? 'Remover da shortlist' : 'Shortlist'}
          className={clsx('p-1.5 rounded-lg transition-colors',
            c.em_shortlist ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'
          )}
        >
          <Star size={13} fill={c.em_shortlist ? 'currentColor' : 'none'} />
        </button>
        {next && (
          <button
            onClick={() => moveMut.mutate(next.status)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
          >
            {next.label} <ChevronRight size={11} />
          </button>
        )}
        {canReject && (
          <button onClick={() => moveMut.mutate('rejeitado')} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Funnel Chart ─────────────────────────────────────────────

function FunnelChart({ stats }: { stats: Stats }) {
  const stages = [
    { key: 'novo'       as const, label: 'Novo',       color: 'bg-gray-300'    },
    { key: 'em_triagem' as const, label: 'Em triagem', color: 'bg-blue-400'    },
    { key: 'shortlist'  as const, label: 'Shortlist',  color: 'bg-purple-400'  },
    { key: 'aprovado'   as const, label: 'Aprovado',   color: 'bg-brand-500'   },
    { key: 'contratado' as const, label: 'Contratado', color: 'bg-emerald-500' },
  ]
  const values = stages.map(s => stats[s.key])
  const max    = Math.max(...values, 1)

  return (
    <div className="bg-white rounded-xl shadow-card p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Funil de pipeline</p>
      <div className="space-y-2">
        {stages.map((s, i) => {
          const val = values[i]
          const pct = (val / max) * 100
          return (
            <div key={s.key} className="flex items-center gap-3">
              <span className="text-[11px] text-gray-500 w-20 shrink-0 text-right">{s.label}</span>
              <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                <div className={clsx('h-full rounded transition-all duration-500', s.color)} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] font-bold text-gray-600 w-5 text-right shrink-0">{val}</span>
            </div>
          )
        })}
      </div>
      {stats.rejeitado > 0 && (
        <p className="text-[10px] text-gray-300 mt-3">
          {stats.rejeitado} rejeitado{stats.rejeitado !== 1 ? 's' : ''} (fora do funil)
        </p>
      )}
    </div>
  )
}

// ── Timeline Chart ────────────────────────────────────────────

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function TimelineChart({ stats }: { stats: Stats }) {
  const max = Math.max(...stats.timeline.map(t => t.total), 1)

  return (
    <div className="bg-white rounded-xl shadow-card p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Importações por mês</p>
      <div className="flex items-end gap-1.5 h-20">
        {stats.timeline.map(t => {
          const pct = (t.total / max) * 100
          const mes = MESES[parseInt(t.mes.split('-')[1]) - 1]
          return (
            <div key={t.mes} className="flex-1 min-w-0 max-w-[64px] flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-500">{t.total}</span>
              <div className="w-full bg-gray-50 rounded-sm flex flex-col justify-end" style={{ height: '48px' }}>
                <div className="w-full bg-brand-400 rounded-sm transition-all duration-500" style={{ height: `${pct}%` }} />
              </div>
              <span className="text-[10px] text-gray-400">{mes}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────

const KPI_STYLES: Record<string, { icon: string; num: string; bg: string }> = {
  brand:   { icon: 'text-brand-600',   num: 'text-brand-700',   bg: 'bg-brand-50'   },
  blue:    { icon: 'text-blue-500',    num: 'text-blue-700',    bg: 'bg-blue-50'    },
  purple:  { icon: 'text-purple-500',  num: 'text-purple-700',  bg: 'bg-purple-50'  },
  emerald: { icon: 'text-emerald-500', num: 'text-emerald-700', bg: 'bg-emerald-50' },
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const s = KPI_STYLES[color]
  return (
    <div className="bg-white rounded-xl shadow-card px-4 py-3 flex items-center gap-3">
      <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', s.bg, s.icon)}>
        {icon}
      </div>
      <div>
        <p className={clsx('text-xl font-bold leading-none', s.num)}>{value}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  )
}
