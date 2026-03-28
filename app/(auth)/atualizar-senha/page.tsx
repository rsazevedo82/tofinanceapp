'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: 'Digite sua senha', color: '#D1D5DB', width: '0%' }

  const hasMinLength = password.length >= 10
  const hasLetters = /[a-zA-Z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const checks = [hasMinLength, hasLetters, hasNumbers].filter(Boolean).length

  if (checks <= 1) return { label: 'Senha fraca', color: '#EF4444', width: '33%' }
  if (checks === 2) return { label: 'Senha media', color: '#F59E0B', width: '66%' }
  return { label: 'Senha boa', color: '#22C55E', width: '100%' }
}

export default function AtualizarSenhaPage() {
  const passwordInputId = 'reset-password'
  const confirmPasswordInputId = 'reset-password-confirm'
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [invalidRecoveryLink, setInvalidRecoveryLink] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const strength = getPasswordStrength(password)

  useEffect(() => {
    async function bootstrapRecoverySession() {
      const supabase = createClient()
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const queryType = url.searchParams.get('type')
      const queryTokenHash = url.searchParams.get('token_hash') ?? url.searchParams.get('token')
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashType = hashParams.get('type')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      const hasRecoveryCode = !!code
      const hasRecoveryTokenQuery = queryType === 'recovery' && !!queryTokenHash
      const hasRecoveryHash = hashType === 'recovery' && !!accessToken && !!refreshToken

      if (!hasRecoveryCode && !hasRecoveryTokenQuery && !hasRecoveryHash) {
        setInvalidRecoveryLink(true)
        setError('Link invalido ou incompleto. Abra novamente o link enviado por email.')
        setCheckingSession(false)
        return
      }

      if (hasRecoveryCode && code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setInvalidRecoveryLink(true)
          setError('Link invalido ou expirado. Solicite um novo email de recuperacao.')
          setCheckingSession(false)
          return
        }
      } else if (hasRecoveryTokenQuery && queryTokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: queryTokenHash,
        })
        if (verifyError) {
          setInvalidRecoveryLink(true)
          setError('Link invalido ou expirado. Solicite um novo email de recuperacao.')
          setCheckingSession(false)
          return
        }
        window.history.replaceState({}, document.title, window.location.pathname)
      } else if (hasRecoveryHash && accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (setSessionError) {
          setInvalidRecoveryLink(true)
          setError('Link invalido ou expirado. Solicite um novo email de recuperacao.')
          setCheckingSession(false)
          return
        }
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setInvalidRecoveryLink(true)
        setError('Link invalido ou expirado. Solicite um novo email de recuperacao.')
      }

      setCheckingSession(false)
    }

    bootstrapRecoverySession()
  }, [])

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 10) {
      setError('Senha deve ter pelo menos 10 caracteres')
      return
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Senha deve conter letras e numeros')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas nao conferem')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Nao foi possivel atualizar a senha. Solicite um novo link.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    setSuccess('Senha atualizada com sucesso. Redirecionando para o login...')
    setLoading(false)

    setTimeout(() => {
      router.push('/login')
      router.refresh()
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-[#FFF5F0]">
        <div className="flex flex-col items-center gap-8 px-12">
          <Link href="/" aria-label="Ir para Visão geral">
            <Image
              src="/n2r-logo-completo-horizontal-cor-V1.png"
              alt="Nos 2 Reais"
              width={260}
              height={80}
              priority
            />
          </Link>
          <div className="text-center space-y-1.5">
            <p className="text-sm text-[#6B7280]">Defina sua nova senha com seguranca.</p>
            <p className="text-sm text-[#6B7280]">Use minimo de 10 caracteres, letras e numeros.</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-[#D1D5DB]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Link href="/" aria-label="Ir para Visão geral">
              <Image
                src="/n2r-simbolo-principal-claro-V1.png"
                alt="Nos 2 Reais"
                width={28}
                height={28}
                className="rounded-md"
              />
            </Link>
            <span className="text-base font-bold text-[#0F172A] tracking-tight">Nos 2 Reais</span>
          </div>

          <div
            className="rounded-2xl p-6 md:p-7 bg-white"
            style={{ border: '1px solid #E5E7EB', boxShadow: '0 8px 28px rgba(15,23,42,0.06)' }}
          >
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight mb-1">Atualizar senha</h1>
            <p className="text-sm mb-8 text-[#6B7280]">Escolha uma nova senha para sua conta</p>

            {checkingSession ? (
              <p className="text-sm text-[#6B7280]">Validando link de recuperacao...</p>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="label" htmlFor={passwordInputId}>Nova senha</label>
                  <div className="relative">
                    <input
                      id={passwordInputId}
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-24"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="minimo 10 caracteres, letras e numeros"
                      required
                      disabled={loading || invalidRecoveryLink}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B7280] hover:text-[#0F172A] transition-colors"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{ width: strength.width, backgroundColor: strength.color }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor={confirmPasswordInputId}>Confirmar nova senha</label>
                  <div className="relative">
                    <input
                      id={confirmPasswordInputId}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="input pr-24"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="repita sua nova senha"
                      required
                      disabled={loading || invalidRecoveryLink}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B7280] hover:text-[#0F172A] transition-colors"
                    >
                      {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="text-sm px-3 py-2 rounded-lg bg-green-50 border border-green-100 text-green-700">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full justify-center py-2.5"
                  disabled={loading || invalidRecoveryLink}
                >
                  {loading ? 'Atualizando...' : 'Atualizar senha'}
                </button>
              </form>
            )}

            <p className="text-center text-sm mt-6 text-[#6B7280]">
              Voltar para{' '}
              <Link href="/login" className="text-[#FF7F50] font-medium hover:text-[#e86e40] transition-colors">
                login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
