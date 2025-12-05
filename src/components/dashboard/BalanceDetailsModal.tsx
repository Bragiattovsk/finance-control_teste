import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useBalanceHistory } from "@/hooks/useBalanceHistory"
import { formatCurrency } from "@/lib/format"
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BalanceDetailsModalProps {
    isOpen: boolean
    onClose: (open: boolean) => void
}

export function BalanceDetailsModal({ isOpen, onClose }: BalanceDetailsModalProps) {
    const { annualSummary, monthlyHistory, loading } = useBalanceHistory()

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Evolução do Saldo</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Resumo Anual */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Resumo Anual ({new Date().getFullYear()})</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                                        <span className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">Entradas</span>
                                    </div>
                                    <p className="text-lg font-bold text-emerald-500">{formatCurrency(annualSummary.income)}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                                        <span className="text-xs font-medium text-rose-600/80 dark:text-rose-400/80">Saídas</span>
                                    </div>
                                    <p className="text-lg font-bold text-rose-500">{formatCurrency(annualSummary.expense)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Mini Histórico */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Últimos 12 Meses</h3>
                            <div className="h-[300px] pr-2 overflow-y-auto">
                                <div className="space-y-2">
                                    {monthlyHistory.map((item) => (
                                        <div 
                                            key={`${item.year}-${item.month}`}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium capitalize">
                                                    {item.month}/{item.year}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "font-semibold",
                                                item.result >= 0 ? "text-emerald-500" : "text-rose-500"
                                            )}>
                                                {item.result >= 0 ? "+" : ""}{formatCurrency(item.result)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
