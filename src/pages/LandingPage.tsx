import { Link } from "react-router-dom"
import { 
  Menu, 
  Layers, 
  Paperclip, 
  FileSpreadsheet, 
  Smartphone, 
  Check, 
  ArrowRight,
  Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans antialiased selection:bg-purple-500/30">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/favicon.svg" 
              alt="Lumie Logo" 
              className="w-8 h-8 object-contain rounded-full" 
            />
            <span className="font-bold text-xl tracking-tight text-white">Lumie</span>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20">
                Começar Agora
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" className="text-zinc-400">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-32 pb-16 overflow-hidden">
        
        {/* Background FX */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center gap-8">
          <Badge variant="secondary" className="px-4 py-2 bg-zinc-900/50 border-white/10 text-purple-400 rounded-full backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
            🚀 Gestão Financeira Inteligente
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            A inteligência financeira que o <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              Profissional Híbrido
            </span>
            {" "}precisava.
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            Freelancers, MEIs e Devs: parem de misturar as contas de casa com as da empresa.
            Tenha clareza total sobre o seu fluxo de caixa.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-500/20 rounded-full">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-lg border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-full">
              <Play className="mr-2 h-4 w-4 fill-current" />
              Ver Demo
            </Button>
          </div>

          {/* Hero Dashboard Placeholder with Perspective */}
          <div className="w-full mt-16 perspective-[2000px] animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 px-2">
            <div 
              className={cn(
                "relative mx-auto rounded-xl border border-purple-500/30 bg-zinc-900/50 p-2 shadow-2xl shadow-purple-500/20",
                "transform rotate-x-[12deg] transition-transform duration-700 hover:rotate-x-0"
              )}
            >

              {/* Inner Content Placeholder */}
              <div className="aspect-[16/9] rounded-lg bg-zinc-950/80 w-full overflow-hidden flex items-center justify-center border border-white/5 relative group">
                <img 
                  src="/dashboardpreview.png" 
                  alt="Dashboard Preview" 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo o que você precisa</h2>
            <p className="text-zinc-400">Ferramentas essenciais para sua liberdade financeira.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Separação Real (Big Card) */}
            <Card className="bg-zinc-900/50 border-white/10 hover:border-purple-500/50 transition-all duration-300 md:col-span-2 group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <Layers className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-xl text-zinc-50">Separação Real</CardTitle>
                <CardDescription className="text-zinc-400 text-base">
                  Mantenha suas finanças pessoais e empresariais em ambientes completamente distintos, mas acessíveis em um único lugar. Nunca mais misture seus gastos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 w-full bg-zinc-950/50 rounded-lg border border-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center gap-8 opacity-50">
                    <div className="w-24 h-32 bg-red-500/10 rounded-t-lg border-t border-x border-red-500/20 translate-y-8" />
                    <div className="w-24 h-32 bg-emerald-500/10 rounded-t-lg border-t border-x border-emerald-500/20 translate-y-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-zinc-900/50 border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Paperclip className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-xl text-zinc-50">Anexos na Nuvem</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Guarde comprovantes, notas fiscais e contratos diretamente em cada transação.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-zinc-900/50 border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                </div>
                <CardTitle className="text-xl text-zinc-50">Relatórios Contábeis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Exporte dados prontos para seu contador em PDF ou Excel com um clique.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-zinc-900/50 border-white/10 hover:border-purple-500/50 transition-all duration-300 md:col-span-2 md:col-start-2 group">
              <div className="flex flex-col md:flex-row items-center">
                <CardHeader className="flex-1">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                    <Smartphone className="w-6 h-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-xl text-zinc-50">App Nativo PWA</CardTitle>
                  <CardDescription className="text-zinc-400 text-base">
                    Instale no seu celular e acesse offline. Uma experiência nativa sem precisar baixar na loja de aplicativos.
                  </CardDescription>
                </CardHeader>
                <div className="p-6 md:pr-12">
                   <img 
                     src="/pwapreview.png" 
                     alt="App Mobile Preview" 
                     className="h-48 w-auto object-contain rounded-xl border border-white/10 shadow-lg shadow-purple-500/10 rotate-0 hover:rotate-3 transition-transform duration-300"
                   />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Pricing Section */}
      <section className="py-24 bg-zinc-900/20 border-y border-white/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos Transparentes</h2>
            <p className="text-zinc-400">Comece grátis e evolua conforme seu negócio cresce.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <Card className="bg-transparent border-white/10 flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl text-zinc-50">Starter</CardTitle>
                <div className="text-4xl font-bold mt-4 text-zinc-50">R$ 0<span className="text-lg font-normal text-zinc-500">/mês</span></div>
                <CardDescription className="mt-2">Para quem está começando a se organizar.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-4 w-4 text-zinc-500" /> Gestão de Receitas e Despesas
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-4 w-4 text-zinc-500" /> 1 Conta Bancária
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-4 w-4 text-zinc-500" /> Relatórios Básicos
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/register" className="w-full">
                  <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 hover:text-white">
                    Começar Grátis
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-zinc-900/80 border-purple-500 relative shadow-[0_0_30px_-5px_rgba(147,51,234,0.3)] flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1">Recomendado</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl text-purple-400">Pro</CardTitle>
                <div className="flex flex-col items-start gap-1 my-4">
                  <span className="text-sm text-zinc-500 line-through font-medium">De R$ 29,90</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">R$ 14,90</span>
                    <span className="text-zinc-400 text-sm">/mês</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase mt-1">
                    ✨ Oferta Founder (Vitalício)
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Garanta o preço de lançamento para sempre.</p>
                <CardDescription className="mt-2">Poder total para o profissional híbrido.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-zinc-50">
                    <Check className="h-4 w-4 text-purple-500" /> Tudo do Starter
                  </li>
                  <li className="flex items-center gap-2 text-zinc-50">
                    <Check className="h-4 w-4 text-purple-500" /> Múltiplas Contas e Cartões
                  </li>
                  <li className="flex items-center gap-2 text-zinc-50">
                    <Check className="h-4 w-4 text-purple-500" /> Anexos de Comprovantes
                  </li>
                  <li className="flex items-center gap-2 text-zinc-50">
                    <Check className="h-4 w-4 text-purple-500" /> Exportação para Contabilidade
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/register" className="w-full">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Quero ser Founder
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-white/10 py-12 bg-zinc-950">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="font-black text-2xl tracking-tighter text-zinc-700">LUMIE</span>
          </div>
          <div className="flex flex-col md:flex-row justify-center gap-8 text-sm text-zinc-500 mb-8">
            <Link to="/terms" className="hover:text-purple-400 transition-colors">Termos de Uso</Link>
            <Link to="/privacy" className="hover:text-purple-400 transition-colors">Política de Privacidade</Link>
            <Link to="/about" className="hover:text-purple-400 transition-colors">Sobre Nós</Link>
            <Link to="/contact" className="hover:text-purple-400 transition-colors">Contato</Link>
          </div>
          <p className="text-zinc-600 text-sm">
            © {new Date().getFullYear()} Lumie. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
