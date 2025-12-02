import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteInstallmentModalProps {
  isOpen: boolean
  onClose: () => void
  onDeleteSingle: () => Promise<void> | void
  onDeleteFuture: () => Promise<void> | void
  installmentNumber?: number | null
  totalInstallments?: number | null
}

export function DeleteInstallmentModal({ isOpen, onClose, onDeleteSingle, onDeleteFuture, installmentNumber, totalInstallments }: DeleteInstallmentModalProps) {
  const text = (typeof installmentNumber === 'number' && typeof totalInstallments === 'number')
    ? `Esta transação é a parcela ${installmentNumber} de ${totalInstallments}. O que deseja fazer?`
    : 'Esta transação é uma parcela. O que deseja fazer?'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Excluir Parcela</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {text}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={async () => { await onDeleteSingle(); onClose(); }}>
            Excluir apenas esta
          </Button>
          <Button variant="destructive" onClick={async () => { await onDeleteFuture(); onClose(); }}>
            Excluir desta em diante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

