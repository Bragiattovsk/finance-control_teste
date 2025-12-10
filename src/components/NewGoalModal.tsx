import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/project-hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Target, Wallet, Plus } from "lucide-react"
import { NewCategoryModal } from "./NewCategoryModal"
import { DatePicker } from "@/components/ui/date-picker"

interface Category {
    id: string
    nome: string
    is_investment?: boolean
    goal_id?: string | null
}

interface Goal {
    id: string
    title: string
    target_amount: number
    deadline: string
    categories: Category[]
}

interface NewGoalModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    goalToEdit?: Goal | null
}

export function NewGoalModal({ isOpen, onClose, onSuccess, goalToEdit }: NewGoalModalProps) {
    const { user } = useAuth()
    const { selectedProject } = useProject()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [categories, setCategories] = useState<Category[]>([])

    const [title, setTitle] = useState("")
    const [targetAmount, setTargetAmount] = useState("")
    const [deadline, setDeadline] = useState<Date | undefined>(undefined)
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

    const fetchInvestmentCategories = useCallback(async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .eq("user_id", user.id)
                .eq("is_investment", true)
                .order("nome")

            if (error) throw error
            if (data) setCategories(data)
        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }, [user])

    const resetForm = useCallback(() => {
        setTitle("")
        setTargetAmount("")
        setDeadline(undefined)
        setSelectedCategoryIds([])
        setError(null)
    }, [])

    useEffect(() => {
        if (isOpen) {
            fetchInvestmentCategories()
            if (goalToEdit) {
                setTitle(goalToEdit.title)
                setTargetAmount(goalToEdit.target_amount.toString())
                
                // Parse date string to Date object correctly (YYYY-MM-DD)
                if (goalToEdit.deadline) {
                    const [year, month, day] = goalToEdit.deadline.split('-').map(Number);
                    setDeadline(new Date(year, month - 1, day));
                } else {
                    setDeadline(undefined);
                }

                const initialCategories = (goalToEdit && Array.isArray(goalToEdit.categories))
                    ? goalToEdit.categories
                    : []
                setSelectedCategoryIds(initialCategories.map(c => c.id))
            } else {
                resetForm()
            }
        }
    }, [isOpen, goalToEdit, fetchInvestmentCategories, resetForm])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        setError(null)

        try {
            if (!title || !targetAmount || !deadline) {
                throw new Error("Preencha todos os campos obrigatórios.")
            }

            const formattedDeadline = format(deadline, "yyyy-MM-dd")
            const targetAmountFloat = parseFloat(targetAmount)
            
            if (isNaN(targetAmountFloat) || targetAmountFloat <= 0) {
                throw new Error("Valor da meta inválido.")
            }

            const { error: rpcError } = await supabase.rpc('create_investment_goal', {
                p_title: title,
                p_target_amount: targetAmountFloat,
                p_deadline: formattedDeadline,
                p_project_id: selectedProject?.id || null,
                p_category_ids: selectedCategoryIds,
                p_goal_id: goalToEdit?.id || null
            })

            if (rpcError) throw rpcError

            onSuccess()
            onClose()
        } catch (err: unknown) {
            console.error("Error saving goal:", err)
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Erro ao salvar meta.")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleCategorySuccess = (newCategory: Category) => {
        fetchInvestmentCategories()
        setSelectedCategoryIds(prev => [...prev, newCategory.id])
    }

    const toggleCategory = (categoryId: string) => {
        setSelectedCategoryIds(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/5">
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            {goalToEdit ? "Editar Meta" : "Nova Meta"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Defina seus objetivos financeiros e acompanhe seu progresso.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">Título da Meta</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Viagem para Europa"
                                    className="h-10"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="targetAmount" className="text-xs font-medium text-muted-foreground">Valor Alvo</Label>
                                    <div className="relative">
                                        <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="targetAmount"
                                            type="number"
                                            step="0.01"
                                            value={targetAmount}
                                            onChange={(e) => setTargetAmount(e.target.value)}
                                            placeholder="0,00"
                                            className="pl-9 h-10"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deadline" className="text-xs font-medium text-muted-foreground">Prazo Final</Label>
                                    <DatePicker date={deadline} setDate={setDeadline} placeholder="Selecione o prazo" />
                                </div>
                            </div>

                            <div className="px-6 pb-6 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-muted-foreground">Categorias Vinculadas</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs gap-1 hover:text-primary"
                                        onClick={() => setIsCategoryModalOpen(true)}
                                    >
                                        <Plus className="h-3 w-3" /> Nova Categoria
                                    </Button>
                                </div>
                                <div className="border border-border/50 rounded-xl bg-muted/20 p-4 max-h-[150px] overflow-y-auto space-y-2">
                                    {categories.length === 0 ? (
                                        <div className="text-center py-4">
                                            <p className="text-sm text-muted-foreground">
                                                Nenhuma categoria de investimento encontrada.
                                            </p>
                                        </div>
                                    ) : (
                                        categories.map((category) => (
                                            <div key={category.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                <Checkbox
                                                    id={`cat-${category.id}`}
                                                    checked={selectedCategoryIds.includes(category.id)}
                                                    onCheckedChange={() => toggleCategory(category.id)}
                                                    className="border-muted-foreground/50"
                                                />
                                                <Label
                                                    htmlFor={`cat-${category.id}`}
                                                    className="text-sm font-medium cursor-pointer flex-1"
                                                >
                                                    {category.nome}
                                                </Label>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    O saldo destas categorias será somado para calcular o progresso.
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="rounded-xl">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Erro</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/5 gap-2">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    goalToEdit ? "Salvar Alterações" : "Criar Meta"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <NewCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSuccess={handleCategorySuccess}
                defaultIsInvestment={true}
            />
        </>
    )
}
