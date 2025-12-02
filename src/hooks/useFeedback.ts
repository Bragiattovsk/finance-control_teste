import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export type FeedbackType = 'bug' | 'idea' | 'ui' | 'other'

interface SendFeedbackParams {
  type: FeedbackType
  message: string
  pageUrl?: string
}

export function useFeedback() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sendFeedback = useCallback(async ({ type, message, pageUrl }: SendFeedbackParams) => {
    setLoading(true)
    setSuccess(null)
    setError(null)

    try {
      if (!user) throw new Error('Usuário não autenticado')

      const payload = {
        user_id: user.id,
        type: type.toUpperCase(),
        message,
        page_url: pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }

      const { error } = await supabase
        .from('feedbacks')
        .insert(payload)

      if (error) throw error

      setSuccess(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao enviar feedback'
      setError(msg)
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }, [user])

  return { sendFeedback, loading, success, error }
}

