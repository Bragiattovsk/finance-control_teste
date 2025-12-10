import { useCategories } from "@/hooks/useCategories";
import { NewCategoryModal } from "@/components/NewCategoryModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Tag, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CategoriesPage() {
    const navigate = useNavigate();
    const { categories, loading, refetch } = useCategories();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { toast } = useToast();

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        const { error } = await supabase.from('categories').delete().eq('id', deleteId);

        if (error) {
            toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
        } else {
            toast({ title: "Sucesso", description: "Categoria excluída." });
            refetch();
        }
        setDeleteId(null);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate("/menu")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Minhas Categorias</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
            </header>

            {/* Conteúdo */}
            <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
                <Card className="border-border shadow-sm bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-base font-medium">Listagem Completa</CardTitle>
                        <Badge variant="secondary" className="font-normal">
                            {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <p>Carregando categorias...</p>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                                <Tag className="h-10 w-10 opacity-20" />
                                <p>Nenhuma categoria encontrada.</p>
                                <Button variant="link" onClick={() => setIsModalOpen(true)}>Criar nova</Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="w-[80px]">Ícone</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead className="w-[120px]">Tipo</TableHead>
                                        <TableHead className="w-[80px] text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((cat) => (
                                        <TableRow key={cat.id} className="border-border hover:bg-muted/50">
                                            <TableCell>
                                                <div
                                                    className="h-8 w-8 rounded-full flex items-center justify-center border border-border/50 shadow-sm"
                                                    style={{ backgroundColor: cat.cor ? `${cat.cor}20` : undefined }}
                                                >
                                                    {cat.cor ? (
                                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                                                    ) : (
                                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {cat.nome}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 flex-wrap">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            cat.tipo === 'income'
                                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                                                                : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20'
                                                        }
                                                    >
                                                        {cat.tipo === 'income' ? 'Receita' : 'Despesa'}
                                                    </Badge>
                                                    {cat.is_investment && (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20"
                                                        >
                                                            Investimento
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeleteClick(cat.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <NewCategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => refetch()}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={confirmDelete}
                title="Excluir Categoria"
                description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita e poderá afetar transações vinculadas."
            />
        </div>
    );
}
