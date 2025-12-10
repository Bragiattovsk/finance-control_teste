import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
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
import { Trash2, TrendingUp, TrendingDown, DollarSign, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { NewCategoryModal } from "@/components/NewCategoryModal"
import { ConfirmModal } from "@/components/ConfirmModal"
import { useToast } from "@/hooks/use-toast"
import type { Category } from "@/types"


export function Categories() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    
    // Pagination and Search state
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

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
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    // Fix "Salário" category automatically
    useEffect(() => {
        const fixSalario = async () => {
            const salario = categories.find(c => c.nome.toLowerCase() === 'salário' || c.nome.toLowerCase() === 'salario')
            if (!salario) return
            const raw = (salario as unknown as { tipo?: string }).tipo
            const resolved = raw === 'income' ? 'income' : raw === 'receita' ? 'income' : 'expense'
            if (resolved === 'expense') {
                const { error } = await supabase
                    .from('categories')
                    .update({ tipo: 'income' })
                    .eq('id', salario.id)
                if (!error) {
                    fetchCategories()
                }
            }
        }
        if (categories.length > 0) {
            fixSalario()
        }
    }, [categories, fetchCategories])

    const handleDelete = (id: string) => {
        setDeleteId(id)
        setIsConfirmOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        try {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", deleteId)

            if (error) throw error
            
            toast({
                title: "Categoria excluída",
                description: "A categoria foi excluída com sucesso.",
            })
            fetchCategories()
        } catch (error) {
            console.error("Error deleting category:", error)
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir a categoria. Verifique se existem transações vinculadas.",
                variant: "destructive",
                duration: 5000,
            })
        } finally {
            setDeleteId(null)
            setIsConfirmOpen(false)
        }
    }

    // Filter and Pagination Logic
    const filteredCategories = categories.filter(category =>
        category.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage)

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
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Categorias</h1>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar categorias..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        Nova Categoria
                    </Button>
                </div>
                <NewCategoryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        fetchCategories()
                    }}
                />
                <ConfirmModal
                    isOpen={isConfirmOpen}
                    onOpenChange={setIsConfirmOpen}
                    onConfirm={confirmDelete}
                    title="Confirmar exclusão"
                    description="Tem certeza que deseja excluir esta categoria?"
                />
            </div>

            <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="text-muted-foreground font-semibold">Nome</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Tipo</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Cor</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Investimento</TableHead>
                            <TableHead className="text-right text-muted-foreground font-semibold">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    {searchTerm ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedCategories.map((category) => (
                                <TableRow key={category.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                                    <TableCell className="font-medium text-foreground">
                                        {category.nome}
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const tipo = (category as unknown as { tipo?: string }).tipo
                                            const isIncome = tipo === 'income' || tipo === 'receita'
                                            return isIncome ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none gap-1">
                                                    <TrendingUp className="h-3 w-3" /> Entrada
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-none gap-1">
                                                    <TrendingDown className="h-3 w-3" /> Saída
                                                </Badge>
                                            )
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-4 w-4 rounded-full border shadow-sm"
                                                style={{ backgroundColor: category.cor }}
                                            />
                                            <span className="text-muted-foreground text-sm">{category.cor}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {category.is_investment && (
                                            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                                <DollarSign className="h-3 w-3" />
                                                Investimento
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(category.id)}
                                            className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                            aria-label="Excluir categoria"
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
