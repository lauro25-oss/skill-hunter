import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { type SearchQuery, type CandidateStatus, type VagaOut, getVagas, createVaga, deleteVaga, updateVaga, recalculateScores } from '../api/client'
import { Plus, Check, X, Trash2, Settings2, RefreshCw, Star, LayoutDashboard, List } from 'lucide-react'
import clsx from 'clsx'

const STATUSES: { value: CandidateStatus; label: string; dot: string }[] = [
  { value: 'novo',       label: 'Novo',       dot: 'bg-gray-300'    },
  { value: 'em_triagem', label: 'Em triagem', dot: 'bg-blue-400'    },
  { value: 'shortlist',  label: 'Shortlist',  dot: 'bg-purple-400'  },
  { value: 'aprovado',   label: 'Aprovado',   dot: 'bg-brand-500'   },
  { value: 'rejeitado',  label: 'Rejeitado',  dot: 'bg-red-400'     },
  { value: 'contratado', label: 'Contratado', dot: 'bg-emerald-500' },
]

const EXP_RANGES = [
  { label: 'Qualquer',    min: undefined, max: undefined },
  { label: 'Até 2 anos',  min: 0,         max: 2         },
  { label: '2 – 5 anos',  min: 2,         max: 5         },
  { label: '5 – 10 anos', min: 5,         max: 10        },
  { label: '10+ anos',    min: 10,        max: undefined  },
]

interface Props {
  query: SearchQuery
  onChange: (q: SearchQuery) => void
}

export default function FilterPanel({ query, onChange }: Props) {
  const qc = useQueryClient()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [showCreate,   setShowCreate]   = useState(false)
  const [newTitulo,    setNewTitulo]    = useState('')
  const [expandedId,   setExpandedId]   = useState<string | null>(null)

  const { data: vagas = [] } = useQuery({
    queryKey: ['vagas'],
    queryFn:  getVagas,
    staleTime: 30_000,
  })

  const createMut = useMutation({
    mutationFn: (titulo: string) => createVaga(titulo),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['vagas'] }); setNewTitulo(''); setShowCreate(false) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteVaga(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['vagas'] }),
  })

  const setStatus   = (s?: CandidateStatus) => onChange({ ...query, status: s, page: 1 })
  const setExpRange = (min?: number, max?: number) => onChange({ ...query, anos_experiencia_min: min, anos_experiencia_max: max, page: 1 })
  const setVaga     = (titulo?: string)      => onChange({ ...query, vaga_origem: titulo, page: 1 })

  return (
    <aside className="w-52 shrink-0 bg-white shadow-panel flex flex-col overflow-y-auto z-10">

      {/* ── Marca ─────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4">
        <p className="font-logo font-extrabold text-[20px] leading-none text-brand-600 tracking-tight uppercase">
          SKILL HUNTER<span className="text-brand-400">.</span>
        </p>
        <p className="text-[10px] text-gray-300 mt-1 tracking-wide">by skill certo.</p>
      </div>

      {/* ── Navegação ─────────────────────────────────── */}
      <div className="px-3 pb-4 flex gap-1">
        <button
          onClick={() => navigate('/')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 rounded-md transition-colors',
            location.pathname === '/' ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700',
          )}
        >
          <List size={12} /> Triagem
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 rounded-md transition-colors',
            location.pathname === '/dashboard' ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700',
          )}
        >
          <LayoutDashboard size={12} /> Dashboard
        </button>
      </div>

      <div className="flex-1 px-3 space-y-6 pb-6">

        {/* ── Status ───────────────────────────────────── */}
        <div>
          <p className="label px-2 mb-1.5">Pipeline</p>
          <NavItem active={!query.status} onClick={() => setStatus(undefined)}>
            <span className="w-2 h-2 rounded-full bg-gray-200 shrink-0" />
            Todos
          </NavItem>
          {STATUSES.map(s => (
            <NavItem key={s.value} active={query.status === s.value} onClick={() => setStatus(s.value)}>
              <span className={clsx('w-2 h-2 rounded-full shrink-0', s.dot)} />
              {s.label}
            </NavItem>
          ))}
        </div>

        {/* ── Vagas ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <p className="label">Vagas</p>
            <button
              onClick={() => setShowCreate(v => !v)}
              className="text-gray-300 hover:text-brand-600 transition-colors"
              title="Nova vaga"
            >
              <Plus size={12} />
            </button>
          </div>

          {showCreate && (
            <form
              onSubmit={e => { e.preventDefault(); if (newTitulo.trim()) createMut.mutate(newTitulo.trim()) }}
              className="mb-2 flex items-center gap-1 px-1"
            >
              <input
                autoFocus
                value={newTitulo}
                onChange={e => setNewTitulo(e.target.value)}
                placeholder="Nome da vaga…"
                className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-brand-400 bg-white"
              />
              <button type="submit" className="text-brand-600 hover:text-brand-700 p-1"><Check size={11} /></button>
              <button type="button" onClick={() => setShowCreate(false)} className="text-gray-300 hover:text-gray-500 p-1"><X size={11} /></button>
            </form>
          )}

          <NavItem active={!query.vaga_origem} onClick={() => setVaga(undefined)}>
            Todas
          </NavItem>

          {vagas.map(v => (
            <VagaItem
              key={v.id}
              vaga={v}
              active={query.vaga_origem === v.titulo}
              expanded={expandedId === v.id}
              onSelect={() => setVaga(query.vaga_origem === v.titulo ? undefined : v.titulo)}
              onToggleExpand={() => setExpandedId(prev => prev === v.id ? null : v.id)}
              onDelete={() => deleteMut.mutate(v.id)}
            />
          ))}

          {vagas.length === 0 && !showCreate && (
            <p className="text-[11px] text-gray-300 px-2 py-1">Nenhuma vaga criada</p>
          )}
        </div>

        {/* ── Shortlist / Avaliação ────────────────────── */}
        <div>
          <p className="label px-2 mb-1.5">Shortlist</p>
          <NavItem
            active={query.em_shortlist === true}
            onClick={() => onChange({ ...query, em_shortlist: query.em_shortlist === true ? undefined : true, aprovado_cliente_filter: undefined, page: 1 })}
          >
            <Star size={12} className="shrink-0" />
            Na shortlist
          </NavItem>
          {query.em_shortlist === true && (
            <div className="ml-2 mt-1 space-y-0.5">
              {(['aprovado', 'reprovado', 'pendente'] as const).map(v => (
                <NavItem
                  key={v}
                  active={query.aprovado_cliente_filter === v}
                  onClick={() => onChange({ ...query, aprovado_cliente_filter: query.aprovado_cliente_filter === v ? undefined : v, page: 1 })}
                >
                  <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0',
                    v === 'aprovado'  && 'bg-brand-500',
                    v === 'reprovado' && 'bg-red-400',
                    v === 'pendente'  && 'bg-amber-400',
                  )} />
                  {v === 'aprovado' ? 'Aprovados' : v === 'reprovado' ? 'Reprovados' : 'Pendentes'}
                </NavItem>
              ))}
            </div>
          )}
        </div>

        {/* ── Experiência ──────────────────────────────── */}
        <div>
          <p className="label px-2 mb-1.5">Experiência</p>
          {EXP_RANGES.map(r => (
            <NavItem
              key={r.label}
              active={query.anos_experiencia_min === r.min && query.anos_experiencia_max === r.max}
              onClick={() => setExpRange(r.min, r.max)}
            >
              {r.label}
            </NavItem>
          ))}
        </div>
      </div>
    </aside>
  )
}

// ── VagaItem com editor de requisitos ─────────────────────────

function VagaItem({ vaga, active, expanded, onSelect, onToggleExpand, onDelete }: {
  vaga: VagaOut
  active: boolean
  expanded: boolean
  onSelect: () => void
  onToggleExpand: () => void
  onDelete: () => void
}) {
  const qc = useQueryClient()
  const [skills,     setSkills]     = useState<string[]>(vaga.skills_obrigatorias)
  const [skillInput, setSkillInput] = useState('')
  const [minExp,     setMinExp]     = useState<string>(vaga.anos_experiencia_min?.toString() ?? '')

  const saveMut = useMutation({
    mutationFn: async () => {
      await updateVaga(vaga.id, {
        skills_obrigatorias:  skills,
        anos_experiencia_min: minExp ? parseFloat(minExp) : undefined,
      })
      return recalculateScores(vaga.id)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['vagas'] })
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['candidates-kanban'] })
      alert(`Scores atualizados: ${data.updated} candidato(s) recalculado(s).`)
    },
  })

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.map(x => x.toLowerCase()).includes(s.toLowerCase())) {
      setSkills(prev => [...prev, s])
    }
    setSkillInput('')
  }

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s))

  return (
    <div>
      {/* Linha principal */}
      <div className="group flex items-center gap-0.5">
        <button
          onClick={onSelect}
          className={clsx(
            'flex-1 flex items-center justify-between text-left text-[13px] px-2 py-1.5 rounded-md transition-colors font-medium truncate',
            active
              ? 'bg-brand-50 text-brand-700'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
          )}
        >
          <span className="truncate">{vaga.titulo}</span>
          {vaga.total_candidatos > 0 && (
            <span className="text-[10px] font-normal text-gray-400 ml-1 shrink-0">{vaga.total_candidatos}</span>
          )}
        </button>
        <button
          onClick={onToggleExpand}
          title="Requisitos da vaga"
          className={clsx(
            'opacity-0 group-hover:opacity-100 p-1 transition-all shrink-0',
            expanded ? 'opacity-100 text-brand-500' : 'text-gray-300 hover:text-brand-500',
          )}
        >
          <Settings2 size={10} />
        </button>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all shrink-0"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {/* Editor de requisitos */}
      {expanded && (
        <div className="mx-2 mb-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 space-y-2.5">

          {/* Skills obrigatórias */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Skills obrigatórias</p>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {skills.map(s => (
                <span key={s} className="flex items-center gap-0.5 text-[10px] bg-brand-50 text-brand-700 border border-brand-100 px-1.5 py-0.5 rounded-md font-medium">
                  {s}
                  <button onClick={() => removeSkill(s)} className="text-brand-400 hover:text-brand-700 ml-0.5"><X size={8} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                placeholder="Ex: React"
                className="flex-1 text-[11px] border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-brand-400 bg-white min-w-0"
              />
              <button onClick={addSkill} className="p-1 text-brand-500 hover:text-brand-700"><Plus size={11} /></button>
            </div>
          </div>

          {/* Experiência mínima */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Mín. experiência</p>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                step="0.5"
                value={minExp}
                onChange={e => setMinExp(e.target.value)}
                placeholder="0"
                className="w-16 text-[11px] border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-brand-400 bg-white text-center"
              />
              <span className="text-[11px] text-gray-400">anos</span>
            </div>
          </div>

          {/* Botão salvar */}
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors disabled:opacity-60"
          >
            <RefreshCw size={10} className={saveMut.isPending ? 'animate-spin' : ''} />
            {saveMut.isPending ? 'Recalculando…' : 'Salvar e recalcular'}
          </button>
        </div>
      )}
    </div>
  )
}

function NavItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-2 text-left text-[13px] px-2 py-1.5 rounded-md transition-all duration-100 font-medium',
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
      )}
    >
      {children}
    </button>
  )
}
