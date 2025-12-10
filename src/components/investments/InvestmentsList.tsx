import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { useProject } from "@/contexts/project-hooks"
import { applyProjectScope } from "@/lib/supabase-helpers"
import { formatCurrency } from "@/lib/format"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Wallet, FileText, Edit2, Trash2, TrendingUp, Loader2, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NewCategoryModal } from "@/components/NewCategoryModal"

interface InvestmentItem {
  id: string
  name: string
  type: string
  amount: number
  date: string
  transaction_id: string | null
  debit_from_balance?: boolean
  category_id?: string | null
  categories?: { id: string; nome: string; tipo: string; cor?: string } | { id: string; nome: string; tipo: string; cor?: string }[] | null
}

interface Category {
    id: string
    nome: string
    cor: string
    is_investment?: boolean
}

interface InvestmentsListProps {
  onChanged?: () => void
}

const INVESTMENT_TYPES = [
  "Renda Fixa",
  "Ações",
  "FIIs",
  "Cripto",
  "Fundos",
  "Outros",
]

import { ConfirmModal } from "@/components/ConfirmModal"

export function InvestmentsList({ onChanged }: InvestmentsListProps) {
  const { user } = useAuth()
  const { selectedProject } = useProject()
  const { toast } = useToast()

  const [items, setItems] = useState<InvestmentItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<InvestmentItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InvestmentItem | null>(null)

  const fetchItems = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      let query = supabase
        .from("investments")
        .select("id, name, type, amount, date, transaction_id, debit_from_balance, category_id, categories(id, nome, tipo, cor)")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      query = applyProjectScope(query, selectedProject)

      const { data, error } = await query
      if (error) throw error
      setItems((data || []) as InvestmentItem[])
    } catch (err) {
      console.error("Error fetching investments list:", err)
      toast({ title: "Erro", description: "Falha ao carregar investimentos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [user, selectedProject, toast])

  const fetchCategories = useCallback(async () => {
      if (!user) return
      try {
          const { data, error } = await supabase
              .from("categories")
              .select("id, nome, cor, is_investment")
              .eq("user_id", user.id)
              .order("nome")
          
          if (error) throw error
          setCategories((data || []) as Category[])
      } catch (err) {
          console.error("Error fetching categories:", err)
      }
  }, [user])

  useEffect(() => {
    fetchItems()
    fetchCategories()
  }, [fetchItems, fetchCategories])

  const handleDeleteClick = (inv: InvestmentItem) => {
    setItemToDelete(inv)
  }

  const handleConfirmDelete = async () => {
    if (!user || !itemToDelete) return

    try {
      const { error } = await supabase.rpc("delete_investment_linked", { p_investment_id: itemToDelete.id })
      if (error) throw error
      toast({ title: "Removido", description: "Investimento excluído com sucesso", variant: "default" })
      await fetchItems()
      onChanged?.()
    } catch (err) {
      console.error("Error deleting investment:", err)
      toast({ title: "Erro", description: "Não foi possível excluir", variant: "destructive" })
    } finally {
      setItemToDelete(null)
    }
  }

  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)

  useEffect(() => {
    if (editing) {
      setEditName(editing.name)
      setEditType(editing.type)
      setEditAmount(String(editing.amount))
      setEditDate(editing.date)
      setEditCategoryId(editing.category_id || null)
    }
  }, [editing])

  const handleEditSave = async () => {
    if (!editing || !user) return
    
    setSaving(true)
    try {
      const payload = {
        name: editName,
        type: editType || "Outros",
        amount: parseFloat(editAmount || "0"),
        date: editDate,
        category_id: editCategoryId
      }
      const { error: invError } = await supabase.from("investments").update(payload).eq("id", editing.id)
      if (invError) throw invError

      if (editing.transaction_id) {
        const txPayload = {
          descricao: `Aporte: ${payload.name}`,
          valor: payload.amount,
          data: payload.date,
          categoria_id: editCategoryId // Also update category on transaction
        }
        const { error: txError } = await supabase.from("transactions").update(txPayload).eq("id", editing.transaction_id)
        if (txError) throw txError
      }

      toast({ title: "Atualizado", description: "Investimento atualizado com sucesso.", variant: "default" })
      setEditing(null)
      await fetchItems()
      onChanged?.()
    } catch (err) {
      console.error("Error updating investment:", err)
      toast({ title: "Erro", description: "Não foi possível atualizar o investimento.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
            <span className="text-sm">Carregando investimentos...</span>
        </div>
    )
  }

  if (items.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/50 rounded-xl bg-muted/5">
              <div className="p-3 bg-muted rounded-full mb-3">
                  <div className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhum investimento encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">Registre um novo aporte para começar.</p>
          </div>
      )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/50 border-border/40">
                <TableHead className="font-semibold text-muted-foreground pl-6">Nome</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Tipo</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Categoria</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Data</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Valor</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-center">Status</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors border-border/40 group">
                  <TableCell className="font-medium text-foreground pl-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        {inv.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Badge variant="outline" className="font-normal bg-background/50">
                        {inv.type || "Outros"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const cat = Array.isArray(inv.categories) ? inv.categories[0] : inv.categories
                      const name = cat?.nome || "Sem Categoria"
                      const color = cat?.cor || "#71717a"
                      
                      return (
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-sm text-muted-foreground">{name}</span>
                        </div>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {new Date(inv.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {formatCurrency(Number(inv.amount))}
                  </TableCell>
                  <TableCell className="text-center">
                    {inv.transaction_id ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none font-normal text-xs px-2 py-0.5">
                          Debitado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground border-border bg-muted/50 font-normal text-xs px-2 py-0.5">
                          Patrimonial
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => setEditing(inv)}
                        title="Editar"
                      >
                          <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                        onClick={() => handleDeleteClick(inv)}
                        title="Excluir"
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Investimento"
        description={`Tem certeza que deseja excluir o investimento "${itemToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/5">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" />
                Editar Investimento
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Nome do Ativo</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="pl-9"
                    placeholder="Ex: Tesouro Selic"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
                <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger>
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
                <Label className="text-xs font-medium text-muted-foreground">Valor</Label>
                <div className="relative">
                    <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="number" 
                        step="0.01" 
                        value={editAmount} 
                        onChange={(e) => setEditAmount(e.target.value)} 
                        className="pl-9"
                    />
                </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Data</Label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="date" 
                        value={editDate} 
                        onChange={(e) => setEditDate(e.target.value)} 
                        className="pl-9 block"
                    />
                </div>
                </div>

                <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Categoria</Label>
                <div className="flex gap-2">
                    <Select value={editCategoryId ?? ""} onValueChange={setEditCategoryId}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.filter(c => c.is_investment === true).length > 0 ? (
                        categories
                            .filter(c => c.is_investment === true)
                            .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.cor }} />
                                {cat.nome}
                                </div>
                            </SelectItem>
                            ))
                        ) : (
                        <div className="p-2 text-center text-xs text-muted-foreground">
                            Nenhuma categoria
                        </div>
                        )}
                    </SelectContent>
                    </Select>
                    <Button 
                        type="button" 
                        size="icon" 
                        variant="outline" 
                        className="shrink-0"
                        onClick={() => setIsCategoryModalOpen(true)}
                        title="Nova Categoria"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/5 gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                    </>
                ) : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={(newCategory) => {
            setCategories(prev => [...prev, newCategory])
            if (newCategory.is_investment) setEditCategoryId(newCategory.id)
        }}
        defaultIsInvestment={true}
      />
    </div>
  )
}
