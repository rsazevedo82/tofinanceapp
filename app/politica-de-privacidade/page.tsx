import type { Metadata } from 'next'
import Link from 'next/link'

const EFFECTIVE_DATE = '28/03/2026'
const DEFAULT_SLA_DAYS = 15

function resolvePrivacyContactEmail() {
  const configured = process.env.NEXT_PUBLIC_PRIVACY_REQUEST_EMAIL?.trim()
  if (configured) return configured
  return null
}

export const metadata: Metadata = {
  title: 'Política de Privacidade | Nós 2 Reais',
  description: 'Transparência sobre tratamento de dados pessoais, direitos do titular e canais LGPD.',
}

export default function PoliticaDePrivacidadePage() {
  const contactEmail = resolvePrivacyContactEmail()
  const slaDays = Number.parseInt(process.env.NEXT_PUBLIC_PRIVACY_SLA_DAYS ?? `${DEFAULT_SLA_DAYS}`, 10)
  const validSla = Number.isFinite(slaDays) && slaDays > 0 ? slaDays : DEFAULT_SLA_DAYS

  return (
    <main className="min-h-screen bg-[#FDFCF0] text-[#0F172A]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Política de Privacidade</h1>
          <p className="text-sm text-[#6B7280]">Data de vigência: {EFFECTIVE_DATE}</p>
        </header>

        <section className="card space-y-3">
          <h2 className="text-xl font-bold">1. Quais dados tratamos</h2>
          <p className="text-sm leading-6 text-[#334155]">
            O dado pessoal principal coletado no produto é o e-mail da conta. Também podem ser gerados metadados
            técnicos de segurança e operação, como endereço IP, user-agent, data/hora de acesso e trilhas de auditoria.
          </p>
        </section>

        <section className="card space-y-3">
          <h2 className="text-xl font-bold">2. Finalidades e bases legais</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-[#334155] space-y-2">
            <li>Autenticação e gestão de conta: execução de contrato.</li>
            <li>Segurança, prevenção a abuso e investigação de incidentes: legítimo interesse e proteção ao crédito/segurança.</li>
            <li>Cumprimento de obrigações legais e regulatórias: cumprimento de obrigação legal.</li>
          </ul>
        </section>

        <section className="card space-y-3">
          <h2 className="text-xl font-bold">3. Retenção e descarte</h2>
          <p className="text-sm leading-6 text-[#334155]">
            Aplicamos retenção mínima necessária e expurgo automático para eventos de auditoria e convites, conforme
            política técnica interna.
          </p>
          <p className="text-sm leading-6 text-[#334155]">
            Referência: <code>docs/lgpd-retencao-expurgo.md</code>.
          </p>
        </section>

        <section className="card space-y-3">
          <h2 className="text-xl font-bold">4. Compartilhamento e armazenamento</h2>
          <p className="text-sm leading-6 text-[#334155]">
            Os dados podem ser tratados por operadores essenciais para operação da plataforma (ex.: hospedagem,
            autenticação e banco de dados), sob controles técnicos e organizacionais proporcionais ao risco.
          </p>
        </section>

        <section className="card space-y-3">
          <h2 className="text-xl font-bold">5. Direitos do titular</h2>
          <p className="text-sm leading-6 text-[#334155]">
            Você pode solicitar confirmação de tratamento, acesso, correção e eliminação de dados quando aplicável.
          </p>
          <p className="text-sm leading-6 text-[#334155]">
            Canal de atendimento:{' '}
            {contactEmail ? (
              <a className="text-[#FF7F50] font-semibold hover:underline" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            ) : (
              <span className="font-semibold">não configurado no ambiente de produção</span>
            )}
          </p>
          <p className="text-sm leading-6 text-[#334155]">
            SLA interno de atendimento: até {validSla} dias corridos após validação da identidade.
          </p>
        </section>

        <section className="card space-y-3">
          <h2 className="text-xl font-bold">6. Contato e atualização desta política</h2>
          <p className="text-sm leading-6 text-[#334155]">
            Esta política pode ser atualizada para refletir mudanças de produto, segurança e requisitos legais.
          </p>
          <div className="text-sm">
            <Link href="/login" className="text-[#FF7F50] font-semibold hover:underline">
              Voltar para login
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
