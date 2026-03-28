# Governança de `service_role` (Supabase)

Objetivo: reduzir impacto de falhas de autorização limitando o uso da chave privilegiada (`SUPABASE_SERVICE_ROLE_KEY`) a uma camada dedicada e auditável.

## Regra de arquitetura

1. É proibido importar `@/lib/supabase/admin` diretamente em rotas `app/api/*`.
2. Operações privilegiadas devem ser expostas por funções específicas em `lib/privileged/*`.
3. A camada privilegiada deve conter somente métodos necessários ao caso de uso.

## Camada privilegiada atual

- `lib/privileged/coupleAdmin.ts`
- `lib/privileged/notificationsAdmin.ts`
- `lib/privileged/auditAdmin.ts`

## Controle automático (CI)

- Script: `scripts/check-service-role-usage.mjs`
- Comando: `npm run security:check-service-role-usage`
- Workflow: `Quality Gate` executa o check em PR.

Se houver import direto de `adminClient` fora da allowlist, o pipeline falha.

## Revisão periódica (recomendado: mensal)

Checklist:

1. Revisar funções em `lib/privileged/*` e remover APIs não usadas.
2. Confirmar princípio do menor privilégio por operação.
3. Verificar logs/auditoria de operações sensíveis.
4. Revisar políticas RLS e constraints relacionadas.
5. Atualizar documentação e decisões arquiteturais.

## Checklist para novos PRs

1. Justificar necessidade de operação privilegiada.
2. Implementar função dedicada em `lib/privileged/*` (evitar função genérica ampla).
3. Cobrir fluxo com teste/smoke.
4. Validar impacto de segurança e LGPD.
