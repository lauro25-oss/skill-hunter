import { useQuery } from '@tanstack/react-query'
import { getStats } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Users, TrendingUp, Star, CheckCircle } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  'Novo':        '#d1d5db',
  'Em triagem':  '#60a5fa',
  'Shortlist':   '#a78bfa',
  'Aprovado':    '#34d399',
  'Rejeitado':   '#f87171',
  'Contratado':  '#10b981',
}

const PIE_COLORS = ['#10b981', '#f87171', '#fbbf24']

export default function DashboardPage() {
  const { data: s, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn:  getStats,
    staleTime: 30_000,
  })

  if (isLoading || !s) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Carregando dashboard…
      </div>
    )
  }

  const pipeline = [
    { name: 'Novo',       total: s.novo,       fill: STATUS_COLORS['Novo'] },
    { name: 'Em triagem', total: s.em_triagem,  fill: STATUS_COLORS['Em triagem'] },
    { name: 'Shortlist',  total: s.shortlist,   fill: STATUS_COLORS['Shortlist'] },
    { name: 'Aprovado',   total: s.aprovado,    fill: STATUS_COLORS['Aprovado'] },
    { name: 'Rejeitado',  total: s.rejeitado,   fill: STATUS_COLORS['Rejeitado'] },
    { name: 'Contratado', total: s.contratado,  fill: STATUS_COLORS['Contratado'] },
  ]

  const approvalData = [
    { name: 'Aprovados',  value: s.aprovacao.aprovado  },
    { name: 'Reprovados', value: s.aprovacao.reprovado },
    { name: 'Pendentes',  value: s.aprovacao.pendente  },
  ].filter(d => d.value > 0)

  const totalShortlist = s.aprovacao.aprovado + s.aprovacao.reprovado + s.aprovacao.pendente

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users size={18} className="text-brand-500" />}
          label="Total de candidatos" value={s.total} />
        <KpiCard icon={<TrendingUp size={18} className="text-blue-500" />}
          label="Score médio" value={s.score_avg > 0 ? `${s.score_avg}` : '—'} />
        <KpiCard icon={<Star size={18} className="text-purple-500" />}
          label="Na shortlist" value={s.shortlist} />
        <KpiCard icon={<CheckCircle size={18} className="text-emerald-500" />}
          label="Contratados" value={s.contratado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pipeline por status */}
        <div className="bg-white rounded-xl shadow-panel p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline por status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pipeline} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(v) => [v, 'Candidatos']} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {pipeline.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Aprovação do cliente */}
        <div className="bg-white rounded-xl shadow-panel p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Avaliação do cliente (shortlist)</h2>
          <p className="text-xs text-gray-400 mb-3">{totalShortlist} candidatos na shortlist</p>
          {totalShortlist === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">
              Nenhum candidato na shortlist ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={approvalData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={75} innerRadius={40}
                  paddingAngle={3}>
                  {approvalData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={10}
                  formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top vagas */}
        {s.top_vagas.length > 0 && (
          <div className="bg-white rounded-xl shadow-panel p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Candidatos por vaga</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.top_vagas} barSize={36} layout="vertical">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="vaga" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v) => [v, 'Candidatos']} />
                <Bar dataKey="total" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl shadow-panel p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}
