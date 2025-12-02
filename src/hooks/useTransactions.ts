import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'

export interface CreateTransactionInput {
  description: string
  amount: number
  type: 'receita' | 'despesa'
  date: string
  categoryId: string | null
  paid?: boolean
  projectId?: string | null
}

export function useTransactions() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const createInstallmentTransaction = useCallback(
    async (input: CreateTransactionInput, totalInstallments: number) => {
      if (!user) throw new Error('Usuário não autenticado')

      try {
        const { error } = await supabase.rpc('create_installment_transaction', {
          p_user_id: user.id,
          p_description: input.description,
          p_amount: Number(input.amount),
          p_category_id: input.categoryId,
          p_date: input.date,
          p_type: input.type,
          p_total_installments: Number(totalInstallments),
          p_is_paid: input.paid ?? false,
        })

        if (error) throw error

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['analytics'] })
        queryClient.invalidateQueries({ queryKey: ['investment'] })
      } catch (err) {
        console.error('Erro ao criar transação parcelada:', err)
        throw err
      }
    },
    [user, queryClient]
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado')
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id)
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
      } catch (err) {
        console.error('Erro ao excluir transação:', err)
        throw err
      }
    },
    [user, queryClient]
  )

  const deleteFutureInstallments = useCallback(
    async (recurrenceId: string, startInstallment: number) => {
      if (!user) throw new Error('Usuário não autenticado')
      try {
        const { error } = await supabase.rpc('delete_future_installments', {
          p_recurrence_id: recurrenceId,
          p_start_installment: startInstallment,
          p_user_id: user.id,
        })
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
      } catch (err) {
        console.error('Erro ao excluir parcelas futuras:', err)
        throw err
      }
    },
    [user, queryClient]
  )

  return {
    createInstallmentTransaction,
    deleteTransaction,
    deleteFutureInstallments,
  }
}
