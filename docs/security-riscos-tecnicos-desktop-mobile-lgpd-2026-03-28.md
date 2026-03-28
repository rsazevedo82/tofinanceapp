OK ### 1) Recuperação de senha sem camada server-side com antiabuso dedicado [Criticidade: Crítica]
O que é: a tela de recuperação chama `supabase.auth.resetPasswordForEmail` direto no client, sem endpoint próprio com rate limit por IP/usuário/dispositivo e sem desafio anti-bot.
Por que importa: fluxo de recuperação é alvo comum de abuso (spam, enumeração indireta e negação de serviço de caixa de entrada).
Impacto: maior risco de abuso em desktop e mobile, custo operacional e pior experiência para usuários legítimos.
Como melhorar: criar `POST /api/auth/password-recovery` com rate limit forte por IP e fingerprint, cooldown por e-mail hash, CAPTCHA progressivo e telemetria de abuso.

### 2) Política CSRF baseada em `Origin` permissiva quando header ausente [Criticidade: Alta]
O que é: o middleware bloqueia origens não permitidas, mas permite requisições mutáveis sem `Origin`.
Por que importa: defesa baseada só em `Origin` é frágil em cenários de clientes heterogêneos e integrações; faltam token CSRF e validações complementares.
Impacto: superfície residual para requisições indevidas em endpoints de escrita.
Como melhorar: manter allowlist de origem e adicionar token CSRF por sessão (double-submit ou sincronizer token) para rotas mutáveis do browser.

### 3) CSP com `unsafe-inline` para scripts em produção [Criticidade: Alta]
O que é: a política de conteúdo permite script inline em produção.
Por que importa: reduz efetividade contra XSS, especialmente em páginas com dados financeiros e sessões autenticadas.
Impacto: maior potencial de execução de script malicioso no navegador (desktop/mobile).
Como melhorar: migrar para CSP com nonce/hash (`script-src 'self' 'nonce-...'`) e remover `unsafe-inline` gradualmente.

### 4) Política de senha mínima ainda fraca para cenário financeiro [Criticidade: Alta]
O que é: regra atual exige 10 caracteres com letras e números.
Por que importa: atende mínimo básico, mas fica abaixo de baseline moderna para contas com dados sensíveis.
Impacto: maior risco de credenciais fracas e takeover de conta.
Como melhorar: elevar para passphrase (12+), checagem de senha comprometida (HIBP/k-anonymity), bloqueio de senhas comuns e histórico de senha.

### 5) Ausência de MFA/step-up authentication em ações sensíveis [Criticidade: Alta]
O que é: não há evidência de segundo fator para login ou para operações críticas (ex.: alteração de e-mail/senha).
Por que importa: senha comprometida vira acesso total.
Impacto: risco elevado de comprometimento de conta em desktop e mobile.
Como melhorar: habilitar MFA (TOTP/passkey) e step-up para mudanças de segurança e ações financeiras críticas.

### 6) Cobertura de rate limit ainda inconsistente entre rotas [Criticidade: Alta]
O que é: parte das rotas usa controles robustos por IP+usuário, mas outras ainda usam apenas IP/global ou estratégia distinta.
Por que importa: só IP não cobre bem NAT/proxy, abuso de conta autenticada e ataques distribuídos.
Impacto: possibilidade de abuso com tráfego legítimo aparente e degradação de serviço.
Como melhorar: padronizar política por rota com limites por IP, `user_id`, escopo de ação e backoff progressivo.

### 7) Logging de erro heterogêneo (nem todo caminho passa por sanitização central) [Criticidade: Média]
O que é: coexistem logs sanitizados e `console.error(...)` diretos em diversas rotas.
Por que importa: mensagens/stack podem carregar contexto sensível em incidentes.
Impacto: risco de vazamento acidental em observabilidade e suporte.
Como melhorar: unificar logging em wrapper sanitizador único, com bloqueio de chaves sensíveis e revisão automática em CI.

### 8) Coleta de IP e User-Agent em auditoria sem política explícita de retenção [Criticidade: Média]
O que é: eventos de auditoria armazenam IP, user-agent e metadata, mas não há TTL/retention documentada.
Por que importa: IP e user-agent são dados pessoais sob LGPD.
Impacto: risco regulatório e aumento de exposição de dados ao longo do tempo.
Como melhorar: definir retenção formal (ex.: 90/180 dias), anonimização parcial de IP e rotação/expurgo automático.

### 9) LGPD: inventário de dados não está alinhado com a prática atual [Criticidade: Média]
O que é: premissa de “apenas e-mail” não reflete o sistema atual, que também processa IP, user-agent e logs de segurança.
Por que importa: divergência entre prática e documentação jurídica aumenta risco de não conformidade.
Impacto: exposição regulatória em auditoria, atendimento a titular e incidentes.
Como melhorar: atualizar RoPA, política de privacidade e base legal por finalidade (segurança, antifraude, operação).

### 10) LGPD: ausência explícita de fluxo de direitos do titular (acesso/eliminação) [Criticidade: Média]
O que é: não há evidência de endpoint/processo formal para exportação e eliminação integral dos dados do usuário.
Por que importa: direitos de acesso, correção e eliminação precisam ser operacionalizáveis.
Impacto: risco de descumprimento de prazo legal e aumento de custo manual de suporte.
Como melhorar: criar fluxo DSR (download/exclusão), com trilha de auditoria e SLA interno.

### 11) Convites de casal armazenam e-mail em texto claro sem ciclo de vida formal [Criticidade: Média]
O que é: `couple_invitations` mantém `invitee_email` e histórico de status, sem política explícita de limpeza periódica.
Por que importa: mantém PII além do necessário operacional.
Impacto: maior superfície de dados pessoais em caso de incidente.
Como melhorar: expurgar convites antigos (aceitos/cancelados/expirados), considerar hash para buscas secundárias e minimizar retention.

### 12) Dependência de controles do provedor para sessão sem política explícita no app [Criticidade: Média]
O que é: parte da gestão de sessão está delegada ao Supabase, sem evidência de política documentada de expiração/inatividade no nível de produto.
Por que importa: segurança de sessão deve ser explícita e verificável.
Impacto: janela de exposição maior em dispositivo perdido/compartilhado.
Como melhorar: formalizar política de sessão (idle timeout, duração máxima, revogação em eventos sensíveis e device review).

### 13) Falta de “security gates” obrigatórios no pipeline (SAST/SCA/secrets) [Criticidade: Média]
O que é: não há evidência, neste snapshot, de bloqueio obrigatório de merge/deploy por SAST, scanner de dependências e secret scanning.
Por que importa: vulnerabilidades entram em produção com mais facilidade.
Impacto: aumento de risco cumulativo em desktop, mobile e APIs.
Como melhorar: tornar SAST/SCA/secret scanning gates obrigatórios no CI com severidade mínima de bloqueio.

### 14) Ausência de plano de resposta a incidente e rotação de segredos versionado [Criticidade: Média]
O que é: não há artefato operacional claro no repositório para resposta a incidentes e rotação periódica de chaves/tokens.
Por que importa: tempo de contenção define impacto real de incidente.
Impacto: maior MTTR e risco ampliado em vazamentos.
Como melhorar: criar runbooks (incidente, revogação, rotação), checklist por deploy e testes periódicos de prontidão.

### 15) Privacidade mobile/PWA: falta política explícita para dispositivos compartilhados [Criticidade: Baixa]
O que é: não há camada adicional de proteção local (PIN biométrico interno) para reentrada rápida no app instalado.
Por que importa: em aparelhos compartilhados/perdidos, sessão ativa facilita acesso indevido.
Impacto: risco contextual em mobile, mesmo com auth server-side correto.
Como melhorar: oferecer bloqueio de app por biometria/PIN opcional e timeout de reautenticação para telas sensíveis.
