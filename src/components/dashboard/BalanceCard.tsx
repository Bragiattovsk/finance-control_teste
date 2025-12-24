import { useState } from "react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon, ChevronDown } from "lucide-react"
import CountUp from 'react-countup'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from "@/lib/format"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface BalanceHistoryPoint {
    month: string;
    balance: number;
}

interface BalanceCardProps {
  title: string
  icon?: LucideIcon
  value: number
  description?: string
  className?: string
  delay?: number
  history: BalanceHistoryPoint[]
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {label}
                        </span>
                        <span className="font-bold text-muted-foreground">
                            {formatCurrency(payload[0].value)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function BalanceCard({
  title,
  icon: Icon,
  value,
  description,
  className,
  delay = 0,
  history
}: BalanceCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const gradientId = "balanceGradient";

    return (
    <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn(
            "rounded-xl border shadow-sm bg-card overflow-hidden",
            "bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-background",
            "border-emerald-200/50 dark:border-emerald-800/50",
            "animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards",
            className
        )}
        style={{ animationDelay: `${delay}ms` }}
    >
      <CollapsibleTrigger asChild>
        <div className="cursor-pointer group select-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {title}
                </CardTitle>
                <div className="flex items-center gap-2">
                    {Icon && (
                    <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 md:h-5 md:w-5" />
                    )}
                    <ChevronDown className={cn(
                        "h-4 w-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )} />
                </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div className="flex items-end gap-4">
                    <div>
                        <div className="text-3xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50 tabular-nums">
                        <CountUp
                            end={value}
                            decimals={2}
                            decimal=","
                            separator="."
                            prefix="R$ "
                            duration={1.5}
                        />
                        </div>
                        {description && (
                        <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">
                            {description}
                        </p>
                        )}
                    </div>

                    <div className="flex-1 h-[70px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#10b981" // emerald-500
                                    strokeWidth={2}
                                    fill={`url(#${gradientId})`}
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="px-6 pb-6 pt-0 border-t border-emerald-100/50 dark:border-emerald-800/30 mt-2">
            <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 mt-4">
                Histórico Recente
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-200 dark:scrollbar-thumb-emerald-800">
                {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados históricos.</p>
                ) : (
                    history.map((point, index) => (
                        <div key={index} className="flex items-center justify-between text-sm group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 p-2 rounded-md transition-colors">
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">{point.month}</span>
                            <span className={cn(
                                "font-mono font-medium",
                                point.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                            )}>
                                {formatCurrency(point.balance)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
