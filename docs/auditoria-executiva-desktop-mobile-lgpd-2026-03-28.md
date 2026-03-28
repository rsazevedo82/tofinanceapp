# Auditoria Técnica, Segurança, UX e LGPD — Desktop e Mobile

Data de referência: 28/03/2026
Escopo avaliado: código-fonte e configurações do repositório `tofinanceapp`.

## PARTE 1 — Resumo executivo

O projeto tem uma base técnica boa (headers de segurança, middleware, RLS assumido, CodeQL, Dependabot, auditoria e PWA), mas há riscos sistêmicos que hoje aumentam chance de regressão, incidente de segurança e exposição LGPD.

Riscos mais relevantes identificados:
1. Governança de banco frágil: versionamento de migrations está ignorado no Git (`.gitignore` contém `supabase/migrations/`).
2. Qualidade de entrega inconsistente: pipeline principal não roda testes automatizados e já existe falha real na suíte local.
3. Uso amplo de `SUPABASE_SERVICE_ROLE_KEY` em rotas de negócio, sem camada de isolamento de privilégio.
4. CSP em produção com `unsafe-inline` para script e style.
5. Lacunas de privacidade/LGPD para e-mail e metadados (IP/user-agent): transparência, retenção, descarte e direitos do titular.

Top 5 itens críticos e plataforma:
- Item 1 (Migrations): Ambos
- Item 2 (CI sem testes obrigatórios): Ambos
- Item 3 (Service role sem boundary): Ambos
- Item 4 (CSP permissiva): Ambos
- Item 5 (LGPD operacional incompleta): Ambos

Evidências objetivas coletadas:
- `npm run lint`: passou.
- `npm run build`: passou.
- `npm run test:run`: falhou (1 teste unitário + conflito ao carregar teste Playwright no Vitest).

## PARTE 2 — Lista completa de problemas e melhorias

I) Governança de banco sem migrations versionadas

O que é:
O diretório de migrations está ignorado no Git (`.gitignore` com `supabase/migrations/`), impedindo rastreabilidade e reprodutibilidade de schema.

Por que importa:
Sem histórico versionado de banco, o time perde controle de mudanças estruturais, rollback seguro e auditoria técnica.

Impacto:
Redução de risco de incidentes em produção, ambiente previsível entre dev/staging/prod e melhor compliance.

Criticidade:
Crítica

Plataforma afetada:
Ambos

Categoria:
Arquitetura

Como corrigir:
Remover `supabase/migrations/` do ignore, adotar migrations declarativas e obrigar PR com revisão de SQL + plano de rollback.

Esforço estimado:
Médio

Prioridade recomendada:
Imediata

Dependências ou observações:
Hipótese: não foi validado se há fluxo externo de migration fora do repositório.

---

I) Pipeline principal sem testes obrigatórios

O que é:
O workflow `quality-gate.yml` executa lint/build/precache, mas não executa suíte de testes unitários/integrados.

Por que importa:
Regressões funcionais podem ser aprovadas e implantadas mesmo com quebra de regras de negócio.

Impacto:
Detecção precoce de regressões e aumento de confiabilidade de releases.

Criticidade:
Crítica

Plataforma afetada:
Ambos

Categoria:
CI/CD

Como corrigir:
Adicionar `npm run test:run` no gate obrigatório de PR/merge; definir branch protection exigindo esse check.

Esforço estimado:
Baixo

Prioridade recomendada:
Imediata

Dependências ou observações:
Já há falha real atual na suíte.

---

I) Suite de testes com configuração inconsistente (Vitest x Playwright)

O que é:
`vitest run` está tentando carregar `tests/e2e/pwa.spec.ts` (Playwright), causando falha de execução.

Por que importa:
Quebra a confiança no pipeline e dificulta separar falha real de falha de tooling.

Impacto:
Pipeline previsível, menor ruído em CI e diagnóstico mais rápido.

Criticidade:
Alta

Plataforma afetada:
Ambos

Categoria:
Código

Como corrigir:
Excluir `tests/e2e/**` da config do Vitest e manter Playwright isolado no comando E2E.

Esforço estimado:
Baixo

Prioridade recomendada:
Imediata

Dependências ou observações:
Há também teste unitário desatualizado em schema (`balance` vs `initial_balance`).

---

I) Uso amplo de `service_role` em rotas de produto sem camada de privilégio

O que é:
Múltiplas rotas de negócio usam `adminClient` diretamente para leitura/escrita de dados sensíveis e auth admin.

Por que importa:
`service_role` bypassa RLS; qualquer falha lógica vira impacto amplo de autorização.

Impacto:
Menor blast radius de falhas e acesso mais aderente ao princípio do menor privilégio.

Criticidade:
Crítica

Plataforma afetada:
Ambos

Categoria:
Segurança

Como corrigir:
Criar camada server-side dedicada para operações privilegiadas, com contratos estritos, validação forte e auditoria obrigatória; reduzir uso de `adminClient` ao mínimo.

Esforço estimado:
Alto

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Informação não validada: políticas RLS/constraints do banco não foram inspecionadas.

---

I) CSP permissiva em produção (`unsafe-inline`)

O que é:
A política CSP de produção permite `script-src 'unsafe-inline'` e `style-src 'unsafe-inline'`.

Por que importa:
Amplia superfície de XSS e execução de script injetado.

Impacto:
Redução relevante de risco de execução maliciosa no browser.

Criticidade:
Crítica

Plataforma afetada:
Ambos

Categoria:
Segurança

Como corrigir:
Migrar para nonce/hash para scripts/estilos inline críticos, remover `unsafe-inline` gradualmente e monitorar violações CSP.

Esforço estimado:
Médio

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Pode exigir ajustes em componentes que injetam estilo/script inline.

---

I) Endpoints sensíveis sem rate limit consistente

O que é:
Rotas mutáveis importantes (ex.: `transactions/[id]`, `notifications/read-all`, `couple DELETE`) não seguem padrão uniforme de limitação.

Por que importa:
Aumenta risco de abuso, brute-force operacional e picos evitáveis.

Impacto:
Menos risco de abuso e melhor estabilidade sob carga.

Criticidade:
Alta

Plataforma afetada:
Ambos

Categoria:
Segurança

Como corrigir:
Padronizar rate limit por rota crítica (IP + usuário), incluindo operações de alteração/exclusão e fluxos com senha.

Esforço estimado:
Médio

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Priorizar primeiro operações que exigem senha.

---

I) Atualização de estado durante render (`PartnerViewProvider`)

O que é:
Há `setState` em caminho de render quando `!couple && isViewingPartner`.

Por que importa:
Pode causar warnings, comportamento não determinístico e retrabalho de render.

Impacto:
Estabilidade de UI e menor risco de bug intermitente.

Criticidade:
Média

Plataforma afetada:
Ambos

Categoria:
Código

Como corrigir:
Mover a normalização de estado para `useEffect` dependente de `couple`.

Esforço estimado:
Baixo

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Sem dependências externas.

---

I) Acessibilidade de formulários incompleta (`label` sem associação explícita)

O que é:
Múltiplos formulários usam `<label className="label">` sem `htmlFor` + `id` no input.

Por que importa:
Leitores de tela e navegação assistiva perdem contexto de campo.

Impacto:
Melhor usabilidade, conformidade WCAG e menor atrito de preenchimento.

Criticidade:
Alta

Plataforma afetada:
Ambos

Categoria:
Acessibilidade

Como corrigir:
Padronizar componente de campo com `id` único e `label htmlFor`, além de mensagens de erro associadas por `aria-describedby`.

Esforço estimado:
Médio

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Aplicar primeiro em auth e transações.

---

I) Elementos clicáveis sem semântica de botão/link

O que é:
Há cards/divs com `onClick` para navegação sem `role`, `tabIndex` e suporte de teclado.

Por que importa:
Usuários de teclado/tecnologia assistiva têm navegação prejudicada.

Impacto:
Acesso equivalente e melhor UX em desktop e mobile com teclado externo.

Criticidade:
Média

Plataforma afetada:
Ambos

Categoria:
Acessibilidade

Como corrigir:
Trocar para `button`/`Link` semântico ou adicionar acessibilidade completa de teclado.

Esforço estimado:
Baixo

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Revisar padrões em componentes reutilizáveis.

---

I) Drawer mobile sem atributos e gestão de foco acessível

O que é:
Menu mobile abre/fecha via estado, mas sem `aria-expanded`, `aria-controls` e sem focus trap.

Por que importa:
Impacta acessibilidade móvel e navegabilidade por leitor de tela.

Impacto:
Melhor experiência assistiva em mobile.

Criticidade:
Média

Plataforma afetada:
Mobile

Categoria:
Acessibilidade

Como corrigir:
Adicionar atributos ARIA no botão de menu, trap de foco no drawer e retorno de foco ao fechar.

Esforço estimado:
Médio

Prioridade recomendada:
Médio prazo

Dependências ou observações:
Pode usar utilitário de acessibilidade já consolidado (headless/dialog).

---

I) Dados pessoais em auditoria sem política técnica de retenção/expurgo implementada no código

O que é:
Eventos de auditoria registram IP, user-agent e metadados com e-mail em alguns fluxos.

Por que importa:
IP/UA/e-mail são dados pessoais sob LGPD; retenção indefinida eleva risco regulatório e de incidente.

Impacto:
Reduz exposição de dados e melhora postura de conformidade.

Criticidade:
Alta

Plataforma afetada:
Ambos

Categoria:
LGPD

Como corrigir:
Definir TTL de auditoria, mascarar parcialmente IP, minimizar metadados de e-mail e implementar job de expurgo.

Esforço estimado:
Médio

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Hipótese: não foi validado se há política de retenção aplicada direto no banco.

---

I) Transparência LGPD incompleta no produto (política/termos não encontrados em rotas da aplicação)

O que é:
Não foram encontradas páginas públicas de política de privacidade e termos no `app/`.

Por que importa:
Sem transparência clara da coleta e tratamento, cresce risco de não conformidade.

Impacto:
Melhoria jurídica, reputacional e de confiança do usuário.

Criticidade:
Alta

Plataforma afetada:
Ambos

Categoria:
LGPD

Como corrigir:
Publicar página de privacidade/termos com base legal, finalidade, retenção, direitos e canal de contato.

Esforço estimado:
Baixo

Prioridade recomendada:
Imediata

Dependências ou observações:
Informação não validada: pode existir política fora deste repositório.

---

I) Fluxo de direitos do titular não evidenciado tecnicamente

O que é:
Não há evidência no projeto de fluxo operacional para solicitação de acesso, retificação, exclusão e portabilidade.

Por que importa:
Eleva risco de descumprimento de prazos e obrigações da LGPD.

Impacto:
Conformidade operacional e resposta mais rápida a solicitações.

Criticidade:
Média

Plataforma afetada:
Ambos

Categoria:
LGPD

Como corrigir:
Definir processo (ticket/SLA), registrar trilha de atendimento e criar endpoint/backoffice mínimo para solicitações.

Esforço estimado:
Médio

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Requer alinhamento jurídico-operacional.

---

I) Observabilidade técnica ainda centrada em `console` sem telemetria de negócio

O que é:
Há muitos pontos com `console.error`, sem padrão único de correlação, métricas de erro por endpoint e alertas.

Por que importa:
Dificulta troubleshooting e reduz capacidade de resposta a incidentes.

Impacto:
MTTR menor e visibilidade real de saúde do produto.

Criticidade:
Média

Plataforma afetada:
Ambos

Categoria:
Observabilidade

Como corrigir:
Padronizar logger estruturado com request-id/correlation-id, métricas por rota, dashboards e alertas.

Esforço estimado:
Médio

Prioridade recomendada:
Médio prazo

Dependências ou observações:
Integrar com stack de observabilidade (ex.: Datadog/Sentry/OpenTelemetry).

---

I) Dependência de headers para base URL interna (`fetchServerApi`) com risco de host spoofing

O que é:
Quando `NEXT_PUBLIC_APP_URL` não está definido, a base é derivada de `x-forwarded-host`/`host`.

Por que importa:
Pode abrir caminho para comportamentos indevidos de roteamento interno em cenários de header spoofing.

Impacto:
Menor risco de SSRF/abuso de host header.

Criticidade:
Média

Plataforma afetada:
Ambos

Categoria:
Segurança

Como corrigir:
Usar allowlist de host explícita, falhar fechado para host não esperado e preferir URL fixa de ambiente.

Esforço estimado:
Baixo

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Impacto depende da camada de proxy/WAF.

---

I) Acúmulo de arquivos `.bak/.old/.deleted` no repositório

O que é:
Existem dezenas de arquivos legados versionados.

Por que importa:
Aumenta ruído, risco de confusão operacional e chance de reaproveitar código obsoleto.

Impacto:
Codebase mais limpa, revisão mais rápida e menor risco de erro humano.

Criticidade:
Média

Plataforma afetada:
Ambos

Categoria:
Governança técnica

Como corrigir:
Remover artefatos legados, criar política de backup local fora do repo e ajustar `.gitignore`.

Esforço estimado:
Baixo

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Fazer limpeza em PR dedicado para evitar conflitos.

---

I) Documentação técnica desalinhada da stack atual

O que é:
README cita Next 14/Tailwind 3, enquanto o projeto usa Next 15/Tailwind 4.

Por que importa:
Onboarding, troubleshooting e decisões técnicas ficam inconsistentes.

Impacto:
Menor atrito de equipe e menos erros de configuração.

Criticidade:
Baixa

Plataforma afetada:
Ambos

Categoria:
Governança técnica

Como corrigir:
Atualizar README, comandos oficiais e matriz de compatibilidade.

Esforço estimado:
Baixo

Prioridade recomendada:
Curto prazo

Dependências ou observações:
Sem dependências.

## PARTE 3 — Itens específicos de LGPD e privacidade

1. Base legal
- Recomendada: execução de contrato para autenticação/operação da conta; legítimo interesse para segurança (rate limit, auditoria, antifraude).
- Hipótese: base legal formal não foi validada em documento público do produto.

2. Consentimento
- Para e-mail transacional (login, recuperação, segurança): em geral não requer consentimento separado, mas requer transparência.
- Para analytics/telemetria: validar necessidade de consentimento conforme interpretação jurídica e finalidade real.

3. Finalidade e minimização
- Positivo: dado principal identificado é e-mail.
- Ajuste: evitar registrar e-mail em metadata de auditoria quando hash/identificador funcional resolver.

4. Retenção e descarte
- Risco atual: sem evidência técnica de TTL/expurgo para `audit_events`, convites e notificações.
- Recomendação: política objetiva (ex.: 90/180 dias para logs de segurança, com exceções justificadas).

5. Transparência na coleta
- Risco: não foram localizadas rotas de política de privacidade/termos no app.
- Recomendação: publicar documento claro com finalidades, base legal, retenção, compartilhamentos e canal de atendimento.

6. Armazenamento seguro
- Positivo: uso de Supabase com autenticação e controles de sessão; headers de segurança existentes.
- Informação não validada: criptografia em repouso, KMS e segregação por ambiente no provedor.

7. Controle de acesso
- Ponto forte: modelo com RLS (declarado).
- Risco: uso extensivo de `service_role` exige governança rígida de privilégios e revisão contínua.

8. Logs e rastreabilidade
- Positivo: trilha de auditoria implementada.
- Ajuste: padronizar mascaramento de PII e definir retenção/expurgo automático.

9. Compartilhamento com terceiros
- Potenciais terceiros técnicos: Supabase, Vercel, Upstash, Cloudflare Turnstile.
- Recomendação: mapear operadores, contratos, transferências internacionais e responsabilidades.

10. Direitos do titular
- Lacuna: não há evidência de fluxo técnico-operacional para acesso/correção/exclusão/portabilidade.
- Recomendação: processo formal com SLA e trilha auditável.

11. Política de privacidade
- Deve refletir especificamente: e-mail como dado principal, metadados de segurança (IP/UA), retenção, incidentes, contato do encarregado.

12. Medidas técnicas e organizacionais adequadas ao risco
- Recomendação proporcional:
  - Minimizar metadata com e-mail em logs.
  - TTL e purge automático.
  - Acesso restrito a tabelas de auditoria.
  - Revisão periódica de uso de `service_role`.
  - Treinamento do time para resposta a solicitações LGPD.

## PARTE 4 — Plano de ação priorizado

Top 10 ações recomendadas (ordem de execução):

OK 1. Restaurar governança de schema (migrations no Git)
- Ganho esperado: previsibilidade de banco e rollback seguro.
- Quick win: remover ignore e publicar padrão de migration.

OK 2. Tornar testes obrigatórios no gate de PR
- Ganho esperado: queda de regressões em produção.
- Quick win: incluir `npm run test:run` e branch protection.

OK 3. Corrigir configuração de testes (Vitest vs Playwright) e suite quebrada
- Ganho esperado: pipeline confiável.
- Quick win: excluir `tests/e2e/**` do Vitest e ajustar teste de schema.

OK 4. Endurecer CSP (remover `unsafe-inline` gradualmente)
- Ganho esperado: redução de risco XSS.
- Ação estrutural: nonce/hash + monitor de violação.

OK 5. Padronizar rate limit em todas as rotas mutáveis críticas
- Ganho esperado: redução de abuso e maior estabilidade.
- Quick win: `transactions/[id]`, `couple DELETE`, notificações.

OK 6. Reduzir superfície de `service_role`
- Ganho esperado: menor impacto de falha de autorização.
- Ação estrutural: camada privilegiada dedicada e revisões periódicas.

OK 7. Implementar baseline de acessibilidade em formulários e navegação
- Ganho esperado: melhor UX e compliance WCAG.
- Quick win: `htmlFor/id`, keyboard support, ARIA no menu/drawer.

OK 8. Definir e implementar retenção/expurgo LGPD para logs e convites
- Ganho esperado: redução de risco regulatório e de exposição em incidente.
- Ação estrutural: jobs automáticos + política formal.

OK 9. Publicar política de privacidade e fluxo de direitos do titular
- Ganho esperado: conformidade e transparência.
- Quick win: página pública + canal de atendimento e SLA interno.

OK 10. Evoluir observabilidade para padrão de produção
- Ganho esperado: menor MTTR e melhor operação contínua.
- Ação estrutural: logs estruturados, métricas por endpoint, alertas e correlação.
