import { createContext } from 'react'

export interface PWAContextType {
  isInstallable: boolean
  isStandalone: boolean
  isIOS: boolean
  installApp: () => void
  showIOSInstructions: boolean
  setShowIOSInstructions: (show: boolean) => void
}

export const PWAContext = createContext({} as PWAContextType)

