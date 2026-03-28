OK ### 1) Bundle muito alto na página de relatórios (`/relatorios`) [Criticidade: Crítica]
O que é: a rota carrega um bundle grande no cliente (aprox. `124 kB` de código da página e `244 kB` de First Load JS), com `recharts` e múltiplas visualizações no mesmo arquivo.
Por que importa: em mobile (CPU/rede mais fracas) aumenta tempo de parse/hidratação e piora TTI/INP; em desktop impacta navegação inicial e troca de aba.
Impacto: abertura de relatórios mais lenta, maior consumo de bateria/dados e sensação de “travamento” em dispositivos modestos.
Como melhorar: dividir por aba com `next/dynamic`, lazy-load de gráficos pesados, mover cálculos para server components/endpoint e renderizar fallback leve até carregar.

OK ### 2) Renderização excessiva no cliente em páginas principais [Criticidade: Crítica]
O que é: dashboard, transações, relatórios, contas, cartões, casal e perfil são majoritariamente `use client` com fetch pós-hidratação.
Por que importa: atrasa conteúdo útil em conexões lentas e aumenta custo de hidratação no mobile.
Impacto: pior LCP/TTI, skeletons por mais tempo e menor fluidez ao abrir telas.
Como melhorar: migrar leituras para Server Components + streaming, usar client components só para interações locais (modais/formulários), pré-carregar dados críticos no servidor.

OK ### 3) Estratégia de polling/refetch agressiva no dashboard [Criticidade: Alta]
O que é: `QueryClient` global com `refetchOnWindowFocus: true` e notificações com `refetchInterval` de 60s.
Por que importa: reconsultas frequentes em desktop e mobile geram tráfego extra, wakeups e renderizações desnecessárias.
Impacto: consumo de bateria e dados no mobile; maior carga no backend.
Como melhorar: desligar refetch global por foco, aplicar por rota crítica; usar polling condicional (somente quando dropdown aberto ou app visível), e aumentar `staleTime` em dados estáveis.

OK ### 4) Endpoint de convite de casal com `listUsers()` completo [Criticidade: Alta]
O que é: rotas de convite/reenvio usam `adminClient.auth.admin.listUsers()` e filtram em memória por e-mail.
Por que importa: escala mal com crescimento de base de usuários e aumenta latência da API.
Impacto: convite lento em horários de pico, risco de timeout e custo operacional maior.
Como melhorar: substituir por busca indexada no banco (tabela de perfil por email normalizado) ou endpoint específico de lookup por email sem varrer lista inteira.

OK ### 5) Endpoint de relatórios com alto custo computacional no servidor [Criticidade: Alta]
O que é: `GET /api/reports` traz grandes conjuntos e faz muitos `filter/reduce` em loops por mês/dia no Node.
Por que importa: crescimento de dados aumenta CPU por requisição e tempo de resposta.
Impacto: lentidão ao abrir relatórios e possível degradação concorrente.
Como melhorar: agregar no SQL (GROUP BY por categoria/mês/dia), reduzir payload retornado, cachear snapshots por usuário/mês e usar SWR curto.

OK ### 6) Falta de code-splitting para modais/forms pesados [Criticidade: Alta]
O que é: páginas importam formulários complexos (ex.: transações, metas, divisão) no bundle inicial mesmo quando modal está fechado.
Por que importa: entrega JS que não é usado no primeiro paint.
Impacto: download/parse maior no mobile e atraso de interação inicial.
Como melhorar: importar formulários/modais com `next/dynamic` e `ssr: false` quando fizer sentido, carregando sob demanda ao abrir ação.

OK ### 7) Recharts carregado integralmente mesmo sem aba ativa [Criticidade: Alta]
O que é: todos os tipos de gráfico e componentes da biblioteca são importados na página, mesmo que usuário abra apenas uma aba.
Por que importa: custo de JS fixo alto independente do uso real.
Impacto: especialmente ruim em mobile de entrada.
Como melhorar: separar cada aba de relatório em componente lazy, carregar `recharts` por aba e memoizar datasets derivados.

OK ### 8) Invalidação ampla de queries após mutações [Criticidade: Média]
O que é: após criar/editar/excluir transações, várias queries são invalidadas de forma ampla (`transactions`, `accounts`, `dashboard`).
Por que importa: provoca refetch em cascata e render extra.
Impacto: UI “pisca” e refaz requisições além do necessário.
Como melhorar: atualizar cache otimisticamente por chave afetada e invalidar apenas ranges/filtros impactados.

OK ### 9) Cálculos repetidos em render no cliente (listas grandes) [Criticidade: Média]
O que é: páginas fazem múltiplos `filter/reduce/map` a cada render sem memoização.
Por que importa: em listas maiores, eleva custo de CPU por interação.
Impacto: scrolling/filtragem menos fluida em mobile.
Como melhorar: aplicar `useMemo` para agregados derivados, extrair helpers puros e evitar recomputar arrays idênticos.

OK ### 10) Configuração PWA agressiva com cache de navegação/API [Criticidade: Média]
O que é: `cacheOnFrontEndNav` e `aggressiveFrontEndNavCaching` habilitados, com `NetworkFirst` e cache curto para `/api`.
Por que importa: pode adicionar overhead de service worker e comportamento inconsistente entre dados frescos e cache em finanças.
Impacto: risco de UX confusa (dados “mudando” após sync) e debugging mais difícil.
Como melhorar: revisar estratégia por endpoint (financeiro crítico sem cache de resposta), manter cache apenas para assets estáticos e rotas não sensíveis.

OK ### 11) Tabelas e listas sem virtualização para crescimento de volume [Criticidade: Média]
O que é: renderização completa de linhas em telas de transações e relatórios.
Por que importa: com maior histórico, custo de layout/paint cresce.
Impacto: scroll menos suave em desktop e especialmente mobile.
Como melhorar: paginação incremental + virtualização (`react-virtual`) em listas densas.

### 12) Carga de notificações em todas as telas com sidebar ativa [Criticidade: Média]
O que é: `NotificationBell` presente globalmente no layout dashboard, mantendo query/polling em navegação contínua.
Por que importa: gera trabalho de rede mesmo quando usuário não abre notificações.
Impacto: overhead constante de background.
Como melhorar: pausar polling quando aba oculta, usar “pull on open” no dropdown e considerar push/realtime para eventos críticos.

### 13) Falta de orçamento de performance (performance budget) no CI [Criticidade: Média]
O que é: CI valida lint/build, mas não impõe limites de bundle, LCP ou TBT.
Por que importa: regressões entram sem bloqueio.
Impacto: crescimento gradual de JS e piora contínua da experiência.
Como melhorar: adicionar budget de bundle por rota, Lighthouse CI (mobile/desktop) e alertas de regressão.

### 14) Ausência de telemetria de Web Vitals por rota crítica [Criticidade: Média]
O que é: há analytics, mas sem monitoramento operacional explícito de LCP/INP/CLS por página.
Por que importa: sem medição contínua, otimizações ficam no escuro.
Impacto: problemas de performance chegam tarde ao time.
Como melhorar: coletar Web Vitals em produção por rota/dispositivo, com metas por percentil (P75) e painel de acompanhamento.

### 15) Overfetch em endpoints (`select('*')`) [Criticidade: Média]
O que é: alguns endpoints trazem mais colunas que o necessário (ex.: transações em relatórios).
Por que importa: aumenta payload e processamento no servidor/cliente.
Impacto: mais latência e custo de serialização.
Como melhorar: selecionar apenas colunas consumidas pela UI e comprimir estrutura de resposta.

### 16) Falta de degradação progressiva para mobile de baixa capacidade [Criticidade: Baixa]
O que é: mesma densidade funcional/visual é entregue para desktop e mobile em algumas áreas analíticas.
Por que importa: dispositivos menos potentes sofrem mais com gráficos e muitos blocos simultâneos.
Impacto: lentidão perceptível e menor conclusão de tarefas.
Como melhorar: modo mobile simplificado (resumos primeiro, gráficos sob demanda, tabela completa só em `md+`).
