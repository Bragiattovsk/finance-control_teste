// supabase/functions/stripe-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

console.log("Stripe Webhook Handler iniciado...")

type StripeCheckoutSession = { client_reference_id?: string | null; customer?: string | { id: string } | null }

serve(async (req: Request) => {
  try {
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error("Erro: Assinatura do Stripe não encontrada no header.")
      return new Response('No stripe signature found', { status: 400 })
    }

    // 1. Inicializa Stripe e Supabase
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    if (!stripeKey || !webhookSecret) {
        console.error("Erro: Variáveis de ambiente STRIPE faltando.")
        return new Response('Server configuration error', { status: 500 })
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string 
    )

    // 2. Lê o corpo da requisição
    const body = await req.text()
    
    // 3. Valida se o evento veio mesmo do Stripe
    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid signature'
      console.error(`Webhook signature verification failed: ${message}`)
      return new Response(`Webhook Error: ${message}`, { status: 400 })
    }

    // 4. Processa o evento
    console.log(`Evento recebido: ${event.type}`)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as StripeCheckoutSession
      const userId = session.client_reference_id
      // Stripe typing can be tricky; customer might be a string or object depending on expansion
      const customerId = typeof session.customer === 'string' 
          ? session.customer 
          : (session.customer as { id: string })?.id;

      console.log(`💰 Pagamento recebido para usuário: ${userId}`)
      console.log(`👤 Customer ID: ${customerId}`)

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
      } else {
          console.warn('Aviso: userId não encontrado na sessão do Stripe (client_reference_id vazio).')
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
