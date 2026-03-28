# LGPD: Fluxo Interno de Direitos do Titular

Data de vigência: 28/03/2026  
Escopo: solicitações relacionadas a dados pessoais do usuário (e-mail e metadados operacionais vinculados à conta).

## Objetivo

Definir um fluxo padronizado, rastreável e com SLA para atendimento de direitos do titular.

## Canal oficial de atendimento

- Canal primário: e-mail configurado em `NEXT_PUBLIC_PRIVACY_REQUEST_EMAIL`.
- Canal de fallback (quando não configurado): suporte operacional do produto.

Observação:
- A definição do e-mail oficial é obrigatória para produção.

## Direitos cobertos

1. Confirmação de tratamento.
2. Acesso aos dados.
3. Correção de dados incompletos/incorretos.
4. Eliminação de dados, quando aplicável.
5. Informações sobre compartilhamento com terceiros.
6. Revisão de consentimento (quando base legal for consentimento).

## SLA interno

- Confirmação de recebimento: até 2 dias corridos.
- Conclusão da solicitação: até 15 dias corridos.
- Casos complexos: comunicação de extensão justificada antes do vencimento do prazo padrão.

## Fluxo operacional

1. Receber solicitação pelo canal oficial.
2. Registrar ticket interno com:
   - data/hora de entrada
   - identificador do usuário
   - tipo de solicitação
   - responsável pelo atendimento
3. Validar identidade do solicitante (mínimo: confirmação por e-mail autenticado da conta).
4. Classificar pedido (acesso, correção, exclusão, etc.) e base legal aplicável.
5. Executar ação técnica:
   - acesso/exportação: consolidar dados do titular
   - correção: atualizar dados permitidos
   - exclusão: aplicar exclusão conforme regras legais e operacionais
6. Registrar evidências de execução (query, logs, timestamp, operador responsável).
7. Responder ao titular com resultado e data de conclusão.
8. Encerrar ticket com trilha completa para auditoria.

## Evidências mínimas por atendimento

1. ID do ticket.
2. Data de abertura e fechamento.
3. Categoria do direito solicitado.
4. Evidência de validação de identidade.
5. Ação executada e responsável.
6. Resposta enviada ao titular.

## Controles técnicos recomendados

1. Usar logs estruturados com correlação por `request_id`/ticket.
2. Limitar acesso às operações de dados pessoais por perfil de função.
3. Revisar permissões trimestralmente.
4. Reconciliar este fluxo com política pública de privacidade e retenção.

## Hipóteses e informações não validadas

- Hipótese: equipe de suporte e engenharia compartilham o atendimento LGPD.
- Informação não validada: existência de ferramenta dedicada de ticketing para esse fluxo.
