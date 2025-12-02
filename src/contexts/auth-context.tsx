import { createContext } from "react"
import { Session, User } from "@supabase/supabase-js"
import { Profile } from "@/types"

interface AuthContextType {
    session: Session | null
    user: User | null
    profile: Profile | null
    loading: boolean
    isDeletionScheduled: boolean
    deletionDate: string | null
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    isDeletionScheduled: false,
    deletionDate: null,
    signOut: async () => { },
    refreshProfile: async () => { },
})