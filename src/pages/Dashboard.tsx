import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useInvestment } from "@/hooks/useInvestment"
import { DollarSign, TrendingDown, TrendingUp, Wallet, ArrowRightLeft, Edit, Save, Plus, Lock } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { NewTransactionModal } from "@/components/NewTransactionModal"
import { NewTransferModal } from "@/components/NewTransferModal"
import { Button } from "@/components/ui/button"
import { useRecurrenceCheck } from "@/hooks/useRecurrenceCheck"


import { useState } from "react"
import { MonthSelector } from "@/components/MonthSelector"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardGrid } from "@/components/dashboard/DashboardGrid"
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets"
import { AddWidgetDialog } from "@/components/dashboard/AddWidgetDialog"
import { WidgetType, WidgetSize } from "@/types/dashboard"

import { UpgradeModal } from "@/components/UpgradeModal"
export function Dashboard() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
    const { income, expense, balance, investment, loading, refetch } = useInvestment(currentDate)

    useRecurrenceCheck(refetch)

    const { profile } = useAuth()
    const isPro = profile?.subscription_tier === 'PRO'

    const { loading: widgetsLoading, addWidget } = useDashboardWidgets()
    const [isEditing, setIsEditing] = useState(false)
    const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

    const handleAddWidgetClick = () => {
        if (isPro) {
            setIsAddWidgetOpen(true);
        } else {
            setIsUpgradeModalOpen(true);
        }
    };

    const handleAddWidget = (type: WidgetType, size: WidgetSize, options?: { title?: string; config?: { categoryIds?: string[] } }) => {
        addWidget(type, size, options);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Visão geral das suas finanças e investimentos.</p>
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
                            onSuccess={refetch}
                        />
                        <NewTransactionModal onSuccess={refetch} />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-border/50 bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
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

                <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-border/50 bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Despesa Total</CardTitle>
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

                <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-border/50 bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Atual</CardTitle>
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
                            Balanço final do mês
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary/80">Meta de Investimento</CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(investment)}</div>
                        <p className="text-xs text-primary/70 mt-1 font-medium">
                            Sugestão baseada no perfil
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
                            isEditing={isEditing}
                            onAddWidget={handleAddWidgetClick}
                        />
                    )}
                </div>
            </div>

            <AddWidgetDialog
                open={isAddWidgetOpen}
                onOpenChange={setIsAddWidgetOpen}
                onAdd={handleAddWidget}
            />

            <UpgradeModal
                open={isUpgradeModalOpen}
                onOpenChange={setIsUpgradeModalOpen}
            />
        </div>
    )
}
