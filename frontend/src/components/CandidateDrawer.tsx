import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getCandidate, updateCandidate, reparse, deleteCandidate, getComments, addComment, deleteComment, type CandidateStatus, type CommentOut } from '../api/client'
import { useToast } from './Toast'
import { X, FileText, ExternalLink, Save, RefreshCw, CheckCircle, XCircle, Clock, Plus, Trash2, MessageSquare } from 'lucide-react'
import clsx from 'clsx'

const STATUSES: { value: CandidateStatus; label: string; color: string }[] = [
  { value: 'novo',       label: 'Novo',        color: 'bg-gray-100 text-gray-600' },
  { value: 'em_triagem', label: 'Em triagem',  color: 'bg-blue-100 text-blue-700' },
  { value: 'shortlist',  label: 'Shortlist',   color: 'bg-purple-100 text-purple-700' },
  { value: 'aprovado',   label: 'Aprovado',    color: 'bg-green-100 text-green-700' },
  { value: 'rejeitado',  label: 'Rejeitado',   color: 'bg-red-100 text-red-700' },
  { value: 'contratado', label: 'Contratado',  color: 'bg-emerald-100 text-emerald-700' },
]

interface Props {
  candidateId: string
  onClose: () => void
}

export default function CandidateDrawer({ candidateId, onClose }: Props) {
  const qc = useQueryClient()
  const { toast } = useToast()

  const [notes, setNotes]         = useState('')
  const [savingNotes, setSaving]  = useState(false)
  const [cvUrl, setCvUrl]         = useState<string | null>(null)
  const [loadingCv, setLoadingCv] = useState(false)

  const { data: c, isLoading, isError, refetch } = useQuery({
    queryKey:  ['candidate', candidateId],
    queryFn:   () => getCandidate(candidateId),
    staleTime: 60_000,
    retry:     0,
  })

  useEffect(() => {
    if (c) setNotes(c.notas ?? '')
  }, [c?.id])

  const statusMut = useMutation({
    mutationFn: (s: CandidateStatus) => updateCandidate(candidateId, { status: s }),
    onSuccess:  (updated) => {
      qc.invalidateQueries({ queryKey: ['candidate', candidateId] })
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['candidates-kanban'] })
      toast(`Status atualizado para ${updated.status.replace('_', ' ')}`)
    },
  })

  const reparseMut = useMutation({
    mutationFn: () => reparse(candidateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', candidateId] })
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['candidates-kanban'] })
      toast('CV reprocessado com sucesso')
    },
    onError: () => toast('Erro ao reprocessar CV', 'error'),
  })

  const [confirmDelete, setConfirmDelete] = useState(false)

  const deleteMut = useMutation({
    mutationFn: () => deleteCandidate(candidateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['candidates-kanban'] })
      toast('Candidato excluído', 'info')
      onClose()
    },
    onError: () => toast('Erro ao excluir candidato', 'error'),
  })

  const saveNotes = async () => {
    setSaving(true)
    try {
      await updateCandidate(candidateId, { notas: notes })
      qc.invalidateQueries({ queryKey: ['candidate', candidateId] })
      toast('Notas salvas')
    } catch {
      toast('Erro ao salvar notas', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openCv = async () => {
    if (cvUrl) { window.open(cvUrl, '_blank'); return }
    setLoadingCv(true)
    // Abre janela antes do await para não ser bloqueada pelo mobile
    const win = window.open('', '_blank')
    try {
      const res = await api.get(`/candidates/${candidateId}/cv-url`, {
        responseType: 'blob',
        timeout: 60000,
      })
      const contentType = (res.headers['content-type'] as string) || 'application/pdf'
      const url = URL.createObjectURL(new Blob([res.data], { type: contentType }))
      setCvUrl(url)
      if (win) win.location.href = url
      else window.open(url, '_blank')
    } catch {
      win?.close()
      toast('Não foi possível carregar o CV', 'error')
    } finally {
      setLoadingCv(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} aria-hidden />

      <aside className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
          {c?.score_aderencia != null && (
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {Math.round(c.score_aderencia)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {isLoading ? 'Carregando…' : (c?.nome ?? '—')}
            </h2>
            {c?.cargo_atual && <p className="text-xs text-gray-400 truncate">{c.cargo_atual}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        {isError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm font-medium text-red-500">Não foi possível carregar o candidato</p>
            <p className="text-xs text-gray-400">Verifique sua conexão e tente novamente.</p>
            <button
              onClick={() => refetch()}
              className="btn-secondary text-xs mt-1"
            >
              Tentar novamente
            </button>
          </div>
        ) : isLoading || !c ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 text-sm">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
            Carregando candidato…
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Status */}
            <section>
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {STATUSES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => statusMut.mutate(s.value)}
                    disabled={statusMut.isPending}
                    className={clsx(
                      'btn text-xs py-1 rounded-md transition-all',
                      c.status === s.value
                        ? 'bg-brand-600 text-white shadow-sm'
                        : `${s.color} hover:opacity-80`,
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Avaliação do Cliente */}
            {c.em_shortlist && (
              <section>
                <Label>Avaliação do Cliente</Label>
                {c.aprovado_cliente === true && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2.5 bg-brand-50 rounded-lg border border-brand-100">
                    <CheckCircle size={15} className="text-brand-600 shrink-0" />
                    <span className="text-sm font-semibold text-brand-700">Cliente aprovou este candidato</span>
                  </div>
                )}
                {c.aprovado_cliente === false && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2.5 bg-red-50 rounded-lg border border-red-100">
                    <XCircle size={15} className="text-red-500 shrink-0" />
                    <span className="text-sm font-semibold text-red-600">Cliente reprovou este candidato</span>
                  </div>
                )}
                {c.aprovado_cliente === null && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-100">
                    <Clock size={15} className="text-amber-500 shrink-0" />
                    <span className="text-sm font-medium text-amber-700">Aguardando avaliação do cliente</span>
                  </div>
                )}
              </section>
            )}

            {/* Dados básicos */}
            <section className="grid grid-cols-2 gap-3">
              <Info label="E-mail"      value={c.email} />
              <Info label="Telefone"    value={c.telefone} />
              <Info label="Localização" value={c.localizacao} />
              <Info label="Exp. total"  value={c.anos_experiencia != null ? `${c.anos_experiencia} anos` : null} />
              <Info label="Vaga origem" value={c.vaga_origem} />
              <Info label="Adicionado"  value={new Date(c.criado_em).toLocaleDateString('pt-BR')} />
            </section>

            {/* Experiência por área */}
            {c.experiencias && c.experiencias.length > 0 && (
              <section>
                <Label>Experiência por área</Label>
                <div className="mt-2 space-y-2">
                  {c.experiencias.map((e, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{e.cargo}</p>
                        <p className="text-xs text-gray-400">{e.area}</p>
                      </div>
                      <span className="text-sm font-semibold text-brand-600 shrink-0 ml-4">
                        {e.anos} {e.anos === 1 ? 'ano' : 'anos'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hard Skills — editável */}
            <ChipEditor
              label="Hard Skills"
              values={c.hard_skills}
              chipClass="bg-brand-50 text-brand-700 border-brand-100"
              onSave={async (skills) => {
                await updateCandidate(candidateId, { hard_skills: skills })
                qc.invalidateQueries({ queryKey: ['candidate', candidateId] })
                qc.invalidateQueries({ queryKey: ['candidates'] })
                toast('Hard skills salvas')
              }}
            />

            {/* Tags — editável */}
            <ChipEditor
              label="Tags internas"
              values={c.tags}
              chipClass="bg-amber-50 text-amber-700 border-amber-100"
              onSave={async (tags) => {
                await updateCandidate(candidateId, { tags })
                qc.invalidateQueries({ queryKey: ['candidate', candidateId] })
                toast('Tags salvas')
              }}
            />

            {/* Resumo da IA */}
            {c.resumo_ia && (
              <section>
                <Label>Resumo gerado pela IA</Label>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 mt-2 border border-gray-100">
                  {c.resumo_ia}
                </p>
              </section>
            )}

            {/* Currículo original */}
            <section>
              <Label>Currículo original</Label>
              <div className="mt-2">
                {c.gcs_url ? (
                  <button onClick={openCv} disabled={loadingCv} className="btn-secondary text-sm">
                    {loadingCv ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
                    {loadingCv ? 'Gerando link…' : (c.nome_arquivo || 'Abrir CV')}
                    <ExternalLink size={12} />
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">Nenhum arquivo armazenado.</span>
                )}
              </div>
            </section>

            {/* Reprocessar extração */}
            <section>
              <Label>Reprocessar extração</Label>
              <button
                onClick={() => reparseMut.mutate()}
                disabled={reparseMut.isPending}
                className="btn-secondary mt-2 text-xs"
              >
                <RefreshCw size={13} className={reparseMut.isPending ? 'animate-spin' : ''} />
                {reparseMut.isPending ? 'Reprocessando…' : 'Re-parsear com IA'}
              </button>
            </section>

            {/* Comentários */}
            <section>
              <Label>
                <span className="flex items-center gap-1.5">
                  <MessageSquare size={11} />
                  Comentários
                </span>
              </Label>
              <CommentsSection candidateId={candidateId} />
            </section>

            {/* Notas internas */}
            <section>
              <Label>Notas internas</Label>
              <textarea
                className="input resize-none h-28 text-sm mt-2"
                placeholder="Observações sobre este candidato, feedback de entrevistas…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <button onClick={saveNotes} disabled={savingNotes} className="btn-primary mt-2 text-xs">
                <Save size={13} />
                {savingNotes ? 'Salvando…' : 'Salvar notas'}
              </button>
            </section>

            {/* Empresa contratada */}
            {c.empresa_contratada && (
              <section>
                <Label>Empresa contratada</Label>
                <p className="text-sm text-gray-700 mt-1">{c.empresa_contratada}</p>
                {c.data_contratacao && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(c.data_contratacao).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </section>
            )}

          </div>
        )}

        {/* Footer — excluir candidato */}
        {c && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-100">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-red-600 flex-1">Confirmar exclusão de <strong>{c.nome}</strong>?</p>
                <button
                  onClick={() => deleteMut.mutate()}
                  disabled={deleteMut.isPending}
                  className="btn bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5"
                >
                  {deleteMut.isPending ? 'Excluindo…' : 'Confirmar'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={13} />
                Excluir candidato
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  )
}

// ── Chip editor reutilizável ──────────────────────────────────

function ChipEditor({ label, values, chipClass, onSave }: {
  label: string
  values: string[]
  chipClass: string
  onSave: (values: string[]) => Promise<void>
}) {
  const [chips,   setChips]   = useState(values)
  const [input,   setInput]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [dirty,   setDirty]   = useState(false)

  useEffect(() => { setChips(values); setDirty(false) }, [values.join(',')])

  const add = () => {
    const s = input.trim()
    if (s && !chips.map(x => x.toLowerCase()).includes(s.toLowerCase())) {
      setChips(prev => [...prev, s])
      setDirty(true)
    }
    setInput('')
  }

  const remove = (s: string) => { setChips(prev => prev.filter(x => x !== s)); setDirty(true) }

  const save = async () => {
    setSaving(true)
    await onSave(chips)
    setSaving(false)
    setDirty(false)
  }

  return (
    <section>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {chips.map(s => (
          <span key={s} className={clsx('flex items-center gap-1 badge border', chipClass)}>
            {s}
            <button onClick={() => remove(s)} className="opacity-50 hover:opacity-100 transition-opacity">
              <X size={9} />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            placeholder="Adicionar…"
            className="text-xs border border-dashed border-gray-200 rounded-md px-2 py-0.5 focus:outline-none focus:border-brand-300 w-24 bg-transparent"
          />
          <button onClick={add} className="text-gray-300 hover:text-brand-500 transition-colors">
            <Plus size={11} />
          </button>
        </div>
      </div>
      {dirty && (
        <button onClick={save} disabled={saving} className="btn-primary mt-2 text-xs">
          <Save size={12} />
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      )}
    </section>
  )
}

// ── Comments Section ──────────────────────────────────────────

function CommentsSection({ candidateId }: { candidateId: string }) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)

  const { data: comments = [] } = useQuery<CommentOut[]>({
    queryKey:  ['comments', candidateId],
    queryFn:   () => getComments(candidateId),
    staleTime: 30_000,
  })

  const handleAdd = async () => {
    const txt = input.trim()
    if (!txt) return
    setPosting(true)
    try {
      await addComment(candidateId, txt)
      qc.invalidateQueries({ queryKey: ['comments', candidateId] })
      setInput('')
    } catch {
      toast('Erro ao adicionar comentário', 'error')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(candidateId, commentId)
      qc.invalidateQueries({ queryKey: ['comments', candidateId] })
    } catch {
      toast('Erro ao excluir comentário', 'error')
    }
  }

  return (
    <div className="mt-2 space-y-2">
      {comments.length === 0 && (
        <p className="text-xs text-gray-400 italic">Nenhum comentário ainda.</p>
      )}
      {comments.map(c => (
        <div key={c.id} className="group bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{c.texto}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {new Date(c.criado_em).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <button
            onClick={() => handleDelete(c.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0 mt-0.5"
            title="Excluir comentário"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
          placeholder="Adicionar comentário… (Enter para enviar)"
          className="input text-sm flex-1 py-1.5"
        />
        <button
          onClick={handleAdd}
          disabled={posting || !input.trim()}
          className="btn-primary text-xs px-3 py-1.5 shrink-0 disabled:opacity-40"
        >
          {posting ? '…' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{children}</p>
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">{value || '—'}</p>
    </div>
  )
}
