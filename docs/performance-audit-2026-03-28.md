# Varredura de Performance (Desktop e Mobile) - 28/03/2026

Base desta análise: leitura do código, build de produção, inspeção de chunks gerados e orçamento de precache PWA.

## Criticidade Crítica

OK ### 1) Precache PWA e assets estáticos grandes demais
O que é: o precache atual soma **4669.1 KB** e inclui arquivos muito pesados, como `n2r-simbolo-principal-claro-V1.png` (~1386 KB), `icon-512.png` (~467 KB) e `nos-dois-reais.jpeg` (~202 KB).
Por que importa: aumenta tempo de primeira carga, instalação do PWA e consumo de dados no mobile (especialmente 3G/4G).
Impacto: app “lento para abrir” no primeiro uso e atualização mais lenta do service worker.
Como melhorar:
- Converter logos/ícones para `WebP`/`AVIF` e reduzir dimensões reais de render.
- Remover do precache tudo que não é crítico para offline imediato.
- Reduzir budget de precache (ex.: 5000 KB -> 2500 KB) para forçar disciplina.
- Eliminar qualquer derivado de `nos-dois-reais.jpeg` do build e do SW.

OK ### 2) JavaScript inicial elevado no cliente
O que é: chunk `app/layout.js` está com ~**614 KB** e há múltiplos chunks grandes adicionais (ex.: ~313 KB, ~184 KB, ~179 KB).
Por que importa: aumenta parse/compile/execute no navegador, com impacto forte em Android intermediário.
Impacto: TTI/INP pioram; navegação e interação inicial ficam lentas.
Como melhorar:
- Reduzir JS no layout raiz (manter providers globais mínimos).
- Isolar componentes pesados por rota com dynamic import real (não apenas em subpartes).
- Revisar dependências globais no layout e no sidebar.
- Rodar análise de bundle por rota e impor orçamento de KB por página.

OK ### 3) Prefetch server-side via HTTP interno com `no-store` em várias páginas
O que é: páginas do dashboard usam `fetchServerApi()` para chamar `/api/*` internamente por HTTP, sem cache (`cache: 'no-store'`), antes de renderizar.
Por que importa: adiciona latência de rede interna + serialização JSON + checks repetidos (auth/rate-limit), elevando TTFB.
Impacto: tempo de navegação inicial pior em desktop e mobile, mesmo com servidor rápido.
Como melhorar:
- Trocar chamadas internas HTTP por acesso direto à camada de dados no server component.
- Onde fizer sentido, usar `revalidate`/cache privado curto para leitura.
- Evitar prefetch redundante de dados comuns em múltiplas páginas (ex.: `couple`, `notifications`).

OK ### 4) Overfetch em transações (payload maior que necessário)
O que é: `GET /api/transactions` usa `select *` + joins de `account/category` e no client a paginação usa `pageSize` alto (`120`).
Por que importa: payload e custo de parse aumentam, principalmente no mobile com lista extensa.
Impacto: scroll/listagem mais pesados, consumo de banda e memória maiores.
Como melhorar:
- Selecionar apenas campos necessários por tela.
- Reduzir `pageSize` inicial (ex.: 120 -> 40/60) e carregar incrementalmente.
- Criar endpoint “summary/list” leve para tela de transações.

### 5) Build de produção falhando em `/casal`
O que é: `npm run build` falha com erro de prerender em `/casal` (`TypeError: a[d] is not a function`).
Por que importa: impede pipeline estável e bloqueia otimizações de release.
Impacto: deploy imprevisível, regressões de performance sem validação completa.
Como melhorar:
- Corrigir a causa do erro de prerender.
- Adicionar teste de build no CI como gate obrigatório.
- Impor “sem build verde, sem merge”.

## Criticidade Alta

OK ### 6) Uso recorrente de `<img>` em vez de `<Image />`
O que é: há warnings de build em páginas/componentes importantes indicando uso de `<img>`.
Por que importa: perde otimização automática de imagem (dimensionamento, formatos, lazy, prioridade).
Impacto: LCP e consumo de banda piores, especialmente no mobile.
Como melhorar:
- Migrar imagens de UI para `next/image`.
- Definir `sizes` corretos para cada breakpoint.
- Marcar `priority` apenas para imagem realmente above-the-fold.

OK ### 7) Re-render e efeito desnecessário no onboarding checklist
O que é: o array `steps` é recriado a cada render, fazendo o `useEffect` depender de referência instável.
Por que importa: trabalho extra de render e timers em componente de dashboard.
Impacto: micro-lentidão contínua na home e custo de CPU desnecessário.
Como melhorar:
- Envolver `steps` em `useMemo`.
- Dependências explícitas e estáveis no effect.
- Evitar side-effects em dependências estruturais mutáveis.

OK ### 8) Polling agressivo em estados offline e notificações
O que é: página offline faz probe a cada 3s; notificações podem entrar em polling quando dropdown abre.
Por que importa: gera chamadas frequentes e desperta CPU/rede sem necessidade em alguns contextos.
Impacto: bateria e fluidez degradam no mobile.
Como melhorar:
- Aplicar backoff exponencial no offline probe.
- Polling adaptativo (visibilidade + rede + tempo inativo).
- Preferir eventos/push quando possível.

OK ### 9) Camada de rate limit em endpoints de leitura críticos
O que é: várias rotas de leitura passam por rate-limit remoto (Upstash), agregando round-trip.
Por que importa: segurança é importante, mas custo por request pode afetar p95/p99.
Impacto: latência adicional visível em conexões móveis ou sob carga.
Como melhorar:
- Manter rate-limit mais rígido para escrita e sensíveis.
- Para leitura frequente autenticada, usar política menos custosa ou cache de decisão curta.
- Monitorar p95 por endpoint após ajuste.

## Criticidade Média

OK ### 10) Biblioteca de ícones e escolha de assets podem inflar bundle/percepção de peso
O que é: uso de `react-icons/fc` no sidebar e assets PNG grandes de marca.
Por que importa: ícones e branding entram em áreas críticas de navegação.
Impacto: mais bytes iniciais e UI menos responsiva em aparelhos modestos.
Como melhorar:
- Substituir por set de ícones menor/otimizado (SVG local ou lucide subset).
- Padronizar assets da marca em formatos leves.

### 11) Cache HTTP inconsistente entre endpoints GET
O que é: `reports` já retorna `Cache-Control` privado curto, mas outros GET críticos (ex.: dashboard/transações) não seguem padrão similar.
Por que importa: sem cache coerente, o app refaz trabalho desnecessário.
Impacto: maior latência de navegação e custo de backend.
Como melhorar:
- Definir estratégia uniforme de cache por endpoint (ex.: `private, max-age=15..60` + SWR).
- Manter invalidação após mutações com React Query.

### 12) Padrão de hidratação amplo no dashboard aumenta custo no client
O que é: muitas páginas são client-heavy e dependem de hidratação de múltiplos blocos de dados.
Por que importa: mais trabalho de JS no main thread.
Impacto: telas densas podem “demorar para ficar prontas” em mobile.
Como melhorar:
- Empurrar parte da renderização para server components.
- Entregar blocos críticos primeiro (progressive rendering/skeleton por seção).
- Separar widgets pesados em chunks tardios.

## Criticidade Baixa (mas recomendada)

### 13) Falta de orçamento formal de performance por rota
O que é: existe budget de precache, mas não há budget de JS/CSS por página e métricas de INP/LCP por rota.
Por que importa: sem alvo mensurável, regressão de performance passa despercebida.
Impacto: evolução do produto tende a ficar mais lenta ao longo do tempo.
Como melhorar:
- Definir budgets por rota (JS inicial, LCP, INP, TTFB).
- Falhar CI quando exceder limites.

### 14) Observabilidade de performance sem diretriz explícita de privacidade
O que é: não há guideline claro para instrumentar performance sem expor dados pessoais.
Por que importa: o único dado do cliente informado é e-mail; telemetria deve evitar PII.
Impacto: risco de coletar dados sensíveis desnecessários.
Como melhorar:
- Registrar métricas com identificadores anônimos (nunca e-mail em logs/labels).
- Se precisar segmentar, usar hash irreversível e retenção mínima.

---

## Prioridade de execução recomendada (curto prazo)
1. Reduzir peso de imagens/ícones e precache PWA.
2. Corrigir build quebrado de `/casal`.
3. Trocar prefetch HTTP interno por acesso direto a dados no server.
4. Diminuir payload e page size de transações.
5. Migrar `<img>` para `next/image` nas telas críticas.

