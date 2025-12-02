import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'

export function BetaDisclaimerModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('beta_disclaimer_accepted')
    if (!accepted) {
      setOpen(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('beta_disclaimer_accepted', 'true')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
        // Prevent closing by clicking outside or escape if not accepted
        // Logic: If we are trying to close (newOpen === false) and we haven't accepted yet (which is implied by being open), 
        // we could block it. But for better UX let's allow closing but it won't save preference (so it reappears).
        // However, to be stricter:
        if (!newOpen) {
             // Optional: Prevent closing if you want to force acceptance.
             // For now, I will allow closing but NOT save the preference, meaning it will show again on reload.
             setOpen(false);
        }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-6 w-6" />
            Versão de Testes (Beta)
          </DialogTitle>
          <DialogDescription className="pt-4 text-base leading-relaxed text-foreground/90">
            Este é um ambiente de testes. Funcionalidades podem mudar a qualquer momento.
            <br /><br />
            Seus dados são utilizados para aprimoramento contínuo da plataforma.
            <br />
            <span className="font-semibold text-red-500/90">Por favor, não insira dados bancários reais ou informações sensíveis críticas neste momento.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button onClick={handleAccept} className="w-full sm:w-auto">
            Entendi e Concordo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
