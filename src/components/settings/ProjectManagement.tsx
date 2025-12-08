import { useState, useEffect } from "react"
import { useProject } from "@/contexts/project-hooks"
import { useAuth } from "@/contexts/auth-hooks"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { NewProjectModal } from "@/components/NewProjectModal"
import { UpgradeModal } from "@/components/UpgradeModal"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, Save, FolderOpen, PlusCircle } from "lucide-react"

export function ProjectManagement({ id }: { id?: string }) {
    const { projects, selectedProject, selectProject, refreshProjects } = useProject()
    const { profile } = useAuth()
    const { toast } = useToast()
    
    // State to track editing values: { [projectId]: "new name" }
    const [editValues, setEditValues] = useState<Record<string, string>>({})
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    
    // Delete state
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Modal states
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

    // Initialize edit values when projects change
    useEffect(() => {
        const initialValues: Record<string, string> = {}
        projects.forEach(p => {
            initialValues[p.id] = p.name
        })
        setEditValues(initialValues)
    }, [projects])

    const handleNewProject = () => {
        if (profile?.subscription_tier === 'FREE') {
            setIsUpgradeModalOpen(true)
        } else {
            setIsNewProjectModalOpen(true)
        }
    }

    const handleNameChange = (id: string, newName: string) => {
        setEditValues(prev => ({ ...prev, [id]: newName }))
    }

    const handleUpdate = async (id: string) => {
        const newName = editValues[id]
        if (!newName || newName.trim() === "") return
        
        // Find original project to check if name actually changed
        const project = projects.find(p => p.id === id)
        if (project && project.name === newName) return

        setUpdatingId(id)
        try {
            const { error } = await supabase
                .from('projects')
                .update({ name: newName })
                .eq('id', id)

            if (error) throw error

            toast({
                title: "Projeto atualizado",
                description: "O nome do projeto foi alterado com sucesso.",
                className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
            })
            
            await refreshProjects()
        } catch (error) {
            console.error("Error updating project:", error)
            toast({
                title: "Erro ao atualizar",
                description: "Não foi possível salvar as alterações.",
                variant: "destructive",
            })
        } finally {
            setUpdatingId(null)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', deleteId)

            if (error) throw error

            // Handle active project deletion logic
            if (selectedProject?.id === deleteId) {
                // Find next available project that isn't the one being deleted
                const nextProject = projects.find(p => p.id !== deleteId) || null
                selectProject(nextProject)
            }

            toast({
                title: "Projeto excluído",
                description: "O projeto e seus dados foram removidos.",
            })

            await refreshProjects()
        } catch (error) {
            console.error("Error deleting project:", error)
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível remover o projeto.",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
            setDeleteId(null)
        }
    }

    // Always render, but empty list state handled below
    const hasProjects = projects.length > 0

    return (
        <>
            <Card id={id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5 text-primary" />
                            <CardTitle>Gerenciar Projetos</CardTitle>
                        </div>
                        <CardDescription>
                            Crie, renomeie ou remova seus projetos.
                        </CardDescription>
                    </div>
                    <Button onClick={handleNewProject} size="sm" className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Novo Projeto
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!hasProjects ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                            Nenhum projeto criado ainda.
                        </div>
                    ) : (
                        projects.map((project) => {
                            const originalName = project.name
                            const currentName = editValues[project.id] ?? originalName
                            const hasChanged = currentName !== originalName && currentName.trim() !== ""
                            
                            return (
                                <div key={project.id} className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Input 
                                            value={currentName}
                                            onChange={(e) => handleNameChange(project.id, e.target.value)}
                                            placeholder="Nome do projeto"
                                        />
                                    </div>
                                    
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={hasChanged ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" : "text-muted-foreground"}
                                        onClick={() => handleUpdate(project.id)}
                                        disabled={!hasChanged || updatingId === project.id}
                                    >
                                        {updatingId === project.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                        onClick={() => setDeleteId(project.id)}
                                        disabled={updatingId === project.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </Card>

            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
            />

            <UpgradeModal
                open={isUpgradeModalOpen}
                onOpenChange={setIsUpgradeModalOpen}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto
                            <span className="font-semibold text-foreground"> "{projects.find(p => p.id === deleteId)?.name}" </span>
                            e todas as suas transações, categorias e metas associadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                "Sim, excluir projeto"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
