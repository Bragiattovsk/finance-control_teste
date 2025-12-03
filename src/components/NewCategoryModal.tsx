import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import type { Category } from "@/types"

interface NewCategoryModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (category: Category) => void
    defaultIsInvestment?: boolean
    defaultType?: 'income' | 'expense'
}

export function NewCategoryModal({ isOpen, onClose, onSuccess, defaultIsInvestment = false, defaultType = 'expense' }: NewCategoryModalProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const [name, setName] = useState("")
    const [type, setType] = useState<'income' | 'expense'>('expense')
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

            toast({
                title: "Categoria criada",
                description: "A nova categoria foi adicionada com sucesso.",
                variant: "default",
            })
            onSuccess(data)
            onClose()
        } catch (error) {
            console.error("Error creating category:", error)
            toast({
                title: "Erro ao criar categoria",
                description: "Ocorreu um erro ao tentar salvar a categoria. Tente novamente.",
                variant: "destructive",
                duration: 5000,
            })
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setName("")
        setType(defaultType)
        setColor("#000000")
        setIsInvestment(defaultIsInvestment)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                    <DialogDescription className="sr-only">
                        Preencha os dados abaixo para criar uma nova categoria de transação.
                    </DialogDescription>
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
                        <Label>Tipo</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                    "h-12 text-base font-medium transition-all",
                                    type === 'income'
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-md"
                                        : "hover:bg-muted text-muted-foreground"
                                )}
                                onClick={() => setType('income')}
                            >
                                Receita
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                    "h-12 text-base font-medium transition-all",
                                    type === 'expense'
                                        ? "bg-red-600 hover:bg-red-700 text-white border-transparent shadow-md"
                                        : "hover:bg-muted text-muted-foreground"
                                )}
                                onClick={() => setType('expense')}
                            >
                                Despesa
                            </Button>
                        </div>
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
