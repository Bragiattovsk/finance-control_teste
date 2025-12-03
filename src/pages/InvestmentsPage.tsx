import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { MonthSelector } from "@/components/MonthSelector"
import { formatCurrency } from "@/lib/format"
import { applyProjectScope, getMonthRange } from "@/lib/supabase-helpers"

interface TransactionInvestment {
    id: string
    valor: number
    tipo: "receita" | "despesa"
    data: string
    categories: { is_investment?: boolean } | { is_investment?: boolean }[] | null
    categoria_id?: string | null
    descricao?: string
    pago?: boolean
    project_id?: string | null
    related_transaction_id?: string | null
    user_id?: string
}

interface TransactionInvestmentFull {
    id: string
    descricao: string
    valor: number
    data: string
    categoria_id: string | null
    categories: {
        id: string
        nome: string
        cor: string
        is_investment: boolean
    } | {
        id: string
        nome: string
        cor: string
        is_investment: boolean
    }[] | null
    project_id?: string | null
    user_id?: string
}
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
import { NewTransactionModal } from "@/components/NewTransactionModal"
import { NewGoalModal } from "@/components/NewGoalModal"
import { GoalCard } from "@/components/GoalCard"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
// Component for simulation
import { InvestmentSimulator } from "@/components/InvestmentSimulator"
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
    const [currentDate, setCurrentDate] = useState(new Date())
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

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [defaultCategoryId, setDefaultCategoryId] = useState<string>("")

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

            // Fetch ALL transactions with categories
            let query = supabase
                .from("transactions")
                .select(`
                    id,
                    valor,
                    tipo,
                    data,
                    categories (
                        is_investment
                    )
                `)
                .eq("user_id", user.id)
                .order("data", { ascending: true })

            if (selectedProject) {
                query = query.eq("project_id", selectedProject.id)
            } else {
                query = query.is("project_id", null)
            }

            const { data: allTxs, error } = await query

            if (error) throw error

            // Process Data
            const monthlyMap = new Map<string, { income: number, expense: number, investment: number }>()

            allTxs?.forEach((tx: TransactionInvestment) => {
                const date = new Date(tx.data)
                // Use UTC to avoid timezone issues shifting the month
                const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`

                const current = monthlyMap.get(monthKey) || { income: 0, expense: 0, investment: 0 }

                const val = Number(tx.valor)
                const categories = Array.isArray(tx.categories) ? tx.categories[0] : tx.categories
                const isInvestment = categories?.is_investment

                if (isInvestment) {
                    // Assuming investment is usually an outflow (expense) or explicitly marked
                    // We sum it as 'investment' regardless of type 'despesa'
                    current.investment += val
                } else {
                    if (tx.tipo === "receita") {
                        current.income += val
                    } else if (tx.tipo === "despesa") {
                        current.expense += val
                    }
                }
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

            // 3. Fetch Investment Transactions
            let invQuery = supabase
                .from("transactions")
                .select(`
                    id,
                    descricao,
                    valor,
                    data,
                    categoria_id,
                    categories (
                        id,
                        nome,
                        cor,
                        is_investment
                    )
                `)
                .eq("user_id", user.id)
                .gte("data", startOfMonth)
                .lte("data", endOfMonth)
                .order("data", { ascending: false })

            invQuery = applyProjectScope(invQuery, selectedProject)

            const { data: investmentTxs, error } = await invQuery

            if (error) throw error

            // Filter and Group
            let totalRealized = 0
            const groupedMap = new Map<string, GroupedInvestment>()
            let firstInvestmentCatId = ""

            investmentTxs?.forEach((tx: TransactionInvestmentFull) => {
                const categories = Array.isArray(tx.categories) ? tx.categories[0] : tx.categories
                if (categories?.is_investment) {
                    const val = Number(tx.valor)
                    totalRealized += val

                    if (!firstInvestmentCatId) firstInvestmentCatId = categories.id

                    const catName = categories.nome
                    // Explicitly type the new object to match GroupedInvestment
                    const current: GroupedInvestment = groupedMap.get(catName) || {
                        categoryName: catName,
                        categoryColor: categories.cor,
                        total: 0,
                        transactions: []
                    }

                    current.total += val
                    current.transactions.push({
                        id: tx.id,
                        descricao: tx.descricao,
                        valor: val,
                        data: tx.data,
                        categories: {
                            nome: categories.nome,
                            cor: categories.cor
                        }
                    })
                    groupedMap.set(catName, current)
                }
            })

            setRealized(totalRealized)
            setInvestments(Array.from(groupedMap.values()))

            // If we didn't find any investment transaction, we should try to find ANY investment category to set as default
            if (!firstInvestmentCatId) {
                const { data: anyInvCat } = await supabase
                    .from("categories")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("is_investment", true)
                    .limit(1)
                    .single()

                if (anyInvCat) firstInvestmentCatId = anyInvCat.id
            }
            setDefaultCategoryId(firstInvestmentCatId)

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
        <div className="space-y-8 pb-20 md:pb-0">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Investimentos</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                    <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto gap-2">
                        <Plus className="h-4 w-4" /> Novo Aporte
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <div className="w-full overflow-x-auto pb-2">
                    <TabsList className="w-full justify-start md:w-auto">
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="goals">Metas</TabsTrigger>
                        <TabsTrigger value="simulator">Simulador</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview">
                    <div className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="p-4 md:p-6">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Patrimônio Acumulado</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">{formatCurrency(totalAccumulatedRealized)}</div>
                                <p className="text-xs text-muted-foreground">Total histórico investido</p>
                            </CardContent>
                        </Card>
                        <Card className="p-4 md:p-6">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Meta Total</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">{formatCurrency(totalAccumulatedGoal)}</div>
                                <p className="text-xs text-muted-foreground">Soma de todas as metas</p>
                            </CardContent>
                        </Card>
                        <Card className="p-4 md:p-6">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Progresso Geral</CardTitle>
                                <LineChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">{performance.toFixed(1)}%</div>
                                <Progress value={Math.min(performance, 100)} className="h-2 mt-2" />
                            </CardContent>
                        </Card>
                        <Card className="p-4 md:p-6">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Aportes (Mês Atual)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">{formatCurrency(realized)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Meta: {formatCurrency(goal)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                        <Card className="col-span-4 rounded-xl border-border/50 bg-card shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-foreground">Evolução Patrimonial</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
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
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                            <div className="flex items-center gap-2">
                                <NewTransactionModal
                                    open={isModalOpen}
                                    onOpenChange={setIsModalOpen}
                                    onSuccess={() => {
                                        fetchMonthlyData()
                                        fetchHistoricalData()
                                    }}
                                    defaultCategoryId={defaultCategoryId}
                                    isInvestmentMode={true}
                                />
                                <Button onClick={() => setIsModalOpen(true)} className="gap-2 rounded-lg shadow-sm hover:shadow-md transition-all">
                                    <Plus className="h-4 w-4" />
                                    Novo Aporte
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Meta do Mês</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{formatCurrency(goal)}</div>
                                    <p className="text-xs text-muted-foreground">Baseado no seu perfil</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Aporte Realizado</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{formatCurrency(realized)}</div>
                                    <Progress value={progress} className="mt-2" />
                                    <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% da meta</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Diferença</CardTitle>
                                    {difference >= 0 ? (
                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-rose-500" />
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${difference >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{formatCurrency(difference)}</div>
                                    <p className="text-xs text-muted-foreground">{difference >= 0 ? "Meta atingida!" : "Falta para a meta"}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Categorias de Investimento</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{investments.length}</div>
                                    <p className="text-xs text-muted-foreground">Ativas neste mês</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Aportes do Mês</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{investments.reduce((acc, g) => acc + g.transactions.length, 0)}</div>
                                    <p className="text-xs text-muted-foreground">Total de lançamentos</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{formatCurrency((investments.reduce((acc, g) => acc + g.transactions.length, 0) > 0 ? (realized / investments.reduce((acc, g) => acc + g.transactions.length, 0)) : 0))}</div>
                                    <p className="text-xs text-muted-foreground">Valor médio por aporte</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Transações de Investimento</h3>
                            {investments.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8 border border-border/50 rounded-xl bg-zinc-900/50">Nenhum investimento encontrado neste mês.</div>
                            ) : (
                                investments.map((group) => (
                                    <Card key={group.categoryName} className="rounded-xl border-border/50 bg-card shadow-sm">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full ring-1 ring-white/20" style={{ backgroundColor: group.categoryColor }} />
                                                <CardTitle className="text-lg text-foreground">{group.categoryName}</CardTitle>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-muted/50">{group.transactions.length} lançamentos</Badge>
                                                <span className="font-bold text-foreground">{formatCurrency(group.total)}</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                    <TableRow className="hover:bg-muted/30 border-border/40">
                                                        <TableHead className="text-muted-foreground">Data</TableHead>
                                                        <TableHead className="text-muted-foreground">Descrição</TableHead>
                                                        <TableHead className="text-right text-muted-foreground">Valor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {group.transactions.map((tx) => (
                                                        <TableRow key={tx.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                                                            <TableCell className="text-muted-foreground">{new Date(tx.data).toLocaleDateString("pt-BR")}</TableCell>
                                                            <TableCell className="text-foreground">{tx.descricao}</TableCell>
                                                            <TableCell className="text-right font-medium text-foreground">{formatCurrency(tx.valor)}</TableCell>
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
