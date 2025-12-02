/* eslint-disable @typescript-eslint/no-explicit-any */
import { Project } from "@/types"

/**
 * Aplica o escopo de projeto a uma query do Supabase
 * @param query - A query do Supabase
 * @param selectedProject - O projeto selecionado ou null
 * @param projectField - O campo de projeto (padrão: 'project_id')
 * @returns A query com o filtro de projeto aplicado
 */
// Simplificando a tipagem para evitar problemas com os tipos genéricos complexos do Supabase
export function applyProjectScope(
    query: any,
    selectedProject: Project | null,
    projectField: string = 'project_id'
): any {
    if (selectedProject) {
        return query.eq(projectField, selectedProject.id)
    } else {
        return query.is(projectField, null)
    }
}

/**
 * Calcula o intervalo de datas para um mês específico
 * @param date - A data de referência (padrão: data atual)
 * @returns Objeto com startOfMonth e endOfMonth em formato ISO
 */
export function getMonthRange(date: Date = new Date()): {
    startOfMonth: string
    endOfMonth: string
} {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()
    
    return {
        startOfMonth,
        endOfMonth
    }
}

/**
 * Calcula o intervalo de datas para o mês atual
 * @returns Objeto com startOfMonth e endOfMonth em formato ISO
 */
export function getCurrentMonthRange(): {
    startOfMonth: string
    endOfMonth: string
} {
    return getMonthRange(new Date())
}