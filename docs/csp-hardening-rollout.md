# Runbook — Endurecimento de CSP e Remoção de `unsafe-inline`

Data base: 28/03/2026  
Escopo: aplicação Next.js com CSP em enforcement + CSP mais rígida em `Report-Only`.

## Objetivo

Executar remoção de `unsafe-inline` de forma segura, com evidência operacional e sem regressão de UX/funcionalidade em desktop e mobile.

## Estado atual (já implementado)

- CSP principal (`Content-Security-Policy`) em enforcement.
- CSP mais rígida em `Content-Security-Policy-Report-Only`.
- Endpoint de coleta de violações: `POST /api/security/csp-report`.

## Resultado esperado

1. Coletar 7–14 dias de violações reais.
2. Corrigir violações de inline script/style.
3. Remover `unsafe-inline` da CSP principal em PR final, mantendo monitoramento.

---

## Fase 1 — Coleta de relatórios (7–14 dias)

Janela recomendada:
- Mínimo: 7 dias corridos.
- Ideal: 14 dias corridos.
- Cobertura obrigatória: dias úteis + fim de semana.

### Checklist de início

1. Confirmar que `Content-Security-Policy-Report-Only` está ativo em produção.
2. Confirmar recebimento de eventos no endpoint `/api/security/csp-report`.
3. Garantir visibilidade dos logs no provedor (ex.: Vercel logs).

### Dados a coletar por evento

- `violated-directive`
- `effective-directive`
- `blocked-uri`
- `document-uri`
- `source-file`
- `line-number` / `column-number` (quando houver)
- user-agent (se disponível no envelope)
- timestamp

### Agregação mínima diária

Para cada dia, registrar:

1. Total de violações.
2. Top 10 `violated-directive`.
3. Top 10 `source-file`/`document-uri`.
4. Quebra por plataforma:
- Desktop (user-agent desktop).
- Mobile (user-agent mobile).
5. Quebra por criticidade:
- Bloqueia fluxo crítico (login, cadastro, dashboard, transação, pagamento fatura).
- Não crítico.

### Critério para avançar para Fase 2

- Há dados suficientes da janela (7–14 dias).
- Violações são reproduzíveis e classificadas.
- Existe backlog técnico de correção por causa-raiz.

---

## Fase 2 — Correção de violações reais

Objetivo: eliminar causas de violação de `script-src` e `style-src` sem `unsafe-inline`.

### Tipos comuns e tratamento

1. Inline script legítimo do app:
- Migrar para script com `nonce` (ou `hash` estático quando aplicável).

2. Inline style legítimo:
- Mover para CSS/arquivo estático/componente com classe.
- Quando inevitável, avaliar `nonce`/`hash` para estilo.

3. Código de terceiro:
- Revisar necessidade da dependência.
- Restringir domínio explicitamente no CSP.
- Substituir por alternativa compatível com CSP restrita, se necessário.

4. Falso positivo/ruído:
- Classificar e documentar justificativa.
- Não mascarar problema estrutural com exceções amplas.

### Regras de implementação

1. Corrigir por lote pequeno (PRs curtos).
2. Cada PR deve incluir:
- evidência de violação original,
- causa-raiz,
- teste manual em desktop e mobile,
- impacto esperado.
3. Reexecutar:
- `npm run lint`
- `npm run test:run`
- `npm run build`
4. Validar páginas críticas após cada lote.

### Critério para avançar para Fase 3

Nos últimos 3 dias da janela:

1. Zero violação nova de `script-src` associada ao app.
2. Zero violação nova de `style-src` associada ao app.
3. Sem regressão em fluxos críticos.

Se houver violações residuais:
- Manter `Report-Only` e repetir ciclo de correção.

---

## Fase 3 — Remoção de `unsafe-inline` (PR final)

### Mudança técnica

Na CSP principal (`Content-Security-Policy`), remover:

- `'unsafe-inline'` de `script-src`
- `'unsafe-inline'` de `style-src`

Manter `Report-Only` por mais 14 dias após o cutover para observação pós-remoção.

### Checklist de PR final

1. Descrição do contexto e evidências da janela de monitoramento.
2. Lista das correções aplicadas (links de PR).
3. Plano de rollback explícito.
4. Testes executados:
- unitários,
- build,
- smoke de autenticação e dashboard,
- fluxos críticos em desktop e mobile.

### Rollback (se necessário)

Condição de rollback imediato:
- quebra de fluxo crítico de produção atribuída ao bloqueio CSP.

Ação:
1. Restaurar temporariamente `unsafe-inline` no diretivo afetado.
2. Abrir incidente técnico com RCA.
3. Corrigir causa e repetir fase de monitoramento.

---

## Quando desativar/remover (decisão objetiva)

### Desativar `Report-Only`

Somente após:
1. 14 dias pós-cutover sem incidentes críticos relacionados à CSP.
2. Volume de violações residuais baixo e classificado como não acionável.
3. Aprovação técnica (engenharia + segurança).

### Remover `unsafe-inline` da CSP principal

Somente quando TODOS os critérios abaixo forem verdadeiros:
1. Coleta mínima de 7 dias (ideal 14) concluída.
2. Violações reais de inline script/style corrigidas.
3. Últimos 3 dias sem novas violações relevantes do app.
4. Smoke tests críticos desktop/mobile aprovados.
5. PR final com rollback definido.

---

## Modelo de relatório semanal (sugestão)

1. Período analisado.
2. Volume total de violações.
3. Top diretivas violadas.
4. Top páginas/rotas impactadas.
5. Itens corrigidos na semana.
6. Violações pendentes + plano.
7. Recomendação da semana:
- continuar monitorando,
- avançar para remoção,
- adiar por risco.

---

## Governança recomendada

- Owner técnico: Engenharia de Plataforma/AppSec.
- Aprovadores de mudança final: Tech Lead + responsável de Segurança.
- Evidências anexadas no PR final:
  - logs agregados,
  - checklist de validação,
  - plano de rollback.

