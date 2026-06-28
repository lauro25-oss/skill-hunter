import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/client'

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(username)
      setSent(true)
    } catch {
      setError('Erro ao processar solicitação. Tente novamente.')
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

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-800">E-mail enviado</h2>
            <p className="text-sm text-gray-500">
              Se o usuário existir, um link de redefinição foi enviado para o e-mail cadastrado.
              O link expira em 2 horas.
            </p>
            <Link to="/login" className="block text-sm text-brand-600 hover:underline mt-4">
              ← Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Esqueci minha senha</h2>
            <p className="text-xs text-gray-400 mb-6">
              Informe seu usuário e enviaremos um link para redefinir sua senha.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Usuário</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input w-full"
                  placeholder="admin"
                  required
                  autoFocus
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
                {loading ? 'Enviando…' : 'Enviar link de redefinição'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              <Link to="/login" className="hover:text-gray-600 underline">← Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
