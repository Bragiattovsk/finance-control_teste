import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import { DashboardWidget } from "@/types/dashboard";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, Legend } from "recharts";
import { Transaction } from "@/types";
import { formatCurrency } from "@/lib/format";

// Cores do Tema Dark
const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#6366f1'];

interface ChartDataItem {
    name?: string;
    value: number;
    fill?: string;
    [key: string]: string | number | undefined;
}

// Interface estendida para suportar as propriedades legadas/específicas deste componente
interface ConfigurableWidget extends DashboardWidget {
    title?: string;
    chart_type?: 'pie' | 'bar' | 'metric';
    data_config?: {
        type?: 'income' | 'expense';
        filterType?: 'income' | 'expense' | 'all';
        period?: string;
    };
}

interface WidgetCardProps {
    widget: ConfigurableWidget;
    onDelete: (id: string) => void;
    isEditable: boolean;
    isEditing?: boolean;
    transactions?: Transaction[];
    fixedExpenses?: { name: string; value: number; color: string }[];
    variableExpenses?: { name: string; value: number; color: string }[];
    // react-grid-layout props
    style?: React.CSSProperties;
    className?: string;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onTouchEnd?: React.TouchEventHandler;
}

export function WidgetCard({ widget, onDelete, isEditable, transactions = [], style, className, onMouseDown, onMouseUp, onTouchEnd, ...props }: WidgetCardProps) {

    // Lógica de Processamento de Dados
    const chartData = useMemo<ChartDataItem[]>(() => {
        const { chart_type, data_config } = widget;

        // 1. Lógica para PIZZA (Pie) - Ex: "Despesas por Categoria"
        if (chart_type === 'pie') {
            const typeFilter = data_config?.type || 'expense'; // 'income' ou 'expense'
            const dbType = typeFilter === 'expense' ? 'despesa' : 'receita';

            // Filtra transações
            const filtered = transactions.filter(t => t.tipo === dbType);

            // Agrupa por categoria
            const grouped = filtered.reduce((acc, curr) => {
                const cat = curr.categories?.nome || 'Outros';
                acc[cat] = (acc[cat] || 0) + Number(curr.valor);
                return acc;
            }, {} as Record<string, number>);

            // Formata para Recharts
            return Object.entries(grouped).map(([name, value]) => ({ name, value }));
        }

        // 2. Lógica para BARRA (Bar) - Ex: "Receitas vs Despesas"
        if (chart_type === 'bar') {
            // const period = data_config?.period || 'current_month';

            // (Simplificado) Filtra mês atual se necessário
            // Assumindo que transactions já vem filtrado pelo mês selecionado no Dashboard
            const filtered = transactions;

            // if (period === 'current_month') {
            //     const now = new Date();
            //     // Se as transações já vierem filtradas do pai, isso é redundante mas seguro
            //     // filtered = transactions.filter(...) 
            // }

            const income = filtered.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor), 0);
            const expense = filtered.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor), 0);

            return [
                { name: 'Receitas', value: income, fill: '#10b981' }, // Verde
                { name: 'Despesas', value: expense, fill: '#ef4444' } // Vermelho
            ];
        }

        // 3. Lógica para MÉTRICA (Metric)
        if (chart_type === 'metric') {
            const typeFilter = data_config?.filterType || 'all';
            let filtered = transactions;

            if (typeFilter === 'expense') filtered = transactions.filter(t => t.tipo === 'despesa');
            if (typeFilter === 'income') filtered = transactions.filter(t => t.tipo === 'receita');

            const total = filtered.reduce((acc, t) => acc + Number(t.valor), 0);
            return [{ value: total }];
        }

        return [];
    }, [widget, transactions]);

    // Renderização do Conteúdo do Gráfico
    const renderChart = () => {
        if (!chartData || chartData.length === 0) {
            return <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Sem dados neste período</div>;
        }

        switch (widget.chart_type) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'metric':
                return (
                    <div className="flex h-full items-center justify-center">
                        <span className="text-4xl font-bold">{formatCurrency(chartData[0].value)}</span>
                    </div>
                );

            default:
                return <div>Tipo desconhecido</div>;
        }
    };

    return (
        <div
            style={style}
            className={className}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
            {...props}
        >
            <Card className="h-full w-full flex flex-col overflow-hidden">
                <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 p-4 ${isEditable ? 'cursor-move draggable-handle' : ''}`}>
                    <CardTitle className="text-sm font-medium leading-none flex items-center gap-2">
                        {isEditable && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                        {widget.title}
                    </CardTitle>
                    {isEditable && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(widget.i)} onMouseDown={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="flex-1 p-0 min-h-[300px]">
                    <div className="h-full w-full p-4 pt-0">
                        {renderChart()}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
