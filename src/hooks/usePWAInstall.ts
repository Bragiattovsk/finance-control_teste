import { useEffect, useRef, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface Window {
    MSStream?: unknown
  }
}

export function usePWAInstall() {
  const [supportsPWA, setSupportsPWA] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setSupportsPWA(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)
  }, [])

  const promptInstall = useCallback(async () => {
    const evt = deferredPromptRef.current
    if (!evt) return
    await evt.prompt()
    try {
      await evt.userChoice
    } finally {
      deferredPromptRef.current = null
    }
  }, [])

  return { supportsPWA, promptInstall, isIOS, isStandalone }
}

