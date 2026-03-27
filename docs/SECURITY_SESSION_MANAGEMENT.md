# Gestão de Sessão (Supabase)

Este documento define como configurar expiração curta, rotação de refresh token e revogação de sessão no logout.

## O que já está implementado no código

- Logout agora revoga sessões globalmente:
  - `POST /api/auth/logout` usa `supabase.auth.signOut({ scope: 'global' })`
  - Arquivo: `app/api/auth/logout/route.ts`
- Frontend de logout usa o endpoint da API (não apenas signOut local):
  - Arquivo: `hooks/useProfile.ts`

## O que precisa ser configurado no Supabase (painel)

No painel do Supabase, em `Authentication -> Settings`:

1. Reduzir duração do JWT (access token):
- Recomendado: `15 minutos`
- Objetivo: reduzir janela de uso de token vazado.

2. Habilitar rotação de refresh token:
- Manter `Refresh token rotation` habilitado.
- Recomendado: `Reuse interval` curto (ex.: `10 segundos`).
- Objetivo: tornar refresh token de uso único e mitigar replay.

3. Definir tempo máximo de sessão:
- Recomendado: entre `8h` e `24h`, conforme UX desejada.
- Objetivo: forçar reautenticação periódica.

4. Revisar sessão por dispositivo:
- Se disponível no plano/configuração: limitar sessões simultâneas por usuário.
- Objetivo: reduzir persistência de sessões esquecidas em múltiplos dispositivos.

## Checklist de validação

1. Fazer login em dois dispositivos.
2. Executar logout em um dispositivo.
3. Confirmar que ambos perdem sessão (revogação global).
4. Manter aba aberta por mais de 15 minutos e validar renovação normal via refresh.
5. Reutilizar refresh token antigo (cenário de teste controlado) e confirmar rejeição.

## Observações

- Expiração curta melhora segurança, mas pode exigir mais refresh silencioso.
- Se houver aumento de atrito no uso, ajustar de 15 min para 30 min sem remover rotação.
