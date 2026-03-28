# Auditoria de UI/UX (Desktop + Mobile)

Data: 28/03/2026  
Escopo: telas de auth, dashboard, formulários, relatórios, navegação, modal, notificações, empty states e PWA banner.

## Criticidade Crítica

OK I) Estrutura mobile quebrando em headers com CTA lateral fixa  
O que é: várias telas usam header com `justify-between` e botão à direita sem fallback responsivo, comprimindo título/ação em larguras menores.  
Por que importa: piora legibilidade, aumenta risco de clique errado e dá sensação de layout “apertado” no mobile.  
Impacto: navegação e ações principais mais claras em telas pequenas; redução de fricção no uso diário.

OK II) Contraste insuficiente em textos pequenos e ações secundárias  
O que é: uso recorrente de texto `#6B7280`, `#FF7F50` e tamanhos `text-xs`/`text-[10px]` em links, labels e CTAs secundários.  
Por que importa: reduz acessibilidade (WCAG), especialmente em ambientes com brilho alto e para usuários com baixa visão.  
Impacto: melhor leitura, menos erro de interpretação e maior conformidade de acessibilidade.

OK III) Relatórios dependem de cor (verde/vermelho) sem redundância visual  
O que é: gráficos e comparativos usam majoritariamente cor para significado (receita vs despesa), com poucas redundâncias de padrão/ícone/texto.  
Por que importa: usuários com daltonismo ou baixa percepção de cor perdem informação.  
Impacto: interpretação mais segura dos dados financeiros e menor risco de decisão errada.

OK IV) Falta de padrão robusto para estados de erro/empty/loading nas telas principais  
O que é: há estados implementados, mas com variação visual grande, baixa hierarquia e mensagens inconsistentes entre páginas.  
Por que importa: em fluxos financeiros, feedback inconsistente reduz confiança e aumenta retrabalho.  
Impacto: experiência mais previsível; melhor taxa de conclusão de tarefas.

## Criticidade Alta

OK I) Ausência de sistema de animação/microinteração unificado  
O que é: existem transições pontuais, mas sem padrão para entrada de tela, troca de aba, expansão de blocos, confirmação e feedback de sucesso.  
Por que importa: sem microinterações consistentes, o app parece “duro” e menos confiável em ações críticas.  
Impacto: percepção de qualidade superior e menor sensação de latência.

OK II) Modal/bottom sheet sem refinamentos mobile (safe-area, gesto e foco contextual)  
O que é: modal funciona, porém falta padrão de handle visual, animação de entrada coerente e espaço dedicado para teclado/safe area em todos os casos.  
Por que importa: formulários em modal são centrais no produto; qualquer fricção aqui afeta quase todo fluxo.  
Impacto: preenchimento mais rápido e menos abandono em criação/edição.

OK III) Conflito potencial de overlays no rodapé (Toast x InstallBanner)  
O que é: ambos são fixos no bottom e podem competir por espaço visual/interação em mobile.  
Por que importa: mensagens críticas podem ficar encobertas ou perder prioridade.  
Impacto: feedbacks mais confiáveis e menor perda de informação.

OK IV) Tipografia e hierarquia visual pouco distintas em páginas de alta densidade  
O que é: muitas telas usam pesos/tamanhos similares entre título, subtítulo e metadados.  
Por que importa: dificulta escaneabilidade, principalmente em páginas com muitos cards e listas.  
Impacto: leitura mais rápida e foco imediato no que é principal.
Status: implementado em 28/03/2026 com classes semânticas (`page-title`, `page-subtitle`, `meta-text`, `kpi-value`, `data-label`, `entity-title`, `entity-meta`) aplicadas nas telas de dashboard, transações, contas, cartões e relatórios.

OK V) Uso excessivo de emoji como linguagem visual principal  
O que é: ícones emoji estão presentes em múltiplos contextos (status, cards, empty states, categorias).  
Por que importa: gera inconsistência de estilo entre plataformas e reduz percepção de produto premium.  
Impacto: identidade visual mais profissional e consistente entre desktop/mobile.
Status: implementado em 28/03/2026 nas telas principais e componentes-base, com troca para `lucide-react` em notificações, empty/error states, contas, cartões, objetivos, divisão, casal e categorias.

## Criticidade Média

OK I) Navegação mobile sem animação de transição e sem reforço de contexto da página atual  
O que é: drawer abre/fecha funcionalmente, mas sem motion claro e sem cabeçalho contextual da seção ativa.  
Por que importa: reduz orientação espacial do usuário no app.  
Impacto: navegação mais intuitiva, especialmente para novos usuários.

OK II) Tabelas dos relatórios pouco amigáveis em mobile  
O que é: tabelas compactas com texto muito pequeno e baixa priorização de colunas.  
Por que importa: leitura de dados financeiros no celular fica cansativa.  
Impacto: melhor compreensão dos relatórios no uso diário via smartphone.
Status: implementado em 28/03/2026 com layout mobile em cards por linha (coluna principal destacada + pares label/valor) e priorização de colunas-chave por aba de relatório.

OK III) Formulários com validação tardia e pouca ajuda progressiva  
O que é: grande parte do feedback aparece no submit; faltam dicas contextuais e validações preditivas em campos sensíveis.  
Por que importa: aumenta tentativa/erro e tempo de preenchimento.  
Impacto: formulários mais rápidos e menos frustração.
Status: implementado em 28/03/2026 com validação em tempo de digitação (`onChange`) e feedback progressivo em formulários críticos (transações, contas, categorias, divisão, metas, login, cadastro e recuperação de senha).

OK IV) Empty states com baixa diferenciação visual  
O que é: vários estados vazios usam estrutura similar (emoji + texto + CTA), sem variação por contexto.  
Por que importa: perde oportunidade de orientar melhor o próximo passo em cada módulo.  
Impacto: aumento de ativação em funcionalidades pouco usadas.
Status: implementado em 28/03/2026 com variações visuais por contexto (`finance`, `cards`, `goals`, `couple`, `category`, `warning`) e bloco de próximos passos acionáveis por módulo.

OK V) Falta de guideline visual para badges, alertas e severidade  
O que é: estilos de aviso/sucesso/erro variam bastante entre componentes.  
Por que importa: o usuário pode subestimar ou superestimar mensagens importantes.  
Impacto: comunicação de risco mais clara.
Status: implementado em 28/03/2026 com guideline semântico (`badge-status-*` e `alert-box-*`) aplicado em toasts, state panels e formulários/fluxos críticos (auth, perfil, casal, cartões e divisão).

## Criticidade Baixa

I) Refino de detalhes visuais de “acabamento”  
O que é: inconsistências pequenas de espaçamento, radius, espessura de borda e densidade de cards.  
Por que importa: não bloqueia uso, mas afeta percepção de qualidade.  
Impacto: interface mais polida e confiável.

II) Melhorias de conteúdo visual contextual  
O que é: há poucos assets além da marca; faltam ilustrações leves e gráficos de apoio em onboarding/empty/offline.  
Por que importa: reduz apelo emocional e orientação visual inicial.  
Impacto: onboarding mais claro e app mais memorável.

## Animações e Microinterações (recomendado implementar)

I) Transições de entrada de página (fade + slight translate, 180–240ms)  
O que é: animação curta e consistente ao trocar de rota/tela principal.  
Por que importa: reduz sensação de “salto brusco”.  
Impacto: fluxo mais fluido em desktop e mobile.

II) Feedback de ação concluída em CTA principal  
O que é: estado “saving/saved” com ícone/label temporário após sucesso.  
Por que importa: confirma conclusão sem depender só de toast.  
Impacto: mais confiança no envio de formulários.

III) Microinteração de progresso em onboarding e objetivos  
O que é: animação de barra/progresso e “checkpoint” ao completar etapa.  
Por que importa: reforça avanço e aumenta engajamento.  
Impacto: maior taxa de conclusão de setup inicial.

IV) Estados de hover/focus/press padronizados  
O que é: padronizar feedback visual e foco acessível em botões, tabs e itens clicáveis.  
Por que importa: melhora usabilidade para mouse, touch e teclado.  
Impacto: menor erro de interação e acessibilidade superior.

## Imagens, Mockups e Materiais Gráficos (necessidade)

I) Ilustrações leves para empty states por domínio (transações, cartões, casal, divisão, offline)  
O que é: conjunto curto de ilustrações proprietárias e coerentes com marca.  
Por que importa: melhora orientação e evita repetição visual de emoji.  
Impacto: experiência mais profissional.

II) Mockups de cartão/fatura no onboarding de cartões  
O que é: representação visual do cartão com limite/uso para explicar conceitos rapidamente.  
Por que importa: reduz carga cognitiva em telas financeiras densas.  
Impacto: onboarding e compreensão mais rápidos.

III) Kit gráfico de status (sucesso, alerta, erro, pendente, bloqueado)  
O que é: ícones e tokens visuais padronizados para severidade.  
Por que importa: acelera leitura de contexto sem depender de texto longo.  
Impacto: comunicação operacional mais clara.

IV) Imagem social e assets de compartilhamento consistentes  
O que é: padronizar OG/social preview por área crítica do produto.  
Por que importa: reforça marca em compartilhamentos e convites (casal).  
Impacto: maior confiança em links recebidos.

## Práticas adicionais recomendadas

I) Design tokens auditáveis e documentação de UI  
O que é: consolidar cor, tipografia, espaçamento, sombra, raio, estado e z-index em um guia único.  
Por que importa: reduz divergência visual entre telas novas e antigas.  
Impacto: manutenção mais barata e evolução mais rápida.

II) Auditoria de acessibilidade contínua (contraste, foco, teclado, leitores de tela)  
O que é: checklist + testes automatizados para componentes base.  
Por que importa: acessibilidade não deve depender de revisão manual pontual.  
Impacto: qualidade consistente em releases.

III) Regressão visual automatizada (desktop + mobile breakpoints)  
O que é: snapshots visuais para páginas críticas em CI.  
Por que importa: evita regressões silenciosas em layout e hierarquia.  
Impacto: releases com menos retrabalho de UI.

IV) Política de conteúdo UX writing por severidade  
O que é: padronizar tom e formato de mensagens de erro/sucesso/ajuda.  
Por que importa: evita mensagens confusas em fluxos financeiros sensíveis.  
Impacto: suporte reduzido e melhor compreensão do usuário.

V) Roadmap de melhoria por ciclos curtos  
O que é: atacar primeiro itens críticos (mobile header, contraste, estados) e depois refinos visuais.  
Por que importa: maximiza ganho de UX com menor esforço inicial.  
Impacto: evolução contínua com resultado percebido já nas primeiras entregas.
