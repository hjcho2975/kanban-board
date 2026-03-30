'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold tracking-tight mb-1">TeamBoard</h1>
        <p className="text-sm text-gray-500 mb-6">팀 칸반 보드에 로그인하세요</p>

        {sent ? (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-gray-700">
              {email}로 로그인 링크를 발송했습니다.
            </p>
            <p className="text-xs text-gray-500 mt-1">이메일을 확인해주세요.</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-3 mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                required
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white text-sm font-semibold py-2 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '처리 중...' : '이메일 링크로 로그인'}
              </button>
            </form>

            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">또는</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border border-gray-300 text-sm font-medium py-2 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 로그인
            </button>
          </>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-500 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}
