import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface FormErrorAlertProps {
    error: string | null
    title?: string
}

export function FormErrorAlert({ error, title = "Erro" }: FormErrorAlertProps) {
    if (!error) return null

    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    )
}