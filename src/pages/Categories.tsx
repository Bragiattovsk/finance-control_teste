import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
import { Trash2, DollarSign, Search, ChevronLeft, ChevronRight, Zap, Home, Utensils, Banknote, Tag, Pencil, ArrowLeft, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewCategoryModal } from "@/components/NewCategoryModal"
import { ConfirmModal } from "@/components/ConfirmModal"
import { useToast } from "@/hooks/use-toast"
import { useCategories } from "@/hooks/useCategories"

const getCategoryIcon = (categoryName: string) => {
    const lower = categoryName.toLowerCase()
    if (lower.includes('luz') || lower.includes('energia') || lower.includes('elétrica')) return Zap
    if (lower.includes('moradia') || lower.includes('casa') || lower.includes('aluguel') || lower.includes('condomínio')) return Home
    if (lower.includes('aliment') || lower.includes('restaurante') || lower.includes('comida') || lower.includes('mercado')) return Utensils
    if (lower.includes('salário') || lower.includes('salario') || lower.includes('renda') || lower.includes('pagamento')) return Banknote
    return Tag
}

export function Categories() {
    useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    
    // Hook de dados unificado
    const { categories, loading, refetch } = useCategories()
    
    // UI States
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    
    // Pagination and Search state
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Fix "Salário" category automatically (Lógica mantida para integridade de dados)
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
                    refetch()
                }
            }
        }
        if (categories.length > 0) {
            fixSalario()
        }
    }, [categories, refetch])

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
            refetch()
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
        <div className="w-full space-y-6 p-4 md:p-8">
            {/* Mobile Header */}
            <div className="flex items-center md:hidden mb-6">
                <Button variant="ghost" size="icon" className="-ml-2 mr-2" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold flex-1 text-center pr-8">Minhas Categorias</h1>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Categorias</h1>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all">
                    Nova Categoria
                </Button>
            </div>

            {/* Mobile FAB */}
            <div className="fixed bottom-6 right-6 md:hidden z-50">
                 <Button 
                    onClick={() => setIsModalOpen(true)} 
                    size="icon" 
                    className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                 >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            <NewCategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    refetch()
                }}
            />
            <ConfirmModal
                isOpen={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={confirmDelete}
                title="Confirmar exclusão"
                description="Tem certeza que deseja excluir esta categoria?"
            />

            <Card className="border-border/50 shadow-sm bg-card w-full">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-6">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Gerenciar Categorias</CardTitle>
                        <CardDescription className="text-muted-foreground mt-1">
                            Visualize e edite suas categorias de receitas e despesas.
                        </CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar categorias..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table className="w-full">
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="pl-6 h-12 text-xs uppercase tracking-wider font-semibold text-muted-foreground w-auto md:w-[40%]">Nome</TableHead>
                                <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-muted-foreground hidden md:table-cell text-center">Tipo</TableHead>
                                <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-muted-foreground hidden md:table-cell text-center">Investimento</TableHead>
                                <TableHead className="pr-6 h-12 text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Tag className="h-8 w-8 text-muted-foreground/30" />
                                            <p className="font-medium">{searchTerm ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada."}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedCategories.map((category) => {
                                    const Icon = getCategoryIcon(category.nome)
                                    return (
                                        <TableRow key={category.id} className="group h-16 hover:bg-muted/50 border-border/40 transition-colors">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div 
                                                        className="h-10 w-10 rounded-lg flex items-center justify-center transition-colors shrink-0"
                                                        style={{ 
                                                            backgroundColor: category.cor ? `${category.cor}20` : undefined,
                                                            color: category.cor || undefined
                                                        }}
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground text-sm">{category.nome}</span>
                                                        {/* Mobile only type indicator */}
                                                        <span className="text-xs text-muted-foreground md:hidden flex items-center gap-1 mt-0.5">
                                                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.cor ?? undefined }} />
                                                            {(category as unknown as { tipo?: string }).tipo === 'income' ? 'Receita' : 'Despesa'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 hidden md:table-cell text-center">
                                                <div className="flex justify-center">
                                                    {(() => {
                                                        const tipo = (category as unknown as { tipo?: string }).tipo
                                                        const isIncome = tipo === 'income' || tipo === 'receita'
                                                        return isIncome ? (
                                                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50 font-normal">
                                                                Receita
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200/50 dark:border-red-800/50 font-normal">
                                                                Despesa
                                                            </Badge>
                                                        )
                                                    })()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 hidden md:table-cell text-center">
                                                <div className="flex justify-center">
                                                    {category.is_investment && (
                                                        <Badge variant="outline" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200/50 dark:border-violet-800/50 font-normal gap-1">
                                                            <DollarSign className="h-3 w-3" />
                                                            Investimento
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            // Future edit functionality
                                                            console.log("Edit category", category.id)
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(category.id)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                                        aria-label="Excluir categoria"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 p-4 border-t border-border/50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Página anterior"
                        className="h-8 text-xs"
                    >
                        <ChevronLeft className="h-3 w-3 mr-1" />
                        Anterior
                    </Button>
                    <div className="text-xs text-muted-foreground font-medium">
                        Página {currentPage} de {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Próxima página"
                        className="h-8 text-xs"
                    >
                        Próxima
                        <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            )}
                </CardContent>
            </Card>
        </div>
    )
}
