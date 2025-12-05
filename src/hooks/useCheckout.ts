import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-hooks'

export function useCheckout() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth() // Pegamos o usuário logado

  // Dentro de useCheckout.ts

  const handleSubscribe = async () => {
    if (loading) return
    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado.', variant: 'destructive' })
      return
    }

    setLoading(true)

    const payload = {
        priceId: import.meta.env.VITE_STRIPE_PRICE_ID, 
        returnUrl: window.location.origin + '/dashboard', 
        // userId e email serão obtidos via token no backend para segurança
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: payload
      })

      if (error) {
        console.error('Supabase Function Error')
        throw new Error('Erro ao comunicar com o servidor')
      }

      // Nota: Verifique se sua Edge Function retorna { url: '...' } ou { sessionId: '...' }
      // Se retornar sessionId, precisaremos ajustar aqui.
      if (!data?.url) {
        console.error("Retorno estranho do backend:", data)
        throw new Error('URL de checkout não foi retornada.')
      }

      window.location.href = data.url

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível iniciar o checkout.'
      console.error('Checkout error:', err)
      toast({ 
        title: 'Erro no Pagamento', 
        description: message, 
        variant: 'destructive' 
      })
      setLoading(false)
    }
  }

  return { handleSubscribe, loading }
}
