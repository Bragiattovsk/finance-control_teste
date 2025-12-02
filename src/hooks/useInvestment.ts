import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"

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
    investment: number
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
            // 1. Get User Profile for Investment Settings
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("investimento_percentual, investimento_base")
                .eq("user_id", user.id)
                .single()

            if (profileError && profileError.code !== "PGRST116") {
                console.error("Error fetching profile:", profileError)
            }

            // 2. Get Transactions for Selected Month
            const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString()
            const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString()

            let query = supabase
                .from("transactions")
                .select("valor, tipo, is_recurrent_copy, categoria_id, categories(nome, cor, is_investment)")
                .eq("user_id", user.id)
                .gte("data", startOfMonth)
                .lte("data", endOfMonth)

            if (selectedProject) {
                query = query.eq("project_id", selectedProject.id)
            } else {
                query = query.is("project_id", null)
            }

            const { data: transactions, error: txError } = await query

            if (txError) {
                console.error("Error fetching transactions:", txError)
                throw txError
            }

            // 3. Calculate Totals and Aggregate Expenses
            let income = 0
            let totalRealExpenses = 0 // Includes investments (money leaving account)
            let operationalExpenses = 0 // Excludes investments (for goal calculation)
            const expenseMap = new Map<string, { value: number; color: string }>()
            const fixedExpenseMap = new Map<string, { value: number; color: string }>()
            const variableExpenseMap = new Map<string, { value: number; color: string }>()

            transactions?.forEach((tx) => {
                const valor = Number(tx.valor)
                const category = (Array.isArray(tx.categories) ? tx.categories[0] : tx.categories) as { nome: string; cor: string; is_investment: boolean } | undefined
                const isInvestment = category?.is_investment

                if (tx.tipo === "receita") {
                    income += valor
                } else if (tx.tipo === "despesa") {
                    totalRealExpenses += valor

                    if (!isInvestment) {
                        operationalExpenses += valor

                        // Aggregate expenses by category (General)
                        const categoryName = category?.nome || "Sem Categoria"
                        const categoryColor = category?.cor || "gray"

                        const current = expenseMap.get(categoryName) || { value: 0, color: categoryColor }
                        expenseMap.set(categoryName, {
                            value: current.value + valor,
                            color: categoryColor
                        })

                        // Aggregate Fixed vs Variable
                        const isFixed = tx.is_recurrent_copy === true
                        const targetMap = isFixed ? fixedExpenseMap : variableExpenseMap
                        const currentTarget = targetMap.get(categoryName) || { value: 0, color: categoryColor }
                        targetMap.set(categoryName, {
                            value: currentTarget.value + valor,
                            color: categoryColor
                        })
                    }
                }
            })

            const balance = income - totalRealExpenses

            // 4. Calculate Investment Goal
            let investment = 0
            const percent = Number(profile?.investimento_percentual || 0) / 100
            const base = profile?.investimento_base || "SOBRA"

            if (base === "BRUTO") {
                investment = income * percent
            } else {
                // SOBRA: (Income - Operational Expenses) * %
                // We use operationalExpenses here so that making an investment doesn't lower the goal
                const operationalSurplus = income - operationalExpenses
                investment = Math.max(0, operationalSurplus * percent)
            }

            // Format expenses for chart
            const formatMap = (map: Map<string, { value: number; color: string }>) =>
                Array.from(map.entries()).map(([name, { value, color }]) => ({
                    name,
                    value,
                    color
                }))

            setData({
                income,
                expense: totalRealExpenses,
                balance,
                investment,
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
