# Padrão de Governança de Migrations (Supabase)

Objetivo: garantir previsibilidade de schema, rastreabilidade, rollback seguro e reprodutibilidade entre ambientes.

## Regras obrigatórias

1. Toda mudança estrutural de banco deve entrar via migration versionada no Git.
2. É proibido alterar schema em produção manualmente sem migration correspondente.
3. PR com migration deve incluir:
   - descrição do que muda;
   - impacto esperado;
   - plano de rollback;
   - validação de compatibilidade com código da aplicação.
4. A ordem de execução das migrations deve ser determinística e idempotente.
5. Mudanças destrutivas (drop/rename sem compatibilidade) exigem plano de transição em duas etapas.

## Convenção de arquivos

- Diretório: `supabase/migrations/`
- Nome: `YYYYMMDDHHMMSS_descricao_curta.sql`
- Exemplo: `20260328101500_add_unique_index_user_profiles_email.sql`

## Fluxo recomendado (PR)

1. Criar migration local.
2. Aplicar localmente e validar que o app sobe e passa checks.
3. Revisar SQL com foco em:
   - lock/tempo de execução;
   - impacto em dados existentes;
   - índices e constraints;
   - RLS/políticas afetadas.
4. Incluir rollback no texto do PR.
5. Fazer merge apenas após aprovação técnica.

## Rollback (mínimo)

Cada migration deve documentar uma estratégia:

- `rollback direto` (DROP de índice/tabela recém-criada, etc.), ou
- `rollback por nova migration` (quando operação não é reversível com segurança).

Se não houver rollback seguro, registrar explicitamente no PR e definir plano de contingência.

## Checklist de release

1. Aplicar migrations em staging.
2. Rodar smoke tests das rotas críticas.
3. Validar métricas/erros de banco após deploy.
4. Aplicar em produção em janela apropriada.
5. Monitorar e, se necessário, executar plano de rollback.

## Observações

- Sempre avaliar compatibilidade reversa entre código e schema durante rollout.
- Priorizar mudanças compatíveis com deploy progressivo (expandir -> migrar dados -> contrair).
