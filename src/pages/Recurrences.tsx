import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/ProjectContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, CheckCircle2, XCircle, Search, ChevronLeft, ChevronRight } from "lucide-react"
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
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

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

    // Filter and Pagination
    const filteredRecurrences = recurrences.filter(item =>
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categories?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalPages = Math.ceil(filteredRecurrences.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedRecurrences = filteredRecurrences.slice(startIndex, startIndex + itemsPerPage)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    if (loading) {
        return (
             <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Despesas Fixas</h1>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                     <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar despesas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <NewRecurrenceModal onSuccess={fetchRecurrences} />
                </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="text-muted-foreground font-semibold">Dia</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Descrição</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Categoria</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Valor Base</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground font-semibold">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRecurrences.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    {searchTerm ? "Nenhuma despesa encontrada." : "Nenhuma despesa fixa cadastrada."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRecurrences.map((item) => (
                                <TableRow key={item.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                                    <TableCell className="font-medium">{item.dia_vencimento}</TableCell>
                                    <TableCell className="font-medium text-foreground">{item.descricao}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            style={{
                                                borderColor: item.categories?.cor || "gray",
                                                color: item.categories?.cor || "gray",
                                                backgroundColor: item.categories?.cor ? `${item.categories.cor}10` : "#80808010"
                                            }}
                                            className="border bg-opacity-10"
                                        >
                                            {item.categories?.nome || "Sem Categoria"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-foreground">{formatCurrency(item.valor_base)}</TableCell>
                                    <TableCell>
                                        {item.ativo ? (
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Ativo
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80 border-none gap-1">
                                                <XCircle className="h-3 w-3" /> Inativo
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(item.id)}
                                            className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                            aria-label="Excluir despesa fixa"
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

             {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Página anterior"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Próxima página"
                    >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}
