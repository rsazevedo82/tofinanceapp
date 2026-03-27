'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const supabase = createClient()
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/atualizar-senha`
        : undefined

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      setError('Nao foi possivel enviar o email de recuperacao. Tente novamente.')
      setLoading(false)
      return
    }

    setSuccess('Se o email existir, voce recebera um link para redefinir a senha.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-[#FFF5F0]">
        <div className="flex flex-col items-center gap-8 px-12">
          <Image
            src="/n2r-logo-completo-horizontal-cor-V1.png"
            alt="Nos 2 Reais"
            width={260}
            height={80}
            priority
          />
          <div className="text-center space-y-1.5">
            <p className="text-sm text-[#6B7280]">Recupere o acesso com seguranca.</p>
            <p className="text-sm text-[#6B7280]">Vamos enviar um link para seu email.</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-[#D1D5DB]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Image
              src="/n2r-simbolo-principal-claro-V1.png"
              alt="Nos 2 Reais"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-base font-bold text-[#0F172A] tracking-tight">Nos 2 Reais</span>
          </div>

          <div
            className="rounded-2xl p-6 md:p-7 bg-white"
            style={{ border: '1px solid #E5E7EB', boxShadow: '0 8px 28px rgba(15,23,42,0.06)' }}
          >
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight mb-1">Recuperar senha</h1>
            <p className="text-sm mb-8 text-[#6B7280]">Informe seu email para receber o link</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
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
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <p className="text-center text-sm mt-6 text-[#6B7280]">
              Lembrou sua senha?{' '}
              <Link href="/login" className="text-[#FF7F50] font-medium hover:text-[#e86e40] transition-colors">
                Voltar para login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
