import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { Category } from "@/types"

// Using shared Category type from '@/types'
// Extending locally with optional goal reference when present in queries
type CategoryWithGoal = Category & { goal_id?: string | null }

interface UseCategoriesReturn {
    categories: CategoryWithGoal[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
    const { user } = useAuth()
    const [categories, setCategories] = useState<CategoryWithGoal[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCategories = useCallback(async () => {
        if (!user) return

        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from("categories")
                .select("id, nome, cor, tipo, is_investment, goal_id, user_id")
                .eq("user_id", user.id)
                .order("nome")

            if (error) throw error

            setCategories((data || []) as CategoryWithGoal[])
        } catch (err) {
            console.error("Error fetching categories:", err)
            setError("Erro ao carregar categorias")
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchCategories()
    }, [user, fetchCategories])

    return {
        categories,
        loading,
        error,
        refetch: fetchCategories
    }
}
