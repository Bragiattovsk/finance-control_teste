import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2, Lock } from "lucide-react"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"

const passwordSchema = z.string().min(6, "A senha deve ter pelo menos 6 caracteres.")

export function UpdatePasswordPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        // Check if we have a session (user clicked magic link)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast({
                    variant: "destructive",
                    title: "Link expirado",
                    description: "O link de recuperação expirou ou é inválido. Por favor, solicite um novo.",
                })
                navigate("/login")
            }
        }
        checkSession()
    }, [navigate, toast])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validate password
        const validation = passwordSchema.safeParse(password)
        if (!validation.success) {
            toast({
                variant: "destructive",
                title: "Senha inválida",
                description: validation.error.issues[0].message,
            })
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Senhas não conferem",
                description: "As senhas digitadas não coincidem.",
            })
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setSuccess(true)
            toast({
                title: "Senha Atualizada!",
                description: "Sua senha foi alterada com sucesso. Redirecionando...",
                className: "bg-green-600 text-white border-none",
            })

            setTimeout(() => {
                navigate("/")
            }, 2000)

        } catch (err: unknown) {
            console.error("Update password error:", err)
            let errorMessage = "Erro ao atualizar senha.";
            if (err instanceof Error) {
                errorMessage = err.message;
            }
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
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
                <div className="absolute -top-[30%] -right-[10%] h-[70vh] w-[70vh] animate-blob rounded-full bg-emerald-500/20 mix-blend-multiply blur-3xl filter"></div>
                <div className="absolute -bottom-[30%] -left-[10%] h-[70vh] w-[70vh] animate-blob animation-delay-2000 rounded-full bg-blue-500/20 mix-blend-multiply blur-3xl filter"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <Card className="z-10 w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-100 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1">
                    <div className="flex flex-col items-center justify-center mb-6 space-y-3">
                        <img 
                            src="/favicon.svg" 
                            alt="Nexo Logo" 
                            className="h-12 w-12 rounded-full object-cover shadow-md" 
                        />
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-2xl font-bold text-primary">Nexo</span>
                            <span className="text-xs font-normal text-muted-foreground tracking-widest">FINANCE CONTROL</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        Redefinir Senha
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        Defina sua nova senha de acesso
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="space-y-4 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-900/20">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium text-green-500">Senha Atualizada!</h3>
                                <p className="text-sm text-slate-400">
                                    Redirecionando para o Dashboard...
                                </p>
                            </div>
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-9 bg-slate-950/50 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-9 bg-slate-950/50 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-emerald-500/25"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Atualizando...
                                    </>
                                ) : (
                                    "Atualizar Senha"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
