import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useInvestment } from '@/hooks/useInvestment';
import { formatCurrency } from '@/lib/format';
import { ChartType } from '@/types/dashboard';
import { Loader2, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface CustomChartWidgetProps {
    title: string;
    chartType: ChartType;
    dataConfig: {
        categoryIds?: string[];
        dataSource?: string; // 'all', 'fixed', 'variable', 'custom'
        mode?: string; // 'income_vs_expense' para resumo
    };
    type?: string;
    currentDate: Date;
}

const COLORS = ['#8b5cf6', '#10b981', '#f43f5e', '#6366f1', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6'];

type ChartDatum = { name: string; value: number; color?: string };

export const CustomChartWidget: React.FC<CustomChartWidgetProps> = ({ title, chartType, dataConfig, currentDate }) => {
    const { transactions, loading, income, expense } = useInvestment(currentDate);

    const processedData = useMemo<ChartDatum[]>(() => {
        const isIncomeVsExpense = (
            title?.toLowerCase().includes('receitas vs despesas') ||
            dataConfig?.mode === 'income_vs_expense' ||
            dataConfig?.dataSource === 'summary'
        );

        if (isIncomeVsExpense) {
            return [
                { name: 'Receitas', value: Number(income || 0), color: '#10b981' }, // emerald-500
                { name: 'Despesas', value: Number(expense || 0), color: '#f43f5e' }  // rose-500
            ];
        }

        if (!transactions) return [];

        let filtered = transactions.filter(t => t.tipo === 'despesa');

        if (dataConfig.dataSource === 'fixed') {
            filtered = filtered.filter(t => t.is_recurrent_copy);
        } else if (dataConfig.dataSource === 'variable') {
            filtered = filtered.filter(t => !t.is_recurrent_copy);
        } else if (dataConfig.dataSource === 'custom' && dataConfig.categoryIds?.length) {
            filtered = filtered.filter(t => t.categoria_id && dataConfig.categoryIds?.includes(t.categoria_id));
        }

        const grouped = filtered.reduce((acc, curr) => {
            const categoryData = Array.isArray(curr.categories) ? curr.categories[0] : curr.categories;
            const catName = categoryData?.nome || 'Outros';
            if (!acc[catName]) {
                acc[catName] = { value: 0, color: (Array.isArray(curr.categories) ? curr.categories[0] : curr.categories)?.cor || undefined };
            }
            acc[catName].value += Number(curr.valor);
            return acc;
        }, {} as Record<string, { value: number; color?: string }>);

        return Object.entries(grouped)
            .map(([name, { value, color }]) => ({ name, value, color }))
            .sort((a, b) => b.value - a.value);

    }, [transactions, income, expense, title, dataConfig.mode, dataConfig.dataSource, dataConfig.categoryIds]);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs">Carregando dados...</p>
            </div>
        );
    }

    if (processedData.length === 0) {
        return (
            <div className="h-full flex flex-col">
                <div className="pb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    {chartType === 'pie' ? <PieChartIcon className="h-8 w-8 opacity-20" /> : <BarChart3 className="h-8 w-8 opacity-20" />}
                    <p className="text-xs">Sem dados para exibir.</p>
                </div>
            </div>
        );
    }

    const renderChart = () => {
        switch (chartType) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={processedData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                innerRadius="60%"
                                outerRadius="80%"
                                paddingAngle={2}
                                fill="#8884d8"
                                dataKey="value"
                                strokeWidth={1}
                                stroke="hsl(var(--card))"
                            >
                                {processedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--popover))', 
                                    borderColor: 'hsl(var(--border))',
                                    color: 'hsl(var(--popover-foreground))',
                                    borderRadius: '8px',
                                    boxShadow: 'var(--shadow-md)',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ color: 'inherit' }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis 
                                dataKey="name" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                interval={0}
                            />
                            <YAxis 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => `R$${value}`} 
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip 
                                cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 4 }}
                                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--popover))', 
                                    borderColor: 'hsl(var(--border))',
                                    color: 'hsl(var(--popover-foreground))',
                                    borderRadius: '8px',
                                    boxShadow: 'var(--shadow-md)',
                                    fontSize: '12px'
                                }}
                            />
                            <Bar 
                                dataKey="value" 
                                radius={[4, 4, 0, 0]} 
                                maxBarSize={50}
                            >
                                {processedData.map((entry, index) => (
                                    <Cell key={`bar-cell-${index}`} fill={entry.color || 'hsl(var(--primary))'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                // Fallback to Bar for now as per original code
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                             <XAxis 
                                dataKey="name" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'metric': {
                const total = processedData.reduce((acc, curr) => acc + curr.value, 0);
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-4xl font-bold text-primary tracking-tight">{formatCurrency(total)}</span>
                        <span className="text-sm text-muted-foreground mt-2 font-medium">Total no Período</span>
                    </div>
                );
            }
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="pb-2 px-0 pt-0">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            </div>
            <div className="flex-1 min-h-[300px]">
                {renderChart()}
            </div>
        </div>
    );
};
