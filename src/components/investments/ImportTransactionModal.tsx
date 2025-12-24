import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TransactionImporter } from './TransactionImporter';
import { FileSpreadsheet } from 'lucide-react';

interface ImportTransactionModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function ImportTransactionModal({ isOpen, onOpenChange, onSuccess }: ImportTransactionModalProps) {
    const handleSuccess = () => {
        onOpenChange(false);
        if (onSuccess) onSuccess();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-violet-600" />
                        Importar Transações via Excel
                    </DialogTitle>
                    <DialogDescription>
                        Carregue um arquivo Excel para importar múltiplas transações de uma vez.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4">
                    <TransactionImporter onSuccess={handleSuccess} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
