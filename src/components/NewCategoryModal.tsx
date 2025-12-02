import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

interface Category {
    id: string
    nome: string
    tipo: "receita" | "despesa"
    cor: string
    is_investment?: boolean
}

interface NewCategoryModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (category: Category) => void
    defaultIsInvestment?: boolean
}

export function NewCategoryModal({ isOpen, onClose, onSuccess, defaultIsInvestment = false }: NewCategoryModalProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)

    const [name, setName] = useState("")
    const [type, setType] = useState<"receita" | "despesa">("despesa")
    const [color, setColor] = useState("#000000")
    const [isInvestment, setIsInvestment] = useState(defaultIsInvestment)

    useEffect(() => {
        if (isOpen) {
            resetForm()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            const { data, error } = await supabase.from("categories").insert({
                user_id: user.id,
                nome: name,
                tipo: type,
                cor: color,
                is_investment: isInvestment,
            }).select().single()

            if (error) throw error

            onSuccess(data)
            onClose()
        } catch (error) {
            console.error("Error creating category:", error)
            alert("Erro ao criar categoria.")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setName("")
        setType("despesa")
        setColor("#000000")
        setIsInvestment(defaultIsInvestment)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select value={type} onValueChange={(val: "receita" | "despesa") => setType(val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="receita">Receita</SelectItem>
                                <SelectItem value="despesa">Despesa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="color">Cor</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="color"
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-12 h-10 p-1"
                                required
                            />
                            <span className="text-sm text-muted-foreground">{color}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isInvestment"
                            checked={isInvestment}
                            onCheckedChange={(checked: boolean) => setIsInvestment(checked)}
                        />
                        <Label htmlFor="isInvestment">É Investimento?</Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
