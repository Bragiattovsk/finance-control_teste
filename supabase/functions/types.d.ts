declare namespace Deno {
  const env: { get(name: string): string | undefined }
}

declare module 'https://deno.land/std/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void
}

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js'
}

declare module 'https://esm.sh/stripe@12.0.0' {
  export namespace Stripe {
    interface Event { type: string; data: { object: unknown } }
    namespace Checkout {
      interface Session {
        client_reference_id?: string | null
        customer?: string | { id: string } | null
      }
    }
    interface Subscription {
      customer?: string | { id: string } | null
    }
  }

  export default class Stripe {
    constructor(apiKey: string, config?: { apiVersion?: string })
    checkout: { sessions: { create: (params: unknown) => Promise<{ url?: string | null }> } }
    webhooks: { constructEvent: (body: string, signature: string, secret: string) => Stripe.Event }
  }
}

declare module 'https://esm.sh/stripe@12.0.0?target=deno' {
  export { default } from 'https://esm.sh/stripe@12.0.0'
  export * from 'https://esm.sh/stripe@12.0.0'
}

declare module 'https://esm.sh/stripe@14.21.0' {
  export namespace Stripe {
    interface Event { type: string; data: { object: unknown } }
    namespace Checkout {
      interface Session {
        client_reference_id?: string | null
        customer?: string | { id: string } | null
      }
    }
    interface Subscription {
      customer?: string | { id: string } | null
    }
  }

  export default class Stripe {
    constructor(apiKey: string, config?: { apiVersion?: string })
    checkout: { sessions: { create: (params: unknown) => Promise<{ url?: string | null }> } }
    webhooks: { constructEvent: (body: string, signature: string, secret: string) => Stripe.Event }
  }
}

declare module 'https://esm.sh/stripe@14.21.0?target=deno' {
  export { default } from 'https://esm.sh/stripe@14.21.0'
  export * from 'https://esm.sh/stripe@14.21.0'
}

