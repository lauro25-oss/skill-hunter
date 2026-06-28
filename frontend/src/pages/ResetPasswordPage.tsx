import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { resetPassword } from '../api/client'

export default function ResetPasswordPage() {
  const [searchParams]        = useSearchParams()
  const token                  = searchParams.get('token') || ''
  const nav                    = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-panel p-10 w-full max-w-sm text-center space-y-4">
          <p className="text-red-500 font-semibold">Link inválido ou expirado.</p>
          <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => nav('/login', { replace: true }), 2500)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Token inválido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-panel p-10 w-full max-w-sm">
        <p className="font-logo font-extrabold text-[26px] text-brand-600 tracking-tight uppercase leading-none">
          SKILL HUNTER<span className="text-brand-400">.</span>
        </p>
        <p className="text-[10px] text-gray-300 mt-1 mb-8 tracking-wide">by skill certo.</p>

        {success ? (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-800">Senha atualizada!</p>
            <p className="text-sm text-gray-500">Redirecionando para o login…</p>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Nova senha</h2>
            <p className="text-xs text-gray-400 mb-6">Escolha uma nova senha para sua conta.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Nova senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input w-full"
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Confirmar senha</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="input w-full"
                  placeholder="Repita a nova senha"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-60"
              >
                {loading ? 'Salvando…' : 'Definir nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
