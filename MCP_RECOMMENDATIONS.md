# MCP Servers Recomendados — tofinanceapp

Servidores MCP recomendados para o stack do projeto (Next.js 14, Supabase, TypeScript, Upstash Redis, Vercel).

---

## Já discutidos anteriormente

### Serena
Análise semântica de código via LSP. Opera no nível de símbolos (funções, classes, métodos) em vez de ler arquivos inteiros — ideal para refatorações e navegação em projetos grandes.

```bash
# Clonar o Serena
git clone https://github.com/oraios/serena C:\serena

# Adicionar ao Claude Code
claude mcp add serena -- uv --directory C:\serena run serena start-mcp-server --project "E:\MyProjects\tofinanceapp" --context claude-code
```

Config do projeto em `.serena/project.yml`:
```yaml
project_name: tofinanceapp
languages:
  - typescript
  - javascript
ignore_all_files_in_gitignore: true
ignored_paths:
  - ".next"
  - "node_modules"
```

---

### Context7
Busca documentação atualizada das libs usadas no projeto diretamente no contexto do Claude. Evita alucinações de APIs antigas (Next.js App Router, Supabase, TanStack Query v5, Zod v4).

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

---

### Supabase MCP (oficial)
Conecta direto ao projeto Supabase — inspeciona schema, roda migrations, lê logs, verifica RLS policies, aplica mudanças no banco.

```bash
claude mcp add supabase -- npx -y @supabase/mcp-server-supabase --access-token <seu-token>
```

Token em: [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)

---

### Playwright
Abre o browser, navega na app, tira screenshots, clica em elementos. Testes visuais e debugging de UI sem sair do Claude.

```bash
claude mcp add playwright -- npx -y @playwright/mcp
```

---

### GitHub MCP (oficial)
Cria issues, PRs, lê comentários, gerencia branches via linguagem natural.

```bash
claude mcp add github -- npx -y @modelcontextprotocol/server-github
```

Requer `GITHUB_PERSONAL_ACCESS_TOKEN` no ambiente.

---

## 10 Adicionais Recomendados pela Comunidade

### 1. Vercel MCP (oficial)
Gerencia deploys, variáveis de ambiente, logs de build e erros de produção. Usa OAuth, sem API key manual.

```bash
claude mcp add --transport http vercel https://mcp.vercel.com
# Após adicionar, autenticar com: /mcp
```

**Por que usar:** Deploy na Vercel — inspeciona builds com falha, compara logs entre ambientes, gerencia env vars do Supabase/Upstash sem abrir o dashboard.

---

### 2. Upstash MCP (oficial)
Inspeciona e gerencia bancos Redis do Upstash — chaves, queries, performance, throughput.

```bash
claude mcp add upstash -- npx -y @upstash/mcp-server@latest \
  --email <UPSTASH_EMAIL> \
  --api-key <UPSTASH_API_KEY>
```

**Por que usar:** O projeto já usa Upstash para rate limiting. Permite inspecionar chaves (`user:*`), diagnosticar cache misses e criar bancos de teste.

---

### 3. Postgres MCP Pro
Análise de performance do PostgreSQL: EXPLAIN plans, index tuning, health do banco, análise de workload.

```bash
pipx install postgres-mcp
```

Configurar com a connection string direta do Supabase e `access_mode: restricted`.

**Por que usar:** O Supabase MCP cuida do management-plane; este cuida do nível DBA — queries lentas nas tabelas de transações, índices faltando nas queries de relatórios/gráficos.

- GitHub: [crystaldba/postgres-mcp](https://github.com/crystaldba/postgres-mcp)

---

### 4. shadcn/ui MCP (oficial)
Busca e instala componentes shadcn/ui via linguagem natural. "Adicione um data table com sorting e um date picker" → encontra e instala os componentes certos.

```bash
pnpm dlx shadcn@latest mcp init --client claude
```

**Por que usar:** Elimina a necessidade de buscar nomes de componentes e copiar comandos de instalação manualmente.

---

### 5. Magic MCP (21st.dev)
Gera componentes React/TypeScript/Tailwind a partir de uma descrição em linguagem natural. Tipo v0.dev dentro do editor.

```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": { "API_KEY": "seu-api-key" }
    }
  }
}
```

API key em: [21st.dev/magic/console](https://21st.dev/magic/console) — free tier: 5 gerações/mês.

**Por que usar:** Gera KPI cards, tabelas de transações com badges de status, wrappers de gráficos Recharts com Tailwind em segundos.

- GitHub: [21st-dev/magic-mcp](https://github.com/21st-dev/magic-mcp)

---

### 6. Sentry MCP (oficial)
Acessa erros de produção no Sentry via OAuth — issues, stack traces, releases, performance data e análise de root cause com IA.

```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
# Após adicionar, autenticar via OAuth
```

**Por que usar:** Quando um erro dispara no deploy da Vercel, Claude vê o stack trace, o arquivo relevante e sugere o fix — sem copiar/colar nada.

---

### 7. Lighthouse MCP
Roda audits do Google Lighthouse direto do Claude: Core Web Vitals (LCP, FID, CLS), acessibilidade (WCAG), SEO, JavaScript não-utilizado, comparação mobile vs desktop.

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["@danielsogl/lighthouse-mcp@latest"]
    }
  }
}
```

Requer Node.js 22+ e Chrome/Chromium.

**Por que usar:** Audita a rota do dashboard, identifica contribuições lentas do bundle do Recharts, aponta falhas de WCAG nos formulários.

- GitHub: [danielsogl/lighthouse-mcp-server](https://github.com/danielsogl/lighthouse-mcp-server)

---

### 8. Brave Search MCP (oficial)
Busca web em tempo real — changelogs de libs, security advisories, status do Vercel/Supabase, discussões recentes da comunidade.

```bash
claude mcp add brave-search \
  -e BRAVE_API_KEY=<key> \
  -- npx -y @modelcontextprotocol/server-brave-search
```

API key em: [brave.com/search/api](https://brave.com/search/api) — free tier: 2.000 queries/mês.

**Por que usar:** Pesquisa atual sem depender do knowledge cutoff do Claude.

---

### 9. Firecrawl MCP
Web scraping com render de JavaScript — extrai dados estruturados de qualquer página, incluindo SPAs e conteúdo dinâmico.

```bash
claude mcp add firecrawl \
  -e FIRECRAWL_API_KEY=<key> \
  -- npx -y firecrawl-mcp
```

API key em: [firecrawl.dev](https://www.firecrawl.dev) — free tier disponível.

**Por que usar:** Extrai dados financeiros externos para seed data, testes ou pipelines de importação.

- GitHub: [firecrawl/firecrawl-mcp-server](https://github.com/firecrawl/firecrawl-mcp-server)

---

### 10. Sequential Thinking (oficial Anthropic)
Decomposição de problemas em etapas numeradas e revisáveis. Útil para tarefas que exigem raciocínio encadeado.

```bash
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
```

**Por que usar:** Refatorações complexas, design de pipelines (Supabase → React Query → Recharts), debugging de race conditions em cache.

- GitHub: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)

---

## Resumo por Prioridade

| Prioridade | MCP | Motivo Principal |
|---|---|---|
| Alta | Serena | Análise semântica de código |
| Alta | Context7 | Docs atualizadas das libs do projeto |
| Alta | Supabase MCP | Gerenciar banco/schema diretamente |
| Alta | Vercel MCP | Deploy na Vercel |
| Alta | Upstash MCP | Rate limiting já em uso no projeto |
| Alta | Sentry MCP | Erros de produção sem fricção |
| Média | Postgres MCP Pro | Performance das queries do Supabase |
| Média | shadcn/ui MCP | Fluxo de componentes de UI mais rápido |
| Média | Brave Search | Pesquisa web atual |
| Média | Playwright | Testes visuais e debugging de UI |
| Baixa | Lighthouse MCP | Auditorias pontuais de performance |
| Baixa | Sequential Thinking | Raciocínio em tarefas complexas |
| Baixa | Magic MCP | Geração de componentes |
| Baixa | Firecrawl | Scraping quando necessário |
| Baixa | GitHub MCP | Útil se usar muito o GitHub no fluxo |

---

## Recursos para Descobrir Mais

- **Registry oficial MCP:** [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/)
- **awesome-mcp-servers:** [github.com/punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- **Servidores oficiais Anthropic:** [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
