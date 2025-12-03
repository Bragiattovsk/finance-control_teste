import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { ChartType, WidgetType, WidgetSize } from '../../types/dashboard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-hooks';
import { Square, RectangleHorizontal, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddWidgetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (type: WidgetType, size: WidgetSize, options?: { title?: string; config?: { categoryIds?: string[] } }) => Promise<void>;
    onSuccess?: () => void;
}

interface Category {
    id: string;
    nome: string;
}

export const AddWidgetDialog: React.FC<AddWidgetDialogProps> = ({ open, onOpenChange, onAdd, onSuccess }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [chartType, setChartType] = useState<ChartType>('pie');
    const [dataSource, setDataSource] = useState('all');
    const [widgetSize, setWidgetSize] = useState<WidgetSize>('md');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    useEffect(() => {
        if (open && user) {
            const fetchCategories = async () => {
                const { data } = await supabase
                    .from('categories')
                    .select('id, nome')
                    .eq('user_id', user.id)
                    .order('nome');

                if (data) {
                    setCategories(data);
                }
            };
            fetchCategories();
        }
    }, [open, user]);

    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleSubmit = async () => {
        if (!user) return;
        let finalType: WidgetType = 'EXPENSE_BY_CATEGORY';
        let config: Record<string, unknown> = {};

        if (dataSource === 'custom') {
            finalType = 'CUSTOM_EXPENSE';
            config = { categoryIds: selectedCategories };
        } else if (dataSource === 'income_vs_expense' || chartType === 'bar') {
            finalType = 'REVENUE_VS_EXPENSE';
            config = { mode: 'income_vs_expense' };
        } else {
            finalType = 'EXPENSE_BY_CATEGORY';
            config = { dataSource };
        }

        const options = {
            title: title || 'Novo Widget',
            config,
        };

        await onAdd(finalType, widgetSize, options);
        if (onSuccess) {
            onSuccess();
        } else {
            onOpenChange(false);
        }

        // Reset form
        setTitle('');
        setChartType('pie');
        setDataSource('all');
        setWidgetSize('md');
        setSelectedCategories([]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Widget</DialogTitle>
                    <DialogDescription className="sr-only">
                        Escolha o tipo de gráfico e configure os filtros para adicionar ao dashboard.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Título
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                            placeholder="Ex: Meus Gastos"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Tipo
                        </Label>
                        <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pie">Gráfico de Pizza</SelectItem>
                                <SelectItem value="bar">Gráfico de Barras</SelectItem>
                                <SelectItem value="line">Gráfico de Linha</SelectItem>
                                <SelectItem value="metric">Métrica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Size Selection */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right mt-2">Tamanho</Label>
                        <div className="col-span-3 grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setWidgetSize('sm')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-2",
                                    widgetSize === 'sm'
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-muted hover:border-primary/50 text-muted-foreground"
                                )}
                            >
                                <Square className="h-5 w-5" />
                                <span className="text-xs font-medium">Pequeno</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setWidgetSize('md')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-2",
                                    widgetSize === 'md'
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-muted hover:border-primary/50 text-muted-foreground"
                                )}
                            >
                                <RectangleHorizontal className="h-5 w-5" />
                                <span className="text-xs font-medium">Médio</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setWidgetSize('lg')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-2",
                                    widgetSize === 'lg'
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-muted hover:border-primary/50 text-muted-foreground"
                                )}
                            >
                                <Maximize className="h-5 w-5" />
                                <span className="text-xs font-medium">Grande</span>
                            </button>
                        </div>
                    </div>

                    {(chartType === 'pie' || chartType === 'bar' || chartType === 'line') && (
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="category" className="text-right mt-2">
                                Dados
                            </Label>
                    <div className="col-span-3 space-y-3">
                        <Select value={dataSource} onValueChange={setDataSource}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione os dados" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Despesas</SelectItem>
                                <SelectItem value="fixed">Apenas Fixas</SelectItem>
                                <SelectItem value="variable">Apenas Variáveis</SelectItem>
                                <SelectItem value="income_vs_expense">Receitas vs Despesas</SelectItem>
                                <SelectItem value="custom">Por Categoria</SelectItem>
                            </SelectContent>
                        </Select>

                                {dataSource === 'custom' && (
                                    <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto bg-slate-50 dark:bg-slate-900">
                                        <p className="text-xs text-muted-foreground mb-2">Selecione as categorias:</p>
                                        {categories.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>}
                                        {categories.map((cat) => (
                                            <div key={cat.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`cat-${cat.id}`}
                                                    checked={selectedCategories.includes(cat.id)}
                                                    onCheckedChange={() => handleCategoryToggle(cat.id)}
                                                />
                                                <Label
                                                    htmlFor={`cat-${cat.id}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {cat.nome}
                                                </Label>
                                            </div>
                                        ))}

                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={!title}>
                        Criar Widget
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
