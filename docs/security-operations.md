# Segurança Operacional: Rotação de Segredos e Política de Logs

Este documento define o processo mínimo obrigatório para:
- rotação de segredos (chaves/tokens);
- prevenção de vazamento de dados sensíveis em logs.

## 1) Escopo de segredos

Consideramos segredo:
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (pública no cliente, mas ainda controlada)
- `UPSTASH_REDIS_REST_TOKEN`
- tokens de provedores externos (quando adicionados)
- chaves de integração usadas no backend/CI

## 2) Cadência de rotação

- Rotação preventiva: a cada 90 dias.
- Rotação imediata: incidente de segurança, suspeita de vazamento, ou saída de pessoa com acesso privilegiado.
- Rotação extraordinária: mudança de fornecedor/projeto ou escopo de permissões.

## 3) Procedimento de rotação (checklist)

1. Gerar novo segredo no provedor.
2. Atualizar variáveis em produção (Vercel/Supabase/Upstash).
3. Atualizar variáveis em staging e ambientes locais autorizados.
4. Realizar deploy.
5. Executar smoke test de autenticação, leituras e escritas financeiras.
6. Revogar o segredo antigo.
7. Registrar evidência da rotação (data, responsável, motivo, serviços afetados).

## 4) Checklist de incidente (vazamento suspeito)

1. Congelar alterações não essenciais.
2. Rotacionar imediatamente os segredos do serviço afetado.
3. Revogar sessões/tokens relacionados quando aplicável.
4. Revisar logs de auditoria e acessos anômalos.
5. Comunicar impacto, janela de exposição e ações corretivas.
6. Abrir post-mortem com melhorias permanentes.

## 5) Política de logs

Regras obrigatórias:
- Nunca registrar senha, token, cookie, `Authorization`, api key ou segredo.
- Mensagens públicas devem ser genéricas; detalhes técnicos só em log interno.
- Preferir `logInternalError(...)` e logger central; evitar `console.*` direto em rotas.
- Incluir contexto operacional (rota, ação, status), não payload sensível.

## 6) Controles técnicos no código

Implementado no projeto:
- Sanitização automática de logs em `lib/logSanitizer.ts`
- `logInternalError` redige dados sensíveis antes de emitir log
- `lib/logger.ts` sanitiza `details` automaticamente

Observação:
- Campos com nomes sensíveis (ex.: `password`, `token`, `secret`, `authorization`, `cookie`, `api_key`) são mascarados com `[REDACTED]`.
- Strings com padrão de Bearer/JWT também são mascaradas.
