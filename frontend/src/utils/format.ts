export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)          return 'agora mesmo'
  if (diff < 3600)        return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400)       return `há ${Math.floor(diff / 3600)}h`
  const days = Math.floor(diff / 86400)
  if (days < 7)           return `há ${days} dia${days > 1 ? 's' : ''}`
  const weeks = Math.floor(days / 7)
  if (weeks < 5)          return `há ${weeks} semana${weeks > 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  return `há ${months} ${months > 1 ? 'meses' : 'mês'}`
}

const AVATAR_COLORS = [
  'bg-blue-500',   'bg-purple-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-teal-500',   'bg-orange-500',
  'bg-rose-500',   'bg-cyan-600',   'bg-violet-500',
  'bg-amber-600',
]

export function getAvatarBg(name: string): string {
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}
