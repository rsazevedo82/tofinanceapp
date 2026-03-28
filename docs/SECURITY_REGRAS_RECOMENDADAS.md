# Regras de Segurança Recomendadas para o Produto

Este documento descreve as recomendações levantadas para fortalecer a segurança do produto financeiro, explicando o que cada item significa e por que é relevante.

## Alta prioridade

OK ### 1) TypeScript e lint obrigatórios no build
O que é: impedir deploy quando há erro de tipagem ou regra de lint quebrada.
Por que importa: reduz risco de bug em produção, inclusive falhas de autorização e validação.
Impacto: build mais confiável; eventuais PRs vão falhar mais cedo no CI.

OK ### 2) Rate limit por rota e por usuário
O que é: limitar volume de requisições por endpoint, IP e também por `user_id`.
Por que importa: só limitar por IP não cobre bem cenários com proxies/NAT ou abuso de conta autenticada.
Impacto: menor risco de abuso, scraping e degradação de serviço.

OK ### 3) Proteção anti-bruteforce em login/cadastro
O que é: após várias tentativas inválidas, aplicar bloqueio temporário e aumento progressivo de espera (backoff).
Por que importa: reduz chance de adivinhação de senha.
Impacto: melhora segurança de conta; exige UX clara para mensagens de bloqueio.

### 4) MFA opcional (TOTP)
O que é: segundo fator de autenticação (ex.: app autenticador com código temporário).
Por que importa: mesmo com senha vazada, atacante não acessa sem segundo fator.
Impacto: forte ganho de proteção de conta; adiciona fluxo de setup e recuperação.

OK ### 5) Gestão de sessão
O que é: expiração curta, rotação de refresh token e revogação de sessão no logout.
Por que importa: limita janela de uso de sessão roubada.
Impacto: segurança operacional maior; exige ajuste nas políticas do provedor de auth.

OK ### 6) Auditoria de eventos sensíveis
O que é: registrar ações críticas (login, troca de senha, alterações financeiras, convites de casal, etc.).
Por que importa: facilita investigação, detecção de fraude e suporte ao usuário.
Impacto: aumenta rastreabilidade; precisa política de retenção e acesso aos logs.

OK ### 7) Rotação de segredos e política de logs
O que é: processo formal para girar chaves/tokens e regra para nunca registrar dados sensíveis.
Por que importa: reduz impacto de vazamento e evita exposição acidental.
Impacto: disciplina operacional contínua; precisa checklist em incidentes e deploy.

OK ### 8) Idempotência em rotas financeiras de escrita
O que é: aceitar `idempotency-key` para evitar criação duplicada em retry/reenvio.
Por que importa: previne lançamentos/pagamentos duplicados por falha de rede ou duplo clique.
Impacto: consistência financeira maior; exige armazenamento e validação da chave.

## Média prioridade

### 1) CSRF em defesa em profundidade
O que é: além de `Origin`, validar `Referer` e/ou token CSRF explícito em mutações.
Por que importa: aumenta proteção contra requisições forjadas em navegador.
Impacto: reforço de segurança com pouca mudança de UX quando bem implementado.

OK ### 2) Erros padronizados sem detalhes internos
O que é: mensagens públicas genéricas e detalhes técnicos apenas em log interno.
Por que importa: evita vazamento de estrutura interna para atacante.
Impacto: superfície de ataque menor e suporte mais previsível.

OK ### 3) Alertas de segurança para usuário
O que é: notificar eventos sensíveis (novo dispositivo/local, troca de senha/email).
Por que importa: usuário detecta atividade suspeita cedo.
Impacto: melhora confiança e reação rápida a comprometimentos.

### 4) Verificação de e-mail para ações críticas
O que é: exigir e-mail verificado antes de liberar funções sensíveis.
Por que importa: dificulta abuso de contas descartáveis/não confirmadas.
Impacto: melhora higiene de identidade da base de usuários.

### 5) Constraints de consistência no banco
O que é: regras no banco (check constraints, FK, unique compostas) além de validação da API.
Por que importa: banco vira última barreira contra inconsistência financeira.
Impacto: integridade de dados mais forte, inclusive contra bugs de aplicação.

## Governança e operação

### 1) Backup e restore testado
O que é: política de backup com testes periódicos reais de restauração.
Por que importa: backup sem teste não garante recuperação.
Impacto: continuidade de negócio em incidentes.

### 2) Runbook de incidente
O que é: procedimento claro para resposta a conta comprometida, vazamento e indisponibilidade.
Por que importa: reduz tempo de reação e erros em situação crítica.
Impacto: resposta mais rápida, coordenada e auditável.

OK ### 3) SAST e scanner de dependências no CI
O que é: análise estática e monitoramento de vulnerabilidades de bibliotecas em pipeline.
Por que importa: detecta problemas antes do deploy.
Impacto: prevenção contínua com custo operacional baixo.

### 4) Ambientes separados e menor privilégio
O que é: separar dev/staging/prod e restringir permissões de chaves/serviços ao mínimo necessário.
Por que importa: reduz risco de impacto cruzado e abuso de credenciais.
Impacto: postura de segurança mais madura em produção.

## Observação final

As recomendações acima não substituem requisitos regulatórios específicos. Se o produto evoluir para escopo regulado, vale mapear conformidade (LGPD, auditoria, retenção e trilhas formais) com apoio jurídico e de segurança.
