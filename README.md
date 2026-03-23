# Nós Dois Reais

Aplicação de controle financeiro para casais. Permite gerenciar contas, transações e categorias com dashboard de resumo mensal.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18, Tailwind CSS 3.4 |
| Banco de dados / Auth | Supabase (PostgreSQL) |
| Estado | TanStack React Query 5 |
| Validação | Zod 4 |
| Rate Limiting | Upstash Redis |
| Gráficos | Recharts |
| Analytics | Vercel Analytics |
| Testes | Vitest + React Testing Library |
| Deploy | Vercel |

---

## Funcionalidades

### Autenticação
- Cadastro com email e senha (mínimo 10 caracteres, letras e números)
- Login com email e senha
- Logout
- Proteção de rotas via middleware — usuários não autenticados são redirecionados para `/login`
- Sessão gerenciada pelo Supabase SSR com cookies HttpOnly

### Dashboard (`/`)
- Saldo total de todas as contas
- Receitas do mês corrente
- Despesas do mês corrente
- Saldo líquido do mês (receitas − despesas)
- Últimas 8 transações
- Botão de nova transação

### Transações (`/transacoes`)
- Listagem de transações do mês corrente em layout de tabela
- Criar transação (tipo, valor, descrição, conta, categoria, data, observações, status)
- Editar transação existente
- Excluir transação (soft delete — `deleted_at`)
- Tipos: `income` (receita), `expense` (despesa), `transfer` (transferência)
- Status: `confirmed`, `pending`, `cancelled`
- Limite máximo de 500 registros por query

### Contas (`/contas`)
- Listagem de contas ativas com saldo e tipo
- Criar conta (nome, tipo, moeda, saldo inicial, cor, ícone)
- Tipos: corrente, poupança, cartão de crédito, investimento, carteira

### Categorias (`/categorias`)
- Listagem de categorias do sistema e do usuário
- Agrupadas por tipo: Receitas / Despesas

### Relatórios (`/relatorios`)
- Previsto para v1.2

---

## API

Todos os endpoints exigem autenticação. Requisições não autenticadas retornam `401`.

### `GET /api/accounts`
Retorna todas as contas ativas do usuário autenticado, ordenadas por nome.

### `POST /api/accounts`
Cria uma nova conta.

**Body:**
```json
{
  "name": "Nubank",
  "type": "checking",
  "currency": "BRL",
  "balance": 1500.00,
  "color": "#6ee7b7",
  "icon": "bank"
}
```

---

### `GET /api/categories`
Retorna categorias do sistema (globais) + categorias do usuário, ordenadas por tipo e nome.

---

### `GET /api/dashboard`
Retorna resumo financeiro do mês corrente: saldo total, receitas, despesas, saldo líquido, últimas transações e despesas por categoria.

---

### `GET /api/transactions`
Retorna transações do usuário. Limite máximo: 500 registros.

**Query params (todos opcionais):**

| Param | Tipo | Descrição |
|---|---|---|
| `start` | `YYYY-MM-DD` | Data inicial |
| `end` | `YYYY-MM-DD` | Data final |
| `account_id` | UUID | Filtrar por conta |
| `type` | `income \| expense \| transfer` | Filtrar por tipo |

**Rate limit:** 60 requisições/minuto por IP.

### `POST /api/transactions`
Cria uma nova transação.

**Body:**
```json
{
  "account_id": "uuid",
  "category_id": "uuid",
  "type": "expense",
  "amount": 49.90,
  "description": "Supermercado",
  "notes": "Compras da semana",
  "date": "2026-03-21",
  "status": "confirmed"
}
```

**Rate limit:** 60 requisições/minuto por IP.

### `PATCH /api/transactions/[id]`
Atualiza uma transação existente. Aceita os mesmos campos do POST.

### `DELETE /api/transactions/[id]`
Soft delete — define `deleted_at` com o timestamp atual.

---

## Segurança

- **CSRF:** Validação do header `Origin` em todas as rotas mutantes (`POST`, `PATCH`, `PUT`, `DELETE`)
- **Rate limiting:** Sliding window via Upstash Redis (60 req/min por IP) nas rotas de transações
- **Validação de input:** Zod com sanitização de strings (caracteres de controle bloqueados)
- **Soft delete:** Registros nunca são deletados fisicamente
- **RLS:** Row Level Security no Supabase — usuários acessam apenas seus próprios dados
- **Headers de segurança:** CSP, HSTS, X-Frame-Options configurados via `next.config.mjs`
- **Senhas:** Mínimo 10 caracteres com letras e números

---

## Estrutura de diretórios

```
/app
  /(auth)
    /login              # Página de login
    /cadastro           # Página de cadastro
  /(dashboard)
    /                   # Dashboard principal
    /transacoes         # Listagem de transações
    /contas             # Listagem de contas
    /categorias         # Listagem de categorias
    /relatorios         # Relatórios (em breve)
  /api
    /accounts           # GET, POST
    /categories         # GET
    /dashboard          # GET
    /transactions       # GET, POST
    /transactions/[id]  # PATCH, DELETE
  layout.tsx
  globals.css
/components
  /finance              # TransactionList, TransactionForm, EditTransactionForm,
                        # NewTransactionButton, ExpensesChart
  /ui                   # Sidebar, Modal, LoadingSpinner, EmptyState
  /providers            # QueryProvider
/hooks
  useAccounts.ts
  useCategories.ts
  useTransactions.ts    # + useCreateTransaction, useUpdateTransaction,
                        #   useDeleteTransaction
/lib
  /supabase             # client.ts (browser), server.ts (SSR)
  /utils                # format.ts (formatCurrency, formatDate, getCurrentMonthRange)
  /validations          # schemas.ts (Zod — createAccountSchema, createTransactionSchema)
  rateLimit.ts          # Upstash Redis sliding window
  logger.ts             # Logger estruturado (JSON)
/types
  index.ts              # Account, Category, Transaction, DashboardSummary, ApiResponse
/tests                  # Vitest unit tests
middleware.ts           # Auth + CSRF
```

---

## Modelos de dados

### Account
```typescript
{
  id: string
  user_id: string
  name: string
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'wallet'
  currency: string       // ex: 'BRL'
  balance: number
  color: string | null   // hex, ex: '#6ee7b7'
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### Category
```typescript
{
  id: string
  user_id: string | null  // null = categoria do sistema
  name: string
  type: 'income' | 'expense'
  color: string | null
  icon: string | null
  is_active: boolean
}
```

### Transaction
```typescript
{
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description: string
  notes: string | null
  date: string            // YYYY-MM-DD
  status: 'confirmed' | 'pending' | 'cancelled'
  deleted_at: string | null
  created_at: string
  updated_at: string
  account?: { id, name, color, icon }
  category?: { id, name, color, icon }
}
```

---

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Testes

```bash
npm run test
```

## Deploy

O projeto está configurado para deploy na Vercel. Adicione as variáveis de ambiente no painel da Vercel (Settings → Environment Variables).
