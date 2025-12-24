import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { formatCurrency } from "@/lib/format"

interface OverviewDataPoint {
    displayMonth: string;
    accumulatedGoal: number;
    accumulatedRealized: number;
    [key: string]: string | number;
}

interface OverviewChartProps {
    data: OverviewDataPoint[]
}

export function OverviewChart({ data }: OverviewChartProps) {
    return (
        <Card className="col-span-4 rounded-xl border-border/50 bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/5">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold tracking-tight">Evolução Patrimonial</CardTitle>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Acompanhamento do patrimônio acumulado vs metas
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorGoal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis 
                                dataKey="displayMonth" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                stroke="#888888"
                                dy={10}
                            />
                            <YAxis 
                                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                stroke="#888888"
                            />
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: "hsl(var(--popover))", 
                                    borderColor: "hsl(var(--border))", 
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                }}
                                itemStyle={{ color: "hsl(var(--popover-foreground))", fontSize: "12px" }}
                                labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px", fontSize: "12px" }}
                                formatter={(value: number) => [formatCurrency(value), ""]}
                            />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} />
                            <Area 
                                type="monotone" 
                                dataKey="accumulatedGoal" 
                                name="Meta Acumulada" 
                                stroke="#8b5cf6" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1} 
                                fill="url(#colorGoal)" 
                            />
                            <Area 
                                type="monotone" 
                                dataKey="accumulatedRealized" 
                                name="Patrimônio Realizado" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorRealized)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
