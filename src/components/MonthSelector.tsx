import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { addMonths, subMonths, format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MonthSelectorProps {
    currentDate: Date
    onMonthChange: (date: Date) => void
}

export function MonthSelector({ currentDate, onMonthChange }: MonthSelectorProps) {
    const handlePreviousMonth = () => {
        onMonthChange(subMonths(currentDate, 1))
    }

    const handleNextMonth = () => {
        onMonthChange(addMonths(currentDate, 1))
    }

    return (
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold capitalize min-w-[150px] text-center">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
