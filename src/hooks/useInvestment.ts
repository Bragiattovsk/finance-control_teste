import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/project-hooks"

interface TransactionInvestment {
    valor: number
    tipo: "receita" | "despesa"
    is_recurrent_copy?: boolean
    categoria_id?: string
    categories: { nome: string; cor: string; is_investment: boolean } | { nome: string; cor: string; is_investment: boolean }[] | null
}

interface FinancialData {
    income: number
    expense: number
    balance: number
    investment: number // Isso será a META (Alvo)
    realizedInvestment: number // NOVO: Isso será o REALIZADO (Soma da tabela investments)
    loading: boolean
    expensesByCategory: { name: string; value: number; color: string }[]
    fixedExpenses: { name: string; value: number; color: string }[]
    variableExpenses: { name: string; value: number; color: string }[]
    transactions: TransactionInvestment[]
}

export function useInvestment(selectedDate: Date = new Date()) {
    const { user } = useAuth()
    const { selectedProject } = useProject()
    const [data, setData] = useState<FinancialData>({
        income: 0,
        expense: 0,
        balance: 0,
        investment: 0,
        realizedInvestment: 0, // Inicializa com 0
        loading: true,
        expensesByCategory: [],
        fixedExpenses: [],
        variableExpenses: [],
        transactions: [],
    })

    const fetchData = useCallback(async () => {
        if (!user) return

        try {
            setData(prev => ({ ...prev, loading: true }))
            
            // 1. Get User Profile for Investment Settings (Meta Settings)
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("investimento_percentual, investimento_base")
                .eq("user_id", user.id)
                .single()

            if (profileError && profileError.code !== "PGRST116") {
                console.error("Error fetching profile:", profileError)
            }

            // Define Date Range
            const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString()
            const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString()

            // ---------------------------------------------------------
            // 2. BUSCA DE TRANSAÇÕES (Para Renda, Despesa e Cálculo da Meta)
            // ---------------------------------------------------------
            let queryTx = supabase
                .from("transactions")
                .select("valor, tipo, is_recurrent_copy, categoria_id, categories(nome, cor, is_investment)")
                .eq("user_id", user.id)
                .gte("data", startOfMonth)
                .lte("data", endOfMonth)

            if (selectedProject) {
                queryTx = queryTx.eq("project_id", selectedProject.id)
            } else {
                queryTx = queryTx.is("project_id", null)
            }

            const { data: transactions, error: txError } = await queryTx

            if (txError) throw txError

            // ---------------------------------------------------------
            // 3. BUSCA DE INVESTIMENTOS REAIS (Tabela 'investments')
            // ---------------------------------------------------------
            // AQUI ESTÁ A CORREÇÃO: Buscamos o que realmente foi investido
            let queryInv = supabase
                .from("investments")
                .select("amount, date")
                .eq("user_id", user.id)
                .gte("date", startOfMonth)
                .lte("date", endOfMonth)

            // Aplica filtro de projeto também na tabela de investimentos
            if (selectedProject) {
                queryInv = queryInv.eq("project_id", selectedProject.id)
            } else {
                // Se sua tabela investments tiver project_id nullable, use isso. 
                // Se não tiver a coluna ainda, remova este else ou o filtro.
                // Assumindo que criamos a coluna no passo anterior:
                queryInv = queryInv.is("project_id", null)
            }

            const { data: investmentsData, error: invError } = await queryInv
            
            if (invError) console.error("Error fetching investments:", invError)

            // Soma do Realizado (Soma da coluna amount da tabela investments)
            const realizedInvestmentTotal = investmentsData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

            // ---------------------------------------------------------
            // 4. Calculate Totals based on Transactions
            // ---------------------------------------------------------
            let income = 0
            let totalRealExpenses = 0 
            let operationalExpenses = 0 
            const expenseMap = new Map<string, { value: number; color: string }>()
            const fixedExpenseMap = new Map<string, { value: number; color: string }>()
            const variableExpenseMap = new Map<string, { value: number; color: string }>()

            transactions?.forEach((tx) => {
                const valor = Number(tx.valor)
                const category = (Array.isArray(tx.categories) ? tx.categories[0] : tx.categories) as { nome: string; cor: string; is_investment: boolean } | undefined
                
                // Nota: is_investment aqui serve apenas para saber se exclui do cálculo operacional da meta
                const isInvestmentCategory = category?.is_investment

                if (tx.tipo === "receita") {
                    income += valor
                } else if (tx.tipo === "despesa") {
                    totalRealExpenses += valor

                    // Para cálculo de META, ignoramos categorias de investimento nas despesas operacionais
                    if (!isInvestmentCategory) {
                        operationalExpenses += valor

                        // Aggregate expenses
                        const categoryName = category?.nome || "Sem Categoria"
                        const categoryColor = category?.cor || "gray"

                        const current = expenseMap.get(categoryName) || { value: 0, color: categoryColor }
                        expenseMap.set(categoryName, { value: current.value + valor, color: categoryColor })

                        const isFixed = tx.is_recurrent_copy === true
                        const targetMap = isFixed ? fixedExpenseMap : variableExpenseMap
                        const currentTarget = targetMap.get(categoryName) || { value: 0, color: categoryColor }
                        targetMap.set(categoryName, { value: currentTarget.value + valor, color: categoryColor })
                    }
                }
            })

            const balance = income - totalRealExpenses

            // ---------------------------------------------------------
            // 5. Calculate Investment GOAL (Meta)
            // ---------------------------------------------------------
            let investmentGoal = 0
            const percent = Number(profile?.investimento_percentual || 0) / 100
            const base = profile?.investimento_base || "SOBRA"

            if (base === "BRUTO") {
                investmentGoal = income * percent
            } else {
                const operationalSurplus = income - operationalExpenses
                investmentGoal = Math.max(0, operationalSurplus * percent)
            }

            const formatMap = (map: Map<string, { value: number; color: string }>) =>
                Array.from(map.entries()).map(([name, { value, color }]) => ({ name, value, color }))

            setData({
                income,
                expense: totalRealExpenses,
                balance,
                investment: investmentGoal, // Isso é a META
                realizedInvestment: realizedInvestmentTotal, // Isso é o REALIZADO
                loading: false,
                expensesByCategory: formatMap(expenseMap),
                fixedExpenses: formatMap(fixedExpenseMap),
                variableExpenses: formatMap(variableExpenseMap),
                transactions: transactions || [],
            })
        } catch (error) {
            console.error("Error in useInvestment:", error)
            setData((prev) => ({ ...prev, loading: false }))
        }
    }, [user, selectedDate, selectedProject])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { ...data, refetch: fetchData }
}