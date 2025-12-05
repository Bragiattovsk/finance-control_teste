import { useState, useRef, ChangeEvent, DragEvent } from "react"
import { useReceiptUpload } from "@/hooks/useReceiptUpload"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2, Upload, FileText, X, Lock } from "lucide-react"

interface AttachmentInputProps {
    value?: string | null
    onChange: (path: string | null) => void
    isPro: boolean
    transactionId?: string
}

export function AttachmentInput({ value, onChange, isPro, transactionId }: AttachmentInputProps) {
    const { uploadReceipt, isUploading, error } = useReceiptUpload()
    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    const handleFileSelect = async (file: File) => {
        if (!file) return
        try {
            const path = await uploadReceipt(file, transactionId)
            if (path) {
                onChange(path)
            }
        } catch (e) {
            console.error("Upload failed", e)
        }
    }

    const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0])
        }
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(null)
    }

    if (!isPro) {
        return (
            <div className="flex flex-col items-center justify-center rounded-md border border-border bg-muted/50 p-6 text-center text-muted-foreground">
                <Lock className="mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm font-medium">Anexos de comprovantes</p>
                <p className="text-xs">Disponível no plano PRO</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div
                onClick={() => !value && !isUploading && inputRef.current?.click()}
                onDragOver={!value && !isUploading ? handleDragOver : undefined}
                onDragLeave={!value && !isUploading ? handleDragLeave : undefined}
                onDrop={!value && !isUploading ? handleDrop : undefined}
                className={cn(
                    "relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-4 text-center transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/25",
                    (value || isUploading) && "cursor-default border-solid bg-muted/10",
                    error && "border-destructive/50 bg-destructive/5"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={onInputChange}
                    disabled={isUploading || !!value}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-xs font-medium">Otimizando e enviando...</span>
                    </div>
                ) : value ? (
                    <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="rounded-full bg-primary/10 p-2">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col items-start overflow-hidden text-left">
                                <span className="truncate text-sm font-medium text-foreground max-w-[200px]">
                                    {value.split('/').pop()}
                                </span>
                                <span className="text-xs text-muted-foreground">Anexo salvo</span>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={handleRemove}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remover arquivo</span>
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="rounded-full bg-muted p-2">
                            <Upload className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                Arraste o comprovante ou clique
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                                Suporta Imagens (até 10MB) ou PDF (até 2MB).
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {error && (
                <p className="text-xs font-medium text-destructive">{error}</p>
            )}
        </div>
    )
}
