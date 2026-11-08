// @ts-nocheck
import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

export default function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    authNotification,
    clearAuthNotification,
    openSignIn,
    openSignUp,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    continueAsGuest,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  if (!authModalOpen) return null

  const isSignIn = authModalMode === 'signin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)
    clearAuthNotification()

    if (!email || !password) {
      setError('Please provide both email and password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      if (isSignIn) {
        const res = await signInWithEmail(email, password)
        if (res.error) {
          setError(res.error.message || 'Unable to sign in. Please check your credentials.')
        }
      } else {
        const res = await signUpWithEmail(email, password, displayName)
        if (res.error) {
          setError(res.error.message || 'Unable to create account. Please try again.')
        } else if (res.needsEmailConfirmation) {
          setInfoMessage('Account created! Please check your email to confirm your account, then sign in.')
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    clearAuthNotification()
    setLoading(true)
    try {
      const res = await signInWithGoogle()
      if (res.error) {
        setError(res.error.message || 'Google sign-in could not be initiated.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try email sign-in instead.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="2.5" fill="currentColor" />
              <circle cx="5" cy="19" r="2.5" fill="currentColor" />
              <circle cx="19" cy="19" r="2.5" fill="currentColor" />
              <line x1="12" y1="7.5" x2="5" y2="16.5" opacity="0.6" />
              <line x1="12" y1="7.5" x2="19" y2="16.5" opacity="0.6" />
              <line x1="7.5" y1="19" x2="16.5" y2="19" opacity="0.6" />
            </svg>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white font-display">
            {isSignIn ? 'Welcome back' : 'Create student account'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {isSignIn
              ? 'Sign in to sync your Learning Twin and verified assessments'
              : 'Save your concept graph and assessment history in Supabase'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="mt-6 flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          <button
            type="button"
            onClick={() => {
              setError(null)
              setInfoMessage(null)
              openSignIn()
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              isSignIn
                ? 'bg-teal-500/20 text-teal-300 shadow-sm border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setInfoMessage(null)
              openSignUp()
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              !isSignIn
                ? 'bg-teal-500/20 text-teal-300 shadow-sm border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Google OAuth Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-900 active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-slate-800" />
          <span className="absolute bg-[#0F172A] px-3 text-[10px] uppercase tracking-wider text-slate-500 font-mono">
            or with email
          </span>
        </div>

        {/* Auth notification from redirect */}
        {authNotification && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <span className="font-semibold">Notice: </span>
            {authNotification}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <span className="font-semibold">Notice: </span>
            {error}
          </div>
        )}

        {/* Info message */}
        {infoMessage && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            {infoMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isSignIn && (
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Display Name / Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-teal-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="learner@example.com"
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs font-bold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </span>
            ) : isSignIn ? (
              'Sign In to Cognify →'
            ) : (
              'Create My Account →'
            )}
          </button>
        </form>

        {/* Guest Mode alternative */}
        <div className="mt-4 border-t border-slate-800 pt-3 text-center">
          <button
            type="button"
            onClick={continueAsGuest}
            className="text-xs text-slate-400 transition hover:text-teal-400 hover:underline"
          >
            Continue as Guest (store progress locally in browser) →
          </button>
        </div>
      </div>
    </div>
  )
}
