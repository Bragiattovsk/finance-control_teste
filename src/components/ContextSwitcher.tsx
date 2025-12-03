import { useState } from "react"
import { useProject } from "@/contexts/ProjectContext"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator
} from "@/components/ui/select"
import { NewProjectModal } from "@/components/NewProjectModal"
import { UpgradeModal } from "@/components/UpgradeModal"
import { useAuth } from "@/contexts/auth-hooks"
import { PlusCircle, User, Lock } from "lucide-react"

export function ContextSwitcher({ className }: { className?: string }) {
    const { projects, selectedProject, selectProject } = useProject()
    const { profile } = useAuth()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

    const handleValueChange = (value: string) => {
        if (value === "new_project") {
            if (profile?.subscription_tier === 'FREE') {
                setIsUpgradeModalOpen(true)
            } else {
                setIsModalOpen(true)
            }
            return
        }

        if (value === "personal") {
            selectProject(null)
        } else {
            // Check if user is FREE and trying to access a project
            if (profile?.subscription_tier === 'FREE') {
                setIsUpgradeModalOpen(true)
                return
            }

            const project = projects.find((p) => p.id === value)
            selectProject(project || null)
        }
    }

    // Value for the Select component
    const currentValue = selectedProject ? selectedProject.id : "personal"

    return (
        <>
            <Select value={currentValue} onValueChange={handleValueChange}>
                <SelectTrigger className={`w-full ${className}`}>
                    <SelectValue placeholder="Selecione o contexto" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="personal">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Minhas Finanças</span>
                        </div>
                    </SelectItem>

                    {projects.length > 0 && <SelectSeparator />}

                    {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                            <div className={`flex items-center gap-2 ${profile?.subscription_tier === 'FREE' ? 'opacity-50 text-muted-foreground' : ''}`}>
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: project.color || "#ccc" }}
                                />
                                <span>{project.name}</span>
                                {profile?.subscription_tier === 'FREE' && (
                                    <Lock className="h-3 w-3 ml-auto" />
                                )}
                            </div>
                        </SelectItem>
                    ))}

                    <SelectSeparator />

                    <SelectItem value="new_project" className="text-primary focus:text-primary font-medium cursor-pointer">
                        <div className="flex items-center gap-2">
                            <PlusCircle className="h-4 w-4" />
                            <span>Novo Projeto</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>

            <NewProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <UpgradeModal
                open={isUpgradeModalOpen}
                onOpenChange={setIsUpgradeModalOpen}
            />
        </>
    )
}
