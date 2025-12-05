import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { addMonths, subMonths, format, setMonth, setYear, getYear, getMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription, DrawerHeader, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface MonthSelectorProps {
    currentDate: Date
    onMonthChange: (date: Date) => void
}

export function MonthSelector({ currentDate, onMonthChange }: MonthSelectorProps) {
    const [open, setOpen] = useState(false)
    const [navYear, setNavYear] = useState(getYear(currentDate))
    const isDesktop = useMediaQuery("(min-width: 768px)")

    useEffect(() => {
        if (open) {
            setNavYear(getYear(currentDate))
        }
    }, [open, currentDate])

    const handlePreviousMonth = () => {
        onMonthChange(subMonths(currentDate, 1))
    }

    const handleNextMonth = () => {
        onMonthChange(addMonths(currentDate, 1))
    }

    const handleYearChange = (increment: number) => {
        setNavYear(prev => prev + increment)
    }

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = setMonth(setYear(currentDate, navYear), monthIndex)
        onMonthChange(newDate)
        setOpen(false)
    }

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]

    const SelectorContent = (
        <div className="space-y-4">
            {/* Seletor de Ano */}
            <div className="flex items-center justify-between px-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => handleYearChange(-1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-bold text-lg">{navYear}</span>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => handleYearChange(1)}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            
            {/* Grid de Meses */}
            <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => {
                    const isSelected = getYear(currentDate) === navYear && getMonth(currentDate) === index;
                    const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === navYear;
                    
                    return (
                        <Button
                            key={month}
                            variant={isSelected ? "default" : "ghost"}
                            size="sm"
                            className={cn(
                                "h-9 text-xs font-medium",
                                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                                !isSelected && isCurrentMonth && "border border-primary text-primary hover:bg-primary/10",
                                !isSelected && !isCurrentMonth && "hover:bg-accent hover:text-accent-foreground"
                            )}
                            onClick={() => handleMonthSelect(index)}
                        >
                            {month.substring(0, 3)}
                        </Button>
                    )
                })}
            </div>
        </div>
    )

    if (isDesktop) {
        return (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="ghost" 
                            className="min-w-[160px] font-semibold text-lg capitalize hover:bg-accent hover:text-accent-foreground"
                        >
                            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4" align="center">
                        {SelectorContent}
                    </PopoverContent>
                </Popover>

                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Button 
                        variant="ghost" 
                        className="min-w-[160px] font-semibold text-lg capitalize hover:bg-accent hover:text-accent-foreground"
                    >
                        {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>Selecione a Data</DrawerTitle>
                        <DrawerDescription>
                            Navegue entre anos e meses rapidamente.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-8">
                        {SelectorContent}
                    </div>
                    <DrawerFooter className="pt-2">
                        <DrawerClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
