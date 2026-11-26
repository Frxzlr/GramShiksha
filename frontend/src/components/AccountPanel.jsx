import { useEffect, useState } from 'react'
import { LogIn, LogOut, UserRound } from 'lucide-react'
import { getUser, login, logout, onAuthChange } from '../lib/auth'

export function useAuthUser() {
  const [user, setUser] = useState(getUser())
  useEffect(() => onAuthChange(setUser), [])
  return user
}

const inputClass =
  'w-full h-8 px-2 rounded-[4px] bg-white/[0.04] dark:bg-white/[0.04] bg-zinc-100 border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 text-[12px] text-white dark:text-white text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#22c55e]'

// Sign-in form + signed-in status. `startOpen` shows the form immediately
// (used inside pages that need a role); the sidebar starts collapsed.
export function AccountPanel({ startOpen = false, hint }) {
  const user = useAuthUser()
  const [open, setOpen] = useState(startOpen)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (user) {
    return (
      <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="flex items-center gap-2 min-w-0">
          <UserRound className="w-4 h-4 shrink-0 text-[#22c55e]" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-zinc-200 dark:text-zinc-200 text-zinc-800">{user.name}</span>
            <span className="block text-[11px] font-mono text-zinc-500">{user.role}</span>
          </span>
        </span>
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
          className="p-1.5 rounded-[4px] text-zinc-500 hover:text-white dark:hover:text-white hover:text-zinc-900 hover:bg-white/[0.05] cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-8 rounded-[4px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 text-[12px] font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 hover:bg-white/[0.05] flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5" /> Sign in
      </button>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-1.5">
      {hint && <p className="text-[12px] text-zinc-400">{hint}</p>}
      <input
        className={inputClass}
        type="email"
        autoComplete="username"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className={inputClass}
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full h-8 rounded-[4px] bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-[12px] font-medium disabled:opacity-50 cursor-pointer"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
