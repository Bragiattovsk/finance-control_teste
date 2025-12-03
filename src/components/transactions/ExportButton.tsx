import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { FileSpreadsheet, Loader2, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { Transaction } from '@/types'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'

interface ExportButtonProps {
  data: Transaction[]
  currentDate: Date
}

export function ExportButton({ data, currentDate }: ExportButtonProps) {
  const { profile, user } = useAuth()
  const isPro = profile?.subscription_tier === 'PRO'
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!isPro || isExporting) return
    setIsExporting(true)
    try {
      let totalReceita = 0
      let totalDespesa = 0

      const processed = await Promise.all((data || []).map(async (t) => {
        const dateStr = new Date(t.data).toLocaleDateString('pt-BR')
        const description = t.descricao
        const category = t.categories?.nome || ''
        const amount = Number(t.valor) || 0
        const typeLabel = t.tipo === 'receita' ? 'Entrada' : 'Saída'
        const statusLabel = t.pago ? 'Pago' : 'Pendente'
        let signedUrl: string | null = null

        if (t.attachment_path) {
          try {
            const { data: urlData } = await supabase.storage
              .from('receipts')
              .createSignedUrl(t.attachment_path, 604800)
            signedUrl = urlData?.signedUrl ?? null
          } catch {
            signedUrl = null
          }
        }

        if (t.tipo === 'receita') totalReceita += amount
        else totalDespesa += amount

        return { dateStr, description, category, amount, typeLabel, statusLabel, signedUrl }
      }))

      const rows: (string | number)[][] = []
      rows.push(['RELATÓRIO FINANCEIRO'])
      rows.push(['Gerado em:', new Date().toLocaleString()])
      rows.push(['Cliente:', user?.email || 'N/A'])
      rows.push([])
      rows.push(['Data', 'Descrição', 'Categoria', 'Valor', 'Tipo', 'Status', 'Comprovante'])

      processed.forEach((item) => {
        rows.push([
          item.dateStr,
          item.description,
          item.category,
          item.amount,
          item.typeLabel,
          item.statusLabel,
          item.signedUrl ? 'Ver Comprovante 🔗' : ''
        ])
      })

      rows.push([])
      rows.push(['TOTAIS:', '', '', totalReceita - totalDespesa, '', '', ''])

      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(rows)

      // Column widths
      ws['!cols'] = [
        { wch: 12 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 20 }
      ]

      // Insert hyperlinks for receipts
      processed.forEach((item, index) => {
        if (!item.signedUrl) return
        const cellRef = XLSX.utils.encode_cell({ r: 5 + index, c: 6 })
        const cell = ((ws as XLSX.WorkSheet)[cellRef] as XLSX.CellObject | undefined) || { t: 's', v: 'Ver Comprovante 🔗' }
        cell.l = { Target: item.signedUrl }
        cell.v = 'Ver Comprovante 🔗'
        ;(ws as XLSX.WorkSheet)[cellRef] = cell
      })

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Extrato')
      const fileName = `Relatorio_Financeiro_${currentDate.toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } finally {
      setIsExporting(false)
    }
  }

  if (!isPro) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              disabled
              className="opacity-60"
            >
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
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
      )}
      {isExporting ? 'Gerando...' : 'Exportar Excel'}
    </Button>
  )
}

