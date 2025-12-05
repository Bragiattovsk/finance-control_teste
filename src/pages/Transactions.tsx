import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { Transaction } from '@/types'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Pencil, Paperclip } from "lucide-react"
import { NewTransactionModal } from "@/components/NewTransactionModal"
import { ExportButton } from "@/components/transactions/ExportButton"
import { ExportReportModal } from "@/components/transactions/ExportReportModal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MonthSelector } from "@/components/MonthSelector"
import { formatCurrency } from "@/lib/format"
import { applyProjectScope, getMonthRange } from "@/lib/supabase-helpers"
import { DeleteInstallmentModal } from '@/components/modals/DeleteInstallmentModal'
import { useTransactions } from '@/hooks/useTransactions'
import { ReceiptViewerModal } from '@/components/transactions/ReceiptViewerModal'

import { useProject } from "@/contexts/project-hooks"

export function Transactions() {
    const { user } = useAuth()
    const { selectedProject } = useProject()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentDate, setCurrentDate] = useState(new Date())

    // Edit state
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteInstallmentOpen, setIsDeleteInstallmentOpen] = useState(false)
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
    const { deleteTransaction, deleteFutureInstallments } = useTransactions()
    const [viewingReceiptPath, setViewingReceiptPath] = useState<string | null>(null)
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)

    const fetchTransactions = useCallback(async () => {
        if (!user) return

        try {
            setLoading(true)
            const { startOfMonth, endOfMonth } = getMonthRange(currentDate)

            let query = supabase
                .from("transactions")
                .select("*, categories(nome, cor)")
                .eq("user_id", user.id)
                .gte("data", startOfMonth)
                .lte("data", endOfMonth)
                .order("data", { ascending: false })

            query = applyProjectScope(query, selectedProject)

            const { data, error } = await query

            if (error) throw error

            // Supabase returns nested data, we need to cast or ensure type safety.
            // The interface above expects 'categories' as an object or null.
            // If the join returns an array (one-to-many), we might need to handle it, 
            // but here it's many-to-one (transaction -> category), so it should be a single object if using .single() or just object if relation is correct.
            // Actually, Supabase JS client returns an object for single relation if configured, or array.
            // Let's verify at runtime or assume object based on typical setup. 
            // Usually it returns an object if it's a foreign key relation.

            setTransactions(data || [])
        } catch (err: unknown) {
            console.error("Error fetching transactions:", err)
            setError("Erro ao carregar transações.")
        } finally {
            setLoading(false)
        }
    }, [user, currentDate, selectedProject])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const handleDelete = async (transaction: Transaction) => {
        if (!transaction.recurrence_id) {
            if (!confirm("Tem certeza que deseja excluir esta transação?")) return
            try {
                await deleteTransaction(transaction.id)
                fetchTransactions()
            } catch (err: unknown) {
                console.error("Error deleting transaction:", err)
                alert("Erro ao excluir transação.")
            }
            return
        }

        setTransactionToDelete(transaction)
        setIsDeleteInstallmentOpen(true)
    }

    const handleDeleteSingle = async () => {
        if (!transactionToDelete) return
        try {
            await deleteTransaction(transactionToDelete.id)
            fetchTransactions()
        } catch (err) {
            console.error('Erro ao excluir parcela única:', err)
            alert('Erro ao excluir transação.')
        } finally {
            setTransactionToDelete(null)
        }
    }

    const handleDeleteFuture = async () => {
        if (!transactionToDelete) return
        const recurrenceId = transactionToDelete.recurrence_id as string
        const startInstallment = Number(transactionToDelete.installment_number || 1)
        try {
            await deleteFutureInstallments(recurrenceId, startInstallment)
            fetchTransactions()
        } catch (err) {
            console.error('Erro ao excluir parcelas futuras:', err)
            alert('Erro ao excluir parcelas futuras.')
        } finally {
            setTransactionToDelete(null)
        }
    }

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction)
        setIsModalOpen(true)
    }

    const handleOpenReceipt = (e: React.MouseEvent, path: string) => {
        e.preventDefault()
        e.stopPropagation()
        setViewingReceiptPath(path)
    }

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open)
        if (!open) setEditingTransaction(null)
    }

    const handleSuccess = () => {
        fetchTransactions()
        setIsModalOpen(false)
        setEditingTransaction(null)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR")
    }

    const getCategoryColor = (color: string) => {
        switch (color) {
            case "red": return "bg-rose-500/10 text-rose-500 border-rose-500/20"
            case "orange": return "bg-orange-500/10 text-orange-500 border-orange-500/20"
            case "yellow": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            case "green": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            case "blue": return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
            case "purple": return "bg-violet-500/10 text-violet-500 border-violet-500/20"
            default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Transações</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                    <NewTransactionModal
                        open={isModalOpen}
                        onOpenChange={handleModalClose}
                        onSuccess={handleSuccess}
                        transactionToEdit={editingTransaction}
                    />
                    <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto gap-2 shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all">
                        Nova Transação
                    </Button>
                    <div className="w-full md:w-auto">
                        <ExportButton onClick={() => setIsExportModalOpen(true)} />
                    </div>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Desktop Table */}
            <div className="hidden md:block rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="text-muted-foreground font-semibold">Descrição</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Categoria</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Data</TableHead>
                            <TableHead className="text-right text-muted-foreground font-semibold">Valor</TableHead>
                            <TableHead className="w-[100px] text-right text-muted-foreground font-semibold">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        Carregando...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                    Nenhuma transação encontrada neste período.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((transaction) => (
                                <TableRow key={transaction.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                                    <TableCell className="font-medium text-foreground">
                                        {transaction.descricao}
                                        {transaction.attachment_path ? (
                                            <button
                                                type="button"
                                                onClick={(e) => handleOpenReceipt(e, transaction.attachment_path as string)}
                                                className="ml-2 inline-flex items-center text-muted-foreground hover:text-primary"
                                                title="Ver comprovante"
                                            >
                                                <Paperclip className="h-4 w-4" />
                                            </button>
                                        ) : null}
                                        {typeof transaction.installment_number === 'number' && typeof transaction.total_installments === 'number' && (
                                            <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                                                {transaction.installment_number}/{transaction.total_installments}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {transaction.categories ? (
                                            <Badge className={`${getCategoryColor(transaction.categories.cor)} border shadow-none hover:bg-opacity-80`}>
                                                {transaction.categories.nome}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{formatDate(transaction.data)}</TableCell>
                                    <TableCell
                                        className={`text-right font-bold ${transaction.tipo === "receita" ? "text-emerald-500" : "text-rose-500"
                                            }`}
                                    >
                                        {formatCurrency(transaction.valor)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 mr-1"
                                            onClick={() => handleEdit(transaction)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                            onClick={() => handleDelete(transaction)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile List */}
            <div className="block md:hidden space-y-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm">Carregando transações...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground text-center rounded-lg border border-border/50 bg-card">
                        <p className="text-sm font-medium">Nenhuma transação encontrada</p>
                        <p className="text-xs">Tente mudar o mês ou os filtros.</p>
                    </div>
                ) : (
                    transactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 shadow-sm active:bg-muted/30 transition-colors"
                            onClick={() => handleEdit(transaction)}
                        >
                            <div className="flex items-center gap-4">
                                {/* Category Icon/Initial */}
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${transaction.categories ? getCategoryColor(transaction.categories.cor) : "bg-muted text-muted-foreground"}`}>
                                    {transaction.categories ? (
                                        <span className="text-sm font-bold">{transaction.categories.nome.charAt(0).toUpperCase()}</span>
                                    ) : (
                                        <span className="text-sm font-bold">-</span>
                                    )}
                                </div>

                                {/* Description & Meta */}
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-sm line-clamp-1">{transaction.descricao}</span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{transaction.categories?.nome || "Sem categoria"}</span>
                                        <span>•</span>
                                        <span>{formatDate(transaction.data)}</span>
                                        {typeof transaction.installment_number === 'number' && typeof transaction.total_installments === 'number' && (
                                            <>
                                                <span>•</span>
                                                <span>{transaction.installment_number}/{transaction.total_installments}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Value, Actions & Attachment */}
                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-sm font-bold ${transaction.tipo === "receita" ? "text-emerald-500" : "text-rose-500"}`}>
                                    {formatCurrency(transaction.valor)}
                                </span>
                                
                                <div className="flex items-center gap-1">
                                    {transaction.attachment_path && (
                                        <button
                                            onClick={(e) => handleOpenReceipt(e, transaction.attachment_path as string)}
                                            className="text-muted-foreground hover:text-primary transition-colors p-1"
                                            title="Ver comprovante"
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </button>
                                    )}
                                    
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleEdit(transaction)
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(transaction)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ReceiptViewerModal
                isOpen={!!viewingReceiptPath}
                path={viewingReceiptPath}
                onClose={() => setViewingReceiptPath(null)}
            />

            <DeleteInstallmentModal
                isOpen={isDeleteInstallmentOpen}
                onClose={() => setIsDeleteInstallmentOpen(false)}
                onDeleteSingle={handleDeleteSingle}
                onDeleteFuture={handleDeleteFuture}
                installmentNumber={transactionToDelete?.installment_number ?? null}
                totalInstallments={transactionToDelete?.total_installments ?? null}
            />

            <ExportReportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
        </div>
    )
}
