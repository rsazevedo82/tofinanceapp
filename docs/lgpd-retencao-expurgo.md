# Política de Retenção e Expurgo (LGPD)

Data de vigência: 28/03/2026  
Escopo: dados operacionais de segurança e convites de casal.

## Objetivo

Reduzir risco regulatório e exposição em incidentes através de retenção mínima necessária e expurgo automático.

## Escopo de dados

1. `audit_events`  
Contém trilha de auditoria com metadados operacionais (ex.: IP, user-agent, ação, status).

2. `couple_invitations`  
Contém convites enviados entre usuários (status, token, e-mail do convidado, expiração).

## Prazos de retenção

1. `audit_events`: 180 dias (padrão).  
2. `couple_invitations` com status terminal (`accepted`, `rejected`, `cancelled`): 30 dias após atualização.  
3. `couple_invitations` pendentes expirados: 30 dias após criação + expiração já vencida.

Observação:
- Os prazos podem ser ajustados por variável de ambiente com justificativa jurídica/técnica.

## Implementação técnica

### Endpoint interno de expurgo

- Rota: `POST /api/internal/privacy-retention`
- Autorização: header `x-retention-job-token` deve corresponder à env `PRIVACY_RETENTION_JOB_TOKEN`.
- Saída: total de registros excluídos por categoria.

### Lógica de expurgo

- Implementada em `lib/privileged/retentionAdmin.ts`.
- Usa `service_role` apenas via camada privilegiada.

### Configuração por ambiente

Variáveis:

1. `PRIVACY_RETENTION_JOB_TOKEN` (obrigatória)
2. `LGPD_AUDIT_RETENTION_DAYS` (opcional, padrão `180`)
3. `LGPD_INVITATION_RETENTION_DAYS` (opcional, padrão `30`)

## Job automático

- Workflow: `.github/workflows/privacy-retention.yml`
- Frequência: diária (cron)
- Segredos necessários no GitHub:
  - `RETENTION_JOB_URL` (URL completa do endpoint, ex.: `https://seu-dominio/api/internal/privacy-retention`)
  - `PRIVACY_RETENTION_JOB_TOKEN` (mesmo valor do ambiente da aplicação)

## Evidência e rastreabilidade

Cada execução registra:

1. contagem de `audit_events` removidos;
2. contagem de convites removidos;
3. sucesso/falha do job com contexto de retenção aplicada.

## Operação manual (incidente ou manutenção)

Executar:

1. `POST /api/internal/privacy-retention` com header `x-retention-job-token`.
2. Validar resposta e logs do job.
3. Registrar evidência no changelog operacional.

## Revisão periódica

Periodicidade recomendada: trimestral.

Checklist:

1. Revalidar prazos com jurídico/compliance.
2. Confirmar sucesso contínuo do workflow diário.
3. Ajustar retenção apenas com justificativa formal.
4. Auditar se o escopo de dados pessoais aumentou (novas tabelas/campos).
