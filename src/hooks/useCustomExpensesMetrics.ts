import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-hooks'

export interface ExpenseSlice {
  name: string
  value: number
  color?: string
  [key: string]: string | number | undefined
}

export function useCustomExpensesMetrics(categoryIds: string[], date: Date) {
  const { user } = useAuth()
  const [data, setData] = useState<ExpenseSlice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      if (!categoryIds || categoryIds.length === 0) {
        setData([])
        return
      }

      setLoading(true)
      setError(null)
      try {
        const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()

        const { data: transactions, error: supaError } = await supabase
          .from('transactions')
          .select(`
            valor,
            categoria_id,
            categories (nome, cor)
          `)
          .eq('user_id', user.id)
          .eq('tipo', 'despesa')
          .in('categoria_id', categoryIds)
          .gte('data', start)
          .lte('data', end)

        if (supaError) throw supaError

        const grouped = (transactions || []).reduce((acc, curr) => {
          const cat = Array.isArray(curr.categories) ? curr.categories[0] : curr.categories
          const name = cat?.nome || 'Sem Categoria'
          const color = cat?.cor || undefined
          const value = Number(curr.valor) || 0
          if (!acc[name]) acc[name] = { value: 0, color }
          acc[name].value += value
          return acc
        }, {} as Record<string, { value: number; color?: string }>)

        const slices: ExpenseSlice[] = Object.entries(grouped)
          .map(([name, { value, color }]) => ({ name, value, color }))
          .sort((a, b) => b.value - a.value)

        setData(slices)
      } catch (err) {
        console.error('Erro ao buscar despesas personalizadas:', err)
        setError(err as Error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, categoryIds, date])

  return { data, loading, error }
}

