import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPortalPublic, voteCandidate, type CandidatePortalOut } from '../api/client'
import { getAvatarBg, getInitials } from '../utils/format'
import { MapPin, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export default function ShortlistPage() {
  const { token } = useParams<{ token: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['portal', token],
    queryFn:  () => getPortalPublic(token!),
    enabled:  !!token,
    retry: 1,
  })

  if (isLoading) return <LoadingState />
  if (isError || !data) return <ErrorState />

  const { portal, candidates } = data
  const aprovados  = candidates.filter(c => c.aprovado_cliente === true).length
  const reprovados = candidates.filter(c => c.aprovado_cliente === false).length
  const pendentes  = candidates.filter(c => c.aprovado_cliente === null).length

  return (
    <div className="min-h-screen bg-canvas">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-logo font-extrabold text-[18px] leading-none text-brand-600 tracking-tight">
              SKILL HUNTER<span className="text-brand-400">.</span>
            </p>
            <p className="text-[10px] text-gray-300 mt-0.5 tracking-wide">by skill certo.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">{portal.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">Shortlist de candidatos</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Resumo */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Candidatos selecionados</h1>
          <p className="text-sm text-gray-400 mt-1">
            Avalie cada candidato e indique sua aprovação. Sua resposta é registrada em tempo real.
          </p>

          <div className="flex gap-4 mt-4">
            <Pill count={candidates.length} label="Total"    color="gray"    />
            <Pill count={pendentes}         label="Pendente" color="yellow"  />
            <Pill count={aprovados}         label="Aprovado" color="green"   />
            <Pill count={reprovados}        label="Reprovado" color="red"    />
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
            <AlertCircle size={36} className="text-gray-200" />
            <p className="text-sm">Nenhum candidato na shortlist ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {candidates.map(c => (
              <CandidatePortalCard key={c.id} candidate={c} token={token!} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16 py-6 text-center">
        <p className="text-xs text-gray-300">
          Powered by <span className="font-semibold text-brand-500">SKILL HUNTER</span> · skill certo.
        </p>
      </footer>
    </div>
  )
}

// ── Card do candidato no portal ───────────────────────────────

function CandidatePortalCard({ candidate: c, token }: { candidate: CandidatePortalOut; token: string }) {
  const qc = useQueryClient()
  const [voted, setVoted] = useState<boolean | null>(c.aprovado_cliente)

  const voteMut = useMutation({
    mutationFn: (aprovado: boolean) => voteCandidate(token, c.id, aprovado),
    onSuccess: (updated) => {
      setVoted(updated.aprovado_cliente)
      qc.invalidateQueries({ queryKey: ['portal', token] })
    },
  })

  const status = voted === true ? 'aprovado' : voted === false ? 'reprovado' : 'pendente'

  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-card overflow-hidden transition-all duration-200',
      voted === true  && 'ring-2 ring-brand-400',
      voted === false && 'ring-2 ring-red-300 opacity-70',
    )}>
      {/* Faixa de status */}
      <div className={clsx('h-[3px]', {
        'bg-gray-200':   status === 'pendente',
        'bg-brand-500':  status === 'aprovado',
        'bg-red-400':    status === 'reprovado',
      })} />

      <div className="p-5">
        {/* Cabeçalho */}
        <div className="flex items-start gap-3 mb-4">
          <div className={clsx('w-12 h-12 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0', getAvatarBg(c.nome))}>
            {getInitials(c.nome)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base leading-tight truncate">{c.nome}</p>
            <p className="text-sm text-brand-600 font-medium mt-0.5 truncate">{c.cargo_atual || '—'}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              {c.localizacao      && <span className="flex items-center gap-1"><MapPin size={10} />{c.localizacao}</span>}
              {c.anos_experiencia != null && <span className="flex items-center gap-1"><Clock size={10} />{c.anos_experiencia}a exp.</span>}
              {c.score_aderencia  != null && <span className="ml-auto text-[11px] font-bold text-gray-400">score {Math.round(c.score_aderencia)}</span>}
            </div>
          </div>
        </div>

        {/* Resumo IA */}
        {c.resumo_ia && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 border border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Resumo</p>
            <p className="text-sm text-gray-600 leading-relaxed">{c.resumo_ia}</p>
          </div>
        )}

        {/* Skills */}
        {c.hard_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {c.hard_skills.slice(0, 6).map(s => (
              <span key={s} className="text-[10px] bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium uppercase tracking-wide">
                {s}
              </span>
            ))}
            {c.hard_skills.length > 6 && (
              <span className="text-[10px] text-gray-400 px-2 py-0.5">+{c.hard_skills.length - 6}</span>
            )}
          </div>
        )}

        {/* Ações */}
        {voted === null ? (
          <div className="flex gap-2">
            <button
              onClick={() => voteMut.mutate(true)}
              disabled={voteMut.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-50 text-brand-700 font-semibold text-sm hover:bg-brand-100 transition-colors disabled:opacity-50"
            >
              {voteMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Aprovar
            </button>
            <button
              onClick={() => voteMut.mutate(false)}
              disabled={voteMut.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle size={15} />
              Reprovar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className={clsx(
              'flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold',
              voted ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600',
            )}>
              {voted ? <CheckCircle size={15} /> : <XCircle size={15} />}
              {voted ? 'Aprovado' : 'Reprovado'}
            </div>
            <button
              onClick={() => { setVoted(null); voteMut.reset() }}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              Alterar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Utilitários ───────────────────────────────────────────────

function Pill({ count, label, color }: { count: number; label: string; color: string }) {
  const styles: Record<string, string> = {
    gray:   'bg-gray-100 text-gray-600',
    yellow: 'bg-yellow-50 text-yellow-700',
    green:  'bg-brand-50 text-brand-700',
    red:    'bg-red-50 text-red-600',
  }
  return (
    <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium', styles[color])}>
      <span className="font-bold text-base leading-none">{count}</span>
      <span className="text-xs">{label}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-400">
      <Loader2 size={32} className="animate-spin text-brand-500" />
      <p className="text-sm">Carregando shortlist…</p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-400">
      <AlertCircle size={36} className="text-red-300" />
      <p className="text-base font-semibold text-gray-600">Link inválido ou expirado</p>
      <p className="text-sm">Este portal não existe ou foi desativado.</p>
    </div>
  )
}
