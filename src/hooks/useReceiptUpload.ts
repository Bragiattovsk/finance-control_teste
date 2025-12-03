import { useState, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-hooks'

export function useReceiptUpload() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadReceipt = useCallback(async (file: File, transactionId?: string) => {
    setIsUploading(true)
    setError(null)

    try {
      if (!user) throw new Error('Usuário não autenticado')

      const mime = file.type
      let blob: Blob = file

      if (mime.startsWith('image/')) {
        blob = await imageCompression(file, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        })
      } else if (mime === 'application/pdf') {
        if (file.size > 2 * 1024 * 1024) {
          throw new Error('PDF deve ter no máximo 2MB')
        }
        blob = file
      } else {
        throw new Error('Formato não suportado. Envie imagem (jpg, png, webp) ou PDF.')
      }

      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`
      const path = `${user.id}/${transactionId || 'temp'}/${fileName}`

      const { error: uploadError } = await supabase
        .storage
        .from('receipts')
        .upload(path, blob, { contentType: blob.type })

      if (uploadError) throw uploadError

      return path
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao enviar comprovante'
      setError(message)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [user])

  return { uploadReceipt, isUploading, error }
}

