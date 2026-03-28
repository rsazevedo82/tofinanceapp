# LGPD: Passo a passo de configuração e primeira execução do expurgo

Este guia cobre a ativação operacional do job de retenção/expurgo LGPD:

1. Configurar secrets no GitHub (`RETENTION_JOB_URL` e `PRIVACY_RETENTION_JOB_TOKEN`)
2. Definir valores finais de retenção no ambiente (`LGPD_*_RETENTION_DAYS`)
3. Executar manualmente o workflow e auditar o primeiro ciclo

## Pré-requisitos

- Workflow existente: `.github/workflows/privacy-retention.yml`
- Endpoint interno existente: `/api/internal/privacy-retention`
- Acesso de administrador ao repositório no GitHub
- Acesso ao ambiente de deploy (Vercel ou equivalente)

## 1) Configurar secrets no GitHub

Objetivo: permitir que o GitHub Actions invoque o endpoint interno de retenção com autenticação.

### 1.1 Gerar token forte

Use um token aleatório com pelo menos 32 bytes.

PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256} | ForEach-Object {[byte]$_}))
```

Guarde o valor com segurança.

### 1.2 Criar/atualizar os secrets do repositório

No GitHub:

1. Acesse `Settings` do repositório.
2. Entre em `Secrets and variables` > `Actions`.
3. Clique em `New repository secret` e crie:
4. `RETENTION_JOB_URL`: URL completa do endpoint no ambiente alvo. Exemplo: `https://seu-dominio.com/api/internal/privacy-retention`
5. `PRIVACY_RETENTION_JOB_TOKEN`: token gerado no passo 1.1

### 1.3 Validar consistência do token

O valor de `PRIVACY_RETENTION_JOB_TOKEN` no GitHub Actions deve ser igual ao configurado no ambiente da aplicação (passo 2), pois o endpoint valida o header `x-retention-job-token`.

## 2) Definir retenção no ambiente

Objetivo: definir janelas finais de retenção para auditoria e convites.

### 2.1 Configurar variáveis no ambiente de execução

No provedor de deploy (Vercel ou equivalente), configure:

- `PRIVACY_RETENTION_JOB_TOKEN` = mesmo valor do GitHub secret
- `LGPD_AUDIT_RETENTION_DAYS` = número de dias para manter `audit_events`
- `LGPD_INVITATION_RETENTION_DAYS` = número de dias para manter convites

### 2.2 Valores recomendados de partida

- `LGPD_AUDIT_RETENTION_DAYS=180`
- `LGPD_INVITATION_RETENTION_DAYS=30`

Observação: confirme com Jurídico/DPO antes de fixar valores definitivos.

### 2.3 Publicar mudanças no ambiente

Após salvar as variáveis, faça o deploy/redeploy para garantir que a aplicação carregue os novos valores.

## 3) Rodar disparo manual e auditar o primeiro ciclo

Objetivo: comprovar execução ponta a ponta, autenticação e expurgo esperado.

### 3.1 Executar workflow manualmente

No GitHub:

1. Abra `Actions`.
2. Selecione o workflow `Privacy Retention Job`.
3. Clique em `Run workflow`.
4. Escolha o branch correto (normalmente `main`) e confirme.

### 3.2 Validar execução técnica

Na execução do workflow, confirme:

- Job concluído com status `success`
- Chamada HTTP com retorno `200`
- Resposta JSON indicando execução do expurgo

Se houver `401` ou `403`, validar token (GitHub secret x env da aplicação).
Se houver `404`, validar `RETENTION_JOB_URL`.
Se houver `5xx`, verificar logs da aplicação.

### 3.3 Auditar o resultado funcional (primeiro ciclo)

Audite se os dados acima do prazo foram removidos:

1. `audit_events`: registros mais antigos que `LGPD_AUDIT_RETENTION_DAYS`
2. `couple_invitations` com status terminal e fora da janela
3. convites pendentes expirados e fora da janela

Evidências mínimas da auditoria:

- link da execução do workflow
- timestamp de início/fim
- volume removido por categoria (quando disponível)
- confirmação de ausência de erro

## Checklist de aceite

- `RETENTION_JOB_URL` configurado no GitHub Actions
- `PRIVACY_RETENTION_JOB_TOKEN` configurado no GitHub Actions
- `PRIVACY_RETENTION_JOB_TOKEN` igual no ambiente da aplicação
- `LGPD_AUDIT_RETENTION_DAYS` definido no ambiente
- `LGPD_INVITATION_RETENTION_DAYS` definido no ambiente
- deploy/redeploy realizado após ajuste de env
- workflow executado manualmente com sucesso
- primeira auditoria registrada

## Operação contínua recomendada

- Monitorar o cron diário por 2 semanas após ativação
- Registrar falhas recorrentes e criar alerta para execuções com erro
- Revalidar janelas de retenção trimestralmente com Jurídico/DPO
