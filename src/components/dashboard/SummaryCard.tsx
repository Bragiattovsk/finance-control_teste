import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import CountUp from 'react-countup'

interface SummaryCardProps {
  title: string
  icon?: LucideIcon
  value: number
  description?: string
  trend?: "up" | "down"
  className?: string
  delay?: number
}

export function SummaryCard({
  title,
  icon: Icon,
  value,
  description,
  trend,
  className,
  delay = 0,
}: SummaryCardProps) {
  return (
    <Card 
      className={cn(
        "rounded-xl border-border/50 shadow-sm bg-card",
        "animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2 md:p-6 md:pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" />
        )}
      </CardHeader>
      <CardContent className="p-5 pt-0 md:p-6 md:pt-0">
        <div className="text-2xl font-bold tracking-tight md:text-3xl tabular-nums">
          <CountUp
            end={value}
            decimals={2}
            decimal=","
            separator="."
            prefix="R$ "
            duration={1.5}
          />
        </div>
        {(description || trend) && (
          <p
            className={cn(
              "mt-2 text-xs",
              trend === "up" && "text-emerald-600 dark:text-emerald-400",
              trend === "down" && "text-red-600 dark:text-red-400",
              !trend && "text-muted-foreground"
            )}
          >
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
