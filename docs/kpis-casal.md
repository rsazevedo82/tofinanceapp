# KPIs do Módulo Casal

Data de referência: 2026-03-29  
Objetivo: medir ativação e uso real do módulo casal com indicadores acionáveis de produto.

## KPIs definidos

1. `% de usuários vinculados em casal até D+7`
- Definição: entre usuários criados na janela, quantos tiveram `linked_at <= created_at + 7 dias`.
- Campo-base: `auth.users.created_at`, `couple_profiles.linked_at`.

2. `% de casais com primeiro split em até 7 dias`
- Definição: entre casais vinculados na janela, quantos tiveram `MIN(expense_splits.created_at) <= linked_at + 7 dias`.
- Campo-base: `couple_profiles.linked_at`, `expense_splits.created_at`.

3. `% de transações de despesa com split vinculado`
- Definição: entre `transactions.type='expense'` (não deletadas), quantas têm `expense_splits.transaction_id = transactions.id`.
- Campo-base: `transactions`, `expense_splits.transaction_id`.

4. `Tempo para primeiro split` (derivado futuro)
- Não materializado ainda no snapshot; recomendação para próxima iteração.

5. `Retenção D30 com casal vs sem casal` (derivado futuro)
- Não materializado ainda no snapshot; exige definição de evento de atividade.

## Materialização SQL (snapshot diário)

Migration: `supabase/migrations/014_couple_kpi_snapshots.sql`

Objetos criados:
- Tabela `couple_kpi_snapshots`
- Função `refresh_couple_kpis_snapshot(p_snapshot_date date, p_window_days int)`

Cada execução grava/atualiza um snapshot por `(snapshot_date, cohort_window_days)`.

## Endpoint interno

Rota: `GET/POST /api/internal/couple-kpis`

Autorização:
- Header obrigatório: `x-couple-kpi-token`
- Env obrigatório: `COUPLE_KPI_JOB_TOKEN`

### GET
- Retorna snapshot mais recente para a janela (`window_days`).
- Query params:
  - `window_days` (default `30`)
  - `auto_refresh` (default `true`)

Exemplo:
```bash
curl -H "x-couple-kpi-token: $COUPLE_KPI_JOB_TOKEN" \
  "https://www.nos2reais.com.br/api/internal/couple-kpis?window_days=30"
```

### POST
- Força refresh do snapshot.
- Body:
  - `window_days` (opcional, default `30`)
  - `snapshot_date` (`YYYY-MM-DD`, opcional, default hoje)

Exemplo:
```bash
curl -X POST \
  -H "content-type: application/json" \
  -H "x-couple-kpi-token: $COUPLE_KPI_JOB_TOKEN" \
  -d '{"window_days":30}' \
  "https://www.nos2reais.com.br/api/internal/couple-kpis"
```

## Garantia de não regressão de serviços

Este pacote:
- Não altera endpoints públicos existentes.
- Não remove funcionalidades atuais.
- Apenas adiciona:
  - uma migration nova de analytics,
  - uma rota interna protegida por token,
  - camada admin para leitura/gravação de snapshot.

## Metas iniciais sugeridas (Q2/2026)

- `% usuários vinculados D+7`: >= 25%
- `% casais com 1º split D+7`: >= 45%
- `% despesas com split vinculado`: >= 35%

Essas metas devem ser recalibradas após 2-4 semanas de baseline real.
