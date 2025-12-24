//
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { ChartData } from '@/hooks/useDashboardMetrics';
import { formatCurrency } from '@/lib/format';
import { FileX, AlertCircle } from 'lucide-react';

interface ExpensePieChartProps {
    data: ChartData[];
    title: string;
    isLoading: boolean;
    emptyMessage?: string;
    error?: Error | null;
}

export function ExpensePieChart({
    data,
    title,
    isLoading,
    emptyMessage = "Nenhum dado encontrado",
    error
}: ExpensePieChartProps) {
    if (isLoading) {
        return (
            <Card className="w-full h-full flex flex-col border-none shadow-none bg-transparent">
                <CardHeader className="pb-2 px-0 pt-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center gap-4 p-0">
                    <div className="w-32 h-32 rounded-full border-[16px] border-muted/20 animate-pulse" />
                    <div className="flex gap-2 flex-wrap justify-center">
                        <div className="h-2 w-12 bg-muted/20 rounded animate-pulse" />
                        <div className="h-2 w-12 bg-muted/20 rounded animate-pulse" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full h-full flex flex-col border-none shadow-none bg-transparent">
                 <CardHeader className="pb-2 px-0 pt-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center text-destructive gap-2 p-0">
                    <AlertCircle className="h-8 w-8 opacity-50" />
                    <p className="text-xs font-medium">Erro ao carregar dados</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full h-full flex flex-col border-none shadow-none bg-transparent">
            <CardHeader className="pb-2 px-0 pt-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] p-0">
                {data.length === 0 ? (
                    <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-3">
                        <div className="p-3 bg-muted/10 rounded-full">
                            <FileX className="h-6 w-6 opacity-50" />
                        </div>
                        <p className="text-xs">{emptyMessage}</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="80%"
                                paddingAngle={2}
                                dataKey="value"
                                strokeWidth={1}
                                stroke="hsl(var(--card))"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number | string) => [formatCurrency(Number(value)), 'Valor']}
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
                )}
            </CardContent>
        </Card>
    );
}
