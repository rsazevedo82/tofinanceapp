OK ### 1) Cálculo do dashboard limitado a 200 transações [Criticidade: Crítica]
O que é: `GET /api/dashboard` busca transações do mês com `.limit(200)` e calcula receitas, despesas e top categorias em memória a partir desse recorte.
Por que importa: usuários com volume acima de 200 transações no mês recebem números incorretos.
Impacto: decisão financeira baseada em dados incompletos em desktop e mobile; risco direto de confiança no produto.
Como melhorar: remover o limite para cálculos agregados e migrar totais/top categorias para SQL com `SUM/GROUP BY`, mantendo limite apenas para lista de “recentes”.

OK ### 2) N+1 de requisições em cartões [Criticidade: Alta]
O que é: cada `CardItem` chama `useInvoices(card.id)`, disparando uma consulta por cartão na renderização da lista.
Por que importa: escala mal conforme cresce a quantidade de cartões.
Impacto: tempo de carregamento maior e mais tráfego no mobile; pior TTI e maior latência percebida no desktop.
Como melhorar: criar endpoint agregado para cartões + faturas abertas/fechadas em uma única chamada.

### 3) Invalidação ampla ainda presente em contas/faturas [Criticidade: Alta]
O que é: mutações em `useAccounts` e `usePayInvoice` ainda invalidam chaves amplas (`transactions`, `accounts`, `dashboard`) sem segmentação por contexto.
Por que importa: provoca refetch em cascata e renderizações desnecessárias.
Impacto: “pisca” na UI, custo de rede/CPU extra e pior fluidez em dispositivos móveis.
Como melhorar: aplicar atualização otimista por chave afetada e invalidar seletivamente por usuário/período/conta.

### 4) Proteção CSRF baseada só em Origin allowlist [Criticidade: Alta]
O que é: middleware valida `Origin` para rotas mutáveis de API, mas aceita requisição sem `Origin` e não usa token CSRF explícito.
Por que importa: proteção depende fortemente do comportamento do navegador e da infraestrutura.
Impacto: risco de bypass em cenários edge e maior fragilidade em integrações multi-cliente.
Como melhorar: adicionar token CSRF (double-submit/synchronizer token) para operações mutáveis sensíveis.

### 5) Logs de erro inconsistentes e parcialmente não sanitizados [Criticidade: Alta]
O que é: parte das rotas usa `logInternalError` (sanitizado), mas várias ainda usam `console.error` direto.
Por que importa: aumenta chance de registrar detalhes internos/sensíveis.
Impacto: risco de exposição em observabilidade/logs e resposta a incidentes mais difícil.
Como melhorar: padronizar logging em um helper único com sanitização obrigatória e contexto estruturado.

### 6) Vulnerabilidades abertas em dependências [Criticidade: Alta]
O que é: a instalação atual reporta vulnerabilidades (`npm audit` mostrou 9, incluindo nível alto).
Por que importa: pode haver exploração via cadeia de dependências.
Impacto: risco de segurança e compliance em produção desktop/mobile.
Como melhorar: tratar backlog de audit, atualizar pacotes vulneráveis e bloquear merge com vulnerabilidades acima do nível definido.

### 7) Validação de ambiente distribuída e com non-null assertions [Criticidade: Média]
O que é: variáveis críticas (`Supabase`, `Upstash`) são acessadas em múltiplos pontos com `!`, sem validação central de bootstrap.
Por que importa: falhas de configuração aparecem em runtime, não no startup/deploy.
Impacto: indisponibilidade parcial em produção e debugging mais caro.
Como melhorar: criar módulo único de validação de env (ex.: Zod) e falhar rápido no boot.

### 8) Cobertura de testes insuficiente para fluxos críticos [Criticidade: Média]
O que é: há poucos testes unitários e E2E (principalmente PWA), com baixa cobertura para fluxos financeiros e autenticação ponta a ponta.
Por que importa: regressões funcionais passam com facilidade.
Impacto: bugs em produção mais frequentes, principalmente em mobile e cenários de rede real.
Como melhorar: adicionar E2E para login/cadastro/recuperação, transações, pagamento de fatura, metas e divisão.

### 9) Dependência de aplicação manual de migrations [Criticidade: Média]
O que é: mudanças de schema (ex.: `010`, `011`) dependem de execução manual no Supabase.
Por que importa: favorece drift entre ambientes.
Impacto: funcionalidades podem quebrar só em produção por migração faltante.
Como melhorar: automatizar pipeline de migrations e bloquear deploy com schema desatualizado.

### 10) Middleware com custo fixo de autenticação em navegação [Criticidade: Média]
O que é: middleware chama `supabase.auth.getUser()` em toda navegação que passa no matcher.
Por que importa: adiciona latência de borda em cada request de página.
Impacto: pior tempo de navegação no mobile (rede alta latência) e custo operacional maior.
Como melhorar: reduzir escopo do matcher e usar estratégia híbrida (validação por rota protegida + cache de sessão quando possível).

### 11) Higiene de repositório com arquivos backup legados [Criticidade: Baixa]
O que é: há muitos arquivos `.bak`, `.old` e `.deleted` versionados.
Por que importa: aumenta ruído, risco de edição incorreta e manutenção confusa.
Impacto: produtividade menor e maior chance de erro humano em mudanças críticas.
Como melhorar: remover arquivos legados do versionamento e reforçar regra no `.gitignore`.

### 12) Estratégia de observabilidade ainda limitada [Criticidade: Baixa]
O que é: há logs estruturados, mas sem trilha clara de monitoramento de erro/performance fim-a-fim (APM/Sentry) para cliente e servidor.
Por que importa: incidentes e degradações são detectados tardiamente.
Impacto: MTTR maior em bugs de desktop/mobile e menor previsibilidade operacional.
Como melhorar: instrumentar tracing e error tracking com alertas por SLA/SLO.
