# Textos da Interface — Nós Dois Reais

> Documento para revisão de copy. Organizado por página/seção.
> Gerado em: 2026-03-24

---

## 1. Login (`/login`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Nós Dois Reais | Branding/Logo | Seção esquerda (desktop) e mobile |
| 2 | Sem brigas por dinheiro. | Tagline | Seção esquerda (desktop) |
| 3 | Organizem a vida financeira juntos. | Tagline | Seção esquerda (desktop) |
| 4 | Entrar | Título H1 | Formulário |
| 5 | Acesse sua conta financeira | Subtítulo | Formulário |
| 6 | Email | Label | Campo de email |
| 7 | seu@email.com | Placeholder | Campo de email |
| 8 | Senha | Label | Campo de senha |
| 9 | •••••••• | Placeholder | Campo de senha |
| 10 | Email ou senha incorretos | Erro | Validação de login |
| 11 | Entrando... | Estado loading | Botão |
| 12 | Entrar | Botão CTA | Principal |
| 13 | Não tem conta? | Texto | Link para cadastro |
| 14 | Criar conta | Link | Redireciona para /cadastro |

---

## 2. Cadastro (`/cadastro`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Nós Dois Reais | Branding/Logo | Seção esquerda (desktop) e mobile |
| 2 | Sem brigas por dinheiro. | Tagline | Seção esquerda (desktop) |
| 3 | Organizem a vida financeira juntos. | Tagline | Seção esquerda (desktop) |
| 4 | Criar conta | Título H1 | Formulário |
| 5 | Comece a controlar suas finanças juntos | Subtítulo | Formulário |
| 6 | Email | Label | Campo de email |
| 7 | seu@email.com | Placeholder | Campo de email |
| 8 | Senha | Label | Campo de senha |
| 9 | mínimo 10 caracteres, letras e números | Placeholder | Campo de senha |
| 10 | Senha deve ter pelo menos 10 caracteres | Erro | Validação |
| 11 | Senha deve conter letras e números | Erro | Validação |
| 12 | Erro ao criar conta. Tente novamente. | Erro | Erro de API |
| 13 | Criando conta... | Estado loading | Botão |
| 14 | Criar conta | Botão CTA | Principal |
| 15 | Já tem conta? | Texto | Link para login |
| 16 | Entrar | Link | Redireciona para /login |

---

## 3. Dashboard (`/`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Dashboard | Título H1 | Cabeçalho |
| 2 | + Nova transacao | Botão CTA | Cabeçalho |
| 3 | Marcar todas como lidas | Botão | Painel de notificações |
| 4 | Saldo em contas | Label | Card KPI |
| 5 | Exclui limite de cartoes de credito | Nota | Card KPI saldo |
| 6 | Receitas | Label | Card KPI |
| 7 | Despesas | Label | Card KPI |
| 8 | Saldo do mes | Label | Card KPI |
| 9 | Taxa de poupanca | Label | Card KPI |
| 10 | Cartoes de credito | Heading | Seção |
| 11 | Fecha dia {X} · Ver fatura → | Info | Card de cartão |
| 12 | Fatura aberta | Label | Card de cartão |
| 13 | Disponivel | Label | Card de cartão |
| 14 | Limite | Label | Card de cartão |
| 15 | Transacoes recentes | Heading | Seção |
| 16 | Ver todas → | Link | Seção transações |
| 17 | Nenhuma transacao este mes | Empty state | Sem transações |
| 18 | Maiores gastos | Heading | Seção |
| 19 | Ver relatorios → | Link | Seção gastos |
| 20 | Nenhum gasto categorizado este mes | Empty state | Sem categorias |

---

## 4. Transações (`/transacoes`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Transacoes | Título H1 | Cabeçalho |
| 2 | {N} lancamento{s} no periodo | Subtítulo dinâmico | Cabeçalho |
| 3 | + Nova | Botão CTA | Cabeçalho |
| 4 | Receitas | Label | Card resumo |
| 5 | Despesas | Label | Card resumo |
| 6 | Saldo | Label | Card resumo |
| 7 | ↓ Despesas ({N}) | Tab | Abas |
| 8 | ↑ Receitas ({N}) | Tab | Abas |
| 9 | Nenhuma despesa neste periodo | Empty state | Aba despesas vazia |
| 10 | Nenhuma receita neste periodo | Empty state | Aba receitas vazia |
| 11 | Total de despesas | Label | Rodapé da lista |
| 12 | Total de receitas | Label | Rodapé da lista |
| 13 | Nova transacao | Título modal | Modal de criação |
| 14 | Editar transacao | Título modal | Modal de edição |
| 15 | Excluir transacao | Botão | Ação de delete |
| 16 | Confirmar exclusao | Botão | Confirmação de delete |
| 17 | Cancelar | Botão | Cancelamento |

---

## 5. Contas (`/contas`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Contas | Título H1 | Cabeçalho |
| 2 | {N} conta{s} ativa{s} | Subtítulo dinâmico | Cabeçalho |
| 3 | + Nova conta | Botão CTA | Cabeçalho |
| 4 | Saldo total em contas | Label | Card KPI |
| 5 | Poupanca, corrente e carteiras (cartoes nao incluidos) | Nota | Card KPI |
| 6 | Nenhuma conta ainda | Empty state título | Tela vazia |
| 7 | Adicione sua primeira conta para começar | Empty state desc | Tela vazia |
| 8 | + Criar primeira conta | Botão | Empty state |
| 9 | Suas contas | Heading | Seção |
| 10 | Conta corrente | Label tipo | Tipo de conta |
| 11 | Poupanca | Label tipo | Tipo de conta |
| 12 | Cartao de credito | Label tipo | Tipo de conta |
| 13 | Investimento | Label tipo | Tipo de conta |
| 14 | Carteira | Label tipo | Tipo de conta |
| 15 | Limite: {valor} | Info | Card de conta (crédito) |
| 16 | Nova conta | Título modal | Modal de criação |
| 17 | Editar conta | Título modal | Modal de edição |

---

## 6. Cartões (`/cartoes`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Cartões | Título H1 | Cabeçalho |
| 2 | {N} cartão{ões} ativo{s} | Subtítulo dinâmico | Cabeçalho |
| 3 | + Novo cartão | Botão CTA | Cabeçalho |
| 4 | Nenhum cartão cadastrado | Empty state título | Tela vazia |
| 5 | Adicione seu primeiro cartão de crédito | Empty state desc | Tela vazia |
| 6 | + Adicionar cartão | Botão | Empty state |
| 7 | Excluir | Botão | Ação no card |
| 8 | Editar | Botão | Ação no card |
| 9 | Ver fatura → | Botão | Ação no card |
| 10 | Limite | Label | Card de cartão |
| 11 | Fatura aberta | Label | Card de cartão |
| 12 | Disponivel | Label | Card de cartão |
| 13 | {N}% do limite utilizado | Info | Card de cartão |
| 14 | Fatura {mês} aguardando pagamento | Aviso | Card de cartão |
| 15 | ⚠️ Ação irreversível | Título | Modal de exclusão |
| 16 | Ao excluir o cartão {nome}, serão removidos permanentemente: | Descrição | Modal de exclusão |
| 17 | • Todas as transações vinculadas ao cartão | Item lista | Modal de exclusão |
| 18 | • Todas as faturas e parcelamentos | Item lista | Modal de exclusão |
| 19 | • O cadastro do cartão | Item lista | Modal de exclusão |
| 20 | Confirme sua senha para prosseguir | Label | Modal de exclusão |
| 21 | Sua senha de acesso | Placeholder | Modal de exclusão |
| 22 | Cancelar | Botão | Modal de exclusão |
| 23 | Excluir cartão | Botão | Modal de exclusão |
| 24 | Excluindo… | Estado loading | Modal de exclusão |
| 25 | Novo cartão | Título modal | Modal de criação |
| 26 | Editar cartão | Título modal | Modal de edição |

---

## 7. Fatura (`/fatura/[id]`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | ← voltar | Link | Cabeçalho |
| 2 | Fecha dia {X} · Vence dia {Y} | Info | Cabeçalho |
| 3 | + Nova transacao | Botão CTA | Cabeçalho |
| 4 | Limite total | Label | Card KPI |
| 5 | Fatura aberta | Label | Card KPI |
| 6 | Disponivel | Label | Card KPI |
| 7 | Faturas | Heading | Seção |
| 8 | Nenhuma fatura ainda. Adicione uma transacao para comecar. | Empty state | Sem faturas |
| 9 | Aberta | Badge status | Status da fatura |
| 10 | Fechada | Badge status | Status da fatura |
| 11 | Paga | Badge status | Status da fatura |
| 12 | Lancamentos · {mês} | Heading | Seção de lançamentos |
| 13 | Nenhum lancamento nesta fatura | Empty state | Fatura vazia |
| 14 | Total da fatura | Label | Rodapé |
| 15 | Pagar fatura | Heading | Seção de pagamento |
| 16 | Pagar com | Label | Select de conta |
| 17 | Selecione uma conta... | Placeholder | Select de conta |
| 18 | Data do pagamento | Label | Campo de data |
| 19 | Processando... | Estado loading | Botão |
| 20 | Pagar {valor} | Botão CTA | Principal |
| 21 | Selecione uma fatura ou adicione uma transacao | Empty state | Painel direito |
| 22 | Nova transacao | Título modal | Modal de criação |

---

## 8. Categorias (`/categorias`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Categorias | Título H1 | Cabeçalho |
| 2 | {N} do sistema · {N} suas | Subtítulo dinâmico | Cabeçalho |
| 3 | + Nova categoria | Botão CTA | Cabeçalho |
| 4 | Suas categorias | Heading | Seção |
| 5 | + Receita | Botão | Atalho criar |
| 6 | + Despesa | Botão | Atalho criar |
| 7 | RECEITAS | Subheading | Subseção |
| 8 | DESPESAS | Subheading | Subseção |
| 9 | Categorias padrao | Heading | Seção |
| 10 | somente leitura | Badge | Indicador |
| 11 | Crie suas proprias categorias | Empty state título | Tela vazia |
| 12 | Personalize alem das categorias padrao | Empty state desc | Tela vazia |
| 13 | + Nova categoria | Botão | Empty state |
| 14 | editar → | Hover hint | Ao passar o mouse |
| 15 | Nova categoria | Título modal | Modal de criação |
| 16 | Editar categoria | Título modal | Modal de edição |

---

## 9. Relatórios (`/relatorios`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Relatorios | Título H1 | Cabeçalho |
| 2 | Analise detalhada das suas financas | Subtítulo | Cabeçalho |
| 3 | Categorias | Tab | Aba |
| 4 | Evolucao | Tab | Aba |
| 5 | Fluxo diario | Tab | Aba |
| 6 | Comparativo | Tab | Aba |
| 7 | Cartoes | Tab | Aba |
| 8 | Projecao | Tab | Aba |
| 9 | Gastos por categoria | Chart título | Aba Categorias |
| 10 | Despesas de {mês} | Chart subtítulo | Aba Categorias |
| 11 | Nenhuma despesa categorizada neste mes | Empty state | Aba Categorias |
| 12 | Categoria | Header tabela | Aba Categorias |
| 13 | Qtd | Header tabela | Aba Categorias |
| 14 | Total | Header tabela | Aba Categorias |
| 15 | % | Header tabela | Aba Categorias |
| 16 | Evolucao mensal | Chart título | Aba Evolução |
| 17 | Receitas e despesas dos ultimos 6 meses | Chart subtítulo | Aba Evolução |
| 18 | Mes | Header tabela | Aba Evolução |
| 19 | Receitas | Header/Label | Aba Evolução |
| 20 | Despesas | Header/Label | Aba Evolução |
| 21 | Saldo | Header tabela | Aba Evolução |
| 22 | Fluxo de caixa diario | Chart título | Aba Fluxo diário |
| 23 | Entradas, saidas e saldo acumulado em {mês} | Chart subtítulo | Aba Fluxo diário |
| 24 | Dia | Header tabela | Aba Fluxo diário |
| 25 | Entrada | Label gráfico | Aba Fluxo diário |
| 26 | Saida | Label gráfico | Aba Fluxo diário |
| 27 | Acumulado | Header tabela | Aba Fluxo diário |
| 28 | Comparativo mensal | Chart título | Aba Comparativo |
| 29 | Mes atual vs mes anterior | Chart subtítulo | Aba Comparativo |
| 30 | Dados insuficientes para comparativo | Empty state | Aba Comparativo |
| 31 | Limites dos cartoes | Chart título | Aba Cartões |
| 32 | Uso atual do limite de credito | Chart subtítulo | Aba Cartões |
| 33 | Nenhum cartao de credito cadastrado | Empty state | Aba Cartões |
| 34 | Cartao | Header tabela | Aba Cartões |
| 35 | Limite | Header tabela | Aba Cartões |
| 36 | Utilizado | Header tabela | Aba Cartões |
| 37 | Disponivel | Header tabela | Aba Cartões |
| 38 | {N}% utilizado · {valor} disponivel | Info | Aba Cartões |
| 39 | Projecao financeira | Chart título | Aba Projeção |
| 40 | Saldo projetado para os proximos 3 meses com base na media historica | Chart subtítulo | Aba Projeção |
| 41 | Receita proj. | Label gráfico | Aba Projeção |
| 42 | Despesa proj. | Label gráfico | Aba Projeção |
| 43 | Saldo proj. | Label gráfico | Aba Projeção |
| 44 | Baseado na media dos ultimos 3 meses | Nota | Aba Projeção |
| 45 | Receita | Header tabela | Aba Projeção |
| 46 | Despesa | Header tabela | Aba Projeção |
| 47 | Tipo | Header tabela | Aba Projeção |
| 48 | Projecao | Valor tabela | Aba Projeção |
| 49 | Real | Valor tabela | Aba Projeção |
| 50 | Erro ao carregar relatorios: {mensagem} | Erro | Geral |

---

## 10. Perfil de Casal (`/casal`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Perfil de Casal | Título H1 | Cabeçalho |
| 2 | Conecte-se ao seu parceiro e acompanhem as finanças juntos | Subtítulo | Cabeçalho |
| 3 | Aceitar convite 💑 | Botão CTA | Notificação de convite |
| 4 | Processando... | Estado loading | Botão aceitar |
| 5 | Recusar | Botão | Notificação de convite |
| 6 | Conectar com seu parceiro | Heading | Formulário de convite |
| 7 | Informe o e-mail do seu parceiro para enviar um convite | Descrição | Formulário de convite |
| 8 | Email do parceiro | Label | Campo |
| 9 | parceiro@email.com | Placeholder | Campo |
| 10 | Convite enviado! Aguardando confirmação do seu parceiro. | Sucesso | Após envio |
| 11 | Enviar convite | Botão CTA | Principal |
| 12 | Enviando... | Estado loading | Botão |
| 13 | Se o email não tiver cadastro, será criada uma conta automaticamente e um e-mail de convite será enviado. | Nota | Abaixo do formulário |
| 14 | Perfil de casal ativo | Título | Estado vinculado |
| 15 | Conectado desde {data} | Info | Estado vinculado |
| 16 | Parceiro vinculado | Label | Indicador |
| 17 | Desvincular perfil de casal | Botão | Ação |
| 18 | Desvincular perfil de casal | Título modal | Modal de desvinculação |
| 19 | Ao desvincular, as seguintes ações serão executadas permanentemente e sem recuperação: | Descrição | Modal |
| 20 | • Os objetivos de casal serão excluídos | Item lista | Modal |
| 21 | • A visão compartilhada dos dados será encerrada | Item lista | Modal |
| 22 | • {parceiro} será notificado | Item lista | Modal |
| 23 | • Um novo vínculo com a mesma pessoa começa do zero | Item lista | Modal |
| 24 | Confirme sua senha para continuar | Label | Modal |
| 25 | •••••••••• | Placeholder | Campo senha no modal |
| 26 | Confirmar desvinculação | Botão CTA | Modal |
| 27 | Desvinculando... | Estado loading | Botão |
| 28 | Cancelar | Botão | Modal |

---

## 11. Divisão (`/divisao`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Divisão | Título H1 | Cabeçalho |
| 2 | Despesas compartilhadas com {parceiro} | Subtítulo dinâmico | Cabeçalho |
| 3 | + Nova divisão | Botão CTA | Cabeçalho |
| 4 | Vocês estão quite! | Título | Card de balanço (equilibrado) |
| 5 | Nenhuma divisão pendente no momento. | Descrição | Card de balanço (equilibrado) |
| 6 | Você deve para {parceiro} | Texto | Card de balanço (você deve) |
| 7 | {parceiro} te deve | Texto | Card de balanço (deve para você) |
| 8 | ⏳ Pendentes | Tab | Aba |
| 9 | ✓ Histórico | Tab | Aba |
| 10 | ⏳ Nenhuma divisão pendente | Empty state | Aba pendentes vazia |
| 11 | 📋 Nenhuma divisão quitada ainda | Empty state | Aba histórico vazia |
| 12 | Registrar primeira divisão | Botão | Empty state |
| 13 | pago por você | Info | Item de divisão |
| 14 | pago por {parceiro} | Info | Item de divisão |
| 15 | pendente | Badge status | Item de divisão |
| 16 | quitado | Badge status | Item de divisão |
| 17 | Você ({N}%) | Label | Item de divisão |
| 18 | {parceiro} ({N}%) | Label | Item de divisão |
| 19 | Quitado em {data} | Info | Item de divisão |
| 20 | ✓ Quitar | Botão | Ação |
| 21 | Quitando… | Estado loading | Botão |
| 22 | Perfil de casal não vinculado | Empty state título | Sem vínculo |
| 23 | Vincule-se ao seu parceiro em Perfil Casal para dividir despesas. | Empty state desc | Sem vínculo |
| 24 | Nova divisão | Título modal | Modal de criação |

---

## 12. Objetivos (`/objetivos`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Objetivos | Título H1 | Cabeçalho |
| 2 | {N} meta{s} · {valor} de {total} acumulados | Subtítulo dinâmico | Cabeçalho |
| 3 | + Nova meta | Botão CTA | Cabeçalho |
| 4 | 👤 Meus objetivos | Tab | Aba |
| 5 | 💑 Do casal | Tab | Aba |
| 6 | Nenhum perfil de casal vinculado | Empty state título | Aba casal sem vínculo |
| 7 | Vincule-se ao seu parceiro em Perfil Casal para criar objetivos compartilhados. | Empty state desc | Aba casal sem vínculo |
| 8 | Em andamento | Heading | Seção |
| 9 | Concluídas 🎉 | Heading | Seção |
| 10 | Nenhum objetivo criado ainda | Empty state título | Aba individual vazia |
| 11 | Nenhum objetivo de casal ainda | Empty state título | Aba casal vazia |
| 12 | Defina uma meta e acompanhe seu progresso mês a mês. | Empty state desc | Tela vazia |
| 13 | Criar primeiro objetivo | Botão | Empty state |
| 14 | casal | Badge | Card de meta compartilhada |
| 15 | ✓ concluída | Badge | Card de meta atingida |
| 16 | Meta atingida! | Info | Progresso do card |
| 17 | Faltam {valor} | Info | Progresso do card |
| 18 | {N}d atrasada | Info prazo | Card |
| 19 | Vence hoje | Info prazo | Card |
| 20 | {N}d restantes | Info prazo | Card |
| 21 | Ocultar aportes | Botão toggle | Card |
| 22 | Ver aportes | Botão toggle | Card |
| 23 | + Aportar | Botão CTA | Card |
| 24 | Nenhum aporte ainda. Seja o primeiro! | Empty state | Lista de aportes |
| 25 | Você | Label | Item de aporte (usuário atual) |
| 26 | Nova meta | Título modal | Modal de criação |
| 27 | Editar meta | Título modal | Modal de edição |
| 28 | Registrar aporte | Título modal | Modal de aporte |

---

## 13. Sidebar — Navegação Global

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Nós Dois Reais | Logo | Topo da sidebar |
| 2 | Menu | Heading | Seção |
| 3 | Dashboard | Link | Navegação |
| 4 | Transações | Link | Navegação |
| 5 | Contas | Link | Navegação |
| 6 | Cartões | Link | Navegação |
| 7 | Categorias | Link | Navegação |
| 8 | Relatórios | Link | Navegação |
| 9 | Objetivos | Link | Navegação |
| 10 | Divisão | Link | Navegação |
| 11 | Perfil Casal | Link | Navegação |
| 12 | A divisão de despesas só está disponível para casais vinculados. | Tooltip/Modal | Item bloqueado (Divisão) |
| 13 | Acesse Perfil Casal e convide seu parceiro(a) para desbloquear. | Tooltip/Modal | Item bloqueado (Divisão) |
| 14 | Entendi | Botão | Modal de item bloqueado |
| 15 | Sair | Botão | Rodapé da sidebar |

---

## 14. Formulário de Transação (`TransactionForm`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | ↓ Despesa | Botão tipo | Seleção de tipo |
| 2 | ↑ Receita | Botão tipo | Seleção de tipo |
| 3 | ⇄ Transferencia | Botão tipo | Seleção de tipo |
| 4 | Valor (R$) | Label | Campo |
| 5 | 0,00 | Placeholder | Campo valor |
| 6 | Descricao | Label | Campo |
| 7 | Ex: Supermercado, Salario... | Placeholder | Campo descrição |
| 8 | Conta | Label | Select |
| 9 | Selecione uma conta... | Placeholder | Select conta |
| 10 | Parcelas | Label | Select |
| 11 | A vista | Opção | Select parcelas (1x) |
| 12 | {N}x de R$ {valor} | Opção dinâmica | Select parcelas |
| 13 | Personalizado... | Opção | Select parcelas |
| 14 | Numero de parcelas (minimo 13) | Placeholder | Campo custom |
| 15 | {N}x de R$ {valor} · Total R$ {total} | Info dinâmica | Resumo de parcelamento |
| 16 | Informe um numero de parcelas entre 13 e 360. | Erro | Validação |
| 17 | Categoria | Label | Select |
| 18 | Sem categoria | Opção | Select categoria |
| 19 | Data | Label | Campo |
| 20 | Mais opcoes (status, observacoes) | Texto collapser | Expansor |
| 21 | Menos opcoes | Texto collapser | Expansor |
| 22 | Status | Label | Select |
| 23 | Confirmado | Opção | Select status |
| 24 | Pendente | Opção | Select status |
| 25 | Observacoes | Label | Textarea |
| 26 | Informacoes adicionais... | Placeholder | Textarea |
| 27 | Salvando... | Estado loading | Botão |
| 28 | Salvar alteracoes | Botão | Editar |
| 29 | Criar {N} parcelas | Botão dinâmico | Criar com parcelamento |
| 30 | Registrar receita | Botão | Criar receita |
| 31 | Registrar transferencia | Botão | Criar transferência |
| 32 | Registrar despesa | Botão | Criar despesa |

---

## 15. Formulário de Conta (`AccountForm`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Nome da conta | Label | Campo |
| 2 | Ex: Nubank, Itau, Carteira... | Placeholder | Campo nome |
| 3 | Tipo | Label | Select |
| 4 | Conta corrente | Opção | Select tipo |
| 5 | Poupanca | Opção | Select tipo |
| 6 | Cartao de credito | Opção | Select tipo |
| 7 | Investimento | Opção | Select tipo |
| 8 | Carteira | Opção | Select tipo |
| 9 | Configuracoes do cartao | Heading | Seção (crédito) |
| 10 | Limite total (R$) | Label | Campo |
| 11 | Ex: 5000,00 | Placeholder | Campo limite |
| 12 | Dia de fechamento | Label | Select |
| 13 | Dia {N} | Opção dinâmica | Select dia |
| 14 | Dia de vencimento | Label | Select |
| 15 | Saldo inicial (R$) | Label | Campo |
| 16 | 0,00 - deixe vazio se nao souber | Placeholder | Campo saldo inicial |
| 17 | Sera registrado como uma transacao de receita inicial. | Nota | Campo saldo inicial |
| 18 | Cor | Label | Color picker |
| 19 | Salvando... | Estado loading | Botão |
| 20 | Salvar alteracoes | Botão | Editar |
| 21 | Criar conta | Botão | Criar |
| 22 | Excluir conta | Botão | Ação de delete |
| 23 | Confirmar exclusao | Botão | Confirmação |
| 24 | Cancelar exclusao | Botão | Cancelamento |
| 25 | Excluindo... | Estado loading | Delete |

---

## 16. Formulário de Categoria (`CategoryForm`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | ↑ Receita | Botão tipo | Seleção de tipo |
| 2 | ↓ Despesa | Botão tipo | Seleção de tipo |
| 3 | Nome da categoria | Label | Campo |
| 4 | Ex: Alimentação, Salário... | Placeholder | Campo nome |
| 5 | Cor | Label | Color picker |
| 6 | Receita | Badge preview | Preview |
| 7 | Despesa | Badge preview | Preview |
| 8 | Salvando... | Estado loading | Botão |
| 9 | Salvar alterações | Botão | Editar |
| 10 | Criar categoria | Botão | Criar |
| 11 | Excluir categoria | Botão | Ação de delete |
| 12 | Confirmar exclusão | Botão | Confirmação |
| 13 | Cancelar exclusão | Botão | Cancelamento |
| 14 | Excluindo... | Estado loading | Delete |

---

## 17. Formulário de Meta (`GoalForm`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Título * | Label | Campo |
| 2 | Ex: Viagem para Europa | Placeholder | Campo título |
| 3 | Descrição | Label | Campo |
| 4 | Opcional | Placeholder | Textarea descrição |
| 5 | Categoria | Label | Grid de seleção |
| 6 | Viagem | Opção | Grid categoria |
| 7 | Imóvel | Opção | Grid categoria |
| 8 | Reserva emergência | Opção | Grid categoria |
| 9 | Educação | Opção | Grid categoria |
| 10 | Veículo | Opção | Grid categoria |
| 11 | Casamento | Opção | Grid categoria |
| 12 | Família | Opção | Grid categoria |
| 13 | Tecnologia | Opção | Grid categoria |
| 14 | Saúde | Opção | Grid categoria |
| 15 | Outro | Opção | Grid categoria |
| 16 | Ícone (emoji) | Label | Campo |
| 17 | ⭐ | Placeholder | Campo ícone |
| 18 | Cor | Label | Color picker |
| 19 | Valor alvo (R$) * | Label | Campo |
| 20 | 0,00 | Placeholder | Campo valor |
| 21 | Prazo | Label | Campo data |
| 22 | Meta de casal 💑 | Checkbox label | Toggle |
| 23 | Ambos podem contribuir e acompanhar o progresso | Nota | Toggle |
| 24 | Cancelar | Botão | Cancelamento |
| 25 | Salvando… | Estado loading | Botão |
| 26 | Salvar alterações | Botão | Editar |
| 27 | Criar meta | Botão | Criar |

---

## 18. Formulário de Divisão (`SplitForm`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Descrição * | Label | Campo |
| 2 | Ex: Jantar no restaurante | Placeholder | Campo |
| 3 | Valor total (R$) * | Label | Campo |
| 4 | 0,00 | Placeholder | Campo valor |
| 5 | Data * | Label | Campo |
| 6 | Sua parte | Label | Slider |
| 7 | Você: {N}% ({valor}) | Info dinâmica | Abaixo do slider |
| 8 | {parceiro}: {N}% ({valor}) | Info dinâmica | Abaixo do slider |
| 9 | Dividir igualmente (50/50) | Link | Atalho |
| 10 | Resumo | Heading | Seção |
| 11 | {parceiro} fica devendo {valor} para você | Info dinâmica | Preview |
| 12 | Cancelar | Botão | Cancelamento |
| 13 | Salvando… | Estado loading | Botão |
| 14 | Registrar divisão | Botão CTA | Principal |

---

## 19. Formulário de Aporte (`ContributionForm`)

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Registrar aporte em {título da meta} | Contexto | Cabeçalho do form |
| 2 | Valor (R$) * | Label | Campo |
| 3 | 0,00 | Placeholder | Campo valor |
| 4 | Data * | Label | Campo |
| 5 | Observação | Label | Campo |
| 6 | Opcional | Placeholder | Campo observação |
| 7 | Cancelar | Botão | Cancelamento |
| 8 | Salvando… | Estado loading | Botão |
| 9 | Registrar aporte | Botão CTA | Principal |

---

## 20. Componentes Globais

### NotificationBell

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Notificações | Heading | Dropdown |
| 2 | Marcar todas como lidas | Botão | Dropdown |
| 3 | Nenhuma notificação | Empty state | Dropdown vazio |
| 4 | agora | Timestamp | Item de notificação |
| 5 | há {N}min | Timestamp | Item de notificação |
| 6 | há {N}h | Timestamp | Item de notificação |
| 7 | há {N}d | Timestamp | Item de notificação |

### PartnerViewBanner

| # | Texto atual | Tipo | Localização |
|---|-------------|------|-------------|
| 1 | Visualizando dados de {parceiro} | Info | Banner global |
| 2 | · a partir de {data} | Info | Banner global |
| 3 | Voltar para os meus dados | Botão CTA | Banner global |

---

*Documento gerado para revisão de copy — Nós Dois Reais*
