import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchCandidates, uploadCurriculos, getStats, getVagas, logout, exportExcel, type SearchQuery, type OrderBy, type UploadResult } from '../api/client'
import FilterPanel from '../components/FilterPanel'
import CandidateGrid from '../components/CandidateGrid'
import KanbanView from '../components/KanbanView'
import CandidateDrawer from '../components/CandidateDrawer'
import SearchBar from '../components/SearchBar'
import { useToast } from '../components/Toast'
import { Upload, LayoutGrid, Columns2, Download, FileSpreadsheet, LogOut } from 'lucide-react'
import PortalManager from '../components/PortalManager'
import clsx from 'clsx'

type ViewMode = 'cards' | 'kanban'

const SORT_OPTIONS: { value: OrderBy; label: string }[] = [
  { value: 'criado_em',       label: 'Mais recentes'  },
  { value: 'score',           label: 'Maior score'    },
  { value: 'nome',            label: 'Nome A-Z'       },
  { value: 'anos_experiencia', label: 'Mais experiente' },
]

export default function TriagemPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const [query,      setQuery]      = useState<SearchQuery>({ q: '', page: 1, per_page: 20, order_by: 'criado_em' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [exporting,     setExporting]     = useState(false)
  const [exportingXlsx, setExportingXlsx] = useState(false)
  const [view,       setView]       = useState<ViewMode>('cards')
  const [uploadVaga, setUploadVaga] = useState<string>('')

  // Cards paginado
  const { data } = useQuery({
    queryKey: ['candidates', query],
    queryFn:  () => searchCandidates(query),
    enabled:  view === 'cards',
  })

  // Kanban (tudo de uma vez)
  const { data: kanbanData } = useQuery({
    queryKey: ['candidates-kanban', query.q, query.vaga_origem, query.em_shortlist],
    queryFn:  () => searchCandidates({ q: query.q, vaga_origem: query.vaga_origem, em_shortlist: query.em_shortlist, page: 1, per_page: 500 }),
    enabled:  view === 'kanban',
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn:  getStats,
    staleTime: 10_000,
  })

  const { data: vagas = [] } = useQuery({
    queryKey: ['vagas'],
    queryFn:  getVagas,
    staleTime: 30_000,
  })

  const uploadMut = useMutation({
    mutationFn: (files: File[]) => uploadCurriculos(files, uploadVaga || undefined),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['candidates-kanban'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['vagas'] })
      if (result.criados.length > 0) {
        toast(`${result.criados.length} CV(s) importado(s) com sucesso`)
      }
      if (result.erros.length > 0) {
        result.erros.forEach((e: { arquivo: string; erro: string }) => toast(`Erro em "${e.arquivo}": ${e.erro}`, 'error'))
      }
      if (result.criados.length === 0 && result.erros.length === 0) {
        toast('Nenhum arquivo processado', 'error')
      }
    },
    onError: () => toast('Erro ao importar CVs', 'error'),
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    await uploadMut.mutateAsync(files)
    setUploading(false)
    e.target.value = ''
  }

  const handleExportXlsx = async () => {
    setExportingXlsx(true)
    try {
      await exportExcel()
      toast('Excel exportado com sucesso')
    } catch {
      toast('Erro ao exportar Excel', 'error')
    } finally {
      setExportingXlsx(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const all = await searchCandidates({ ...query, page: 1, per_page: 5000 })
      const headers = ['Nome', 'Cargo atual', 'Status', 'Localização', 'Exp. (anos)', 'Score', 'Skills', 'Na shortlist', 'Avaliação cliente', 'Adicionado']
      const rows = all.results.map(c => [
        c.nome,
        c.cargo_atual ?? '',
        c.status,
        c.localizacao ?? '',
        c.anos_experiencia ?? '',
        c.score_aderencia != null ? Math.round(c.score_aderencia) : '',
        c.hard_skills.join('; '),
        c.em_shortlist ? 'Sim' : 'Não',
        c.aprovado_cliente === true ? 'Aprovado' : c.aprovado_cliente === false ? 'Reprovado' : 'Pendente',
        new Date(c.criado_em).toLocaleDateString('pt-BR'),
      ])
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `candidatos_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast(`${all.results.length} candidato(s) exportado(s)`)
    } catch {
      toast('Erro ao exportar', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      <FilterPanel query={query} onChange={setQuery} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center gap-3 shadow-sm">
          <div className="flex-1">
            <SearchBar
              value={query.q || ''}
              onChange={q => setQuery(prev => ({ ...prev, q, page: 1 }))}
            />
          </div>

          {/* Sort */}
          <select
            value={query.order_by || 'criado_em'}
            onChange={e => setQuery(prev => ({ ...prev, order_by: e.target.value as OrderBy, page: 1 }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:border-brand-400 hidden sm:block"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Toggle view */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setView('cards')}
              className={clsx('p-1.5 rounded-md transition-colors', view === 'cards' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600')}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={clsx('p-1.5 rounded-md transition-colors', view === 'kanban' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600')}
            >
              <Columns2 size={16} />
            </button>
          </div>

          {/* Seletor de vaga para upload */}
          {vagas.filter(v => v.status === 'aberta').length > 0 && (
            <select
              value={uploadVaga}
              onChange={e => setUploadVaga(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:border-brand-400 max-w-[160px]"
            >
              <option value="">Sem vaga</option>
              {vagas.filter(v => v.status === 'aberta').map(v => (
                <option key={v.id} value={v.titulo}>{v.titulo}</option>
              ))}
            </select>
          )}

          <PortalManager />

          {/* Exportar CSV */}
          <button
            onClick={handleExport}
            disabled={exporting}
            title="Exportar CSV"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            <span className="hidden sm:inline">{exporting ? 'Exportando…' : 'CSV'}</span>
          </button>

          {/* Exportar Excel */}
          <button
            onClick={handleExportXlsx}
            disabled={exportingXlsx}
            title="Exportar Excel formatado"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet size={14} />
            <span className="hidden sm:inline">{exportingXlsx ? 'Exportando…' : 'Excel'}</span>
          </button>

          <div className="w-px h-6 bg-gray-100" />

          {/* Importar CVs */}
          <label className={clsx(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer select-none',
            'bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all',
            uploading && 'opacity-60 pointer-events-none',
          )}>
            <Upload size={15} />
            {uploading ? 'Processando…' : 'Importar CVs'}
            <input type="file" multiple accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
          </label>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sair"
            className="p-2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {view === 'cards' ? (
            <CandidateGrid
              candidates={data?.results || []}
              total={data?.total || 0}
              page={query.page || 1}
              perPage={query.per_page || 20}
              onPageChange={page => setQuery(prev => ({ ...prev, page }))}
              onSelect={setSelectedId}
              selectedId={selectedId}
              stats={stats}
            />
          ) : (
            <KanbanView
              candidates={kanbanData?.results || []}
              onSelect={setSelectedId}
            />
          )}
        </main>
      </div>

      {selectedId && (
        <CandidateDrawer
          candidateId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
