import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, CheckCircle2, XCircle } from "lucide-react"
import { NewRecurrenceModal } from "@/components/NewRecurrenceModal"
import { formatCurrency } from "@/lib/format"
import { applyProjectScope } from "@/lib/supabase-helpers"

interface Recurrence {
    id: string
    descricao: string
    valor_base: number
    dia_vencimento: number
    ativo: boolean
    categories: {
        nome: string
        cor: string
    }
}

export function Recurrences() {
    const { user } = useAuth()
    const { selectedProject } = useProject()
    const [recurrences, setRecurrences] = useState<Recurrence[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRecurrences = useCallback(async () => {
        if (!user) return

        try {
            let query = supabase
                .from("recurrence_templates")
                .select("*, categories(nome, cor)")
                .eq("user_id", user.id)
                .order("dia_vencimento")

            query = applyProjectScope(query, selectedProject)

            const { data, error } = await query

            if (error) throw error
            if (data) setRecurrences(data)
        } catch (error) {
            console.error("Error fetching recurrences:", error)
        } finally {
            setLoading(false)
        }
    }, [user, selectedProject])

    useEffect(() => {
        fetchRecurrences()
    }, [fetchRecurrences])

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta despesa fixa?")) return

        try {
            const { error } = await supabase
                .from("recurrence_templates")
                .delete()
                .eq("id", id)

            if (error) throw error
            fetchRecurrences()
        } catch (error) {
            console.error("Error deleting recurrence:", error)
        }
    }

    if (loading) {
        return <div className="p-8">Carregando...</div>
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Despesas Fixas</h1>
                <NewRecurrenceModal onSuccess={fetchRecurrences} />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Dia</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Valor Base</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recurrences.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    Nenhuma despesa fixa cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            recurrences.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.dia_vencimento}</TableCell>
                                    <TableCell>{item.descricao}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            style={{
                                                borderColor: item.categories?.cor || "gray",
                                                color: item.categories?.cor || "gray",
                                            }}
                                        >
                                            {item.categories?.nome || "Sem Categoria"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatCurrency(item.valor_base)}</TableCell>
                                    <TableCell>
                                        {item.ativo ? (
                                            <div className="flex items-center text-green-600">
                                                <CheckCircle2 className="mr-1 h-4 w-4" /> Ativo
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-muted-foreground">
                                                <XCircle className="mr-1 h-4 w-4" /> Inativo
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
