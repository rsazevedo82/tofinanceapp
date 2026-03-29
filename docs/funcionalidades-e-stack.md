# Projeto Nós 2 Reais — Funcionalidades e Stack

## 1. Visão Geral
O **Nós 2 Reais** é uma aplicação web/PWA de gestão financeira para casal, com foco em:
- controle de despesas e receitas
- organização por contas, categorias e cartões
- acompanhamento de objetivos financeiros
- colaboração em contexto de casal

## 2. Funcionalidades Principais

### 2.1 Autenticação e Conta
- Cadastro, login, logout e recuperação de senha.
- Sessão autenticada com Supabase.
- Rotas públicas e privadas com proteção via `proxy.ts`.

### 2.2 Dashboard Financeiro
- Visão consolidada do mês (saldo, receitas, despesas e resumo).
- Cards de status financeiro.
- Atalhos para ações e fluxos principais.

### 2.3 Transações
- Cadastro e edição de transações.
- Listagem e filtros por período/conta/categoria.
- Endpoints dedicados de listagem e resumo.

### 2.4 Contas e Cartões
- Gestão de contas financeiras.
- Gestão de cartões e visão de fatura/limites.
- Fluxo de detalhes por fatura (`/fatura/[id]`).

### 2.5 Categorias
- Organização de gastos/receitas por categoria.
- Suporte para classificação visual e semântica.

### 2.6 Objetivos
- Criação e acompanhamento de metas financeiras.
- Contribuições por objetivo e evolução de progresso.

### 2.7 Relatórios
- Página de relatórios com recortes analíticos.
- APIs para dados agregados e visão mensal.

### 2.8 Módulo Casal e Divisão
- Funcionalidades de vínculo de casal (convite/pendências).
- Fluxos de divisão e colaboração financeira.

### 2.9 Perfil e Notificações
- Gestão de perfil e senha.
- Central de notificações e marcação de leitura.

### 2.10 PWA e Offline
- Instalação como app (manifest + ícones + service worker).
- Fallback offline (`/offline`).
- Cache de assets estáticos e estratégia de API em `NetworkOnly` no SW.

## 3. Stack Tecnológica

### 3.1 Frontend
- **Next.js 16.2.1** (App Router)
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind CSS 4**
- **TanStack React Query 5**
- **Recharts** (gráficos)

### 3.2 Backend (BFF no próprio Next)
- Rotas API em `app/api/*`.
- Validação com **Zod**.
- Integração de autenticação/dados com **Supabase**.

### 3.3 Banco e Serviços
- **Supabase** (PostgreSQL + Auth)
- **Upstash Redis** para rate limit

### 3.4 PWA
- **@ducanh2912/next-pwa**
- Service Worker com runtime caching e fallback offline

### 3.5 Observabilidade e Produto
- **@vercel/analytics**
- **@vercel/speed-insights**

### 3.6 Qualidade
- **ESLint 9** + `eslint-config-next`
- **Vitest** (unit)
- **Playwright** (E2E PWA)
- **Typecheck** com `tsc`

## 4. Estrutura Funcional do App

### 4.1 Áreas de UI (App Router)
- `app/(auth)`
- `app/(dashboard)` com módulos: `cartoes`, `casal`, `categorias`, `contas`, `divisao`, `fatura`, `objetivos`, `perfil`, `relatorios`, `transacoes`
- `app/offline`

### 4.2 Camada de API
Módulos em `app/api`:
- `accounts`, `auth`, `cards`, `categories`, `couple`, `dashboard`, `goals`, `icons`, `internal`, `invoices`, `notifications`, `profile`, `reports`, `security`, `splits`, `transactions`

## 5. Segurança e Confiabilidade
- Controle de acesso em rotas privadas via `proxy.ts`.
- Verificação de origem para rotas mutáveis (proteção CSRF por origem permitida).
- Rate limit em fluxos sensíveis.
- Cabeçalhos de segurança (CSP e políticas complementares via `next.config.mjs`).
- Uso de service role restrito a camadas privilegiadas específicas.

## 6. Fluxo de Build e Testes
Scripts principais:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run test:e2e:pwa`
- `npm run ci:check`

## 7. Deploy e Operação
- Deploy alvo: **Vercel**.
- Variáveis de ambiente para Supabase, Upstash, segurança e domínio.
- Projeto preparado para uso em desktop e mobile, incluindo experiência PWA.

## 8. Resumo Executivo
O projeto já possui base sólida para um produto financeiro de casal com:
- arquitetura moderna (Next 16 + App Router)
- backend integrado no próprio app
- autenticação e dados em Supabase
- estratégia PWA/offline
- esteira de qualidade com lint, typecheck e testes automatizados
