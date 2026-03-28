## Resumo

Descreva objetivamente o que este PR entrega e por quê.

## Tipo de mudança

- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] Segurança
- [ ] Banco de dados (Migration)
- [ ] Outro

## Checklist geral

- [ ] Rodei `npm run lint`
- [ ] Rodei `npm run test:run`
- [ ] Rodei `npm run build`
- [ ] Atualizei documentação relevante (README/docs)
- [ ] Avaliei impactos de segurança e privacidade (LGPD), quando aplicável

## Banco de dados (Migrations) — Obrigatório

### Migrations incluídas

Liste os arquivos adicionados/alterados:

- `supabase/migrations/...`

### Impacto esperado no banco

Descreva tabelas/índices/constraints/policies afetadas e efeitos esperados.

### Compatibilidade de deploy

- [ ] Mudança compatível com deploy progressivo
- [ ] Exige janela de manutenção
- [ ] Exige execução coordenada com app

Detalhes:

### Plano de rollback — Obrigatório

Escolha e descreva:

- [ ] Rollback direto (reversão segura imediata)
- [ ] Rollback por nova migration
- [ ] Sem rollback direto viável (justificar e descrever contingência)

Passos de rollback:

1.
2.
3.

### Pós-deploy / Validação

- [ ] Migration aplicada em staging
- [ ] Smoke tests de rotas críticas executados
- [ ] Monitoramento de erro e performance de queries revisado

## Testes e validação funcional

Descreva testes executados e evidências (logs, prints, etc.).

## Riscos

Liste riscos técnicos/operacionais remanescentes e mitigação.

## Observações para release

Inclua pré-requisitos, ordem de execução e monitoramento pós-deploy.
