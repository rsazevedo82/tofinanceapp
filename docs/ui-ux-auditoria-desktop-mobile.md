OK ### 1) Classes de UI ausentes em formulários críticos (Objetivos/Divisão)
O que é: formulários usam classes como `input-field`, `label-sm`, `btn-secondary` e `error-msg` sem definição no CSS global.
Por que importa: quebra de estilo em produção reduz clareza visual e confiança do usuário em fluxos financeiros importantes.
Impacto: experiência inconsistente e percepção de produto “quebrado”, principalmente em mobile.
Como melhorar: criar tokens/classes faltantes no `globals.css` (ou migrar tudo para `input`, `label`, `btn-ghost`) e revisar `GoalForm`, `SplitForm` e `ContributionForm`.

OK ### 2) Acessibilidade de zoom bloqueada no mobile
O que é: `viewport` está com `maximumScale: 1` e `userScalable: false`.
Por que importa: impede zoom para usuários com baixa visão e viola boas práticas de acessibilidade.
Impacto: exclusão de parte dos usuários e pior usabilidade em telas pequenas.
Como melhorar: remover bloqueio de zoom e usar `userScalable: true` (ou omitir as flags).

OK ### 3) Navegação com `<a href>` em vez de `Link` do Next
O que é: links internos em auth e outras telas usam âncora HTML comum.
Por que importa: causa recarregamento completo de página, piorando fluidez e percepção de performance.
Impacto: transições menos suaves e maior tempo de navegação em mobile.
Como melhorar: padronizar navegação interna com `next/link`.

OK ### 4) Selects customizados sem acessibilidade de teclado/ARIA
O que é: selects próprios abrem com clique, mas não implementam navegação por setas, `aria-expanded`, `role=listbox`, foco gerenciado.
Por que importa: usuários de teclado e leitores de tela perdem capacidade de uso.
Impacto: barreira de acessibilidade em formulários centrais (transações e filtros).
Como melhorar: trocar para componente acessível (Radix/shadcn Select) ou implementar semântica WAI-ARIA completa.

OK ### 5) Modais sem foco preso e sem fechamento por tecla `Esc`
O que é: modal atual não faz focus trap, não restaura foco e não trata `Escape`.
Por que importa: navegação por teclado e leitores de tela ficam confusas, principalmente em fluxos longos.
Impacto: usabilidade pior e risco de erro em ações críticas.
Como melhorar: migrar para dialog acessível (Radix Dialog) com trap de foco, `Esc`, `aria-modal` e lock de scroll.

OK ### 6) Botões e alvos de toque muito pequenos
O que é: vários CTAs e ações usam `text-xs` e alturas visuais abaixo do ideal de toque (44px).
Por que importa: em mobile aumenta erro de toque e frustração.
Impacto: queda de conversão em tarefas como editar/excluir/lidar com convites.
Como melhorar: padronizar alturas mínimas de ação (`min-h-[44px]`) e espaçamento interno maior.

OK ### 7) Densidade alta em desktop e compressão excessiva em mobile
O que é: telas misturam muitos cards, textos pequenos e grids rígidos sem adaptação progressiva.
Por que importa: leitura fica cansativa e escaneabilidade cai em ambos os contextos.
Impacto: usuários demoram mais para achar ações e interpretar status financeiro.
Como melhorar: definir escala tipográfica por breakpoint e reduzir blocos simultâneos na dobra inicial.

OK ### 8) Grid com colunas fixas em lista de transações
O que é: layout “database” usa colunas fixas (`100px`, `80px`, `90px`) sem ajuste responsivo.
Por que importa: quebra/clipa informação em telas menores e idiomas com textos mais longos.
Impacto: perda de contexto da transação no mobile.
Como melhorar: usar grid responsivo com colunas fluidas e fallback para layout em pilha no mobile.

OK ### 9) Header de transações pode estourar no mobile
O que é: mês + botão primário ficam lado a lado sem estratégia de quebra consistente.
Por que importa: em largura menor ocorrem colisões visuais e perda de legibilidade.
Impacto: acesso ao filtro/período e CTA principal fica prejudicado.
Como melhorar: empilhar ações no mobile (`flex-col`), com CTA full-width e filtro em linha separada.

OK ### 10) Inconsistência semântica de cor (tag income/expense)
O que é: classes de tags usam cores invertidas/confusas em alguns pontos.
Por que importa: cor comunica tipo de movimento financeiro; inconsistência gera erro cognitivo.
Impacto: leitura financeira menos confiável e mais lenta.
Como melhorar: definir semântica única de cor por tipo (`income`, `expense`, `neutral`) em tokens globais.

OK ### 11) Contraste baixo em textos auxiliares pequenos
O que é: uso intenso de `text-xs` com cinza claro em fundos claros.
Por que importa: dificulta leitura em ambientes externos e telas de menor qualidade.
Impacto: perda de informação de contexto (datas, subtítulos, status).
Como melhorar: elevar contraste mínimo para texto auxiliar e reduzir uso de `text-[10px]/[11px]`.

OK ### 12) Falta de padrões de feedback temporal (toast/snackbar)
O que é: muitas ações dependem apenas de mensagens inline, sem confirmação global breve.
Por que importa: usuário nem sempre vê o resultado após rolagem/fechamento de modal.
Impacto: incerteza sobre sucesso/erro em operações financeiras.
Como melhorar: adicionar sistema de toast com mensagens curtas e consistentes.

### 13) Estados de erro de validação pouco granulares
O que é: vários formulários mostram só o primeiro erro global, não todos os campos relevantes.
Por que importa: aumenta tentativas e tempo para completar tarefas.
Impacto: fricção em cadastro, transações e edição de perfil.
Como melhorar: exibir erro por campo, manter resumo no topo e destacar campo com foco automático.

### 14) Fluxos destrutivos sem reforço visual suficiente
O que é: exclusões e desvinculação dependem de clique duplo/senha, mas variam no padrão visual.
Por que importa: ações irreversíveis exigem consistência e clareza máxima.
Impacto: risco de exclusão acidental ou hesitação excessiva.
Como melhorar: adotar padrão único de confirmação destrutiva (modal dedicado + texto de impacto + ação primária em vermelho).

### 15) Falta de “mostrar senha” em formulários autenticados sensíveis
O que é: perfil/casal/cartões ainda têm campos de senha sem toggle de visibilidade.
Por que importa: em mobile aumenta erro de digitação e retrabalho.
Impacto: mais falhas em alteração de senha e confirmações críticas.
Como melhorar: reutilizar componente de senha com botão “Mostrar/Ocultar” e requisitos visíveis.

### 16) Tabelas de relatórios com responsividade limitada
O que é: tabelas em abas de relatório usam `overflow-x-auto`, mas sem adaptação de colunas prioritárias.
Por que importa: rolagem horizontal contínua prejudica leitura comparativa em mobile.
Impacto: análise de dados fica cansativa e menos útil.
Como melhorar: criar modo mobile resumido (cards) e manter tabela completa só em `md+`.

### 17) Falta de hierarchy/action sticky em formulários longos
O que é: formulários extensos não têm CTA fixo no rodapé em mobile.
Por que importa: usuário precisa rolar para concluir, perdendo contexto.
Impacto: abandono maior em criação/edição de transações e metas.
Como melhorar: adicionar barra de ação sticky no mobile com botão primário persistente.

### 18) Drawer mobile sem semântica de navegação acessível
O que é: menu lateral abre visualmente, mas sem roles ARIA, foco inicial e retorno de foco.
Por que importa: navegação assistiva perde contexto da interface.
Impacto: experiência degradada para teclado e leitor de tela.
Como melhorar: usar componente de Sheet/Dialog acessível com foco gerenciado e rotulagem clara.

### 19) Microcopy inconsistente entre áreas
O que é: termos alternam entre “gastos”, “transações”, “movimentações” sem padrão de domínio.
Por que importa: linguagem inconsistente aumenta carga cognitiva.
Impacto: onboarding mais lento e dúvidas de interpretação.
Como melhorar: criar guia de linguagem do produto e aplicar copy system em todas as telas.

### 20) Falta de padronização de espaçamento vertical entre páginas
O que é: headers e blocos variam bastante de margem/padding entre módulos.
Por que importa: sensação de “produto fragmentado” reduz percepção de qualidade.
Impacto: UX menos previsível em navegação recorrente.
Como melhorar: estabelecer layout primitives (PageHeader, SectionBlock, Stack spacing) e aplicar globalmente.
