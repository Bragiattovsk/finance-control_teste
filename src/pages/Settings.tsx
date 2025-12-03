
import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { SecuritySettings } from "@/components/settings/SecuritySettings"
import { usePWA } from "@/hooks/use-pwa"
import { Download, Share, PlusSquare, Smartphone, CheckCircle } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function Settings() {
    const { user, signOut } = useAuth()
    const { toast } = useToast()
    const { isStandalone, installApp, isInstallable, showIOSInstructions, setShowIOSInstructions } = usePWA()
    const [loading, setLoading] = useState(false)
    const [setupLoading, setSetupLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const handleScheduleDeletion = async () => {
        setDeleteLoading(true)
        try {
            const { error } = await supabase.rpc("schedule_account_deletion")

            if (error) throw error

            toast({
                title: "Conta Agendada para Exclusão",
                description: "Sua conta será excluída em 30 dias. Você foi desconectado.",
                className: "bg-red-600 text-white border-none",
            })

            await signOut()
        } catch (error) {
            console.error("Error scheduling deletion:", error)
            toast({
                title: "Erro",
                description: "Não foi possível agendar a exclusão. Tente novamente.",
                variant: "destructive",
            })
            setDeleteLoading(false)
            setIsDeleteModalOpen(false)
        }
    }

    // Investment Settings State
    const [investmentPercent, setInvestmentPercent] = useState("")
    const [investmentBase, setInvestmentBase] = useState<"BRUTO" | "SOBRA">("SOBRA")

    const fetchProfile = useCallback(async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("investimento_percentual, investimento_base")
                .eq("user_id", user.id)
                .single()

            if (error && error.code !== "PGRST116") throw error

            if (data) {
                setInvestmentPercent(data.investimento_percentual?.toString() || "")
                setInvestmentBase(data.investimento_base || "SOBRA")
            }
        } catch (err) {
            console.error("Error fetching profile:", err)
        }
    }, [user])

    useEffect(() => {
        if (user) {
            fetchProfile()
        }
    }, [user, fetchProfile])

    const handleSetupCategories = async () => {
        if (!user) return

        setSetupLoading(true)
        setMessage(null)

        try {
            const categories = [
                { nome: "Alimentação", tipo: "expense", cor: "red", user_id: user.id },
                { nome: "Moradia", tipo: "expense", cor: "orange", user_id: user.id },
                { nome: "Lazer", tipo: "expense", cor: "yellow", user_id: user.id },
                { nome: "Salário", tipo: "income", cor: "green", user_id: user.id },
                { nome: "Investimento", tipo: "expense", cor: "purple", user_id: user.id },
            ]

            const { data: existing } = await supabase
                .from("categories")
                .select("nome")
                .eq("user_id", user.id)

            const existingNames = new Set(existing?.map(c => c.nome))

            const toInsert = categories.filter(c => !existingNames.has(c.nome))

            if (toInsert.length === 0) {
                setMessage({ type: "success", text: "Todas as categorias padrão já existem." })
                return
            }

            const { error } = await supabase.from("categories").insert(toInsert)

            if (error) throw error

            setMessage({ type: "success", text: "Categorias criadas com sucesso!" })
        } catch (err: unknown) {
            console.error("Error creating categories:", err)
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
            setMessage({ type: "error", text: "Erro ao criar categorias: " + errorMessage })
        } finally {
            setSetupLoading(false)
        }
    }

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            const updates = {
                user_id: user.id,
                investimento_percentual: parseFloat(investmentPercent),
                investimento_base: investmentBase,
                updated_at: new Date(),
            }

            const { error } = await supabase
                .from("profiles")
                .upsert(updates, { onConflict: "user_id" })

            if (error) throw error

            toast({
                title: "Sucesso!",
                description: "Configurações salvas com sucesso.",
                className: "bg-green-500 text-white border-none",
            })
        } catch (err: unknown) {
            console.error("Error saving settings:", err)
            toast({
                title: "Erro",
                description: "Erro ao salvar configurações.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Configurações</h1>

            

            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle>Investimentos</CardTitle>
                    <CardDescription>
                        Defina suas metas de investimento.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="percent">Porcentagem de Investimento (%)</Label>
                            <Input
                                id="percent"
                                type="number"
                                placeholder="Ex: 20"
                                value={investmentPercent}
                                onChange={(e) => setInvestmentPercent(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="base">Base de Cálculo</Label>
                            <Select value={investmentBase} onValueChange={(val: "BRUTO" | "SOBRA") => setInvestmentBase(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BRUTO">Sobre a Receita Bruta</SelectItem>
                                    <SelectItem value="SOBRA">Sobre a Sobra (Receita - Despesa)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Configurações
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <SecuritySettings />

            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        Aplicativo Mobile
                    </CardTitle>
                    <CardDescription>
                        Instale o app para acesso rápido e melhor experiência.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isStandalone ? (
                        <div className="flex items-center gap-2 rounded-lg px-4 py-3 bg-emerald-500/10 text-emerald-600">
                            <CheckCircle className="h-5 w-5" />
                            <span>O aplicativo já está instalado neste dispositivo.</span>
                        </div>
                    ) : (
                        <Button
                            onClick={installApp}
                            disabled={!isInstallable}
                            className="w-full sm:w-auto gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Instalar App na Tela Inicial
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Instalar no iPhone/iPad</DialogTitle>
                        <DialogDescription>
                            Siga os passos abaixo para adicionar o app à sua tela inicial.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <Share className="h-4 w-4" />
                            <span>Toque no ícone de Compartilhar</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <PlusSquare className="h-4 w-4" />
                            <span>Role para baixo e selecione Adicionar à Tela de Início</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4" />
                            <span>Confirme clicando em Adicionar</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowIOSInstructions(false)}>Entendi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="rounded-xl border-border/50 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle>Configuração Inicial</CardTitle>
                    <CardDescription>
                        Ferramentas para configurar sua conta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Clique no botão abaixo para criar as categorias padrão (Alimentação, Moradia, Lazer, Salário, Investimento).
                    </p>

                    {message && (
                        <Alert variant={message.type === "success" ? "default" : "destructive"} className={message.type === "success" ? "border-emerald-500/50 text-emerald-600 bg-emerald-500/10" : ""}>
                            {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            <AlertTitle>{message.type === "success" ? "Sucesso" : "Erro"}</AlertTitle>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    <Button onClick={handleSetupCategories} disabled={setupLoading} variant="outline">
                        {setupLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Criar Categorias Padrão
                    </Button>
                </CardContent>
            </Card>
            <Card className="border-destructive/30 bg-destructive/5 shadow-sm rounded-xl">
                <CardHeader>
                    <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription>
                        Ações irreversíveis ou críticas para sua conta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                        <div className="space-y-1">
                            <p className="font-medium text-destructive">Excluir Conta</p>
                            <p className="text-sm text-muted-foreground">
                                Sua conta será suspensa por 30 dias antes da exclusão permanente.
                            </p>
                        </div>
                        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">Excluir Conta</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Tem certeza absoluta?</DialogTitle>
                                    <DialogDescription>
                                        Essa ação agendará a exclusão da sua conta. Você perderá o acesso imediatamente e seus dados serão apagados permanentemente após 30 dias.
                                        <br /><br />
                                        Você pode cancelar a exclusão fazendo login novamente dentro desse período.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                                    <Button variant="destructive" onClick={handleScheduleDeletion} disabled={deleteLoading}>
                                        {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Sim, excluir minha conta
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}

