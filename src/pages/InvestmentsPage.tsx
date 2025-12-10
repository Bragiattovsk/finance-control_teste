import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/project-hooks"
import { useDate } from "@/contexts/date-hooks"
import { MonthSelector } from "@/components/MonthSelector"
import { formatCurrency } from "@/lib/format"
import { applyProjectScope, getMonthRange } from "@/lib/supabase-helpers"

 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { TrendingUp, TrendingDown, DollarSign, Plus, Loader2, LineChart } from "lucide-react"
import { InvestmentModal } from "@/components/investments/InvestmentModal"
import { NewGoalModal } from "@/components/NewGoalModal"
import { GoalCard } from "@/components/GoalCard"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
// Component for simulation
import { InvestmentSimulator } from "@/components/InvestmentSimulator"
import { InvestmentsList } from "@/components/investments/InvestmentsList"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"

interface InvestmentTransaction {
    id: string
    descricao: string
    valor: number
    data: string
    categories: {
        nome: string
        cor: string
    }
}

interface GroupedInvestment {
    categoryName: string
    categoryColor: string
    total: number
    transactions: InvestmentTransaction[]
}

interface MonthlyHistory {
    month: string // YYYY-MM
    displayMonth: string // MMM/YY
    income: number
    expense: number // Regular expense
    investment: number
    goal: number
    accumulatedGoal: number
    accumulatedRealized: number
}

interface InvestmentRecord {
    id: string
    name: string
    type: string
    amount: number
    date: string
}

interface Category {
    id: string
    nome: string
    cor: string
    is_investment?: boolean
    goal_id?: string | null
}

interface Goal {
    id: string
    title: string
    target_amount: number
    deadline: string
    categories: Category[]
}

export function InvestmentsPage() {
    const { user } = useAuth()
    const { selectedProject } = useProject()
    const { currentDate, setCurrentDate } = useDate()
    const [loading, setLoading] = useState(true)

    // Monthly View State
    const [goal, setGoal] = useState(0)
    const [realized, setRealized] = useState(0)
    const [investments, setInvestments] = useState<GroupedInvestment[]>([])

    // Historical/All-Time State
    const [historicalData, setHistoricalData] = useState<MonthlyHistory[]>([])
    const [totalAccumulatedGoal, setTotalAccumulatedGoal] = useState(0)
    const [totalAccumulatedRealized, setTotalAccumulatedRealized] = useState(0)
    const [performance, setPerformance] = useState(0)

    const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false)

    // Goals State
    const [goals, setGoals] = useState<Goal[]>([])
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)

    const fetchGoals = useCallback(async () => {
        if (!user) return
        try {
            let query = supabase
                .from("goals")
                .select(`
                    *,
                    categories (
                        id,
                        nome,
                        cor,
                        is_investment,
                        goal_id
                    )
                `)
                .eq("user_id", user.id)
                .order("deadline", { ascending: true })

            query = applyProjectScope(query, selectedProject)

            const { data, error } = await query

            if (error) throw error
            setGoals(data || [])
        } catch (err) {
            console.error("Error fetching goals:", err)
        }
    }, [user, selectedProject])

    const handleEditGoal = (goal: Goal) => {
        setEditingGoal(goal)
        setIsGoalModalOpen(true)
    }

    const handleGoalSuccess = () => {
        fetchGoals()
        setEditingGoal(null)
    }

    const fetchHistoricalData = useCallback(async () => {
        if (!user) return

        try {
            // Fetch Profile for Goal Settings
            const { data: profile } = await supabase
                .from("profiles")
                .select("investimento_percentual, investimento_base")
                .eq("user_id", user.id)
                .single()

            const percent = Number(profile?.investimento_percentual || 0) / 100
            const base = profile?.investimento_base || "SOBRA"

            // Fetch ALL transactions for income/expense only (to compute goal)
            let txForGoalQuery = supabase
                .from("transactions")
                .select("valor, tipo, data")
                .eq("user_id", user.id)
                .order("data", { ascending: true })

            txForGoalQuery = applyProjectScope(txForGoalQuery, selectedProject)

            const { data: txForGoal } = await txForGoalQuery

            const monthlyMap = new Map<string, { income: number, expense: number, investment: number }>()

            txForGoal?.forEach((tx: { valor: number; tipo: "receita" | "despesa"; data: string }) => {
                const date = new Date(tx.data)
                const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
                const current = monthlyMap.get(monthKey) || { income: 0, expense: 0, investment: 0 }
                const val = Number(tx.valor)
                if (tx.tipo === "receita") current.income += val
                else current.expense += val
                monthlyMap.set(monthKey, current)
            })

            // Fetch investments table and add to investment totals
            let invSummaryQuery = supabase
                .from("investments")
                .select("amount, date")
                .eq("user_id", user.id)
                .order("date", { ascending: true })

            invSummaryQuery = applyProjectScope(invSummaryQuery, selectedProject)

            const { data: allInvestments } = await invSummaryQuery

            allInvestments?.forEach((inv: { amount: number; date: string }) => {
                const date = new Date(inv.date)
                const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
                const current = monthlyMap.get(monthKey) || { income: 0, expense: 0, investment: 0 }
                current.investment += Number(inv.amount)
                monthlyMap.set(monthKey, current)
            })

            // Calculate Goals and Accumulations
            let accGoal = 0
            let accRealized = 0
            const history: MonthlyHistory[] = []

            // Sort months chronologically
            const sortedMonths = Array.from(monthlyMap.keys()).sort()

            sortedMonths.forEach(monthKey => {
                const data = monthlyMap.get(monthKey)!

                // Calculate Monthly Goal
                let monthlyGoal = 0
                if (base === "BRUTO") {
                    monthlyGoal = data.income * percent
                } else {
                    monthlyGoal = Math.max(0, (data.income - data.expense) * percent)
                }

                accGoal += monthlyGoal
                accRealized += data.investment

                const [year, month] = monthKey.split('-')
                const dateObj = new Date(Number(year), Number(month) - 1)
                const displayMonth = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

                history.push({
                    month: monthKey,
                    displayMonth: displayMonth.charAt(0).toUpperCase() + displayMonth.slice(1),
                    income: data.income,
                    expense: data.expense,
                    investment: data.investment,
                    goal: monthlyGoal,
                    accumulatedGoal: accGoal,
                    accumulatedRealized: accRealized
                })
            })

            setHistoricalData(history)
            setTotalAccumulatedGoal(accGoal)
            setTotalAccumulatedRealized(accRealized)
            setPerformance(accGoal > 0 ? (accRealized / accGoal) * 100 : 0)

        } catch (err) {
            console.error("Error fetching historical data:", err)
        }
    }, [user, selectedProject])

    const fetchMonthlyData = useCallback(async () => {
        if (!user) return

        try {
            setLoading(true)
            const { startOfMonth, endOfMonth } = getMonthRange(currentDate)

            // 1. Fetch Profile for Goal Calculation
            const { data: profile } = await supabase
                .from("profiles")
                .select("investimento_percentual, investimento_base")
                .eq("user_id", user.id)
                .single()

            // 2. Fetch All Transactions for the Month (to calc income/expense for goal)
            let txQuery = supabase
                .from("transactions")
                .select("valor, tipo, categories(is_investment)")
                .eq("user_id", user.id)
                .gte("data", startOfMonth)
                .lte("data", endOfMonth)

            txQuery = applyProjectScope(txQuery, selectedProject)

            const { data: allTransactions } = await txQuery

            let income = 0
            let expense = 0
            allTransactions?.forEach((tx: { valor: number; tipo: string; categories: { is_investment: boolean }[] }) => {
                const categories = tx.categories?.[0]
                const isInv = categories?.is_investment
                if (!isInv) {
                    if (tx.tipo === "receita") income += Number(tx.valor)
                    if (tx.tipo === "despesa") expense += Number(tx.valor)
                }
            })

            // Calculate Goal
            let calculatedGoal = 0
            const percent = Number(profile?.investimento_percentual || 0) / 100
            const base = profile?.investimento_base || "SOBRA"

            if (base === "BRUTO") {
                calculatedGoal = income * percent
            } else {
                calculatedGoal = Math.max(0, (income - expense) * percent)
            }
            setGoal(calculatedGoal)

            // 3. Fetch investments for the month (EXCLUSIVE source)
            let invTableQuery = supabase
                .from("investments")
                .select("id, name, type, amount, date")
                .eq("user_id", user.id)
                .gte("date", startOfMonth)
                .lte("date", endOfMonth)
                .order("date", { ascending: false })

            invTableQuery = applyProjectScope(invTableQuery, selectedProject)

            const { data: monthlyInvestments } = await invTableQuery

            let totalRealized = 0
            const groupedMap = new Map<string, GroupedInvestment>()

            const typeColors: Record<string, string> = {
                "Renda Fixa": "#22c55e",
                "Ações": "#3b82f6",
                "FIIs": "#a855f7",
                "Cripto": "#ef4444",
                "Fundos": "#06b6d4",
                "Outros": "#64748b",
            }

            monthlyInvestments?.forEach((inv: InvestmentRecord) => {
                const val = Number(inv.amount)
                totalRealized += val

                const typeName = inv.type || "Outros"
                const current: GroupedInvestment = groupedMap.get(typeName) || {
                    categoryName: typeName,
                    categoryColor: typeColors[typeName] || "#64748b",
                    total: 0,
                    transactions: []
                }

                current.total += val
                current.transactions.push({
                    id: inv.id,
                    descricao: inv.name,
                    valor: val,
                    data: inv.date,
                    categories: { nome: typeName, cor: current.categoryColor }
                })
                groupedMap.set(typeName, current)
            })

            setRealized(totalRealized)
            setInvestments(Array.from(groupedMap.values()))

        } catch (err) {
            console.error("Error fetching investment data:", err)
        } finally {
            setLoading(false)
        }
    }, [user, currentDate, selectedProject])

    useEffect(() => {
        fetchHistoricalData()
        fetchGoals()
    }, [fetchHistoricalData, fetchGoals])

    useEffect(() => {
        fetchMonthlyData()
    }, [fetchMonthlyData])

    const difference = realized - goal
    const progress = goal > 0 ? Math.min(100, (realized / goal) * 100) : 0

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg font-medium text-muted-foreground">Carregando...</span>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-1 pb-20 md:pb-0">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Investimentos</h1>
                    <p className="text-muted-foreground mt-1">Gerencie seus aportes e acompanhe a evolução patrimonial.</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                    <Button onClick={() => setIsInvestmentModalOpen(true)} className="w-full md:w-auto gap-2 shadow-sm">
                        <Plus className="h-4 w-4" /> Novo Aporte
                    </Button>
                </div>
            </div>

            <InvestmentModal
                isOpen={isInvestmentModalOpen}
                onClose={() => setIsInvestmentModalOpen(false)}
                onSuccess={() => {
                    fetchMonthlyData()
                    fetchHistoricalData()
                }}
            />

            <Tabs defaultValue="overview" className="space-y-8">
                <div className="w-full overflow-x-auto pb-2">
                    <TabsList className="w-full justify-start md:w-auto bg-muted/50 p-1">
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="goals">Metas</TabsTrigger>
                        <TabsTrigger value="simulator">Simulador</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview">
                    <div className="space-y-6">
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Patrimônio Acumulado</CardTitle>
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{formatCurrency(totalAccumulatedRealized)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Total histórico investido</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Meta Total</CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{formatCurrency(totalAccumulatedGoal)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Soma de todas as metas</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Progresso Geral</CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <LineChart className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{performance.toFixed(1)}%</div>
                                    <Progress value={Math.min(performance, 100)} className="h-2 mt-2 bg-primary/20" />
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Aportes (Mês Atual)</CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <DollarSign className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{formatCurrency(realized)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Meta: {formatCurrency(goal)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="col-span-4 rounded-xl border-border/50 bg-card shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-border/40 bg-muted/20">
                                <CardTitle className="text-foreground">Evolução Patrimonial</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-0 pt-6 pr-6">
                                <div className="h-[360px] md:h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={historicalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="displayMonth"
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                tickFormatter={(value) => `R$ ${value}`}
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(Number(value))}
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    borderColor: 'hsl(var(--border))',
                                                    color: 'hsl(var(--foreground))',
                                                    borderRadius: 'var(--radius)'
                                                }}
                                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                            />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="accumulatedGoal"
                                                name="Meta Acumulada"
                                                stroke="hsl(var(--muted-foreground))"
                                                fillOpacity={0}
                                                strokeDasharray="5 5"
                                                strokeWidth={2}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="accumulatedRealized"
                                                name="Patrimônio Real"
                                                stroke="hsl(var(--primary))"
                                                fill="url(#colorRealized)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="mt-6">
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-foreground">Investimentos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <InvestmentsList onChanged={() => { fetchMonthlyData(); fetchHistoricalData(); }} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="goals">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Metas Financeiras</h2>
                            <Button variant="outline" className="gap-2" onClick={() => {
                                setEditingGoal(null)
                                setIsGoalModalOpen(true)
                            }}>
                                <Plus className="h-4 w-4" />
                                Nova Meta
                            </Button>
                        </div>
                        <NewGoalModal
                            isOpen={isGoalModalOpen}
                            onClose={() => setIsGoalModalOpen(false)}
                            onSuccess={handleGoalSuccess}
                            goalToEdit={editingGoal}
                        />

                        {goals.length === 0 ? (
                            <div className="text-center py-8 border border-border/50 rounded-xl bg-zinc-900/50">
                                <p className="text-muted-foreground">Nenhuma meta cadastrada.</p>
                                <p className="text-sm text-muted-foreground">Crie uma meta para acompanhar seu progresso.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {goals.map(goal => (
                                    <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} onDelete={handleGoalSuccess} />
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="statement">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                        <div className="flex items-center gap-2">
                                <Button onClick={() => setIsInvestmentModalOpen(true)} className="gap-2 rounded-lg shadow-sm hover:shadow-md transition-all">
                                    <Plus className="h-4 w-4" />
                                    Novo Aporte
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Meta do Mês</CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <DollarSign className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{formatCurrency(goal)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Baseado no seu perfil</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Aporte Realizado</CardTitle>
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{formatCurrency(realized)}</div>
                                    <Progress value={progress} className="mt-2 h-2 bg-emerald-500/20 [&>div]:bg-emerald-500" />
                                    <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% da meta</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Diferença</CardTitle>
                                    <div className={`p-2 rounded-lg ${difference >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                                        {difference >= 0 ? (
                                            <TrendingUp className={`h-4 w-4 ${difference >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
                                        ) : (
                                            <TrendingDown className={`h-4 w-4 ${difference >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${difference >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{formatCurrency(difference)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{difference >= 0 ? "Meta atingida!" : "Falta para a meta"}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Categorias de Investimento</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{investments.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Ativas neste mês</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Aportes do Mês</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{investments.reduce((acc, g) => acc + g.transactions.length, 0)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Total de lançamentos</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{formatCurrency((investments.reduce((acc, g) => acc + g.transactions.length, 0) > 0 ? (realized / investments.reduce((acc, g) => acc + g.transactions.length, 0)) : 0))}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Valor médio por aporte</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Transações de Investimento</h3>
                            {investments.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8 border border-border/50 rounded-xl bg-card">Nenhum investimento encontrado neste mês.</div>
                            ) : (
                                investments.map((group) => (
                                    <Card key={group.categoryName} className="rounded-xl border-border/50 bg-card shadow-sm overflow-hidden">
                                    <CardHeader className="pb-2 bg-muted/20 border-b border-border/40">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full ring-1 ring-white/20" style={{ backgroundColor: group.categoryColor }} />
                                                <CardTitle className="text-lg text-foreground">{group.categoryName}</CardTitle>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-muted/50 border-border/40">{group.transactions.length} lançamentos</Badge>
                                                <span className="font-bold text-foreground">{formatCurrency(group.total)}</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                    <TableRow className="hover:bg-muted/30 border-border/40">
                                                        <TableHead className="text-muted-foreground pl-6">Data</TableHead>
                                                        <TableHead className="text-muted-foreground">Descrição</TableHead>
                                                        <TableHead className="text-right text-muted-foreground pr-6">Valor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {group.transactions.map((tx) => (
                                                        <TableRow key={tx.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                                                            <TableCell className="text-muted-foreground pl-6">{new Date(tx.data).toLocaleDateString("pt-BR")}</TableCell>
                                                            <TableCell className="text-foreground">{tx.descricao}</TableCell>
                                                            <TableCell className="text-right font-medium text-foreground pr-6">{formatCurrency(tx.valor)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="simulator">
                    <div className="mt-4">
                        <InvestmentSimulator />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
