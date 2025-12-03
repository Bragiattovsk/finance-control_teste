import { useContext } from 'react'
import { PWAContext } from '@/contexts/pwa-context'

export const usePWA = () => useContext(PWAContext)

