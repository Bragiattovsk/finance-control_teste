// supabase/functions/stripe-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

console.log("Stripe Webhook Handler iniciado...")

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error("Erro: Assinatura do Stripe não encontrada no header.")
      return new Response('No stripe signature found', { status: 400 })
    }

    // Pega as chaves
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
        console.error("Erro: Variáveis de ambiente faltando.")
        return new Response('Server configuration error', { status: 500 })
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      // @ts-expect-error Propriedade necessária para Deno no runtime v14
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Lê o corpo da requisição como texto
    const body = await req.text()
    
    let event
    try {
      // CORREÇÃO CRÍTICA AQUI: Usamos a versão Async
      // @ts-expect-error Método existe na v14
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid signature'
      console.error(`Webhook signature verification failed: ${message}`)
      return new Response(`Webhook Error: ${message}`, { status: 400 })
    }

    // Processa o evento
    console.log(`Evento recebido: ${event.type}`)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id
      const customerId = session.customer

      console.log(`💰 Pagamento recebido para usuário: ${userId}`)

      if (userId) {
        // Atualiza o plano no banco
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_tier: 'PRO',
            stripe_customer_id: customerId 
          })
          .eq('user_id', userId)

        if (error) {
            console.error('Erro ao atualizar perfil no Supabase:', error)
            throw error
        }
        console.log('✅ SUCESSO: Plano atualizado para PRO!')
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error(`Server Error: ${message}`)
    return new Response(message, { status: 400 })
  }
})
