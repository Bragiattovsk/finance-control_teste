import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { Session, User } from "@supabase/supabase-js"
import { useNavigate, Navigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Profile } from "@/types"
import { AuthContext } from "./auth-context"
import { useAuth } from "./auth-hooks"
import posthog from "posthog-js"

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDeletionScheduled, setIsDeletionScheduled] = useState(false)
    const [deletionDate, setDeletionDate] = useState<string | null>(null)
    const navigate = useNavigate()

    // Ref to track user for onAuthStateChange listener (avoids stale closure)
    const userRef = useRef<User | null>(null)

    useEffect(() => {
        userRef.current = user
    }, [user])

    const fetchProfileData = useCallback(async (userId: string) => {
        try {
            const { data: profileData, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", userId)
                .single()

            if (error) {
                if (import.meta.env.DEV) {
                    console.error("DEV ERROR: Error fetching profile:", error)
                } else {
                    console.error("Erro ao carregar perfil do usuário.")
                }
                return null
            }

            return profileData as Profile
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("DEV ERROR: Error in fetchProfileData:", error)
            } else {
                console.error("Erro ao carregar perfil do usuário.")
            }
            return null
        }
    }, [])

    useEffect(() => {
        let mounted = true

        async function getSession() {
            setLoading(true)

            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) throw error

                if (session?.user) {
                    const profileData = await fetchProfileData(session.user.id)

                    if (mounted) {
                        if (profileData) {
                            setProfile(profileData)

                            // Identify user in PostHog
                            posthog.identify(session.user.id, {
                                email: session.user.email,
                                plan: profileData.subscription_tier || 'FREE',
                                name: profileData.full_name
                            });

                            // Check suspension
                            if (profileData.deletion_scheduled_at) {
                                const deletionDate = new Date(profileData.deletion_scheduled_at)
                                if (deletionDate > new Date()) {
                                    setIsDeletionScheduled(true)
                                    setDeletionDate(profileData.deletion_scheduled_at)
                                } else {
                                    setIsDeletionScheduled(false)
                                    setDeletionDate(null)
                                }
                            } else {
                                setIsDeletionScheduled(false)
                                setDeletionDate(null)
                            }
                        }
                        setUser(session.user)
                        setSession(session)
                    }
                } else {
                    if (mounted) {
                        setSession(null)
                        setIsDeletionScheduled(false)
                        setDeletionDate(null)
                    }
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }

        getSession()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, _session) => {
            
            
            if (_event === "PASSWORD_RECOVERY") {
                window.location.href = '/update-password'; 
                return; 
            }

            if ((_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED") && _session?.user?.id === userRef.current?.id) {
                setSession(_session)
                return
            }

            if (_event === "SIGNED_OUT") {
                setIsDeletionScheduled(false)
                setDeletionDate(null)
                setUser(null)
                setSession(null)
                setProfile(null)
                setLoading(false)
            } else if (_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED") {
                getSession()
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [fetchProfileData])

    const signOut = useCallback(async () => {
        try {
            posthog.reset()
            await supabase.auth.signOut()
        } catch (error) {
            console.error("Erro ao realizar logout no servidor:", error)
        } finally {
            setIsDeletionScheduled(false)
            setDeletionDate(null)
            setUser(null)
            setSession(null)
            setProfile(null)
            localStorage.removeItem("finance_app_last_activity")
            navigate("/login")
        }
    }, [navigate])

    const refreshProfile = useCallback(async () => {
        if (!user) return

        const profileData = await fetchProfileData(user.id)
        if (profileData) {
            setProfile(profileData)
        }
    }, [user, fetchProfileData])

    const value = useMemo(() => ({
        session,
        user,
        profile,
        loading,
        isDeletionScheduled,
        deletionDate,
        signOut,
        refreshProfile
    }), [session, user, profile, loading, isDeletionScheduled, deletionDate, signOut, refreshProfile])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}


export function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Carregando...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

export function ActiveAccountRoute({ children }: { children: React.ReactNode }) {
    const { user, loading, isDeletionScheduled } = useAuth()

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Carregando...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (isDeletionScheduled) {
        return <Navigate to="/recovery" replace />
    }

    return <>{children}</>
}
