import { useState, useEffect, useRef, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2, LogOut, Camera, User, Mail, CreditCard, Sparkles, Settings as SettingsIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
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
import { Download, Share, PlusSquare, Smartphone } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatarUpload } from "@/hooks/useAvatarUpload"
import { Badge } from "@/components/ui/badge"
import { UpgradeModal } from "@/components/UpgradeModal"
import { ProjectManagement } from "@/components/settings/ProjectManagement"

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
    const { user, profile, signOut, refreshProfile } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    const { isStandalone, installApp, isInstallable } = usePWA()
    const { uploadAvatar, isUploading: isAvatarUploading } = useAvatarUpload()
    
    const [loading, setLoading] = useState(false)
    const [setupLoading, setSetupLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // Subscription State
    const [isPortalLoading, setIsPortalLoading] = useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

    // Profile Form State
    const [fullName, setFullName] = useState("")
    const [isProfileSaving, setIsProfileSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [avatarVersion, setAvatarVersion] = useState(Date.now())

    // Investment Settings State
    const [investmentPercent, setInvestmentPercent] = useState("")
    const [investmentBase, setInvestmentBase] = useState<"BRUTO" | "SOBRA">("SOBRA")

    // Lógica para extrair as iniciais de forma segura
    const userInitials = useMemo(() => {
        const name = profile?.full_name;
        const email = user?.email;
        if (name && name.trim().length > 0) {
            return name.charAt(0).toUpperCase();
        }
        if (email && email.trim().length > 0) {
            return email.charAt(0).toUpperCase();
        }
        return '?'; // Fallback final
    }, [profile?.full_name, user?.email]);

    const safeAvatarUrl = useMemo(() => {
        if (profile?.avatar_url && profile.avatar_url.trim() !== "") {
            return `${profile.avatar_url}?v=${avatarVersion}`;
        }
        return null;
    }, [profile?.avatar_url, avatarVersion]);

    // Initialize form data from profile
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "")
            setInvestmentPercent(profile.investimento_percentual?.toString() || "")
            setInvestmentBase(profile.investimento_base || "SOBRA")
        }
    }, [profile])

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            await uploadAvatar(file)
            setAvatarVersion(Date.now()) // Force refresh
            toast({
                title: "Foto atualizada!",
                description: "Seu avatar foi alterado com sucesso.",
                className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
            })
        } catch (error) {
            console.error("Error uploading avatar:", error)
            toast({
                title: "Erro no upload",
                description: "Não foi possível atualizar a foto.",
                variant: "destructive",
            })
        }
    }

    const handleSaveProfile = async () => {
        if (!user) return
        setIsProfileSaving(true)
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ full_name: fullName })
                .eq("user_id", user.id)

            if (error) throw error

            await refreshProfile()
            
            toast({
                title: "Perfil atualizado!",
                description: "Seus dados foram salvos com sucesso.",
                className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
            })
        } catch (error) {
            console.error("Error updating profile:", error)
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível atualizar o perfil.",
                variant: "destructive",
            })
        } finally {
            setIsProfileSaving(false)
        }
    }

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

    const handleSignOut = async () => {
        try {
            await signOut()
            navigate("/login")
        } catch (error) {
            console.error("Error signing out:", error)
            toast({
                variant: "destructive",
                title: "Erro ao sair",
                description: "Não foi possível encerrar a sessão. Tente novamente."
            })
        }
    }

    const handleSetupCategories = async () => {
        if (!user) return
        setSetupLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.rpc("setup_default_categories", {
                user_uuid: user.id,
            })

            if (error) throw error

            setMessage({
                type: "success",
                text: "Categorias padrão criadas com sucesso!",
            })
            toast({
                title: "Sucesso",
                description: "Categorias padrão configuradas!",
            })
        } catch (error) {
            console.error("Error setting up categories:", error)
            setMessage({
                type: "error",
                text: "Erro ao criar categorias. Tente novamente.",
            })
            toast({
                title: "Erro",
                description: "Falha ao configurar categorias.",
                variant: "destructive",
            })
        } finally {
            setSetupLoading(false)
        }
    }

    const handleSaveInvestmentSettings = async () => {
        if (!user) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from("profiles")
                .upsert({
                    user_id: user.id,
                    investimento_percentual: investmentPercent ? parseFloat(investmentPercent) : null,
                    investimento_base: investmentBase,
                })

            if (error) throw error
            
            await refreshProfile()

            toast({
                title: "Configurações salvas!",
                description: "Preferências de investimento atualizadas.",
                className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
            })
        } catch (error) {
            console.error("Error saving settings:", error)
            toast({
                title: "Erro",
                description: "Falha ao salvar configurações.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleManageSubscription = async () => {
        setIsPortalLoading(true)
        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session', {
                body: { returnUrl: window.location.href }
            })

            if (error) throw error

            if (data?.url) {
                window.location.href = data.url
            } else {
                throw new Error("URL do portal não retornada")
            }
        } catch (error) {
            console.error("Error opening portal:", error)
            toast({
                title: "Erro ao abrir portal",
                description: "Não foi possível redirecionar para o gerenciamento de assinatura.",
                variant: "destructive"
            })
        } finally {
            setIsPortalLoading(false)
        }
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in duration-500 pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Configurações da Conta</h2>
                <p className="text-muted-foreground">
                    Gerencie suas informações pessoais e preferências.
                </p>
            </div>

            {/* Section 1: Public Profile */}
            <Card>
                <CardHeader>
                    <CardTitle>Perfil Público</CardTitle>
                    <CardDescription>
                        Sua foto e informações visíveis para você.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 ring-4 ring-purple-500/20">
                            {safeAvatarUrl && (
                                <AvatarImage 
                                    src={safeAvatarUrl} 
                                    alt="Foto de Perfil" 
                                    className="object-cover"
                                />
                            )}
                            <AvatarFallback className="flex h-full w-full items-center justify-center bg-purple-600 text-4xl font-bold text-white delay-0">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="absolute bottom-0 right-0 rounded-full shadow-lg hover:scale-105 transition-transform"
                            onClick={handleAvatarClick}
                            disabled={isAvatarUploading}
                        >
                            {isAvatarUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Camera className="h-4 w-4" />
                            )}
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="text-center">
                        <h3 className="font-medium text-lg">{profile?.full_name || "Usuário"}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Section 2: Personal Data */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados Pessoais</CardTitle>
                    <CardDescription>
                        Atualize seu nome e informações de identificação.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nome de Exibição</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="fullName"
                                placeholder="Seu nome completo"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                value={user?.email || ""}
                                disabled
                                className="pl-9 bg-muted/50"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            O e-mail não pode ser alterado.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <Button onClick={handleSaveProfile} disabled={isProfileSaving} className="ml-auto">
                        {isProfileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </CardFooter>
            </Card>

            <SecuritySettings />

            {/* Investment Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Metas de Investimento</CardTitle>
                    <CardDescription>
                        Defina quanto você quer investir mensalmente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Percentual Ideal (%)</Label>
                            <Input
                                type="number"
                                placeholder="Ex: 20"
                                value={investmentPercent}
                                onChange={(e) => setInvestmentPercent(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Base de Cálculo</Label>
                            <Select
                                value={investmentBase}
                                onValueChange={(value: "BRUTO" | "SOBRA") => setInvestmentBase(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BRUTO">Sobre Renda Bruta</SelectItem>
                                    <SelectItem value="SOBRA">Sobre a Sobra</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                     <Button onClick={handleSaveInvestmentSettings} disabled={loading} className="ml-auto">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Preferências
                    </Button>
                </CardFooter>
            </Card>

            <ProjectManagement id="project-management" />

            {/* Subscription Settings */}
            <Card className={profile?.subscription_tier === 'PRO' ? "border-primary/20 bg-primary/5" : ""}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                {profile?.subscription_tier === 'PRO' ? (
                                    <>
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        Assinatura Ativa
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-5 w-5" />
                                        Assinatura
                                    </>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {profile?.subscription_tier === 'PRO' 
                                    ? "Gerencie seu plano e informações de pagamento."
                                    : "Desbloqueie recursos ilimitados com o Plano PRO."
                                }
                            </CardDescription>
                        </div>
                        {profile?.subscription_tier === 'PRO' && (
                            <Badge className="bg-primary hover:bg-primary/90">Plano PRO</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {profile?.subscription_tier === 'PRO' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Você tem acesso a todos os recursos premium, incluindo relatórios avançados, categorias ilimitadas e gestão de múltiplos contextos.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Aproveite todo o potencial do Lumie Finance.
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    Relatórios avançados e exportação
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    Categorias ilimitadas
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    Gestão de múltiplos contextos
                                </li>
                            </ul>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="border-t pt-6">
                    {profile?.subscription_tier === 'PRO' ? (
                        <Button 
                            variant="outline" 
                            onClick={handleManageSubscription} 
                            disabled={isPortalLoading} 
                            className="ml-auto gap-2"
                        >
                            {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SettingsIcon className="h-4 w-4" />}
                            Gerenciar Assinatura / Cancelar
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => setIsUpgradeModalOpen(true)} 
                            className="ml-auto gap-2 bg-primary hover:bg-primary/90"
                        >
                            <Sparkles className="h-4 w-4" />
                            Fazer Upgrade
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <UpgradeModal 
                open={isUpgradeModalOpen} 
                onOpenChange={setIsUpgradeModalOpen} 
            />

             {/* PWA Install Card */}
             {!isStandalone && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Smartphone className="h-5 w-5" />
                            Aplicativo
                        </CardTitle>
                        <CardDescription>
                            Instale o Lumie para acesso rápido.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isInstallable ? (
                            <Button onClick={installApp} className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90">
                                <Download className="h-4 w-4" />
                                Instalar Agora
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Para instalar no iOS (iPhone/iPad):
                                </p>
                                <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground ml-2">
                                    <li className="flex items-center gap-2">
                                        Toque no botão de compartilhamento <Share className="h-4 w-4" />
                                    </li>
                                    <li className="flex items-center gap-2">
                                        Role para baixo e toque em "Adicionar à Tela de Início" <PlusSquare className="h-4 w-4" />
                                    </li>
                                </ol>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* System Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Sistema</CardTitle>
                    <CardDescription>
                        Configurações avançadas e zona de perigo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {message && (
                        <Alert variant={message.type === "success" ? "default" : "destructive"}>
                            {message.type === "success" ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertTitle>{message.type === "success" ? "Sucesso" : "Erro"}</AlertTitle>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Categorias Padrão</Label>
                                <p className="text-sm text-muted-foreground">
                                    Restaurar categorias essenciais.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleSetupCategories} disabled={setupLoading}>
                                {setupLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Restaurar
                            </Button>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
                            <div className="space-y-0.5">
                                <Label className="text-base text-red-600 dark:text-red-400">Excluir Conta</Label>
                                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                                    Ação irreversível após 30 dias.
                                </p>
                            </div>
                            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" size="sm">Excluir</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Tem certeza absoluta?</DialogTitle>
                                        <DialogDescription>
                                            Esta ação agendará a exclusão da sua conta em 30 dias.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                                        <Button variant="destructive" onClick={handleScheduleDeletion} disabled={deleteLoading}>
                                            {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Confirmar
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Session Settings - Logout */}
            <Card className="border-red-100 dark:border-red-900/20">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                        <LogOut className="h-5 w-5" />
                        Sessão
                    </CardTitle>
                    <CardDescription>
                        Encerrar sua sessão neste dispositivo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        variant="destructive" 
                        className="w-full sm:w-auto gap-2" 
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-4 w-4" />
                        Sair da Conta
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
