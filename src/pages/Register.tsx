import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não conferem",
        description: "Por favor, verifique se as senhas digitadas são iguais.",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu e-mail para confirmar o cadastro.",
      })

      setTimeout(() => {
        navigate("/login")
      }, 2000)

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente."
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: message,
      })
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
                   src="/favicon.png" 
                   alt="Lumie Logo" 
                   className="h-10 w-10 rounded-full object-cover shadow-sm" 
               />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Crie sua conta</h1>
            <p className="text-sm text-muted-foreground">
              Comece a organizar suas finanças hoje
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background h-12 border-input focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background h-12 border-input focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="******"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background h-12 border-input focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>

          <p className="px-8 text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link 
              to="/login" 
              className="text-primary underline-offset-4 hover:underline transition-colors"
            >
              Entrar
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
                src="/favicon.png" 
                alt="Lumie Logo" 
                className="mr-2 h-6 w-6 rounded-full" 
            />
            Lumie Finance
        </div>

        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;A melhor decisão para minhas finanças pessoais. Interface limpa e intuitiva.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">Marcus Chen</footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
