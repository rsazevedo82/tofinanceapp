# LGPD: Configuração de Ambiente (Canal do Titular e SLA)

Este documento define a configuração mínima de ambiente para o fluxo de direitos do titular na política pública de privacidade.

## Variáveis obrigatórias

1. `NEXT_PUBLIC_PRIVACY_REQUEST_EMAIL`  
Canal oficial para solicitações do titular (ex.: `privacidade@seudominio.com`).

2. `NEXT_PUBLIC_PRIVACY_SLA_DAYS`  
Prazo de atendimento exibido na política pública.  
Padrão recomendado: `15`.

3. `NEXT_PUBLIC_DPO_EMAIL`  
Contato público do encarregado (DPO) exibido na política de privacidade.

## Exemplo de configuração

```env
NEXT_PUBLIC_PRIVACY_REQUEST_EMAIL=privacidade@seudominio.com
NEXT_PUBLIC_PRIVACY_SLA_DAYS=15
NEXT_PUBLIC_DPO_EMAIL=encarregado@seudominio.com
```

## Passo a passo de aplicação

1. Acesse o provedor de deploy (Vercel ou equivalente).
2. Abra as configurações de Environment Variables do projeto.
3. Crie/atualize as duas variáveis acima em todos os ambientes necessários (`Production`, `Preview`, `Development`).
4. Faça redeploy para aplicar os novos valores.

## Validação pós-deploy

1. Abrir `/politica-de-privacidade`.
2. Confirmar se o e-mail aparece corretamente na seção de direitos do titular.
3. Confirmar se o SLA exibido está com o valor esperado (ex.: 15 dias).

## Critérios de aceite

- `NEXT_PUBLIC_PRIVACY_REQUEST_EMAIL` configurado e visível na página pública.
- `NEXT_PUBLIC_PRIVACY_SLA_DAYS` configurado e refletido no texto da política.
- Deploy concluído sem erro após ajuste de variáveis.
