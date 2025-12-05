import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
                navigate("/")
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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950">
            {/* 3D Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-[30%] -left-[10%] h-[70vh] w-[70vh] animate-blob rounded-full bg-violet-500/30 mix-blend-multiply blur-3xl filter transition-all duration-10000 ease-in-out"></div>
                <div className="absolute -top-[30%] -right-[10%] h-[70vh] w-[70vh] animate-blob animation-delay-2000 rounded-full bg-emerald-500/30 mix-blend-multiply blur-3xl filter transition-all duration-10000 ease-in-out"></div>
                <div className="absolute -bottom-[30%] left-[20%] h-[70vh] w-[70vh] animate-blob animation-delay-4000 rounded-full bg-rose-500/30 mix-blend-multiply blur-3xl filter transition-all duration-10000 ease-in-out"></div>

                {/* Grid Pattern for depth */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <Card className="z-10 w-full max-w-md border-border/50 bg-zinc-900/50 text-foreground backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-violet-500/10">
                <CardHeader className="space-y-1">
                    <div className="flex flex-col items-center justify-center mb-6 space-y-3">
                        <img 
                            src="/favicon.svg" 
                            alt="Lumie Logo" 
                            className="h-12 w-12 rounded-full object-cover shadow-md" 
                        />
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-2xl font-bold text-primary">Lumie</span>
                            <span className="text-xs font-normal text-muted-foreground tracking-widest">FINANCE CONTROL</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-violet-400 to-rose-600 bg-clip-text text-transparent">
                        Bem-vindo de volta
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Entre com suas credenciais para acessar o painel
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                className="bg-zinc-950/50 border-border/50 focus:border-violet-500 focus:ring-violet-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-zinc-950/50 border-border/50 focus:border-violet-500 focus:ring-violet-500/20"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                variant="link"
                                className="px-0 font-normal text-xs text-muted-foreground hover:text-violet-400"
                                onClick={() => navigate("/forgot-password")}
                                type="button"
                            >
                                Esqueci minha senha
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="bg-rose-900/20 border-rose-900/50 text-rose-200">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="bg-emerald-900/20 border-emerald-900/50 text-emerald-200">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>Sucesso</AlertTitle>
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-700 hover:to-rose-700 transition-all duration-300 shadow-lg shadow-violet-500/25"
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
                </CardContent>
                <CardFooter className="flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        Ainda não tem conta? {" "}
                        <Link to="/register" className="text-violet-400 hover:text-violet-300 hover:underline">
                            Cadastre-se
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
