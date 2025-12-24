import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Target, Calendar, TrendingUp, Edit2, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ConfirmModal } from "@/components/ConfirmModal"

interface Category {
    id: string
    nome: string
    cor: string
}

interface Goal {
    id: string
    title: string
    target_amount: number
    deadline: string
    categories: Category[]
}

interface GoalCardProps {
    goal: Goal
    onEdit: (goal: Goal) => void
    onDelete: () => void
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
    const [currentBalance, setCurrentBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [animatedProgress, setAnimatedProgress] = useState(0)

    // Defensive coding: Ensure categories is always an array
    const categoriesList: Category[] = useMemo(() => Array.isArray(goal.categories) ? goal.categories : [], [goal.categories])

    const progress = Math.min(100, (currentBalance / goal.target_amount) * 100)

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const categoryIds = categoriesList.map(c => c.id)

                if (categoryIds.length === 0) {
                    setCurrentBalance(0)
                    setLoading(false)
                    return
                }

                // Fetch all investments for these categories
                const { data: investmentsData, error } = await supabase
                    .from("investments")
                    .select("amount")
                    .in("category_id", categoryIds)

                if (error) throw error

                const total = investmentsData?.reduce((acc, inv) => acc + Number(inv.amount), 0) || 0
                setCurrentBalance(total)
            } catch (err) {
                console.error("Error fetching goal balance:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchBalance()
    }, [categoriesList])

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedProgress(progress)
        }, 500)
        return () => clearTimeout(timer)
    }, [progress])

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        try {
            const { error } = await supabase
                .from("goals")
                .delete()
                .eq("id", goal.id)

            if (error) throw error
            onDelete()
        } catch (err) {
            console.error("Error deleting goal:", err)
            alert("Erro ao excluir meta.")
        }
    }

    if (loading) {
        return (
            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                <CardContent className="p-6">
                    <div className="h-4 w-1/2 bg-muted/50 animate-pulse rounded mb-4"></div>
                    <div className="h-8 w-full bg-muted/50 animate-pulse rounded"></div>
                </CardContent>
            </Card>
        )
    }

    const remainingAmount = Math.max(0, goal.target_amount - currentBalance)

    // Calculate months remaining
    const today = new Date()
    const deadlineDate = new Date(goal.deadline)
    const monthsRemaining = (deadlineDate.getFullYear() - today.getFullYear()) * 12 + (deadlineDate.getMonth() - today.getMonth())

    // Avoid division by zero or negative months for projection
    const validMonths = Math.max(1, monthsRemaining)
    const monthlyNeeded = remainingAmount / validMonths

    const isOnTrack = progress >= 80

    const categoryNames = categoriesList.length > 0
        ? categoriesList.map(c => c.nome).join(", ")
        : "Nenhuma categoria vinculada"

    return (
        <Card className="group rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="p-5 md:p-6 pb-2">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary/80" />
                            {goal.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-1" title={categoryNames}>
                            {categoryNames}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Meta</div>
                        <div className="text-2xl font-bold tracking-tight text-primary">
                            {formatCurrency(goal.target_amount)}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 md:p-6 pt-2">
                <div className="my-6 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-zinc-600 dark:text-zinc-400">Progresso</span>
                        <span className={cn("font-bold", isOnTrack ? "text-emerald-600" : "text-yellow-600")}>
                            {progress.toFixed(1)}%
                        </span>
                    </div>
                    <Progress
                        value={animatedProgress}
                        className={cn(
                            "h-3 [&>div]:transition-all [&>div]:duration-1000 [&>div]:ease-out",
                            isOnTrack
                                ? "bg-emerald-500/10 [&>div]:bg-emerald-500"
                                : "bg-yellow-500/10 [&>div]:bg-yellow-500"
                        )}
                    />
                    <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-2">
                        <span>Atual: {formatCurrency(currentBalance)}</span>
                        <span>Falta: {formatCurrency(remainingAmount)}</span>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>
                            Prazo: <span className="font-semibold text-foreground">{new Date(goal.deadline).toLocaleDateString("pt-BR")}</span>
                            <span className="ml-1 opacity-80">({monthsRemaining > 0 ? `${monthsRemaining} meses` : "Vencido"})</span>
                        </span>
                    </div>

                    {remainingAmount > 0 && monthsRemaining > 0 && (
                        <div className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                            <TrendingUp className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                                Investir <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyNeeded)}</span> / mês
                            </span>
                        </div>
                    )}

                    {remainingAmount <= 0 && (
                        <div className="flex items-center gap-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            <Target className="h-4 w-4" />
                            <span>Meta Atingida! Parabéns!</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-border/40">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50" 
                        onClick={() => onEdit(goal)}
                    >
                        <Edit2 className="h-4 w-4" />
                        Editar
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                        onClick={handleDeleteClick}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={handleConfirmDelete}
                title="Excluir Meta"
                description={`Tem certeza que deseja excluir a meta "${goal.title}"? Esta ação não pode ser desfeita.`}
            />
        </Card>
    )
}
