import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { FileSpreadsheet, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-hooks'

interface ExportButtonProps {
  onClick: () => void
}

export function ExportButton({ onClick }: ExportButtonProps) {
  const { profile } = useAuth()
  const isPro = profile?.subscription_tier === 'PRO'

  if (!isPro) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" disabled className="opacity-60">
              <Lock className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </TooltipTrigger>
          <TooltipContent>Recurso PRO: Exporte para Excel</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button variant="outline" onClick={onClick} className="gap-2">
      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
      Exportar Excel
    </Button>
  )
}

