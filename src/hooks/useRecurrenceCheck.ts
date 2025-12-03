import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/project-hooks"
import { useToast } from "@/hooks/use-toast"

export function useRecurrenceCheck(onSuccess?: () => void) {
    const { user } = useAuth()
    const { selectedProject } = useProject()
    const { toast } = useToast()
    const hasChecked = useRef(false)

    useEffect(() => {
        const checkRecurrences = async () => {
            if (!user || hasChecked.current) return
            hasChecked.current = true

            try {
                // 1. Fetch active templates
                let query = supabase
                    .from("recurrence_templates")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("ativo", true)

                if (selectedProject) {
                    query = query.eq("project_id", selectedProject.id)
                } else {
                    query = query.is("project_id", null)
                }

                const { data: templates, error: templatesError } = await query

                if (templatesError) throw templatesError
                if (!templates || templates.length === 0) return

                // 2. Define current month range
                const now = new Date()
                const currentYear = now.getFullYear()
                const currentMonth = now.getMonth() // 0-indexed

                const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString()
                const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString()

                // 3. Fetch existing transactions for this month that match templates
                let txQuery = supabase
                    .from("transactions")
                    .select("descricao")
                    .eq("user_id", user.id)
                    .gte("data", startOfMonth)
                    .lte("data", endOfMonth)

                if (selectedProject) {
                    txQuery = txQuery.eq("project_id", selectedProject.id)
                } else {
                    txQuery = txQuery.is("project_id", null)
                }

                const { data: transactions, error: txError } = await txQuery

                if (txError) throw txError

                const existingDescriptions = new Set(transactions?.map(t => t.descricao))
                const toCreate = []

                for (const template of templates) {
                    if (!existingDescriptions.has(template.descricao)) {
                        // Handle date (e.g. Feb 30 -> Feb 28/29)
                        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
                        const day = Math.min(template.dia_vencimento, lastDayOfMonth)
                        const date = new Date(currentYear, currentMonth, day)

                        toCreate.push({
                            user_id: user.id,
                            descricao: template.descricao,
                            valor: template.valor_base,
                            tipo: "despesa",
                            data: date.toISOString().split('T')[0], // YYYY-MM-DD
                            categoria_id: template.categoria_id,
                            pago: false,
                            is_recurrent_copy: true,
                            project_id: template.project_id // Copy project_id from template
                        })
                    }
                }

                if (toCreate.length > 0) {
                    const { error: insertError } = await supabase
                        .from("transactions")
                        .insert(toCreate)

                    if (insertError) throw insertError

                    toast({
                        title: "Despesas Fixas Geradas",
                        description: `${toCreate.length} despesas fixas foram geradas para este mês.`,
                        className: "bg-blue-500 text-white border-none",
                    })

                    if (onSuccess) onSuccess()
                }

            } catch (error) {
                console.error("Error checking recurrences:", error)
            }
        }

        checkRecurrences()
    }, [user, toast, onSuccess, selectedProject])
}
