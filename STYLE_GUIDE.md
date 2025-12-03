# Finance Control - Style Guide

Este documento define os padrões de interface e experiência do usuário (UI/UX) para o projeto Finance Control. O objetivo é manter a consistência visual e comportamental em todas as páginas do sistema.

## Layout e Estrutura

### Containers Principais
- **Estilo**: `rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden`
- **Uso**: Envolver tabelas principais e seções de conteúdo destacado.

### Cabeçalhos de Página
- **Título**: `text-3xl font-bold tracking-tight text-foreground`
- **Layout**: Flexbox responsivo (`flex-col` no mobile, `flex-row` no desktop) com `gap-4`.
- **Botões de Ação**: Alinhados à direita no desktop, largura total no mobile se necessário.

## Componentes

### Tabelas
- **Header**:
  - Background: `bg-muted/50`
  - Texto: `text-muted-foreground font-semibold`
  - Borda: `border-border/50`
- **Linhas (Rows)**:
  - Hover: `hover:bg-muted/30`
  - Transição: `transition-colors`
  - Borda: `border-border/40`
- **Células Vazias**: Mensagem centralizada com `text-muted-foreground` e altura mínima (`h-24`).

### Badges (Indicadores de Status)
Utilizar variantes com fundo transparente e cores semânticas.

- **Positivo (Receita, Ativo, Lucro)**:
  - Classes: `bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none`
  - Ícones: `TrendingUp`, `CheckCircle2`

- **Negativo (Despesa, Inativo, Prejuízo)**:
  - Classes: `bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-none`
  - Ícones: `TrendingDown`, `XCircle`

- **Neutro / Informativo (Investimento, Categoria)**:
  - Classes: `bg-primary/10 text-primary hover:bg-primary/20 border-none` (ou variantes de cinza/muted para secundários)

### Botões de Ação (Ícones)
- **Excluir**:
  - Variante: `ghost`
  - Classes: `text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10`

### Barra de Pesquisa
- **Container**: `relative w-full sm:w-64`
- **Input**: `pl-8` (para acomodar ícone)
- **Ícone**: Absolute position `left-2 top-2.5`, cor `text-muted-foreground`.

### Paginação
- **Container**: `flex items-center justify-end space-x-2 py-4`
- **Botões**: `variant="outline" size="sm"`
- **Texto**: `text-sm text-muted-foreground`

## Responsividade

- **Mobile First**: Desenvolver layouts pensando primeiro em telas pequenas.
- **Breakpoints**: Utilizar `sm:` (640px) como principal ponto de quebra para transição de layouts empilhados para horizontais.
- **Tabelas no Mobile**: Garantir overflow horizontal ou cards adaptativos se necessário (atualmente utilizando overflow padrão da tabela).

## Acessibilidade e Usabilidade

- **Feedback Visual**: Sempre fornecer feedback de hover e focus em elementos interativos.
- **Loading States**: Utilizar spinners centralizados (`animate-spin`) durante carregamento de dados.
- **Empty States**: Sempre mostrar mensagens claras quando não houver dados a exibir.
- **Confirmação**: Exigir confirmação (`confirm()` ou Modal) para ações destrutivas.
