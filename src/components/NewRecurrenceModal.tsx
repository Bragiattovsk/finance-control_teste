import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/ProjectContext"
import { Loader2, Plus } from "lucide-react"

interface Category {
    id: string
    nome: string
    cor: string
}

interface NewRecurrenceModalProps {
    onSuccess: () => void
}

export function NewRecurrenceModal({ onSuccess }: NewRecurrenceModalProps) {
    const { user } = useAuth()
    const { selectedProject } = useProject()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [dueDay, setDueDay] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [active, setActive] = useState(true)

    useEffect(() => {
        if (!user) return

        const fetchCategories = async () => {
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
        }

        fetchCategories()
    }, [user])

    const resetForm = () => {
        setDescription("")
        setAmount("")
        setDueDay("")
        setCategoryId("")
        setActive(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            const valorLimpo = String(amount).replace(',', '.')
            const valorFinal = parseFloat(valorLimpo)

            const { error } = await supabase.from("recurrence_templates").insert({
                user_id: user.id,
                descricao: description,
                valor_base: valorFinal,
                dia_vencimento: parseInt(dueDay),
                categoria_id: categoryId,
                ativo: active,
                project_id: selectedProject?.id || null
            })

            if (error) throw error

            setOpen(false)
            resetForm()
            onSuccess()
        } catch (error) {
            console.error("Error creating recurrence:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Despesa Fixa
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Despesa Fixa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Valor Base</Label>
                        <Input
                            id="amount"
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="dueDay">Dia do Vencimento (1-31)</Label>
                        <Input
                            id="dueDay"
                            type="number"
                            min="1"
                            max="31"
                            value={dueDay}
                            onChange={(e) => setDueDay(e.target.value)}
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
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-3 w-3 rounded-full"
                                                style={{ backgroundColor: category.cor || "gray" }}
                                            />
                                            {category.nome}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="active">Ativo</Label>
                        <Switch
                            id="active"
                            checked={active}
                            onCheckedChange={setActive}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
