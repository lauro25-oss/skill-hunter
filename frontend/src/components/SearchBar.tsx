import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
      <input
        type="text"
        className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-700
          placeholder:text-gray-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10
          transition-all duration-150 shadow-sm"
        placeholder="Buscar por nome, cargo, skill, localização…"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
