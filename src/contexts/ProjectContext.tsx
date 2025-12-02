import { useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-hooks";
import { Project } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ProjectContext } from "./project-context";

export { useProject } from "./project-hooks";

export function ProjectProvider({ children }: { children: ReactNode }) {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    // Security Check: Force FREE users out of paid projects
    useEffect(() => {
        if (profile?.subscription_tier === 'FREE' && selectedProject !== null) {
            setSelectedProject(null);
            toast({
                title: "Plano Expirado",
                description: "Seu plano expirou. Voltando para o perfil Pessoal.",
                variant: "destructive",
            });
        }
    }, [profile, selectedProject, toast]);

    const fetchProjects = useCallback(async () => {
        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            setProjects(data || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProjects();
    }, [user, fetchProjects]);

    const selectProject = (project: Project | null) => {
        setSelectedProject(project);
    };

    const createProject = async (name: string, color?: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from("projects")
                .insert([
                    {
                        name,
                        color,
                        user_id: user.id,
                    },
                ]);

            if (error) throw error;

            await fetchProjects();
        } catch (error) {
            console.error("Error creating project:", error);
            throw error;
        }
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                selectedProject,
                loading,
                selectProject,
                createProject,
                refreshProjects: fetchProjects,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}
