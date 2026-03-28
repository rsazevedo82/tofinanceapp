OK ### 1) Ícone principal do PWA é pesado e não otimizado [Criticidade: Crítica]
O que é: o manifesto e metadados usam `n2r-simbolo-principal-claro-V1.png` (~1.4MB) para tamanhos 180/192/512.
Por que importa: ícone entra no fluxo de instalação e pode ser precacheado, aumentando download inicial e tempo para “instalar pronto”.
Impacto: instalação lenta, maior consumo de dados e pior experiência em mobile com rede fraca.
Como melhorar: usar `public/icon-192.png` e `public/icon-512.png` otimizados; manter arquivo branding grande fora do manifesto.

OK ### 2) Inconsistência de tema entre manifesto e viewport [Criticidade: Alta]
O que é: `manifest.webmanifest` usa `background_color/theme_color` escuros, enquanto `app/layout.tsx` usa `themeColor` claro (`#FDFCF0`).
Por que importa: navegador usa essas cores em splash/UI do app instalado; inconsistência gera “flash” visual e sensação de app quebrado.
Impacto: experiência visual inconsistente no launch e alternância navegador/PWA.
Como melhorar: unificar tokens de cor do PWA (manifest + viewport + CSS base), preferencialmente derivados de uma única fonte.

OK ### 3) Cache de API financeira no Service Worker [Criticidade: Alta]
O que é: runtime caching aplica `NetworkFirst` para `/api/*` com cache local (`api-cache`, 60s).
Por que importa: dados financeiros sensíveis podem ficar em cache do SW; também pode mostrar dados levemente defasados em retomada de conexão.
Impacto: risco de inconsistência/privacidade local e comportamento imprevisível em cenários offline-online.
Como melhorar: desabilitar cache para APIs financeiras críticas (`NetworkOnly`) ou segmentar apenas endpoints não sensíveis.

OK ### 4) Fallback offline não está explicitamente configurado no Workbox [Criticidade: Alta]
O que é: existe página `/offline`, mas a configuração não define fallback de navegação/documento de forma explícita.
Por que importa: em falhas de rede, usuários podem ver erro genérico em vez de experiência offline controlada.
Impacto: UX offline inconsistente e maior taxa de abandono em mobile.
Como melhorar: configurar fallback de navegação para `/offline` de forma explícita (document fallback) e testar fluxo sem rede.

OK ### 5) Página offline depende de client JS [Criticidade: Média]
O que é: `app/offline/page.tsx` é `use client`.
Por que importa: em cenários degradados, reduzir dependência de hidratação aumenta robustez.
Impacto: maior risco de tela parcial/sem interação se JS falhar.
Como melhorar: transformar a página offline em server component simples e manter botão de retry progressivo.

OK ### 6) Banner de instalação só cobre iOS Safari [Criticidade: Média]
O que é: `InstallBanner` trata iOS/Safari; não há fluxo customizado para Android via `beforeinstallprompt`.
Por que importa: em Android, instalação fica dependente de prompt nativo (nem sempre exibido no melhor momento).
Impacto: conversão de instalação menor em parte relevante dos usuários mobile.
Como melhorar: adicionar hook para `beforeinstallprompt` e CTA contextual para Android/Chrome.

OK ### 7) “Dismiss” do banner é permanente e sem versionamento [Criticidade: Média]
O que é: usa `localStorage('pwa-install-dismissed')` sem TTL ou reset por versão.
Por que importa: usuário que descartou uma vez nunca vê nova chance, mesmo após melhorias relevantes do app instalado.
Impacto: perda contínua de oportunidade de instalação.
Como melhorar: aplicar TTL (ex.: 30 dias) ou versionar a chave por release/campanha.

OK ### 8) Manifesto usa o mesmo arquivo para múltiplos tamanhos declarados [Criticidade: Média]
O que é: mesmo `src` é declarado como 192, 512 e 180.
Por que importa: auditorias PWA e alguns launchers esperam assets reais por tamanho; pode degradar qualidade/compatibilidade.
Impacto: ícone borrado, recortes ruins ou warnings em validações.
Como melhorar: mapear cada tamanho para arquivo dedicado (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).

OK ### 9) Ícones já otimizados existem, mas não são usados nos metadados [Criticidade: Média]
O que é: `public/icon-192.png`, `public/icon-512.png` e `public/apple-touch-icon.png` estão presentes, porém metadados apontam para outro arquivo.
Por que importa: mantém custo alto sem necessidade e duplica manutenção.
Impacto: pior performance de instalação e inconsistência entre fontes de verdade.
Como melhorar: padronizar manifesto/layout para usar os arquivos otimizados existentes.

OK ### 10) Estratégia de precache pode crescer sem orçamento [Criticidade: Média]
O que é: SW precacheia muitos chunks e assets; não há budget/monitoramento de tamanho de precache.
Por que importa: cada release pode aumentar custo de update silenciosamente.
Impacto: updates mais lentos e consumo de armazenamento em dispositivos com pouco espaço.
Como melhorar: adicionar budget no CI para tamanho de precache e revisar assets grandes antes de merge.

OK ### 11) Falta de testes E2E dedicados para cenários PWA [Criticidade: Média]
O que é: não há validação automatizada de instalação, atualização de SW, fallback offline e retomada online.
Por que importa: regressões de PWA costumam aparecer só em produção/dispositivos reais.
Impacto: bugs intermitentes difíceis de reproduzir e corrigir.
Como melhorar: criar suite de testes (Playwright) para fluxos offline/install/update.

OK ### 12) Classe utilitária `pb-safe` aparece sem definição explícita [Criticidade: Baixa]
O que é: `InstallBanner` usa `pb-safe`, mas a base de estilos não define essa utilidade diretamente.
Por que importa: comportamento pode variar conforme setup Tailwind/utilitários disponíveis.
Impacto: espaçamento inferior inconsistente em alguns dispositivos.
Como melhorar: definir utilitário próprio para safe-area ou manter apenas `style` inline já presente.
