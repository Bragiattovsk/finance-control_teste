import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/ProjectContext"
import { applyProjectScope } from "@/lib/supabase-helpers"
import { Project, Category } from "@/types"

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
    const { selectedProject } = useProject()
    const [categories, setCategories] = useState<CategoryWithGoal[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCategories = useCallback(async () => {
        if (!user) return

        try {
            setLoading(true)
            setError(null)

            let query = supabase
                .from("categories")
                .select("*")
                .eq("user_id", user.id)
                .order("nome")

            query = applyProjectScope(query, selectedProject as Project | null)

            const { data, error } = await query

            if (error) throw error

            setCategories((data || []) as CategoryWithGoal[])
        } catch (err) {
            console.error("Error fetching categories:", err)
            setError("Erro ao carregar categorias")
        } finally {
            setLoading(false)
        }
    }, [user, selectedProject])

    useEffect(() => {
        fetchCategories()
    }, [user, selectedProject, fetchCategories])

    return {
        categories,
        loading,
        error,
        refetch: fetchCategories
    }
}
