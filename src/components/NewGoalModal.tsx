import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/ProjectContext"
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
import { AlertCircle, Loader2 } from "lucide-react"
import { NewCategoryModal } from "./NewCategoryModal"

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
    const [deadline, setDeadline] = useState("")
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
        setDeadline("")
        setSelectedCategoryIds([])
        setError(null)
    }, [])

    useEffect(() => {
        if (isOpen) {
            fetchInvestmentCategories()
            if (goalToEdit) {
                setTitle(goalToEdit.title)
                setTargetAmount(goalToEdit.target_amount.toString())
                setDeadline(goalToEdit.deadline)

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
            const targetAmountFloat = parseFloat(targetAmount)
            if (isNaN(targetAmountFloat) || targetAmountFloat <= 0) {
                throw new Error("Valor da meta inválido.")
            }

            const { error: rpcError } = await supabase.rpc('create_investment_goal', {
                p_title: title,
                p_target_amount: targetAmountFloat,
                p_deadline: deadline,
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{goalToEdit ? "Editar Meta" : "Nova Meta"}</DialogTitle>
                        <DialogDescription>
                            Defina seus objetivos financeiros e acompanhe seu progresso.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título da Meta</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Viagem para Europa"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="targetAmount">Valor Alvo</Label>
                            <Input
                                id="targetAmount"
                                type="number"
                                step="0.01"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                placeholder="0,00"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="deadline">Data Limite</Label>
                            <Input
                                id="deadline"
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>Categorias de Investimento Vinculadas</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => setIsCategoryModalOpen(true)}
                                >
                                    + Nova Categoria
                                </Button>
                            </div>
                            <div className="border rounded-md p-4 max-h-[150px] overflow-y-auto space-y-2">
                                {categories.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-2">
                                        Nenhuma categoria de investimento encontrada.
                                    </p>
                                ) : (
                                    categories.map((category) => (
                                        <div key={category.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`cat-${category.id}`}
                                                checked={selectedCategoryIds.includes(category.id)}
                                                onCheckedChange={() => toggleCategory(category.id)}
                                            />
                                            <Label
                                                htmlFor={`cat-${category.id}`}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {category.nome}
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Selecione as categorias que contribuirão para esta meta.
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (goalToEdit ? "Salvar Alterações" : "Criar Meta")}
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
