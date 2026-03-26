# Textos da Interface — Nós 2 Reais

> Documento de referência de copy. Organizado por página/seção.
> Atualizado em: 2026-03-24 — reflete copy dupla (individual vs casal) implementada.
>
> **Legenda de modo:**
> - `solo` — usuário sem parceiro vinculado
> - `casal` — usuário com parceiro vinculado
> - `fixo` — mesmo texto em ambos os modos

---

## 1. Login (`/login`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Nós 2 Reais | Branding/Logo | fixo |
| 2 | Sem brigas por dinheiro. | Tagline | fixo |
| 3 | Organizem a vida financeira juntos. | Tagline | fixo |
| 4 | Entrar | Título H1 | fixo |
| 5 | Acesse sua conta | Subtítulo | fixo |
| 6 | Email | Label | fixo |
| 7 | seu@email.com | Placeholder | fixo |
| 8 | Senha | Label | fixo |
| 9 | •••••••• | Placeholder | fixo |
| 10 | Email ou senha incorretos | Erro | fixo |
| 11 | Entrando... | Estado loading | fixo |
| 12 | Entrar | Botão CTA | fixo |
| 13 | Não tem conta? | Texto | fixo |
| 14 | Criar conta | Link → /cadastro | fixo |

---

## 2. Cadastro (`/cadastro`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Nós 2 Reais | Branding/Logo | fixo |
| 2 | Sem brigas por dinheiro. | Tagline | fixo |
| 3 | Organizem a vida financeira juntos. | Tagline | fixo |
| 4 | Criar conta | Título H1 | fixo |
| 5 | Comece a organizar sua vida financeira | Subtítulo | fixo |
| 6 | Email | Label | fixo |
| 7 | seu@email.com | Placeholder | fixo |
| 8 | Senha | Label | fixo |
| 9 | mínimo 10 caracteres, letras e números | Placeholder | fixo |
| 10 | Senha deve ter pelo menos 10 caracteres | Erro | fixo |
| 11 | Senha deve conter letras e números | Erro | fixo |
| 12 | Erro ao criar conta. Tente novamente. | Erro API | fixo |
| 13 | Criando conta... | Estado loading | fixo |
| 14 | Criar conta | Botão CTA | fixo |
| 15 | Já tem conta? | Texto | fixo |
| 16 | Entrar | Link → /login | fixo |

---

## 3. Sidebar / Menu lateral

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Nós 2 Reais | Logo | fixo |
| 2 | Visão geral | Item menu | fixo |
| 3 | Gastos | Item menu | fixo |
| 4 | Contas | Item menu | fixo |
| 5 | Cartões | Item menu | fixo |
| 6 | Categorias | Item menu | fixo |
| 7 | Relatórios | Item menu | fixo |
| 8 | Objetivos | Item menu | fixo |
| 9 | Divisão de despesas | Item menu | fixo |
| 10 | Conexão do casal | Item menu | fixo |
| 11 | Acesse Conexão do casal e convide seu parceiro(a) para desbloquear. | Tooltip (itens bloqueados) | solo |

---

## 4. Dashboard (`/`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Visão geral | Título H1 | solo |
| 1 | Como vocês estão hoje | Título H1 | casal |
| 2 | + Registrar gasto | Botão | fixo |
| 3 | Seu saldo no mês | Card KPI | solo |
| 3 | Saldo de vocês no mês | Card KPI | casal |
| 4 | Seus últimos gastos | Seção | solo |
| 4 | Últimos gastos de vocês | Seção | casal |
| 5 | Você ainda não registrou gastos este mês | Empty state | solo |
| 5 | Vocês ainda não registraram gastos este mês | Empty state | casal |
| 6 | Onde você mais gastou | Seção gráfico | solo |
| 6 | Onde vocês mais gastaram | Seção gráfico | casal |
| 7 | Nenhum gasto categorizado este mês | Empty state gráfico | solo |
| 7 | Vocês ainda não categorizaram gastos este mês | Empty state gráfico | casal |
| 8 | Nova transação | Título modal | fixo |
| 9 | Ver relatórios → | Link | fixo |

---

## 5. Gastos / Transações (`/transacoes`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Seus gastos | Título H1 | solo |
| 1 | Gastos de vocês | Título H1 | casal |
| 2 | N movimentação(ões) no período | Subtítulo | fixo |
| 3 | + Registrar gasto | Botão | fixo |
| 4 | Você não tem despesas neste período | Empty state (despesa) | solo |
| 4 | Vocês não têm despesas neste período | Empty state (despesa) | casal |
| 5 | Você não tem receitas neste período | Empty state (receita) | solo |
| 5 | Vocês não têm receitas neste período | Empty state (receita) | casal |
| 6 | Nova transação | Título modal criar | fixo |
| 7 | Editar transação | Título modal editar | fixo |
| 8 | Confirmar exclusão | Título modal excluir | fixo |
| 9 | Excluir transação | Botão confirmar exclusão | fixo |

---

## 6. Contas (`/contas`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Suas contas | Subtítulo seção | solo |
| 1 | Contas de vocês | Subtítulo seção | casal |
| 2 | Poupança, corrente e carteiras (cartões não incluídos) | Nota KPI total | fixo |
| 3 | Você ainda não adicionou nenhuma conta | Empty state | solo |
| 3 | Vocês ainda não adicionaram nenhuma conta | Empty state | casal |
| 4 | Adicione sua primeira conta | CTA empty state | fixo |
| 5 | Nova conta | Título modal | fixo |
| 6 | Poupança | Tipo de conta | fixo |
| 7 | Cartão de crédito | Tipo de conta | fixo |

---

## 7. Cartões (`/cartoes`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Cartões de crédito | Título H1 | fixo |
| 2 | Você ainda não cadastrou nenhum cartão | Empty state | solo |
| 2 | Vocês ainda não cadastraram nenhum cartão | Empty state | casal |
| 3 | Adicione seu primeiro cartão | CTA empty state | solo |
| 3 | Adicionem o primeiro cartão de vocês | CTA empty state | casal |
| 4 | + Novo cartão | Botão | fixo |

---

## 8. Fatura (`/fatura/[id]`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Lançamentos · {mês} | Título seção | fixo |
| 2 | + Nova transação | Botão | fixo |
| 3 | Nenhum lançamento nesta fatura | Empty state | fixo |
| 4 | Selecione uma fatura ou adicione uma transação | Empty state (sem fatura selecionada) | fixo |
| 5 | Nova transação | Título modal | fixo |

---

## 9. Categorias (`/categorias`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Categorias | Título H1 | fixo |
| 2 | Categorias padrão | Seção | fixo |
| 3 | Você ainda não criou nenhuma categoria | Empty state | solo |
| 3 | Vocês ainda não criaram nenhuma categoria | Empty state | casal |
| 4 | + Nova categoria | Botão | fixo |

---

## 10. Relatórios (`/relatorios`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Seus relatórios | Título H1 | solo |
| 1 | Relatórios de vocês | Título H1 | casal |
| 2 | Visualize seus gastos ao longo do tempo | Subtítulo | solo |
| 2 | Visualizem os gastos de vocês ao longo do tempo | Subtítulo | casal |
| 3 | Evolução | Aba | fixo |
| 4 | Fluxo diário | Aba | fixo |
| 5 | Cartões | Aba | fixo |
| 6 | Projeção | Aba | fixo |
| 7 | Evolução mensal | Título gráfico | fixo |
| 8 | últimos 6 meses | Subtítulo gráfico | fixo |
| 9 | Mês | Coluna tabela | fixo |
| 10 | Entrada | Coluna tabela | fixo |
| 11 | Saída | Coluna tabela | fixo |
| 12 | Fluxo de caixa diário | Título gráfico | fixo |
| 13 | Mês atual vs mês anterior | Subtítulo gráfico | fixo |
| 14 | Saída | Label gráfico | fixo |
| 15 | Limites dos cartões | Título gráfico | fixo |
| 16 | Cartão | Coluna tabela | fixo |
| 17 | limite de crédito | Label | fixo |
| 18 | Disponível | Coluna tabela | fixo |
| 19 | Projeção para os próximos 3 meses | Título gráfico | fixo |
| 20 | com base na média histórica | Subtítulo gráfico | fixo |
| 21 | últimos 3 meses | Referência período | fixo |
| 22 | Nenhuma despesa categorizada neste mês | Empty state | solo |
| 22 | Vocês ainda não categorizaram despesas este mês | Empty state | casal |

---

## 11. Objetivos (`/objetivos`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Seus objetivos | Título H1 | solo |
| 1 | Objetivos de vocês | Título H1 | casal |
| 2 | N meta(s) · R$ X de R$ Y acumulados | Subtítulo | fixo |
| 3 | + Nova meta | Botão | fixo |
| 4 | 👤 Meus objetivos | Aba | fixo |
| 5 | 💑 Do casal | Aba | fixo |
| 6 | Nenhum perfil de casal vinculado | Estado (aba casal, sem vínculo) | solo |
| 7 | Vincule-se ao seu parceiro em Conexão do casal para criar objetivos compartilhados. | Texto estado | solo |
| 8 | Em andamento | Seção | fixo |
| 9 | Concluídas 🎉 | Seção | fixo |
| 10 | Você ainda não criou nenhum objetivo | Empty state | solo |
| 10 | Vocês ainda não definiram um objetivo em conjunto | Empty state | casal |
| 11 | Defina um objetivo e acompanhe seu progresso | CTA empty state | solo |
| 11 | Definam um objetivo e acompanhem juntos | CTA empty state | casal |
| 12 | Criar primeiro objetivo | Botão empty state | fixo |
| 13 | Nova meta | Título modal criar | fixo |
| 14 | Editar meta | Título modal editar | fixo |

### GoalForm (componente)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Tornar objetivo compartilhado 💑 | Checkbox label | fixo |
| 2 | Ambos podem contribuir e acompanhar juntos | Descrição checkbox | fixo |

---

## 12. Divisão de despesas (`/divisao`)

| # | Texto | Tipo | Modo |
|---|-------|------|------|
| 1 | Divisão de despesas | Título H1 | fixo |
| 2 | Despesas compartilhadas com {parceiro} | Subtítulo | fixo |
| 3 | + Nova divisão | Botão | fixo |
| 4 | Tudo certo entre vocês 👍 | Card saldo zerado | casal |
| 5 | Nenhum valor pendente entre vocês | Subtexto saldo zerado | casal |
| 6 | Você tem um valor pendente com {parceiro} | Card saldo (você deve) | casal |
| 7 | {parceiro} tem um valor pendente com você | Card saldo (parceiro deve) | casal |
| 8 | ⏳ Pendentes | Aba | fixo |
| 9 | ✓ Histórico | Aba | fixo |
| 10 | Nenhuma divisão pendente | Empty state pendentes | fixo |
| 11 | Nenhuma divisão quitada ainda | Empty state histórico | fixo |
| 12 | Registrar primeira divisão | Botão empty state | fixo |
| 13 | Perfil de casal não vinculado | Título (sem vínculo) | solo |
| 14 | Vincule-se ao seu parceiro em Conexão do casal para dividir despesas. | Texto (sem vínculo) | solo |
| 15 | Nova divisão | Título modal | fixo |

### SplitCard (componente)

| # | Texto | Tipo |
|---|-------|------|
| 1 | Pago por você | Subtexto data (split criado por você) |
| 2 | Pago por {parceiro} | Subtexto data (split criado pelo parceiro) |
| 3 | Você ({X}%) | Label coluna divisão |
| 4 | {parceiro} ({Y}%) | Label coluna divisão |
| 5 | pendente | Badge status |
| 6 | quitado | Badge status |
| 7 | Quitando… | Estado loading botão |
| 8 | ✓ Quitar | Botão ação |
| 9 | Remover divisão | Title (tooltip) botão excluir |
| 10 | Quitado em {data} | Texto histórico |

---

## 13. Conexão do casal (`/casal`)

### Estado: sem vínculo

| # | Texto | Tipo |
|---|-------|------|
| 1 | Perfil de Casal | Título H1 |
| 2 | Conectem-se e organizem a vida financeira juntos | Subtítulo |
| 3 | Conectar com seu parceiro | Título card convite |
| 4 | Informe o e-mail do seu parceiro para enviar um convite | Descrição |
| 5 | Email do parceiro | Label |
| 6 | parceiro@email.com | Placeholder |
| 7 | Enviando... | Estado loading |
| 8 | Enviar convite | Botão CTA |
| 9 | Convite enviado. Agora é só aguardar seu parceiro aceitar. | Mensagem sucesso |
| 10 | Se o email não tiver cadastro, será criada uma conta automaticamente e um e-mail de convite será enviado. | Nota |

### Estado: convite recebido

| # | Texto | Tipo |
|---|-------|------|
| 1 | {título da notificação} | Título convite |
| 2 | {corpo da notificação} | Descrição |
| 3 | Processando... | Estado loading |
| 4 | Aceitar convite 💑 | Botão aceitar |
| 5 | Recusar | Botão recusar |

### Estado: vínculo ativo

| # | Texto | Tipo |
|---|-------|------|
| 1 | Vocês já estão conectados 🎉 | Título card |
| 2 | Conectado desde {data} | Subtexto |
| 3 | {nome do parceiro} | Nome no avatar |
| 4 | Parceiro vinculado | Label avatar |
| 5 | Encerrar vínculo do casal | Botão (desvincular) |

### Modal encerrar vínculo

| # | Texto | Tipo |
|---|-------|------|
| 1 | Encerrar vínculo do casal | Título modal |
| 2 | Ao encerrar o vínculo, vocês deixarão de compartilhar dados e objetivos. As seguintes ações serão executadas permanentemente: | Descrição |
| 3 | Os objetivos de casal serão excluídos | Item lista |
| 4 | A visão compartilhada dos dados será encerrada | Item lista |
| 5 | {parceiro} será notificado | Item lista |
| 6 | Um novo vínculo com a mesma pessoa começa do zero | Item lista |
| 7 | Confirme sua senha para continuar | Label |
| 8 | •••••••••• | Placeholder senha |
| 9 | Encerrando... | Estado loading |
| 10 | Confirmar encerramento | Botão confirmar |
| 11 | Cancelar | Botão cancelar |

---

## 14. Componentes globais

### PartnerViewBanner

| # | Texto | Tipo |
|---|-------|------|
| 1 | Você está vendo os dados de {parceiro} | Label banner |
| 2 | Voltar para meus dados | Botão |

### TransactionForm

| # | Texto | Tipo |
|---|-------|------|
| 1 | Despesa | Tipo transação |
| 2 | Receita | Tipo transação |
| 3 | ⇄ Transferência | Tipo transação |
| 4 | Descrição | Label |
| 5 | Salário | Placeholder receita |
| 6 | Número de parcelas (mínimo 13) | Label parcelamento |
| 7 | Informe um número de parcelas entre 13 e 360. | Erro validação parcelas |
| 8 | Menos opções | Toggle avançado (recolher) |
| 9 | Mais opções | Toggle avançado (expandir) |
| 10 | Observações | Label |
| 11 | Informações adicionais | Placeholder obs |
| 12 | Salvar alterações | Botão edição |
| 13 | Registrar transferência | Botão transferência |

### AccountForm

| # | Texto | Tipo |
|---|-------|------|
| 1 | Poupança | Tipo de conta |
| 2 | Cartão de crédito | Tipo de conta |
| 3 | Configurações do cartão | Seção |
| 4 | Se não souber, deixe em branco | Nota |
| 5 | Será registrado como uma transação de receita inicial. | Nota saldo inicial |
| 6 | Salvar alterações | Botão edição |
| 7 | Confirmar exclusão | Botão excluir |
| 8 | Cancelar exclusão | Botão cancelar exclusão |

### SplitForm

| # | Texto | Tipo |
|---|-------|------|
| 1 | {parceiro} tem um valor pendente com você de {valor} | Prévia de saldo |

---

*Última atualização: 2026-03-24 — copy dupla (individual/casal) implementada em todo o app.*
