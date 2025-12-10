import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useInvestment } from "@/hooks/useInvestment"
import { useDashboardAnalytics } from "@/hooks/useDashboardMetrics"
import { DollarSign, TrendingDown, TrendingUp, Wallet, ArrowRightLeft, Edit, Save, Plus, Lock, Info } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { NewTransactionModal } from "@/components/NewTransactionModal"
import { NewTransferModal } from "@/components/NewTransferModal"
import { Button } from "@/components/ui/button"
import { useRecurrenceCheck } from "@/hooks/useRecurrenceCheck"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Progress } from "@/components/ui/progress"


import { useEffect, useState } from "react"
import { useDate } from "@/contexts/date-hooks"
import { MonthSelector } from "@/components/MonthSelector"
import { useAuth } from "@/contexts/auth-hooks"
import { DashboardGrid } from "@/components/dashboard/DashboardGrid"
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets"
import { AddWidgetDialog } from "@/components/dashboard/AddWidgetDialog"
import { WidgetType, WidgetSize } from "@/types/dashboard"

import { UpgradeModal } from "@/components/UpgradeModal"
import { useToast } from "@/hooks/use-toast"
import { BalanceDetailsModal } from "@/components/dashboard/BalanceDetailsModal"
import { BalanceSparkline } from "@/components/dashboard/BalanceSparkline"

export function Dashboard() {
    const { currentDate, setCurrentDate } = useDate()
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false)
    const { income, expense, balance, investment, realizedInvestment, loading, refetch } = useInvestment(currentDate)
    const { walletBalance, balanceHistory, refetch: refetchAnalytics } = useDashboardAnalytics(currentDate)

    useRecurrenceCheck(refetch)

    const { profile } = useAuth()
    const { refreshProfile } = useAuth()
    const isPro = profile?.subscription_tier === 'PRO'
    const { toast } = useToast()

    const { widgets, loading: widgetsLoading, addWidget, deleteWidget, reorderWidgets, refresh } = useDashboardWidgets()
    const [isEditing, setIsEditing] = useState(false)
    const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const success = params.get('success')
        const canceled = params.get('canceled')
        if (success === 'true') {
            toast({ title: 'Parabéns!', description: 'Sua conta PRO foi ativada.' })
            refreshProfile()
            const url = new URL(window.location.href)
            url.searchParams.delete('success')
            window.history.replaceState({}, '', url.toString())
        } else if (canceled === 'true') {
            toast({ title: 'Pagamento cancelado', description: 'Você pode tentar novamente quando quiser.' })
            const url = new URL(window.location.href)
            url.searchParams.delete('canceled')
            window.history.replaceState({}, '', url.toString())
        }
    }, [toast, refreshProfile])

    const handleAddWidgetClick = () => {
        if (isPro) {
            setIsAddWidgetOpen(true);
        } else {
            setIsUpgradeModalOpen(true);
        }
    };

    const handleAddWidget = async (type: WidgetType, size: WidgetSize, options?: { title?: string; config?: { categoryIds?: string[] } }) => {
        await addWidget(type, size, options);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    const monthName = format(currentDate, "MMMM", { locale: ptBR })
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    return (
        <div className="space-y-8 p-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Visão geral das suas finanças e investimentos.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="gap-2 flex-1 sm:flex-none border-dashed border-border hover:border-solid hover:bg-secondary/50"
                            onClick={() => setIsTransferModalOpen(true)}
                        >
                            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                            <span className="hidden sm:inline">Transferir</span>
                        </Button>
                        <NewTransferModal
                            open={isTransferModalOpen}
                            onOpenChange={setIsTransferModalOpen}
                            onSuccess={() => { refetch(); void refetchAnalytics(); }}
                        />
                        <NewTransactionModal onSuccess={() => { refetch(); void refetchAnalytics(); }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* 1. Saldo Atual (Destaque - Top Left) */}
                <Card 
                    onClick={() => setIsBalanceModalOpen(true)}
                    className={cn(
                    "rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border relative overflow-hidden group cursor-pointer hover:bg-card/80 md:col-span-8 h-full min-h-[140px]",
                    walletBalance > 0 ? "bg-emerald-500/10 border-emerald-500/20" : 
                    walletBalance < 0 ? "bg-red-500/10 border-red-500/20" : 
                    "bg-zinc-500/10 border-zinc-500/20"
                )}>
                    <div className={cn(
                        "absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full blur-3xl transition-all duration-500 opacity-20",
                        walletBalance > 0 ? "bg-emerald-500" :
                        walletBalance < 0 ? "bg-red-500" :
                        "bg-zinc-500"
                    )}></div>
                    
                    <CardContent className="p-6 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Saldo em Conta</CardTitle>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-3.5 w-3.5 cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Soma de todas as suas receitas menos despesas desde o início</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <div className={cn(
                                        "p-1.5 rounded-md backdrop-blur-sm ml-1",
                                         walletBalance > 0 ? "bg-emerald-500/10" :
                                         walletBalance < 0 ? "bg-red-500/10" :
                                         "bg-zinc-500/10"
                                    )}>
                                        <Wallet className={cn(
                                            "h-3.5 w-3.5",
                                            walletBalance > 0 ? "text-emerald-600 dark:text-emerald-400" :
                                            walletBalance < 0 ? "text-red-600 dark:text-red-400" :
                                            "text-zinc-600 dark:text-zinc-400"
                                        )} />
                                    </div>
                                </div>
                                
                                <div>
                                    <div className={cn(
                                        "text-4xl font-bold tracking-tight",
                                        walletBalance > 0 ? "text-emerald-600 dark:text-emerald-400" :
                                        walletBalance < 0 ? "text-red-600 dark:text-red-400" :
                                        "text-zinc-900 dark:text-zinc-50"
                                    )}>{formatCurrency(walletBalance)}</div>
                                    <p className={cn(
                                        "text-xs font-medium mt-1",
                                        walletBalance > 0 ? "text-emerald-600/80 dark:text-emerald-400/80" :
                                        walletBalance < 0 ? "text-red-600/80 dark:text-red-400/80" :
                                        "text-zinc-500 dark:text-zinc-400"
                                    )}>
                                        Acumulado total
                                    </p>
                                </div>
                            </div>

                            <div className="hidden md:block flex-1 h-24 ml-4 self-end opacity-80">
                                <BalanceSparkline data={balanceHistory} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Meta de Investimento (Top Right) */}
                <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-primary/20 bg-primary/5 md:col-span-4 h-full min-h-[140px]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-violet-600 dark:text-violet-400">Meta de Investimento</CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <DollarSign className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatCurrency(realizedInvestment)}</div>
                        <div className="flex flex-col gap-1">
                            <p className="text-xs text-primary/70 mt-1 font-medium">
                                de {formatCurrency(investment)} (Meta sugerida)
                            </p>
                            <Progress 
                                value={investment === 0 ? 0 : Math.min((realizedInvestment / investment) * 100, 100)} 
                                className="h-2 mt-1 bg-primary/20 [&>div]:bg-primary"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Receita Mês (Bottom Row) */}
                <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-border/50 bg-card md:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Receita em {capitalizedMonth}</CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(income)}</div>
                        <p className="text-xs text-emerald-500 mt-1 font-medium">
                            + Receitas do mês
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Despesa Mês (Bottom Row) */}
                <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-border/50 bg-card md:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Despesa em {capitalizedMonth}</CardTitle>
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(expense)}</div>
                        <p className="text-xs text-rose-500 mt-1 font-medium">
                            - Despesas do mês
                        </p>
                    </CardContent>
                </Card>

                {/* 5. Balanço Mês (Bottom Row) */}
                <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-border/50 bg-card md:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Balanço de {capitalizedMonth}</CardTitle>
                        <div className={cn(
                            "p-2 rounded-lg",
                            balance >= 0 ? "bg-indigo-500/10" : "bg-rose-500/10"
                        )}>
                            <Wallet className={cn(
                                "h-4 w-4",
                                balance >= 0 ? "text-indigo-500" : "text-rose-500"
                            )} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-bold",
                            balance >= 0 ? "text-indigo-500" : "text-rose-500"
                        )}>
                            {formatCurrency(balance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Resultado do mês
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Customizable Dashboard Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-primary/20 rounded-full"></div>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-foreground">Seu Painel</h2>
                            <p className="text-xs text-muted-foreground">Visualize seus widgets personalizados</p>
                        </div>
                        {!isPro && (
                            <span className="ml-2 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/50 flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Gratuito
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {isPro && (
                            <Button
                                variant={isEditing ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                                className={cn(
                                    "gap-2 transition-all",
                                    isEditing && "ring-2 ring-primary/20"
                                )}
                            >
                                {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                                {isEditing ? "Concluir" : "Editar"}
                            </Button>
                        )}

                        {(isEditing || !isPro) && (
                            <Button 
                                size="sm" 
                                className="gap-2 shadow-sm" 
                                onClick={handleAddWidgetClick}
                                variant={isEditing ? "outline" : "default"}
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Adicionar Widget</span>
                                <span className="sm:hidden">Add</span>
                                {!isPro && <Lock className="h-3 w-3 ml-1 opacity-70" />}
                            </Button>
                        )}
                    </div>
                </div>

                <div className={cn(
                    "rounded-xl border border-border/50 bg-card/50 min-h-[500px] transition-all",
                    isEditing && "border-dashed border-primary/30 bg-primary/5 ring-1 ring-primary/10"
                )}>
                    {widgetsLoading ? (
                        <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-muted-foreground animate-pulse">
                            <div className="h-12 w-12 rounded-full bg-muted"></div>
                            <p>Carregando seu painel...</p>
                        </div>
                    ) : (
                        <DashboardGrid
                            widgets={widgets}
                            loading={widgetsLoading}
                            isEditing={isEditing}
                            onAddWidget={handleAddWidgetClick}
                            isPro={isPro}
                            onRemoveWidget={deleteWidget}
                            onReorderWidgets={reorderWidgets}
                            currentDate={currentDate}
                        />
                    )}
                </div>
            </div>

            <AddWidgetDialog
                open={isAddWidgetOpen}
                onOpenChange={setIsAddWidgetOpen}
                onAdd={handleAddWidget}
                onSuccess={() => { refresh(); setIsAddWidgetOpen(false); }}
            />

            <UpgradeModal
                open={isUpgradeModalOpen}
                onOpenChange={setIsUpgradeModalOpen}
            />

            <BalanceDetailsModal 
                isOpen={isBalanceModalOpen}
                onClose={setIsBalanceModalOpen}
            />
        </div>
    )
}
