import { useState, useEffect } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { Button } from '@/components/ui/button'
import { Share, X, PlusSquare, Download } from 'lucide-react'

export function PWAInstallPrompt() {
    const { supportsPWA, promptInstall, isIOS, isStandalone } = usePWAInstall()
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const dismissed = localStorage.getItem('pwa_dismissed')
        if (!dismissed) {
            setIsVisible(true)
        }
    }, [])

    if (isStandalone) return null
    if (!isVisible) return null

    const handleDismiss = () => {
        localStorage.setItem('pwa_dismissed', 'true')
        setIsVisible(false)
    }

    if (supportsPWA) {
        return (
            <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-4 rounded-xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-10 md:left-auto md:right-4 md:bottom-4 md:w-[400px]">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-white">Instalar Aplicativo</h3>
                        <p className="text-sm text-zinc-400">
                            Instale o Finance Control para uma experiência melhor.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-zinc-400 hover:text-white"
                        onClick={handleDismiss}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <Button 
                    onClick={promptInstall}
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                    <Download className="h-4 w-4" />
                    Instalar App
                </Button>
            </div>
        )
    }

    if (isIOS) {
        return (
            <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-4 rounded-xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-10 md:left-auto md:right-4 md:bottom-4 md:w-[400px]">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-white">Instalar no iPhone</h3>
                        <p className="text-sm text-zinc-400">
                            Adicione à tela de início para melhor experiência.
                        </p>
                    </div>
                </div>
                
                <div className="space-y-3 text-sm text-zinc-300">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800">
                            <Share className="h-4 w-4 text-blue-400" />
                        </div>
                        <span>Toque no botão <strong>Compartilhar</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800">
                            <PlusSquare className="h-4 w-4 text-zinc-400" />
                        </div>
                        <span>Selecione <strong>Adicionar à Tela de Início</strong></span>
                    </div>
                </div>

                <Button 
                    onClick={handleDismiss}
                    variant="secondary"
                    className="w-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                >
                    Entendi, vou fazer depois
                </Button>
            </div>
        )
    }

    return null
}
