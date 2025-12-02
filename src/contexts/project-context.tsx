import { createContext } from "react"
import { Project } from "@/types"

interface ProjectContextType {
    projects: Project[];
    selectedProject: Project | null;
    loading: boolean;
    selectProject: (project: Project | null) => void;
    createProject: (name: string, color?: string) => Promise<void>;
    refreshProjects: () => Promise<void>;
}

export const ProjectContext = createContext<ProjectContextType>({
    projects: [],
    selectedProject: null,
    loading: true,
    selectProject: () => { },
    createProject: async () => { },
    refreshProjects: async () => { },
});