# Observabilidade em Produção

Data de vigência: 28/03/2026

## Objetivo

Padronizar observabilidade para reduzir MTTR e melhorar operação contínua com:

1. logs estruturados
2. métricas por endpoint
3. alertas operacionais
4. correlação por requisição

## 1) Correlação por requisição

- Toda requisição recebe `x-request-id` no `middleware`.
- O mesmo `x-request-id` é propagado para respostas e usado nos logs de API.
- Endpoints críticos usam `withRouteObservability` para garantir correlação + latência.

Arquivos principais:

- `middleware.ts`
- `lib/observability.ts`
- `lib/logger.ts`

## 2) Logs estruturados

Formato base:

- `service`
- `environment`
- `timestamp`
- `level`
- `action`
- `requestId`
- `details` (objeto sanitizado)

Evento principal de API:

- `action: "http_request"`
- campos em `details`:
  - `operation`
  - `route`
  - `method`
  - `status_code`
  - `duration_ms`
  - `metric_name: "http.server.request"`

## 3) Métricas por endpoint

As métricas são emitidas via logs estruturados por endpoint.

Métricas mínimas:

1. volume de requisições (`count` por `route + method`)
2. latência p95/p99 (`duration_ms`)
3. taxa de erro (`status_code >= 500`)
4. taxa de client error (`status_code >= 400 e < 500`)

## 4) Alertas recomendados

Configurar no provedor de observabilidade (Vercel/Datadog/Sentry):

1. Erro 5xx por endpoint > 2% por 5 min.
2. p95 de latência > 1200 ms por 10 min em endpoints críticos.
3. Falha do job de retenção LGPD (`operation=privacy_retention_job_post`, `status_code>=500`).

## 5) Endpoints críticos já cobertos

1. `/api/transactions/[id]` (`PATCH`, `DELETE`)
2. `/api/couple` (`GET`, `DELETE`)
3. `/api/notifications/[id]` (`PATCH`)
4. `/api/internal/privacy-retention` (`POST`)

## 6) Playbook de incidente (resumo)

1. Buscar `request_id` no erro reportado.
2. Filtrar logs por `request_id`.
3. Validar sequência: autenticação, autorização, query e status final.
4. Classificar incidente e abrir correção com evidências (timestamp, endpoint, impacto).

## 7) Checklist de rollout

- Deploy com middleware e `withRouteObservability`.
- Verificar presença de `x-request-id` nas respostas.
- Confirmar evento `http_request` no agregador de logs.
- Criar alertas e destinatários de plantão.

## Variáveis de ambiente úteis

- `OBS_SERVICE_NAME` (opcional, padrão `tofinanceapp`)
- `NEXT_PUBLIC_APP_URL` (já existente, usada em contexto geral)

## Limitações atuais

- Métricas são derivadas de logs; não há exporter dedicado Prometheus/OpenTelemetry neste ciclo.
- Alguns endpoints legados ainda não usam `withRouteObservability` e devem ser migrados gradualmente.
