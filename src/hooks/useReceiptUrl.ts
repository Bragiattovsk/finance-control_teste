import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export function useReceiptUrl(path?: string | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const cacheRef = useRef<Record<string, { url: string; expiresAt: number }>>({})

  const getSignedUrl = useCallback(async (p: string): Promise<string | null> => {
    setLoading(true)
    setError(null)
    try {
      const cached = cacheRef.current[p]
      const now = Date.now()
      if (cached && cached.expiresAt > now) {
        setUrl(cached.url)
        return cached.url
      }

      const { data: signedData, error } = await supabase.storage.from('receipts').createSignedUrl(p, 60 * 60)
      if (error) throw error
      const signed = signedData?.signedUrl ?? null
      if (signed) {
        cacheRef.current[p] = { url: signed, expiresAt: now + 60 * 60 * 1000 }
      }
      setUrl(signed)
      return signed
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao gerar URL do comprovante'
      setError(msg)
      setUrl(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (path) {
      void getSignedUrl(path)
    } else {
      setUrl(null)
    }
  }, [path, getSignedUrl])

  return { url, loading, error, getSignedUrl }
}

