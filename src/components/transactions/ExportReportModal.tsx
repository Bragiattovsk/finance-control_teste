import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Download, Loader2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns"
import * as XLSX from "xlsx"
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
  const { user, profile } = useAuth()
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

      // 0. Cálculo de Totais (Pré-processamento)
      let totalReceitas = 0;
      let totalDespesas = 0;

      (transactions || []).forEach((t: Transaction) => {
        const val = Number(t.valor) || 0;
        if (t.tipo === 'receita') totalReceitas += val;
        else totalDespesas += val;
      });

      const saldoLiquido = totalReceitas - totalDespesas;

      // 1. Cabeçalho Institucional e Resumo
      const sheetData: (string | number)[][] = [
        ['LUMIE FINANCE CONTROL'],
        ['Relatório de Transações'],
        ['Gerado em:', new Date().toLocaleString()],
        ['Usuário:', profile?.full_name || user.email || 'N/A'],
        [], // Linha 5 (Vazia)
        ['RESUMO DO PERÍODO'], // Linha 6
        ['Total Receitas:', totalReceitas], // Linha 7
        ['Total Despesas:', totalDespesas], // Linha 8
        ['Saldo Líquido:', saldoLiquido], // Linha 9
        [], // Linha 10 (Vazia)
        ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'] // Linha 11 (Cabeçalho da Tabela)
      ];

      // 2. Dados
      (transactions || []).forEach((t: Transaction) => {
        const dateStr = new Date(t.data).toLocaleDateString('pt-BR'); // Formato dd/MM/yyyy
        const amount = Number(t.valor) || 0;
        const category = t.categories?.nome || '';
        const typeLabel = t.tipo === 'receita' ? 'Receita' : 'Despesa'; // Tradução solicitada

        sheetData.push([
          dateStr,
          t.descricao,
          category,
          typeLabel,
          amount
        ])
      })

      // 3. Geração da Planilha
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // 4. Ajuste Visual (Largura das Colunas)
      worksheet['!cols'] = [
        { wch: 20 }, // Data / Rótulos do Resumo
        { wch: 40 }, // Descrição
        { wch: 15 }, // Categoria
        { wch: 15 }, // Tipo
        { wch: 15 }  // Valor
      ];

      // 5. Finalização
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

      const fileName = `Relatorio_Lumie_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      if ((transactions || []).length === 5000) {
        toast({
          title: "Atenção",
          description: "O relatório atingiu o limite de 5.000 linhas. Diminua o período.",
        })
      }

      setLoading(false)
      onOpenChange?.(false)
      onClose?.()
    } catch (error) {
      console.error(error)
      setLoading(false)
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório.",
        variant: "destructive"
      })
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

