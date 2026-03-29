# Design System e UX Casal - Plano em 2 Sprints

Data: 2026-03-29  
Objetivo: elevar consistência visual, apelo emocional do produto para casal e UX mobile sem regressão funcional.

## Princípios de execução (obrigatórios)

1. Não remover fluxo existente que esteja funcionando.
2. Mudanças visuais devem ser incrementais e reversíveis.
3. Cada PR deve ter escopo pequeno (1 camada por vez: tokens, componente base, tela).
4. Validar sempre:
- build (`npm run build`)
- testes (`npm run test:run`)
- smoke manual em desktop e mobile nas telas alteradas
5. Sem migração massiva “big-bang”.

## Sprint 1 (Fundação + Componentes Base)

Meta: consolidar fundações de design system e aplicar em componentes núcleo reutilizáveis.

### 1. Fundações (tokens semânticos)

Escopo:
- Definir tokens de cor semântica: `bg/surface/text/muted/primary/success/warning/danger/border`.
- Definir tokens de tipografia: escala de título, corpo, legenda.
- Definir tokens de espaçamento e raio.
- Definir tokens de motion (curto, médio, feedback).

Entrega:
- Documento curto com tabela de tokens e uso.
- Variáveis CSS no tema atual (sem alterar comportamento da lógica de negócio).

Critério de aceite:
- Nenhuma tela quebra visualmente.
- Paleta e contrastes permanecem AA nos componentes principais.

### 2. Componentes base com variantes

Escopo:
- `Button` com variantes: `primary`, `secondary`, `ghost`, `danger`.
- `Input`/`Textarea` com estados: `default`, `focus`, `error`, `disabled`.
- `Card` com variantes: `default`, `highlight`, `warning`.
- `Badge/Status` padronizado.

Entrega:
- Catálogo básico de variantes no código.
- Substituição parcial de classes repetidas em telas críticas.

Critério de aceite:
- Sem regressão de interação (submit, disabled, loading, hover/focus).
- Estado de erro visual uniforme em formulários.

### 3. Base mobile/touch-friendly

Escopo:
- Garantir alvo de toque mínimo 44px em botões/itens interativos.
- Revisar overlays/popovers para não sair da viewport.
- Padronizar paddings mobile em cards/listas.

Critério de aceite:
- Navegação usável em viewport 360x800 sem elementos sobrepostos.

## Sprint 2 (Aplicação em Telas + Linguagem Emocional)

Meta: aplicar design system nas jornadas de maior impacto e fortalecer identidade do módulo casal.

### 1. Tabelas e telas prioritárias

Ordem:
1. Dashboard
2. Transações
3. Divisão
4. Conexão do casal
5. Relatórios (ajustes visuais, sem alterar dados)

Critério de aceite:
- Hierarquia visual clara (headline, contexto, CTA primário).
- Estados de loading, empty e erro padronizados.

### 2. Empty states e microcopy

Escopo:
- Todo estado vazio deve ter:
  - título objetivo
  - explicação curta
  - CTA principal
  - próximo passo sugerido
- Linguagem mais calorosa para contexto de casal (sem exagero).

Critério de aceite:
- Não existe tela principal sem estado vazio estruturado.

### 3. Motion significativa e discreta

Escopo:
- Animações curtas para:
  - entrada de cards/listas
  - mudança de abas
  - confirmação de ação
- Respeitar `prefers-reduced-motion`.

Critério de aceite:
- Motion não bloqueia interação.
- Transições consistentes e sem “jank”.

## Backlog técnico (tickets)

### Sprint 1
- DS-01: Definir tokens semânticos e mapear no CSS global.
- DS-02: Refatorar `btn-*` para variantes únicas.
- DS-03: Refatorar `input`/`textarea` para estados padronizados.
- DS-04: Unificar badges/status usados em dashboard/divisão.
- DS-05: Ajustar componentes com toque < 44px.

### Sprint 2
- DS-06: Aplicar componentes base no Dashboard.
- DS-07: Aplicar componentes base em Transações.
- DS-08: Aplicar componentes base em Divisão + Casal.
- DS-09: Revisar empty states e microcopy.
- DS-10: Adicionar motion utilitária com `prefers-reduced-motion`.

## Checklist de PR (não regressão)

Para cada PR:
- [ ] Escopo visual limitado à tela/componente alvo.
- [ ] Sem mudança em regras de negócio/API.
- [ ] Build e testes passando.
- [ ] Smoke test manual desktop+mobile.
- [ ] Sem remoção de funcionalidade existente.

## Métricas de sucesso (UX)

1. Redução de inconsistências visuais reportadas em QA.
2. Redução de cliques errados em mobile (alvo de toque).
3. Aumento de conclusão de fluxos chave (cadastro de transação, criação de split).
4. Melhor percepção qualitativa do módulo casal em testes de usabilidade.
