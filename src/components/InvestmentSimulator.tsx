import { useState, useMemo } from "react"
import { useCompoundInterest } from "@/hooks/useCompoundInterest"
import { useAuth } from "@/contexts/auth-hooks"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/format"
import { 
  Lock, 
  Loader2, 
  Info,
  Gem, 
  PiggyBank, 
  TrendingUp, 
  Coins
} from "lucide-react"
import { UpgradeModal } from "@/components/UpgradeModal"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export function InvestmentSimulator() {
  const { profile } = useAuth()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const isPro = profile?.subscription_tier === "PRO"

  const {
    initialAmount,
    monthlyContribution,
    annualInterestRate,
    years,
    rateType,
    rateMode,
    cdiValue,
    cdiPercent,
    isRateLoading,
    cdiStrategy,
    currentRate,
    historicalRate,
    simulationMode,
    setInitialAmount,
    setMonthlyContribution,
    setAnnualInterestRate,
    setYears,
    setRateType,
    setRateMode,
    setCdiValue,
    setCdiPercent,
    setRateSource,
    setCdiStrategy,
    setMode,
    applyPreset,
    simulation,
  } = useCompoundInterest()

  const graphData = useMemo(() => {
    return simulation.chartData.map((p, idx) => ({
      idx,
      year: p.year,
      invested: p.invested,
      interest: p.interest,
      total: p.total,
      comparisonTotal: p.comparisonTotal
    }))
  }, [simulation.chartData])

  const yearTicks = useMemo(() => {
    return graphData.filter((d) => d.idx % 12 === 0).map((d) => d.idx)
  }, [graphData])

  const pct = (v: number) => `${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
  const sameRates = Number.isFinite(currentRate) && Number.isFinite(historicalRate) && Math.abs(currentRate - historicalRate) < 0.0001

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
        {/* Sidebar - Parameters */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card border-border shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                Simulador
                {simulationMode === "ADVANCED" && <Gem className="w-4 h-4 text-purple-500" />}
              </CardTitle>
              <CardDescription>
                Configure os parâmetros para projetar seu futuro financeiro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Switcher */}
              <div className="bg-muted/50 p-1 rounded-lg grid grid-cols-2 gap-1">
                <Button
                  variant={simulationMode === "QUICK" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("QUICK")}
                  className="w-full text-xs font-medium"
                >
                  Rápido
                </Button>
                <Button
                  variant={simulationMode === "ADVANCED" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("ADVANCED")}
                  className="w-full text-xs font-medium flex items-center justify-center gap-1"
                >
                  Avançado
                  {!isPro && <Lock className="w-3 h-3" />}
                </Button>
              </div>

              {/* Quick Mode Presets */}
              {simulationMode === "QUICK" && (
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => applyPreset("MILLION")}
                    className="h-auto py-2 flex flex-col gap-1 border-dashed hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="text-lg">🌽</span>
                    <span className="text-[10px] font-medium">1º Milhão</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => applyPreset("HOUSE")}
                    className="h-auto py-2 flex flex-col gap-1 border-dashed hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="text-lg">🏠</span>
                    <span className="text-[10px] font-medium">Casa</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => applyPreset("RETIRE")}
                    className="h-auto py-2 flex flex-col gap-1 border-dashed hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="text-lg">💰</span>
                    <span className="text-[10px] font-medium">Renda</span>
                  </Button>
                </div>
              )}

              {/* Main Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="initial-amount">Valor Inicial</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input 
                      id="initial-amount"
                      type="number" 
                      value={initialAmount} 
                      onChange={(e) => setInitialAmount(Number(e.target.value || 0))}
                      className="pl-9 h-12 md:h-10" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly-contribution">Aporte Mensal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input 
                      id="monthly-contribution"
                      type="number" 
                      value={monthlyContribution} 
                      onChange={(e) => setMonthlyContribution(Number(e.target.value || 0))}
                      className="pl-9 h-12 md:h-10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Período (Anos)</Label>
                    <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{years} anos</span>
                  </div>
                  <Slider 
                    value={[years]} 
                    onValueChange={(vals) => setYears(vals[0])} 
                    min={1} 
                    max={40} 
                    step={1}
                    className="py-2"
                  />
                </div>
              </div>

              {/* Interest Rate Configuration */}
              <div className="pt-4 border-t border-border/50">
                {simulationMode === "QUICK" ? (
                  <div className="space-y-2">
                    <Label htmlFor="quick-rate">Taxa de Juros Anual (%)</Label>
                    <div className="relative">
                      <Input 
                        id="quick-rate"
                        type="number" 
                        step="0.1" 
                        value={annualInterestRate} 
                        onChange={(e) => setAnnualInterestRate(Number(e.target.value || 0))}
                        className="pr-8 h-12 md:h-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>
                ) : (
                  /* Advanced Mode */
                  <div className="relative space-y-4">
                    {!isPro && (
                       <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 rounded-lg border border-border/50">
                         <Gem className="w-8 h-8 text-purple-500 mb-2" />
                         <h3 className="font-medium text-sm mb-1">Recurso Premium</h3>
                         <p className="text-xs text-muted-foreground mb-3">Desbloqueie taxas reais do CDI e configurações avançadas.</p>
                         <Button size="sm" onClick={() => setUpgradeOpen(true)} className="w-full">Liberar Acesso</Button>
                       </div>
                    )}

                    <Tabs value={rateMode === "FIXED" ? "fixed" : "cdi"} onValueChange={(v) => setRateMode(v === "fixed" ? "FIXED" : "CDI")} className="w-full">
                      <TabsList className="w-full grid grid-cols-1 xs:grid-cols-2 h-auto">
                        <TabsTrigger value="fixed" className="h-9">Taxa Fixa</TabsTrigger>
                        <TabsTrigger value="cdi" className="h-9">% do CDI</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="fixed" className="space-y-3 mt-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Tipo de Taxa</Label>
                          <div className="flex bg-muted rounded-md p-0.5">
                            <button 
                              onClick={() => setRateType("MONTHLY")}
                              className={cn("px-2 py-1 text-xs rounded-sm transition-all", rateType === "MONTHLY" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                              % a.m.
                            </button>
                            <button 
                              onClick={() => setRateType("YEARLY")}
                              className={cn("px-2 py-1 text-xs rounded-sm transition-all", rateType === "YEARLY" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                              % a.a.
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Valor da Taxa</Label>
                          <Input type="number" step="0.1" value={annualInterestRate} onChange={(e) => setAnnualInterestRate(Number(e.target.value || 0))} className="h-12 md:h-10" />
                        </div>
                      </TabsContent>

                      <TabsContent value="cdi" className="space-y-3 mt-3">
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1 h-5">% do CDI</Label>
                            <Input type="number" value={cdiPercent} onChange={(e) => setCdiPercent(Number(e.target.value || 0))} className="h-12 md:h-10" />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1 h-5">
                              CDI Anual
                              {isRateLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                            </Label>
                            <Input 
                              type="number" 
                              step="0.01" 
                              value={cdiValue} 
                              onChange={(e) => { setCdiValue(Number(e.target.value || 0)); setRateSource("MANUAL") }} 
                              className="h-12 md:h-10"
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 pt-2">
                          <Button 
                            variant={cdiStrategy === "SPOT" ? "secondary" : "outline"} 
                            size="sm" 
                            onClick={() => setCdiStrategy("SPOT")}
                            className={cn(
                              "justify-between font-normal h-auto py-2",
                              cdiStrategy === "SPOT" && "border border-transparent"
                            )}
                          >
                            <div className="flex flex-col items-start text-left">
                              <span className="text-xs font-medium">Taxa Atual</span>
                              <span className="text-[10px] text-muted-foreground">Valor hoje</span>
                            </div>
                            <span className="font-mono font-bold">{pct(currentRate)}</span>
                          </Button>
                          
                          <Button 
                            variant={cdiStrategy === "AVERAGE" ? "secondary" : "outline"} 
                            size="sm" 
                            onClick={() => !sameRates && setCdiStrategy("AVERAGE")}
                            disabled={sameRates}
                            className={cn(
                              "justify-between font-normal h-auto py-2",
                              cdiStrategy === "AVERAGE" && "border border-transparent"
                            )}
                          >
                            <div className="flex flex-col items-start text-left">
                              <span className="text-xs font-medium">Média Histórica</span>
                              <span className="text-[10px] text-muted-foreground">Últimos 24 meses</span>
                            </div>
                            <span className="font-mono font-bold">{pct(historicalRate)}</span>
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="p-4 pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <PiggyBank className="w-3 h-3" /> Total Investido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-2xl font-bold text-foreground">{formatCurrency(simulation.rawTotals.totalInvested)}</div>
                <p className="text-xs text-muted-foreground mt-1">Aporte inicial + mensais</p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-border">
              <CardHeader className="p-4 pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-emerald-600/80 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> Rendimento Líquido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-2xl font-bold text-emerald-600">
                  +{formatCurrency((simulation.netInterest ?? (simulation.rawTotals.totalInterest - simulation.taxAmount)))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 rounded cursor-help">
                        IR: -{formatCurrency(simulation.taxAmount)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Imposto de Renda estimado em {simulation.taxRate}% sobre os lucros
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-border shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-8 -mt-8" />
              <CardHeader className="p-4 pb-2 space-y-0 relative">
                <CardTitle className="text-xs font-medium text-primary/80 uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-3 h-3" /> Montante Final
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 relative">
                <div className="text-2xl font-bold text-primary">{formatCurrency((simulation.netTotal ?? simulation.rawTotals.totalAmount))}</div>
                <p className="text-xs text-primary/60 mt-1">Já descontado impostos</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">Evolução Patrimonial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] md:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="idx"
                      ticks={yearTicks}
                      tickFormatter={(idx) => `Ano ${Math.floor(idx / 12) + 1}`}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
                        if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
                        return `R$ ${value}`
                      }}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: 'inherit' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      name="Valor Investido"
                      stroke="#6366F1"
                      fillOpacity={1}
                      fill="url(#colorInvested)"
                    />
                    <Area
                      type="monotone"
                      dataKey="interest"
                      name="Rendimento"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorInterest)"
                      stackId="1"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  Aviso: Os valores apresentados são apenas uma simulação baseada nos parâmetros inseridos e estão sujeitos a alterações em cenários reais de mercado. Não representam garantia de rentabilidade.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </TooltipProvider>
  )
}
