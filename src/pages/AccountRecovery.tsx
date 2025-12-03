import { useAuth } from "@/contexts/auth-hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function AccountRecovery() {
    const { deletionDate, signOut } = useAuth()
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const formattedDate = deletionDate
        ? new Date(deletionDate).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        })
        : "breve"

    const handleReactivate = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.rpc("cancel_account_deletion")

            if (error) throw error

            toast({
                title: "Conta Reativada!",
                description: "Sua conta foi restaurada com sucesso.",
                className: "bg-green-600 text-white border-none",
            })

            // Force reload to update context or redirect
            window.location.href = "/"
        } catch (error) {
            console.error("Error reactivating account:", error)
            toast({
                title: "Erro",
                description: "Não foi possível reativar sua conta. Tente novamente.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-destructive/50 shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl text-destructive">Conta Agendada para Exclusão</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Sua conta está agendada para exclusão em <span className="font-bold text-foreground">{formattedDate}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>
                        Para voltar a acessar seus dados e cancelar a exclusão, você precisa reativar sua conta agora.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        size="lg"
                        onClick={handleReactivate}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Reativar Conta
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={signOut}
                        disabled={loading}
                    >
                        Sair
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
