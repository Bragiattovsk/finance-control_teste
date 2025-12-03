import React, { useEffect, useState } from 'react'
import { PWAContext } from '@/contexts/pwa-context'

declare global {
  interface Navigator {
    standalone?: boolean
  }
  interface Window {
    MSStream?: unknown
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

// context definido em '@/contexts/pwa-context'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // 1. Detectar se é iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // 2. Detectar se já está instalado (Standalone)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
    setIsStandalone(isInStandaloneMode)

    // 3. Capturar evento do Chrome/Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const installApp = () => {
    if (isIOS) {
      setShowIOSInstructions(true)
    } else if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed'; platform: string }) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null)
        }
      })
    }
  }

  // É instalável se tivermos o prompt guardado OU se for iOS (manual) e não estiver instalado
  const isInstallable = !!deferredPrompt || (isIOS && !isStandalone)

  return (
    <PWAContext.Provider
      value={{ isInstallable, isStandalone, isIOS, installApp, showIOSInstructions, setShowIOSInstructions }}
    >
      {children}
    </PWAContext.Provider>
  )
}

// hook movido para '@/hooks/use-pwa'

