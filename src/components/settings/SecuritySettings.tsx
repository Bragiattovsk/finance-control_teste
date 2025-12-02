import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function SecuritySettings() {
  const { toast } = useToast()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem', variant: 'destructive' })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter ao menos 6 caracteres', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Senha atualizada com sucesso!' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível atualizar a senha'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-xl border-border/50 bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Segurança</CardTitle>
        </div>
        <CardDescription>Gerencie sua senha de acesso</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input id="new-password" type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <CardFooter className="flex justify-end p-0">
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}

