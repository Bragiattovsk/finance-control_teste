import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/project-hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import type { Category } from "@/types"
import { NewCategoryModal } from "@/components/NewCategoryModal"
import { CalendarIcon, Wallet, TrendingUp, Plus } from "lucide-react"

interface InvestmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const INVESTMENT_TYPES = [
  "Renda Fixa",
  "Ações",
  "FIIs",
  "Cripto",
  "Fundos",
  "Outros",
]

export function InvestmentModal({ isOpen, onClose, onSuccess }: InvestmentModalProps) {
  const { user } = useAuth()
  const { selectedProject } = useProject()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<string>(INVESTMENT_TYPES[0])
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [debitFromBalance, setDebitFromBalance] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [investmentCategoryId, setInvestmentCategoryId] = useState<string | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName("")
      setType(INVESTMENT_TYPES[0])
      setAmount("")
      setDate(new Date().toISOString().split("T")[0])
      setDebitFromBalance(true)
      ;(async () => {
        if (!user) return
        const { data } = await supabase
          .from("categories")
          .select("id, nome, cor, tipo, is_investment")
          .eq("user_id", user.id)
          .order("nome")
        const cats = (data || []) as Category[]
        setCategories(cats)
        const defaultId = await findInvestmentCategoryId()
        setInvestmentCategoryId(defaultId)
      })()
    }
  }, [isOpen])

  const resolveCategoryTipo = (c: Category): "income" | "expense" => {
    const raw = (c as unknown as { tipo?: string }).tipo
    if (raw === "income" || raw === "expense") return raw
    if (raw === "receita") return "income"
    return "expense"
  }

  const findInvestmentCategoryId = async (): Promise<string | null> => {
    if (!user) return null
    const { data, error } = await supabase
      .from("categories")
      .select("id, nome, tipo, is_investment")
      .eq("user_id", user.id)
      .order("nome")

    if (error) {
      console.error("Erro ao buscar categorias:", error)
      return null
    }

    const categories = (data || []) as Category[]

    const byName = categories.find(
      (c) => c.nome.toLowerCase() === "investimento" || c.nome.toLowerCase() === "investimentos"
    )
    if (byName) return byName.id

    const inv = categories.find((c) => c.is_investment)
    if (inv) return inv.id

    const firstExpense = categories.find((c) => resolveCategoryTipo(c) === "expense")
    return firstExpense ? firstExpense.id : null
  }

  const handleSave = async () => {
    if (!user) return
    if (!name || !amount || !date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Nome, Valor e Data.",
        variant: "destructive",
      })
      return
    }

    if (parseFloat(amount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor do investimento deve ser positivo.",
        variant: "destructive",
      })
      return
    }

    const amountFloat = parseFloat(amount)
    if (isNaN(amountFloat) || amountFloat <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero.",
        variant: "destructive",
      })
      return
    }

    if (debitFromBalance && !investmentCategoryId) {
      toast({
        title: "Selecione uma categoria",
        description: "Para debitar do saldo, escolha uma categoria de investimento.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      let linkedTxId: string | null = null

      if (debitFromBalance) {
        const categoryId = investmentCategoryId
        const txPayload = {
          user_id: user.id,
          descricao: `Aporte: ${name}`,
          valor: amountFloat,
          tipo: "despesa",
          categoria_id: categoryId,
          data: date,
          pago: true,
          project_id: selectedProject?.id ?? null,
        }
        const { data: createdTx, error: txError } = await supabase
          .from("transactions")
          .insert(txPayload)
          .select("id")
          .single()
        if (txError) throw txError
        linkedTxId = createdTx?.id ?? null
      }

      const investPayload = {
        user_id: user.id,
        project_id: selectedProject?.id ?? null,
        name,
        type,
        amount: amountFloat,
        date,
        debit_from_balance: debitFromBalance,
        transaction_id: linkedTxId,
        category_id: investmentCategoryId ?? null,
      }

      const { error: invError } = await supabase.from("investments").insert(investPayload)
      if (invError) throw invError

      toast({
        title: "Sucesso",
        description: debitFromBalance
          ? `Investimento criado e R$ ${Number(amount).toFixed(2)} debitados da conta.`
          : "Investimento registrado no patrimônio (sem impacto no saldo).",
        variant: "default",
      })

      onClose()
      onSuccess?.()
    } catch (err) {
      console.error("Erro ao salvar investimento:", err)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o investimento.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/5">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Novo Investimento
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Registre um novo aporte para acompanhar seu patrimônio.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Nome do Ativo</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Tesouro Selic 2029" 
              className="h-10"
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs font-medium text-muted-foreground">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {INVESTMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">Valor Aplicado</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0,00" 
                  className="pl-9 h-10"
                  required 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-medium text-muted-foreground">Data do Aporte</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="date" 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="pl-9 h-10 block"
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-medium text-muted-foreground">Categoria</Label>
              <div className="flex gap-2">
                <Select value={investmentCategoryId ?? ""} onValueChange={setInvestmentCategoryId}>
                  <SelectTrigger className="h-10 flex-1">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.is_investment === true).length > 0 ? (
                      categories
                        .filter(c => c.is_investment === true)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                              {cat.nome}
                            </div>
                          </SelectItem>
                        ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                        <span>Nenhuma categoria encontrada.</span>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setIsCategoryModalOpen(true)}>
                          Criar categoria
                        </Button>
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="outline" 
                  className="h-10 w-10 shrink-0"
                  onClick={() => setIsCategoryModalOpen(true)}
                  title="Nova Categoria"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
            <div className="space-y-0.5">
              <Label htmlFor="debit" className="text-sm font-medium cursor-pointer">Debitar do saldo?</Label>
              <p className="text-xs text-muted-foreground">
                {debitFromBalance 
                  ? "O valor será descontado da conta." 
                  : "Apenas registro histórico."}
              </p>
            </div>
            <Switch id="debit" checked={debitFromBalance} onCheckedChange={setDebitFromBalance} />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/5 gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                Salvando...
              </>
            ) : (
              "Confirmar Investimento"
            )}
          </Button>
        </DialogFooter>

        <NewCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSuccess={(newCategory) => {
            setCategories(prev => [...prev, newCategory])
            if (newCategory.is_investment) setInvestmentCategoryId(newCategory.id)
          }}
          defaultType={"expense"}
          defaultIsInvestment={true}
        />
      </DialogContent>
    </Dialog>
  )
}
