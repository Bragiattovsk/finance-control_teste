# Style Guide: Clean Financial UI

Este projeto utiliza uma abordagem **Híbrida (Light & Dark)** com foco em legibilidade e profissionalismo, adotando o sistema visual 'Clean Financial'.

## 1. Paleta de Cores (Zinc Base)

| Elemento | Light Mode (Class) | Dark Mode (Class) | Descrição |
| :--- | :--- | :--- | :--- |
| **Page Background** | `bg-zinc-50` | `bg-zinc-950` | Base da aplicação. |
| **Card/Surface** | `bg-white` | `bg-zinc-900` | Elementos flutuantes. |
| **Borders** | `border-zinc-200` | `border-zinc-800` | Separação sutil. |
| **Sidebar** | `bg-white` | `bg-zinc-950` | Navegação lateral. |

## 2. Tipografia & Contraste

O contraste deve ser ajustado para garantir leitura confortável sem "estourar" a vista.

| Elemento | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| **Títulos (H1-H3)** | `text-zinc-900` | `text-zinc-50` |
| **Body Text** | `text-zinc-600` | `text-zinc-400` |
| **Muted/Subtitles** | `text-zinc-500` | `text-zinc-500` |
| **Icons (Default)** | `text-zinc-500` | `text-zinc-400` |

## 3. Cores Semânticas (Data Viz)

Cores vibrantes devem ser mais escuras no modo claro para manter o contraste WCAG, e mais claras no modo escuro para "brilhar".

| Contexto | Light Mode (`-600`) | Dark Mode (`-400` / `-500`) |
| :--- | :--- | :--- |
| **Primary (Brand)** | `text-violet-600` | `text-violet-400` |
| **Success (Alta)** | `text-emerald-600` | `text-emerald-400` |
| **Danger (Baixa)** | `text-red-600` | `text-red-400` |
| **Warning** | `text-amber-600` | `text-amber-400` |
| **Info** | `text-blue-600` | `text-blue-400` |

## 4. Componentes

### Cards
- **Light:** Fundo branco, borda fina (`border-zinc-200`), sombra suave (`shadow-sm`).
- **Dark:** Fundo cinza escuro (`bg-zinc-900`), borda escura (`border-zinc-800`), sem sombra.

### Gráficos (Recharts)
- **Grid Lines:** `stroke-zinc-200` (Light) / `stroke-zinc-800` (Dark).
- **Tooltips:** Devem seguir o padrão dos Cards (Fundo branco/preto com borda).

### Tabelas
- **Header:** `bg-zinc-50/50` (Light) vs `dark:bg-zinc-900/50`.
- **Linhas (Hover):** `hover:bg-zinc-50` (Light) vs `dark:hover:bg-zinc-800/50`.
- **Bordas:** `border-zinc-200` (Light) vs `dark:border-zinc-800`.
