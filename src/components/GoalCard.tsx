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

    // Defensive coding: Ensure categories is always an array
    const categoriesList: Category[] = useMemo(() => Array.isArray(goal.categories) ? goal.categories : [], [goal.categories])

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

    const progress = Math.min(100, (currentBalance / goal.target_amount) * 100)
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
        <Card className="group rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            {goal.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1" title={categoryNames}>
                            Vinculado a: <span className="font-medium text-foreground">{categoryNames}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meta</div>
                        <div className="font-bold text-lg text-primary">{formatCurrency(goal.target_amount)}</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-muted-foreground">Progresso Atual</span>
                        <span className={cn("font-bold", isOnTrack ? "text-emerald-600" : "text-yellow-600")}>
                            {progress.toFixed(1)}%
                        </span>
                    </div>
                    <Progress 
                        value={progress} 
                        className={cn(
                            "h-2.5", 
                            isOnTrack 
                                ? "bg-emerald-500/20 [&>div]:bg-emerald-500" 
                                : "bg-yellow-500/20 [&>div]:bg-yellow-500"
                        )} 
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span className="font-medium">{formatCurrency(currentBalance)}</span>
                        <span>Falta {formatCurrency(remainingAmount)}</span>
                    </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg border border-border/50 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Prazo: <span className="text-foreground font-medium">{new Date(goal.deadline).toLocaleDateString("pt-BR")}</span> ({monthsRemaining > 0 ? `${monthsRemaining} meses` : "Vencido"})</span>
                    </div>

                    {remainingAmount > 0 && monthsRemaining > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">
                                Para atingir a meta, invista <span className="font-bold text-emerald-600">{formatCurrency(monthlyNeeded)}</span> por mês.
                            </span>
                        </div>
                    )}

                    {remainingAmount <= 0 && (
                        <div className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Meta Atingida! Parabéns!
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2 hover:bg-muted" onClick={() => onEdit(goal)}>
                        <Edit2 className="h-3 w-3" />
                        Editar
                    </Button>
                    <Button variant="outline" size="sm" className="w-10 px-0 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50" onClick={handleDeleteClick}>
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
