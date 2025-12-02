import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { useCustomExpensesMetrics } from '@/hooks/useCustomExpensesMetrics'
import { formatCurrency } from '@/lib/format'
import { Loader2, FileX, PieChart as PieChartIcon } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

interface CustomExpenseWidgetProps {
  categoryIds: string[]
  title?: string
  currentDate: Date
}

export const CustomExpenseWidget: React.FC<CustomExpenseWidgetProps> = ({ categoryIds, title = 'Gráfico Personalizado', currentDate }) => {
  const { data, loading } = useCustomExpensesMetrics(categoryIds, currentDate)

  if (!categoryIds || categoryIds.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
          <PieChartIcon className="h-8 w-8 opacity-20" />
          <p className="text-xs">Nenhuma categoria selecionada.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs">Carregando dados...</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
          <FileX className="h-8 w-8 opacity-20" />
          <p className="text-xs">Sem dados para exibir.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="pb-2 px-0 pt-0">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
                data={data} 
                cx="50%" 
                cy="50%" 
                labelLine={false} 
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                strokeWidth={1}
                stroke="hsl(var(--card))"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--popover-foreground))',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: '12px'
                }}
                itemStyle={{ color: 'inherit' }}
            />
            <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

