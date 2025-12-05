import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Download, Loader2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns"
import ExcelJS from "exceljs"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { Transaction } from "@/types"

import { useToast } from "@/hooks/use-toast"

interface ExportReportModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  isOpen?: boolean
  onClose?: () => void
}

export function ExportReportModal({ open, onOpenChange, isOpen, onClose }: ExportReportModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const now = new Date()
    const s = startOfMonth(now)
    const e = endOfMonth(now)
    setStartDate(format(s, "yyyy-MM-dd"))
    setEndDate(format(e, "yyyy-MM-dd"))
  }, [])

  const invalidRange = useMemo(() => {
    if (!startDate || !endDate) return true
    return new Date(endDate).getTime() < new Date(startDate).getTime()
  }, [startDate, endDate])

  const quickSetMonth = () => {
    const now = new Date()
    setStartDate(format(startOfMonth(now), "yyyy-MM-dd"))
    setEndDate(format(endOfMonth(now), "yyyy-MM-dd"))
  }

  const quickSetYear = () => {
    const now = new Date()
    setStartDate(format(startOfYear(now), "yyyy-MM-dd"))
    setEndDate(format(endOfYear(now), "yyyy-MM-dd"))
  }

  const quickSetLast3Months = () => {
    const now = new Date()
    const start = startOfMonth(subMonths(now, 3))
    setStartDate(format(start, "yyyy-MM-dd"))
    setEndDate(format(now, "yyyy-MM-dd"))
  }

  const handleExport = async () => {
    if (!user || invalidRange || loading) return
    setLoading(true)
    try {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(nome, tipo)')
        .eq('user_id', user.id)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: true })
        .limit(5000)

      let totalReceita = 0
      let totalDespesa = 0

      const processed = await Promise.all((transactions || []).map(async (t: Transaction) => {
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
      const worksheet = workbook.addWorksheet('Relatório Contábil')

      worksheet.columns = [
        { header: 'Data', key: 'data', width: 15 },
        { header: 'Descrição', key: 'descricao', width: 40 },
        { header: 'Categoria', key: 'categoria', width: 20 },
        { header: 'Valor', key: 'valor', width: 15 },
        { header: 'Tipo', key: 'tipo', width: 10 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Comprovante', key: 'comprovante', width: 25 },
      ]

      worksheet.getRow(1).font = { bold: true }
      worksheet.getColumn('valor').numFmt = '"R$"#,##0.00'

      worksheet.getRow(2).values = ['Período:', `${startDate} até ${endDate}`]

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

      const fileName = `Relatorio_Contabil_${format(new Date(startDate), 'yyyy-MM-dd')}_${format(new Date(endDate), 'yyyy-MM-dd')}.xlsx`
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

      if ((transactions || []).length === 5000) {
        toast({
          title: "Atenção",
          description: "O relatório atingiu o limite de 5.000 linhas. Diminua o período.",
        })
      }

      setLoading(false)
      onOpenChange?.(false)
      onClose?.()
    } catch {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open ?? isOpen ?? false} onOpenChange={(o) => { onOpenChange?.(o); if (!o) onClose?.() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Exportar Relatório Contábil
          </DialogTitle>
          <DialogDescription>Selecione o período e gere um relatório em Excel</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">De</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Até</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Badge onClick={quickSetMonth} className="cursor-pointer">Mês Atual</Badge>
          <Badge onClick={quickSetYear} className="cursor-pointer">Ano Atual</Badge>
          <Badge onClick={quickSetLast3Months} className="cursor-pointer">Últimos 3 Meses</Badge>
        </div>

        <DialogFooter>
          <Button onClick={handleExport} disabled={invalidRange || loading || !user} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {loading ? 'Gerando...' : 'Gerar Relatório Excel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

