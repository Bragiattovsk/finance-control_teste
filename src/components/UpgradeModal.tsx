import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Check, Rocket } from "lucide-react"
import { useCheckout } from "@/hooks/useCheckout"

interface UpgradeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
    const benefits = [
        "Criação de Múltiplos Projetos/Empresas",
        "Visão Global (Analytics) da sua Holding",
        "Gestão separada de Metas e Recorrências",
        "(Em breve) Cálculo Automático de Impostos",
    ]

    const { handleSubscribe, loading } = useCheckout()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Rocket className="h-6 w-6 text-primary" />
                        Desbloqueie o Poder Profissional
                    </DialogTitle>
                    <DialogDescription>
                        Leve sua gestão financeira para o próximo nível com o plano PRO.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <ul className="space-y-3">
                        {benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                                    <Check className="h-3 w-3 text-primary" />
                                </div>
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubscribe} disabled={loading} className="w-full text-lg font-semibold" size="lg">
                        {loading ? 'Redirecionando para o Stripe...' : 'Fazer Upgrade Agora'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
