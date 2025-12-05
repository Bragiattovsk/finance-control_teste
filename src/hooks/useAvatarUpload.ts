import { useState, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-hooks'

export function useAvatarUpload() {
  const { user, refreshProfile } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const uploadAvatar = useCallback(async (file: File) => {
    setIsUploading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      if (!file.type.startsWith('image/')) throw new Error('Envie uma imagem válida')

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      })

      const path = `${user.id}/avatar_${Date.now()}.jpg`

      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(path, compressed, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = publicData.publicUrl
      setAvatarUrl(publicUrl)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      await refreshProfile()

      return publicUrl
    } finally {
      setIsUploading(false)
    }
  }, [user, refreshProfile])

  return { isUploading, uploadAvatar, avatarUrl }
}

