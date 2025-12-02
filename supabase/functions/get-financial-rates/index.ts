// deno types shim for local TypeScript
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
}
const serve = (handler: (req: Request) => Response | Promise<Response>) => Deno.serve(handler)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

 

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("Iniciando busca...")

    const fetchHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
      Accept: "application/json",
    }

    let currentRate = 12.15
    let historicalAverage = 12.15
    let source = "Fallback"

    try {
      const brResponse = await fetch("https://brasilapi.com.br/api/taxas/v1")
      if (brResponse.ok) {
        const brData = (await brResponse.json()) as Array<{ nome: string; valor: number }>
        const cdi = Array.isArray(brData) ? brData.find((item) => item.nome === "CDI") : null
        if (cdi) {
          currentRate = Number(cdi.valor)
          historicalAverage = currentRate * 0.96
          source = "BrasilAPI"
        }
      }
    } catch (e) {
      console.error("BrasilAPI erro:", e)
    }

    try {
      const bcbResponse = await fetch(
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/24?formato=json",
        { headers: fetchHeaders, signal: AbortSignal.timeout(3000) as AbortSignal }
      )

      if (bcbResponse.ok) {
        const bcbData = (await bcbResponse.json()) as Array<{ data: string; valor: string }>
        if (Array.isArray(bcbData) && bcbData.length > 0) {
          const sum = bcbData.reduce((acc: number, item) => acc + parseFloat(String(item.valor)), 0)
          historicalAverage = sum / bcbData.length
          source = source === "BrasilAPI" ? "Híbrido (Real)" : "BCB"
        }
      } else {
        console.log("BCB Bloqueou/Falhou. Usando estimativa.")
        if (source === "BrasilAPI") source = "BrasilAPI (Estimado)"
      }
    } catch (e) {
      console.error("BCB Erro de conexão:", e)
      if (source === "BrasilAPI") source = "BrasilAPI (Estimado)"
    }

    return new Response(
      JSON.stringify({
        current_rate: Number(currentRate.toFixed(2)),
        historical_average_24m: Number(historicalAverage.toFixed(2)),
        source,
        last_update: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
