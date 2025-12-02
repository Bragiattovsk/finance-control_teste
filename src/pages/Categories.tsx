import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
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
import { Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { NewCategoryModal } from "@/components/NewCategoryModal"

interface Category {
    id: string
    nome: string
    tipo: "receita" | "despesa"
    cor: string
    is_investment?: boolean
}

export function Categories() {
    const { user } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)

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

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta categoria? Se houver transações vinculadas, elas ficarão sem categoria.")) return

        try {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", id)

            if (error) throw error
            fetchCategories()
        } catch (error) {
            console.error("Error deleting category:", error)
            alert("Erro ao excluir categoria.")
        }
    }

    if (loading) {
        return <div className="p-8">Carregando...</div>
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Categorias</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    Nova Categoria
                </Button>
                <NewCategoryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        fetchCategories()
                    }}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Cor</TableHead>
                            <TableHead>Investimento</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    Nenhuma categoria cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.nome}</TableCell>
                                    <TableCell>
                                        {category.tipo === "receita" ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">
                                                <TrendingUp className="mr-1 h-3 w-3" /> Receita
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">
                                                <TrendingDown className="mr-1 h-3 w-3" /> Despesa
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-4 w-4 rounded-full border"
                                                style={{ backgroundColor: category.cor }}
                                            />
                                            <span className="text-muted-foreground text-sm">{category.cor}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {category.is_investment && (
                                            <Badge variant="secondary" className="gap-1">
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
