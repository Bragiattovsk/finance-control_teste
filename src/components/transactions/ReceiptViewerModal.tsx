//
import { useReceiptUrl } from "@/hooks/useReceiptUrl"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Download, ExternalLink, FileText, X } from "lucide-react"

interface ReceiptViewerModalProps {
    isOpen: boolean
    onClose: () => void
    path: string | null
}

export function ReceiptViewerModal({ isOpen, onClose, path }: ReceiptViewerModalProps) {
    const { url, loading, error } = useReceiptUrl(path)

    if (!path) return null

    const isPdf = path.toLowerCase().endsWith(".pdf")
    const fileName = path.split("/").pop() || "Comprovante"

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Comprovante</DialogTitle>
                    <DialogDescription>
                        Visualizando: {fileName}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-[300px] flex items-center justify-center bg-muted/30 rounded-md border p-4">
                    {loading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Carregando comprovante...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-2 text-destructive">
                            <X className="h-8 w-8" />
                            <p className="text-sm font-medium">Erro ao carregar imagem</p>
                            <p className="text-xs text-muted-foreground">{error}</p>
                        </div>
                    ) : url ? (
                        isPdf ? (
                            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                                <div className="rounded-full bg-primary/10 p-6">
                                    <FileText className="h-12 w-12 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">Arquivo PDF</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs">
                                        Este documento é um PDF. Para melhor visualização, abra em uma nova aba ou faça o download.
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => window.open(url, "_blank")}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Abrir PDF
                                </Button>
                            </div>
                        ) : (
                            <img
                                src={url}
                                alt="Comprovante"
                                className="w-full h-auto max-h-[60vh] object-contain rounded-md shadow-sm"
                            />
                        )
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Não foi possível obter a URL do arquivo.
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:justify-between sm:gap-0">
                    <Button variant="ghost" onClick={onClose}>
                        Fechar
                    </Button>
                    <div className="flex gap-2">
                        {url && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(url, "_blank")}
                                    title="Abrir em nova aba"
                                >
                                    <ExternalLink className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Abrir</span>
                                </Button>
                                <Button asChild>
                                    <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Baixar</span>
                                    </a>
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
