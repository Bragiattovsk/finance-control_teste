import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { applyProjectScope } from "@/lib/supabase-helpers"
import { Project } from "@/types"

export interface Category {
    id: string
    nome: string
    cor: string
    is_investment?: boolean
    goal_id?: string | null
}

interface UseCategoriesReturn {
    categories: Category[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
    const { user } = useAuth()
    const { selectedProject } = useProject()
    const [categories, setCategories] = useState<Category[]>([])
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

            setCategories(data || [])
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