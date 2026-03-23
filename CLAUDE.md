# CLAUDE.md – Nós Dois Reais

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 0. Commands

```bash
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint validation
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
```

## 1. Visão Geral do Produto
**Nós Dois Reais** — aplicação web de controle financeiro pessoal.
Objetivo principal: gerenciar contas, transações e categorias com dashboard claro e resumo mensal.
Público-alvo: casais no Brasil.
Idioma prioritário: Português Brasileiro (interface, mensagens, validações, logs).
Estágio atual: app local em desenvolvimento → objetivo futuro de SaaS B2C Brasil.

## 2. Stack Tecnológica (obrigatória)
- Framework: Next.js 15 (App Router)
- Frontend: React 18 + Tailwind CSS 4.2
- UI components: shadcn/ui (quando aplicável) + componentes custom em /components/finance e /components/ui
- Banco de dados & Auth: Supabase (PostgreSQL + Auth + RLS)
- Gerenciamento de estado assíncrono: TanStack React Query v5
- Validação de formulários: React Hook Form + Zod v4
- Rate limiting: Upstash Redis (sliding window – 60 req/min por IP em rotas de escrita sensíveis)
- Gráficos: Recharts
- Analytics: Vercel Analytics
- Testes: Vitest + React Testing Library
- Deploy: Vercel

## 3. Regras de Autenticação e Segurança (sempre respeitar)
- Sessão: Supabase SSR + cookies HttpOnly
- Middleware: middleware.ts protege todas rotas privadas → redireciona para /login se não autenticado
- RLS (Row Level Security): usuário só vê seus próprios dados (user_id)
- CSRF: valida header Origin em todas rotas mutantes (POST/PATCH/DELETE)
- Senhas: mínimo 10 caracteres, deve conter letras e números
- Rate limiting: 60 req/min por IP em rotas de escrita sensíveis (Upstash Redis)
- Soft delete: transações usam deleted_at (nunca DELETE físico)
- Headers de segurança: CSP, HSTS, X-Frame-Options (já configurados em next.config.mjs)
- Nunca expor chaves Supabase no client-side (usar NEXT_PUBLIC_ apenas para url e anon key)

## 4. Convenções de Código
- TypeScript strict mode
- Arquivos: kebab-case (ex: use-transactions.ts)
- Componentes: PascalCase (ex: TransactionForm.tsx)
- Commits: Conventional Commits (feat:, fix:, chore:, refactor:, test:, docs:)
- Pastas principais:
  - /app/(auth)       → login, cadastro
  - /app/(dashboard)  → /, /transacoes, /contas, /categorias, /relatorios, /cartoes, /fatura/[id]
  - /app/api          → accounts, categories, dashboard, transactions, invoices, reports
  - /components/finance, /components/ui, /components/providers, /components/reports
  - /hooks            → useAccounts, useCategories, useTransactions, useInvoices, useReports
  - /lib/supabase     → client.ts, server.ts
  - /lib/utils        → format.ts (formatCurrency, formatDate)
  - /lib/domain       → invoices.ts (lógica de fatura e parcelamento)
  - /lib/validations  → schemas.ts (Zod)
  - /types            → Account, Category, Transaction, CreditInvoice, InstallmentGroup, ReportsPayload

## 5. Fluxo de Trabalho Obrigatório
1. **Sempre comece invocando** a skill /product-orchestrator para planejar qualquer tarefa significativa (nova feature, refatoração, correção, otimização).
2. Nunca comece codificando ou alterando arquivos sem um plano validado.
3. Ordem típica de delegação:
   - /product-orchestrator → planeja e delega
   - /system-architect     → define arquitetura / trade-offs (se necessário)
   - /ux-researcher        → discovery, personas, validação de hipóteses (se necessário)
   - /ui-ux-architect      → wireframes, user flows, componentes
   - /ui-designer          → visual + assets
   - /copywriter           → textos de interface, mensagens de erro, tooltips
   - /frontend-engineer    → código React/Next.js/Tailwind
   - /backend-engineer     → Supabase queries, RLS, funções edge, API routes
   - /ai-llm-engineer      → se precisar de prompt engineering ou integração AI
   - /qa-engineer          → testes unitários + E2E
   - /revisor-tecnico      → code review final
   - /technical-writer     → README, docs, CLAUDE.md updates
   - /data-analyst         → insights financeiros, métricas de produto, queries SQL
   - /cro-specialist       → otimização de conversão / usabilidade (cadastro, login, dashboard)
   - /web-performance-engineer → Lighthouse, Core Web Vitals
   - /devops-cloud         → deploy Vercel, env vars, CI/CD
4. Após qualquer alteração significativa: peça /qa-engineer + /revisor-tecnico antes de commit.

## 6. Regras Adicionais (referenciadas)
- Convenções detalhadas de código e commit → .claude/rules/code-style.md
- Padrões de teste → .claude/rules/testing.md
- Checklist de segurança → .claude/rules/security-checklist.md

## 7. Preferências do Usuário (Robson)
- Respostas em português brasileiro informal
- Código limpo, comentado quando complexo
- Sempre mostre diffs ou trechos alterados quando sugerir mudanças
- Pergunte se houver dúvida sobre requisitos ou intenção
- Priorize simplicidade e manutenibilidade sobre features avançadas desnecessárias

Última atualização: Março 2026
