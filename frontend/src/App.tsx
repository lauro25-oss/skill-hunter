import { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import TriagemPage    from './pages/TriagemPage'
import ShortlistPage  from './pages/ShortlistPage'
import LoginPage      from './pages/LoginPage'
import DashboardPage  from './pages/DashboardPage'

function AuthGuard({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('auth_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"            element={<LoginPage />}   />
      <Route path="/shortlist/:token" element={<ShortlistPage />} />
      <Route path="/"          element={<AuthGuard><TriagemPage /></AuthGuard>} />
      <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  )
}
