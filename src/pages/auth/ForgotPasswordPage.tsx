import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2, ArrowLeft, Mail } from "lucide-react"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"

const emailSchema = z.string().email("Por favor, insira um email válido.")

export function ForgotPasswordPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        // Validate email
        const validation = emailSchema.safeParse(email)
        if (!validation.success) {
            toast({
                variant: "destructive",
                title: "Email inválido",
                description: validation.error.issues[0].message,
            })
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/update-password',
            })

            if (error) throw error

            // Always show success message for security (prevent enumeration)
            setSuccess(true)
        } catch (err: unknown) {
            console.error("Reset password error:", err)
            let errorMessage = "Ocorreu um erro ao processar sua solicitação.";
            if (err instanceof Error) {
                errorMessage = err.message;
            }
            toast({
                variant: "destructive",
                title: "Erro ao enviar email",
                description: errorMessage,
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-[30%] -left-[10%] h-[70vh] w-[70vh] animate-blob rounded-full bg-purple-500/20 mix-blend-multiply blur-3xl filter"></div>
                <div className="absolute -bottom-[30%] -right-[10%] h-[70vh] w-[70vh] animate-blob animation-delay-2000 rounded-full bg-indigo-500/20 mix-blend-multiply blur-3xl filter"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <Card className="z-10 w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-100 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1">
                    <div className="flex flex-col items-center justify-center mb-6 space-y-3">
                        <img 
                            src="/favicon.png" 
                            alt="Lumie Logo" 
                            className="h-12 w-12 rounded-full object-cover shadow-md" 
                        />
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-2xl font-bold text-primary">Lumie</span>
                            <span className="text-xs font-normal text-muted-foreground tracking-widest">FINANCE CONTROL</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        Recuperar Senha
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        Digite seu email para receber o link de redefinição
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="space-y-4 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-900/20">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium text-green-500">Email Enviado!</h3>
                                <p className="text-sm text-slate-400">
                                    Se houver uma conta associada a este e-mail, você receberá um link de recuperação em instantes.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-slate-700 hover:bg-slate-800 text-slate-300"
                                onClick={() => navigate("/login")}
                            >
                                Voltar para Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9 bg-slate-950/50 border-slate-800 focus:border-purple-500 focus:ring-purple-500/20"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/25"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar Link de Recuperação"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                {!success && (
                    <CardFooter>
                        <Button
                            variant="ghost"
                            className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
                            onClick={() => navigate("/login")}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para Login
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}
