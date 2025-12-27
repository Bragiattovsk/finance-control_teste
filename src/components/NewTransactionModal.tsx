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
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, PlusCircle, Plus } from "lucide-react"
import { NewCategoryModal } from "@/components/NewCategoryModal"
import { AttachmentInput } from "@/components/AttachmentInput"
import { DatePicker } from "@/components/ui/date-picker"

import { Transaction, Category } from "@/types"
import { Switch } from "@/components/ui/switch"
import { useTransactions } from "@/hooks/useTransactions"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

interface NewTransactionModalProps {
    onSuccess?: () => void
    transactionToEdit?: Transaction | null
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultCategoryId?: string
    isInvestmentMode?: boolean
}

export function NewTransactionModal({
    onSuccess,
    transactionToEdit,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    defaultCategoryId,
    isInvestmentMode = false
}: NewTransactionModalProps) {
    const { user, profile } = useAuth()
    const { selectedProject } = useProject()
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = (value: boolean) => {
        if (isControlled) {
            setControlledOpen?.(value)
        } else {
            setInternalOpen(value)
        }
    }

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [categories, setCategories] = useState<Category[]>([])

    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [type, setType] = useState<"receita" | "despesa">("despesa")
    const [categoryId, setCategoryId] = useState("")
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [isPaid, setIsPaid] = useState(true)
    const [isInstallment, setIsInstallment] = useState(false)
    const [installments, setInstallments] = useState<string>("2")
    const [attachmentPath, setAttachmentPath] = useState<string | null>(null)

    // New Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

    const resolveCategoryTipo = (c: Category): 'income' | 'expense' => {
        const raw = (c as unknown as { tipo?: string }).tipo
        if (raw === 'income' || raw === 'expense') return raw
        if (raw === 'receita') return 'income'
        return 'expense'
    }

    const filteredCategories = categories.filter(cat => {
        const catTipo = resolveCategoryTipo(cat)
        const expected = type === 'receita' ? 'income' : 'expense'
        const matchesType = catTipo === expected
        const isInvestment = (cat as unknown as { is_investment?: boolean }).is_investment === true
        return matchesType && !isInvestment
    })

    // Reset categoryId if the selected category doesn't match the new transaction type
    useEffect(() => {
        if (categoryId) {
            const selectedCategory = categories.find(c => c.id === categoryId)
            if (selectedCategory) {
                const currentType = type === 'receita' ? 'income' : 'expense'
                const selectedType = resolveCategoryTipo(selectedCategory)
                if (selectedType !== currentType) {
                    setCategoryId("")
                }
            }
        }
    }, [type, categoryId, categories])

    const fetchCategories = useCallback(async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("id, user_id, nome, cor, tipo, is_investment")
                .eq("user_id", user.id)
                .order("nome")

            if (error) throw error
            if (data) setCategories(data)
        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }, [user])

    const resetForm = useCallback(() => {
        setDescription("")
        setAmount("")
        setType(isInvestmentMode ? "despesa" : "despesa")
        setCategoryId("")
        setDate(new Date())
        setIsPaid(true)
        setAttachmentPath(null)
    }, [isInvestmentMode])

    useEffect(() => {
        if (open) {
            fetchCategories()
            if (transactionToEdit) {
                setDescription(transactionToEdit.descricao)
                setAmount(transactionToEdit.valor.toString())
                setType(transactionToEdit.tipo)
                setCategoryId(transactionToEdit.categoria_id || "")
                
                // Parse date string to Date object correctly (YYYY-MM-DD)
                if (transactionToEdit.data) {
                    const [year, month, day] = transactionToEdit.data.split('-').map(Number);
                    setDate(new Date(year, month - 1, day));
                } else {
                    setDate(new Date());
                }

                setIsPaid(transactionToEdit.pago)
                setAttachmentPath(transactionToEdit.attachment_path || null)
            } else {
                resetForm()
                if (defaultCategoryId) {
                    setCategoryId(defaultCategoryId)
                }
            }
        }
    }, [open, transactionToEdit, defaultCategoryId, fetchCategories, resetForm])

    const { createInstallmentTransaction } = useTransactions()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        setError(null)

        try {
            if (!description || !amount || !date) {
                throw new Error("Preencha todos os campos obrigatórios.")
            }

            const formattedDate = format(date, "yyyy-MM-dd")

            const payload = {
                user_id: user.id,
                descricao: description,
                valor: parseFloat(amount),
                tipo: type,
                categoria_id: categoryId || null,
                data: formattedDate,
                pago: isPaid,
                project_id: selectedProject?.id ?? null,
                attachment_path: attachmentPath
            }

            let opError
            if (transactionToEdit) {
                const { error: updateError } = await supabase
                    .from("transactions")
                    .update(payload)
                    .eq("id", transactionToEdit.id)
                opError = updateError
            } else {
                if (isInstallment && type === "despesa") {
                    await createInstallmentTransaction(
                        {
                            description,
                            amount: parseFloat(amount),
                            type,
                            date: formattedDate,
                            categoryId: categoryId || null,
                            paid: isPaid,
                            projectId: selectedProject?.id ?? null,
                        },
                        Math.min(120, Math.max(2, parseInt(installments || "2", 10)))
                    )
                    opError = null
                } else {
                    const { error: insertError } = await supabase
                        .from("transactions")
                        .insert(payload)
                    opError = insertError
                }
            }

            if (opError) throw opError

            setOpen(false)
            resetForm()
            onSuccess?.()
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Ocorreu um erro ao salvar a transação.")
            }
        } finally {
            setLoading(false)
        }
    }

    const getTitle = () => {
        if (isInvestmentMode) return "Novo Aporte"
        return transactionToEdit ? "Editar Transação" : "Nova Transação"
    }

    const getDescription = () => {
        if (isInvestmentMode) return "Adicione um novo aporte financeiro."
        return transactionToEdit ? "Edite os detalhes da transação." : "Adicione uma nova receita ou despesa."
    }

    const handleCategorySuccess = (newCategory: Category) => {
        // 1. Recarrega a lista para garantir que está atualizada
        fetchCategories()

        // 2. Atualiza estado local otimista para feedback imediato
        setCategories((prev) => {
            const exists = prev.some(c => c.id === newCategory.id)
            if (exists) return prev
            // Ensure newCategory has user_id
            const completeCategory = { ...newCategory, user_id: user?.id || '' };
            return [...prev, completeCategory].sort((a, b) => a.nome.localeCompare(b.nome))
        })
        
        // 3. AUTO-SELECT: Define o ID da nova categoria
        setCategoryId(newCategory.id)
    }

    const isPro = profile?.subscription_tier === 'PRO'

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        {isInvestmentMode ? "Novo Aporte" : "Nova Transação"}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                    <DialogDescription>
                        {getDescription()}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {!isInvestmentMode && (
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant={type === "receita" ? "default" : "outline"}
                                className={type === "receita" ? "bg-green-600 hover:bg-green-700" : ""}
                                onClick={() => setType("receita")}
                            >
                                Receita
                            </Button>
                            <Button
                                type="button"
                                variant={type === "despesa" ? "default" : "outline"}
                                className={type === "despesa" ? "bg-red-600 hover:bg-red-700" : ""}
                                onClick={() => setType("despesa")}
                            >
                                Despesa
                            </Button>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={isInvestmentMode ? "Ex: Compra de Ações" : "Ex: Compras do mês"}
                            required
                        />
                    </div>

                    <div className={cn("grid gap-4", (!isInvestmentMode && type === "despesa") ? "grid-cols-2" : "grid-cols-1")}>
                        <div className="flex flex-col gap-2">
                            <div className="flex h-6 items-center">
                                <Label htmlFor="amount">Valor</Label>
                            </div>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0,00"
                                required
                            />
                        </div>

                        {!isInvestmentMode && type === "despesa" && (
                            <div className="flex flex-col gap-2">
                                <div className="flex h-6 items-center justify-between">
                                    <Label htmlFor="installment-switch" className="cursor-pointer">Parcelado?</Label>
                                    <Switch id="installment-switch" checked={isInstallment} onCheckedChange={setIsInstallment} />
                                </div>
                                {isInstallment ? (
                                    <>
                                        <Input
                                            id="installments"
                                            type="number"
                                            min={2}
                                            max={120}
                                            value={installments}
                                            onChange={(e) => setInstallments(e.target.value)}
                                            placeholder="Qtd"
                                        />
                                        {amount && (
                                            <p className="text-xs text-muted-foreground">
                                                {(() => {
                                                    const total = parseFloat(amount || "0")
                                                    const n = Math.min(120, Math.max(2, parseInt(installments || "2", 10)))
                                                    const per = total / (n || 1)
                                                    return `Ex: ${n}x de ${formatCurrency(per)}`
                                                })()}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-10" />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category">Categoria</Label>
                        <div className="flex gap-2">
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredCategories.length > 0 ? (
                                        filteredCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-3 w-3 rounded-full"
                                                        style={{ backgroundColor: cat.cor || undefined }}
                                                    />
                                                    {cat.nome}
                                                </div>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                            <span>Nenhuma categoria de {type} encontrada.</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => setIsCategoryModalOpen(true)}
                                            >
                                                Criar nova categoria
                                            </Button>
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => setIsCategoryModalOpen(true)}
                                title="Nova Categoria"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="date">Data</Label>
                        <DatePicker date={date} setDate={setDate} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Comprovante</Label>
                        <AttachmentInput
                            value={attachmentPath}
                            onChange={setAttachmentPath}
                            isPro={isPro}
                            transactionId={transactionToEdit?.id}
                        />
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
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>

                <NewCategoryModal
                    isOpen={isCategoryModalOpen}
                    onClose={() => setIsCategoryModalOpen(false)}
                    onSuccess={handleCategorySuccess}
                    defaultType={type === 'receita' ? 'income' : 'expense'}
                />
            </DialogContent>
        </Dialog>
    )
}
