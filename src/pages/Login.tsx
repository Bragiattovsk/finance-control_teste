import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export function Login() {
    const navigate = useNavigate()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                window.location.href = "/"
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                setSuccess("Conta criada com sucesso! Verifique seu email ou faça login.")
                setIsLogin(true) // Switch to login mode for convenience
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro. Tente novamente."
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full min-h-screen grid lg:grid-cols-2">
            {/* Left Column - Form */}
            <div className="flex items-center justify-center py-12 bg-background">
                <div className="mx-auto w-full max-w-[350px] space-y-6">
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <img 
                                src="/favicon.svg" 
                                alt="Lumie Logo" 
                                className="h-10 w-10 rounded-full object-cover shadow-sm" 
                            />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Bem-vindo de volta
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Entre com suas credenciais para acessar sua conta
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background h-12 border-input focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <Button
                                    variant="link"
                                    className="px-0 font-normal text-xs text-primary underline-offset-4 hover:underline h-auto"
                                    onClick={() => navigate("/forgot-password")}
                                    type="button"
                                    tabIndex={-1}
                                >
                                    Esqueceu a senha?
                                </Button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background h-12 border-input focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>

                        {error && (
                            <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>Sucesso</AlertTitle>
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium transition-all duration-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </form>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Ainda não tem conta?{" "}
                        <Link 
                            to="/register" 
                            className="text-primary underline-offset-4 hover:underline transition-colors"
                        >
                            Cadastre-se
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Column - Branding */}
            <div className="hidden lg:flex relative h-full flex-col justify-between p-10 text-white bg-zinc-900 dark:border-r overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-600/20 to-emerald-600/20 pointer-events-none" />
                
                {/* Decorative Elements */}
                <div className="absolute -top-[30%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-violet-500/10 blur-3xl" />
                <div className="absolute -bottom-[30%] -right-[10%] h-[70vh] w-[70vh] rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative z-20 flex items-center text-lg font-medium">
                    <img 
                        src="/favicon.svg" 
                        alt="Lumie Logo" 
                        className="mr-2 h-6 w-6 rounded-full" 
                    />
                    Lumie Finance
                </div>

                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;O controle financeiro que transformou a maneira como gerencio meu patrimônio. Simples, rápido e poderoso.&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-400">Sofia Davis</footer>
                    </blockquote>
                </div>
            </div>
        </div>
    )
}
