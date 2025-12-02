import { useState } from 'react'
import { MessageSquare, Loader2, Bug, Lightbulb, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useFeedback, FeedbackType } from '@/hooks/useFeedback'
import { useToast } from '@/hooks/use-toast'

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const { sendFeedback, loading } = useFeedback()
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!message.trim()) return

    await sendFeedback({
      type,
      message,
    })

    setOpen(false)
    setMessage('')
    setType('bug')
    toast({
      title: "Feedback enviado!",
      description: "Obrigado por nos ajudar a melhorar a plataforma.",
      className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    })
  }

  const isValid = message.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Tipo de Feedback</Label>
            <Select
              value={type}
              onValueChange={(value: FeedbackType) => setType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">
                    <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4 text-red-500" />
                        <span>Reportar Bug</span>
                    </div>
                </SelectItem>
                <SelectItem value="idea">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <span>Sugestão</span>
                    </div>
                </SelectItem>
                <SelectItem value="other">
                    <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-rose-500" />
                        <span>Elogio</span>
                    </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Mensagem</Label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder="Descreva detalhadamente..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
