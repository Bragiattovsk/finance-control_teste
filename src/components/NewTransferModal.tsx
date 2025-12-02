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
import { AlertCircle, ArrowRightLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Category {
    id: string
    nome: string
    cor: string
}

interface NewTransferModalProps {
    onSuccess?: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function NewTransferModal({ onSuccess, open: controlledOpen, onOpenChange: setControlledOpen }: NewTransferModalProps) {
    const { user } = useAuth()
    const { selectedProject, projects } = useProject()
    const { toast } = useToast()

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

    const [amount, setAmount] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [destinationProjectId, setDestinationProjectId] = useState<string>("personal")
    const [description, setDescription] = useState("")
    const [categoryId, setCategoryId] = useState("")

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

    useEffect(() => {
        if (open) {
            setAmount("")
            setDate(new Date().toISOString().split("T")[0])
            setDescription("")
            setCategoryId("")
            // Default destination logic
            setDestinationProjectId(selectedProject ? "personal" : "")
            fetchCategories()
        }
    }, [open, selectedProject, fetchCategories])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        setError(null)

        try {
            const transferAmount = parseFloat(amount)
            if (isNaN(transferAmount) || transferAmount <= 0) {
                throw new Error("Valor inválido")
            }

            const originProjectId = selectedProject?.id || null
            const destProjectId = destinationProjectId === "personal" ? null : destinationProjectId

            if (originProjectId === destProjectId) {
                throw new Error("Origem e destino não podem ser iguais")
            }

            // 1. Create Expense in Origin
            const { error: expenseError } = await supabase
                .from("transactions")
                .insert({
                    user_id: user.id,
                    descricao: `Transferência para ${destProjectId ? "Projeto" : "Conta Pessoal"}: ${description}`,
                    valor: transferAmount,
                    tipo: "despesa",
                    categoria_id: categoryId,
                    data: date,
                    pago: true,
                    project_id: originProjectId
                })

            if (expenseError) throw expenseError

            // 2. Create Income in Destination
            const { error: incomeError } = await supabase
                .from("transactions")
                .insert({
                    user_id: user.id,
                    descricao: `Transferência de ${originProjectId ? "Projeto" : "Conta Pessoal"}: ${description}`,
                    valor: transferAmount,
                    tipo: "receita",
                    categoria_id: categoryId,
                    data: date,
                    pago: true,
                    project_id: destProjectId
                })

            if (incomeError) throw incomeError

            toast({
                title: "Sucesso",
                description: "Transferência realizada com sucesso!",
            })

            setOpen(false)
            onSuccess?.()
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Ocorreu um erro ao realizar a transferência.")
            }
        } finally {
            setLoading(false)
        }
    }

    // Filter projects for destination select
    const availableProjects = [
        { id: "personal", name: "Pessoal" },
        ...(projects || []).map(p => ({ id: p.id, name: p.name }))
    ].filter(p => {
        const currentId = selectedProject?.id || "personal"
        return p.id !== currentId
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <ArrowRightLeft className="h-4 w-4" />
                        Transferir
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nova Transferência</DialogTitle>
                    <DialogDescription>
                        Mova dinheiro entre seus projetos ou conta pessoal.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Origem</Label>
                        <div className="p-2 border rounded-md bg-muted text-sm font-medium">
                            {selectedProject ? selectedProject.name : "Pessoal"}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="destination">Destino</Label>
                        <Select
                            value={destinationProjectId}
                            onValueChange={setDestinationProjectId}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o destino..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableProjects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amount">Valor</Label>
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
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Aporte para projeto"
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select value={categoryId} onValueChange={setCategoryId} required>
                            <SelectTrigger>
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
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Transferência"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
