import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/ProjectContext"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { MonthSelector } from "@/components/MonthSelector"
import { UpgradeModal } from "@/components/UpgradeModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    XAxis, YAxis, CartesianGrid, AreaChart, Area
} from "recharts"
import { Project, Transaction } from "@/types"
import { Loader2, TrendingUp, TrendingDown, Wallet, DollarSign } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { subMonths, eachMonthOfInterval, format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AnalyticsData {
    contextName: string
    contextId: string
    color: string
    income: number
    expense: number
    balance: number // Accumulated
    monthResult: number
}

export function AnalyticsPage() {
    const { user, profile } = useAuth()
    const { selectProject } = useProject()
    const navigate = useNavigate()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState<Project[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return

        try {
            setLoading(true)

            // Fetch Projects
            const { data: projectsData, error: projectsError } = await supabase
                .from("projects")
                .select("*")
                .eq("user_id", user.id)

            if (projectsError) throw projectsError

            // Fetch All Transactions (for accumulated balance)
            const { data: transactionsData, error: transactionsError } = await supabase
                .from("transactions")
                .select("*")
                .eq("user_id", user.id)

            if (transactionsError) throw transactionsError

            setProjects(projectsData || [])
            setTransactions(transactionsData || [])

        } catch (error) {
            console.error("Error fetching analytics data:", error)
        } finally {
            setLoading(false)
        }
        }
        
        fetchData()
    }, [user])

    // 1. Current Month Data (KPIs)
    const currentMonthData = useMemo(() => {
        const start = startOfMonth(currentDate)
        const end = endOfMonth(currentDate)

        // Group by Project ID
        const groupedData: Record<string, AnalyticsData> = {}

        // Initialize groups
        groupedData["personal"] = {
            contextName: "Pessoal",
            contextId: "personal",
            color: "#3b82f6",
            income: 0,
            expense: 0,
            balance: 0,
            monthResult: 0
        }

        projects.forEach(p => {
            groupedData[p.id] = {
                contextName: p.name,
                contextId: p.id,
                color: p.color || "#64748b",
                income: 0,
                expense: 0,
                balance: 0,
                monthResult: 0
            }
        })

        // Process Transactions
        transactions.forEach(t => {
            const key = t.project_id || "personal"
            if (!groupedData[key]) return

            const amount = Number(t.valor)
            const isIncome = t.tipo === "receita"
            const tDate = new Date(t.data)

            // Accumulated Balance (All time)
            if (isIncome) {
                groupedData[key].balance += amount
            } else {
                groupedData[key].balance -= amount
            }

            // Month Data
            if (tDate >= start && tDate <= end) {
                if (isIncome) {
                    groupedData[key].income += amount
                } else {
                    groupedData[key].expense += amount
                }
                groupedData[key].monthResult = groupedData[key].income - groupedData[key].expense
            }
        })

        return Object.values(groupedData)
    }, [transactions, projects, currentDate])

    // 2. Previous Month Data (MoM Trends)
    const kpiTrends = useMemo(() => {
        const prevDate = subMonths(currentDate, 1)
        const startPrev = startOfMonth(prevDate)
        const endPrev = endOfMonth(prevDate)

        let prevIncome = 0
        let prevExpense = 0

        transactions.forEach(t => {
            const tDate = new Date(t.data)
            if (tDate >= startPrev && tDate <= endPrev) {
                const amount = Number(t.valor)
                if (t.tipo === "receita") {
                    prevIncome += amount
                } else {
                    prevExpense += amount
                }
            }
        })

        const prevResult = prevIncome - prevExpense

        const currentIncome = currentMonthData.reduce((acc, curr) => acc + curr.income, 0)
        const currentExpense = currentMonthData.reduce((acc, curr) => acc + curr.expense, 0)
        const currentResult = currentIncome - currentExpense

        const calculateTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0
            return ((current - previous) / previous) * 100
        }

        return {
            income: calculateTrend(currentIncome, prevIncome),
            expense: calculateTrend(currentExpense, prevExpense),
            result: calculateTrend(currentResult, prevResult)
        }
    }, [transactions, currentMonthData, currentDate])

    // 3. History Data (Last 6 Months)
    const historyData = useMemo(() => {
        const months = eachMonthOfInterval({
            start: subMonths(currentDate, 5),
            end: currentDate
        })

        return months.map(month => {
            const start = startOfMonth(month)
            const end = endOfMonth(month)
            let income = 0
            let expense = 0

            transactions.forEach(t => {
                const tDate = new Date(t.data)
                if (tDate >= start && tDate <= end) {
                    const amount = Number(t.valor)
                    if (t.tipo === "receita") {
                        income += amount
                    } else {
                        expense += amount
                    }
                }
            })

            return {
                month: format(month, "MMM", { locale: ptBR }),
                receita: income,
                lucro: income - expense
            }
        })
    }, [transactions, currentDate])

    // KPIs
    const totalPatrimony = currentMonthData.reduce((acc, curr) => acc + curr.balance, 0)
    const globalIncome = currentMonthData.reduce((acc, curr) => acc + curr.income, 0)
    const globalExpense = currentMonthData.reduce((acc, curr) => acc + curr.expense, 0)
    const globalResult = globalIncome - globalExpense

    // Charts Data
    const pieData = currentMonthData
        .filter(d => d.balance > 0)
        .map(d => ({ name: d.contextName, value: d.balance, color: d.color }))

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    const formatPercent = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "percent",
            maximumFractionDigits: 1,
            signDisplay: "exceptZero"
        }).format(value / 100)
    }

    const handleRowClick = (contextId: string) => {
        if (contextId === "personal") {
            selectProject(null)
        } else {
            const project = projects.find(p => p.id === contextId)
            if (project) {
                selectProject(project)
            }
        }
        navigate("/")
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (profile?.subscription_tier === 'FREE') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h2 className="text-2xl font-bold">Funcionalidade PRO 🚀</h2>
                <p className="mb-4 text-muted-foreground">O Analytics Global está disponível apenas para assinantes.</p>
                <Button onClick={() => setIsUpgradeModalOpen(true)}>Fazer Upgrade</Button>
                <UpgradeModal open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Inteligência Financeira</h1>
                <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
            </div>

            {/* KPI Cards with Trends */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPatrimony)}</div>
                        <p className="text-xs text-muted-foreground">Acumulado Geral</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Global</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(globalIncome)}</div>
                        <div className="flex items-center gap-1 mt-1">
                            {kpiTrends.income > 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                            <span className={`text-xs ${kpiTrends.income > 0 ? "text-green-500" : "text-red-500"}`}>
                                {formatPercent(kpiTrends.income)} vs mês anterior
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Despesa Global</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(globalExpense)}</div>
                        <div className="flex items-center gap-1 mt-1">
                            {kpiTrends.expense < 0 ? <TrendingDown className="h-3 w-3 text-green-500" /> : <TrendingUp className="h-3 w-3 text-red-500" />}
                            <span className={`text-xs ${kpiTrends.expense < 0 ? "text-green-500" : "text-red-500"}`}>
                                {formatPercent(kpiTrends.expense)} vs mês anterior
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resultado</CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${globalResult >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(globalResult)}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            {kpiTrends.result > 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                            <span className={`text-xs ${kpiTrends.result > 0 ? "text-green-500" : "text-red-500"}`}>
                                {formatPercent(kpiTrends.result)} vs mês anterior
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Evolution Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Evolução Financeira (Últimos 6 Meses)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `R$ ${value / 1000}k`} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", color: "hsl(var(--popover-foreground))" }}
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Area type="linear" dataKey="receita" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorReceita)" name="Receita" />
                            <Area type="linear" dataKey="lucro" stroke="#10b981" fillOpacity={1} fill="url(#colorLucro)" name="Lucro" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição de Patrimônio</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Detailed Table with Margins */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detalhamento de Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Contexto</TableHead>
                                    <TableHead className="text-right">Receita</TableHead>
                                    <TableHead className="text-right">Resultado</TableHead>
                                    <TableHead className="text-right">Margem %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentMonthData.map((row) => {
                                    const margin = row.income > 0 ? (row.monthResult / row.income) * 100 : 0
                                    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary"
                                    let badgeClass = ""

                                    if (margin > 0) {
                                        badgeVariant = "default"
                                        badgeClass = "bg-emerald-600 hover:bg-emerald-700"
                                    } else if (margin < 0) {
                                        badgeVariant = "destructive"
                                        badgeClass = "bg-rose-600 hover:bg-rose-700"
                                    } else {
                                        badgeVariant = "secondary"
                                        badgeClass = "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    }

                                    return (
                                        <TableRow
                                            key={row.contextId}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => handleRowClick(row.contextId)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
                                                    {row.contextName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">{formatCurrency(row.income)}</TableCell>
                                            <TableCell className={`text-right font-bold ${row.monthResult >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                {formatCurrency(row.monthResult)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant={badgeVariant}
                                                    className={badgeClass}
                                                >
                                                    {formatPercent(margin)}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
