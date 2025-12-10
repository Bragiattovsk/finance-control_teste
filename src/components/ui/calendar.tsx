import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      captionLayout="dropdown"
      fromYear={2000}
      toYear={2030}
      fixedWeeks
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        
        // --- CABEÇALHO ---
        caption: "flex justify-center pt-1 relative items-center",
        
        // Esconde o título estático ("dezembro 2025") pois já temos os dropdowns
        caption_label: "hidden", 
        
        // Container dos dropdowns centralizado
        caption_dropdowns: "flex justify-center gap-1 items-center",

        // --- NAVEGAÇÃO ---
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",

        // --- TABELA (Layout Flex clássico da v8) ---
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        
        // --- DROPDOWNS ---
        // Estiliza os selects nativos para parecerem componentes Shadcn
        dropdown: "bg-background border border-border p-1 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer hover:bg-accent hover:text-accent-foreground",
        dropdown_month: "mr-2", // Espaço entre mês e ano
        dropdown_year: "",
        dropdown_icon: "hidden", // Esconde o ícone nativo feio se houver

        // --- CORREÇÃO CRÍTICA PARA O PRINT QUE VOCÊ MANDOU ---
        // A classe 'vhidden' é usada pelo RDP para labels de acessibilidade ("Month:", "Year:")
        // 'sr-only' é a classe do Tailwind para esconder isso visualmente
        vhidden: "sr-only", 
        
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
