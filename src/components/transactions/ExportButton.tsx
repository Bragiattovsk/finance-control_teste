import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { FileSpreadsheet, Loader2, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-hooks'
import type { Transaction } from '@/types'
import ExcelJS from 'exceljs'
import { supabase } from '@/lib/supabase'

interface ExportButtonProps {
  data: Transaction[]
  currentDate: Date
}

export function ExportButton({ data, currentDate }: ExportButtonProps) {
  const { profile } = useAuth()
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

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Relatório Financeiro')

      worksheet.columns = [
        { header: 'Data', key: 'data', width: 15 },
        { header: 'Descrição', key: 'descricao', width: 40 },
        { header: 'Categoria', key: 'categoria', width: 20 },
        { header: 'Valor', key: 'valor', width: 15 },
        { header: 'Tipo', key: 'tipo', width: 10 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Comprovante', key: 'comprovante', width: 25 },
      ]

      processed.forEach((item) => {
        const row = worksheet.addRow({
          data: item.dateStr,
          descricao: item.description,
          categoria: item.category,
          valor: item.amount,
          tipo: item.typeLabel,
          status: item.statusLabel,
          comprovante: item.signedUrl ? 'Ver Comprovante' : '',
        })
        if (item.signedUrl) {
          const cell = row.getCell('comprovante')
          cell.value = { text: 'Ver Comprovante', hyperlink: item.signedUrl }
          cell.font = { color: { argb: 'FF0000FF' }, underline: true }
        }
      })

      // Header styling
      worksheet.getRow(1).font = { bold: true }
      // Currency format
      worksheet.getColumn('valor').numFmt = '"R$"#,##0.00'

      // Totais
      const totalRow = worksheet.addRow({
        data: '',
        descricao: 'TOTAIS',
        categoria: '',
        valor: totalReceita - totalDespesa,
        tipo: '',
        status: '',
        comprovante: '',
      })
      totalRow.font = { bold: true }

      const fileName = `Relatorio_Financeiro_${currentDate.toISOString().split('T')[0]}.xlsx`
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        URL.revokeObjectURL(url)
        a.remove()
      }, 0)
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

