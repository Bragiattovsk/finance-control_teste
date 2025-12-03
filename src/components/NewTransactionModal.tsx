import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
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
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [isPaid, setIsPaid] = useState(true)
    const [isInstallment, setIsInstallment] = useState(false)
    const [installments, setInstallments] = useState<string>("2")
    const [attachmentPath, setAttachmentPath] = useState<string | null>(null)

    // New Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

    const fetchCategories = useCallback(async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
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
        setDate(new Date().toISOString().split("T")[0])
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
                setDate(transactionToEdit.data)
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

            const payload = {
                user_id: user.id,
                descricao: description,
                valor: parseFloat(amount),
                tipo: type,
                categoria_id: categoryId || null,
                data: date,
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
                            date,
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
        // Add new category to list
        setCategories((prev) => [...prev, newCategory].sort((a, b) => a.nome.localeCompare(b.nome)))
        // Select the new category
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
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: cat.cor }}
                                                />
                                                {cat.nome}
                                            </div>
                                        </SelectItem>
                                    ))}
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
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
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
                />
            </DialogContent>
        </Dialog>
    )
}
