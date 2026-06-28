import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor: injeta token nas requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor: redireciona para /login se 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Tipos espelhando os schemas do backend ──────────────────

export type CandidateStatus =
  | 'novo' | 'em_triagem' | 'shortlist'
  | 'aprovado' | 'rejeitado' | 'contratado'

export interface CandidateListItem {
  id: string
  nome: string
  cargo_atual: string | null
  localizacao: string | null
  anos_experiencia: number | null
  hard_skills: string[]
  status: CandidateStatus
  score_aderencia: number | null
  em_shortlist: boolean
  aprovado_cliente: boolean | null
  criado_em: string
}

export interface ExperienciaItem {
  cargo: string
  area: string
  anos: number
}

export interface CandidateOut extends CandidateListItem {
  email: string | null
  telefone: string | null
  resumo_ia: string | null
  notas: string | null
  tags: string[]
  experiencias: ExperienciaItem[]
  gcs_url: string | null
  nome_arquivo: string | null
  vaga_origem: string | null
  empresa_contratada: string | null
  data_contratacao: string | null
  aprovado_cliente: boolean | null
  atualizado_em: string
}

export type OrderBy = 'criado_em' | 'score' | 'nome' | 'anos_experiencia'

export interface SearchQuery {
  q?: string
  status?: CandidateStatus
  localizacao?: string
  anos_experiencia_min?: number
  anos_experiencia_max?: number
  hard_skills?: string[]
  tags?: string[]
  vaga_origem?: string
  em_shortlist?: boolean
  aprovado_cliente_filter?: 'aprovado' | 'reprovado' | 'pendente'
  order_by?: OrderBy
  page?: number
  per_page?: number
}

export interface SearchResult {
  total: number
  page: number
  per_page: number
  results: CandidateListItem[]
}

// ── Endpoints ───────────────────────────────────────────────

export const searchCandidates = (query: SearchQuery) =>
  api.post<SearchResult>('/search', query).then(r => r.data)

export const getCandidate = (id: string) =>
  api.get<CandidateOut>(`/candidates/${id}`).then(r => r.data)

export const updateCandidate = (id: string, data: Partial<CandidateOut>) =>
  api.patch<CandidateOut>(`/candidates/${id}`, data).then(r => r.data)

export const uploadCurriculos = (files: File[], vagaOrigem?: string) => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  if (vagaOrigem) form.append('vaga_origem', vagaOrigem)
  return api.post<CandidateOut[]>('/candidates/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export const deleteCandidate = (id: string) =>
  api.delete(`/candidates/${id}`)

export const reparse = (id: string) =>
  api.post<CandidateOut>(`/candidates/${id}/reparse`).then(r => r.data)

export const anonimizarCandidato = (id: string) =>
  api.post(`/candidates/${id}/anonimizar`).then(r => r.data)

export const exportExcel = async () => {
  const res = await api.get('/candidates/export/excel', { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }))
  const a = document.createElement('a')
  a.href = url
  a.download = `candidatos_skill_hunter_${new Date().toISOString().split('T')[0]}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export interface Stats {
  total: number
  novo: number
  em_triagem: number
  shortlist: number
  aprovado: number
  rejeitado: number
  contratado: number
  score_avg: number
  top_vagas: { vaga: string; total: number }[]
  aprovacao: { aprovado: number; reprovado: number; pendente: number }
}

export const getStats = () =>
  api.get<Stats>('/candidates/stats').then(r => r.data)

// ── Auth ─────────────────────────────────────────────────────

export const login = (username: string, password: string) =>
  api.post<{ token: string }>('/auth/login', { username, password }).then(r => r.data)

export const logout = () => {
  localStorage.removeItem('auth_token')
  window.location.href = '/login'
}

// ── Portal do Cliente ─────────────────────────────────────────

export interface PortalOut {
  id: string
  token: string
  label: string
  vaga_origem: string | null
  ativo: boolean
  criado_em: string
}

export interface CandidatePortalOut {
  id: string
  nome: string
  cargo_atual: string | null
  localizacao: string | null
  anos_experiencia: number | null
  hard_skills: string[]
  experiencias: ExperienciaItem[]
  resumo_ia: string | null
  score_aderencia: number | null
  aprovado_cliente: boolean | null
}

export interface PortalPublicData {
  portal: PortalOut
  candidates: CandidatePortalOut[]
}

export const getPortals    = ()                                => api.get<PortalOut[]>('/portals').then(r => r.data)
export const createPortal  = (label: string, vaga_origem?: string) => api.post<PortalOut>('/portals', { label, vaga_origem }).then(r => r.data)
export const deletePortal  = (id: string)                     => api.delete(`/portals/${id}`)
export const getPortalPublic = (token: string)                => api.get<PortalPublicData>(`/portal/${token}`).then(r => r.data)
export const voteCandidate = (token: string, candidateId: string, aprovado: boolean) =>
  api.patch<CandidatePortalOut>(`/portal/${token}/candidates/${candidateId}/vote`, { aprovado }).then(r => r.data)

// ── Vagas ────────────────────────────────────────────────────

export type VagaStatus = 'aberta' | 'fechada' | 'arquivada'

export interface VagaOut {
  id: string
  titulo: string
  descricao: string | null
  status: VagaStatus
  skills_obrigatorias: string[]
  anos_experiencia_min: number | null
  criado_em: string
  total_candidatos: number
}

export const getVagas          = ()                              => api.get<VagaOut[]>('/vagas').then(r => r.data)
export const createVaga        = (titulo: string)                => api.post<VagaOut>('/vagas', { titulo }).then(r => r.data)
export const updateVaga        = (id: string, data: Partial<VagaOut>) => api.patch<VagaOut>(`/vagas/${id}`, data).then(r => r.data)
export const deleteVaga        = (id: string)                    => api.delete(`/vagas/${id}`)
export const recalculateScores = (id: string)                    => api.post<{ updated: number }>(`/vagas/${id}/recalculate`).then(r => r.data)
