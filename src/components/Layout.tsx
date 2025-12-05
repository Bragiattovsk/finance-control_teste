import { Outlet, Link, useLocation } from "react-router-dom"
import { LayoutDashboard, DollarSign, Settings, LogOut, CalendarClock, Layers, TrendingUp, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-hooks"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { ContextSwitcher } from "@/components/ContextSwitcher"
import { ModeToggle } from "@/components/mode-toggle"
import { FeedbackWidget } from "@/components/FeedbackWidget"
import { BetaDisclaimerModal } from "@/components/BetaDisclaimerModal"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { MobileHeader } from "@/components/MobileHeader"
import { NewTransactionModal } from "@/components/NewTransactionModal"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"

export function Layout() {
    const { pathname } = useLocation()
    const { signOut, profile } = useAuth()
    const [isMobileTransactionModalOpen, setIsMobileTransactionModalOpen] = useState(false)
    const queryClient = useQueryClient()

    const handleTransactionSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['analytics'] })
        queryClient.invalidateQueries({ queryKey: ['investment'] })
    }

    const navItems = [
        { href: "/", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/analytics", icon: BarChart3, label: "Visão Global" },
        { href: "/transactions", icon: DollarSign, label: "Transações" },
        { href: "/recurrences", icon: CalendarClock, label: "Despesas Fixas" },
        { href: "/categories", icon: Layers, label: "Categorias" },
        { href: "/investments", icon: TrendingUp, label: "Investimentos" },
        { href: "/settings", icon: Settings, label: "Configurações" },
    ]

    return (
        <div className="flex min-h-screen w-full bg-background">
            {/* Sidebar */}
            <aside className="hidden w-64 flex-col border-r border-border/50 bg-zinc-900/50 px-4 py-6 md:flex backdrop-blur-xl">
                <div className="mb-6 flex items-center px-2 gap-[15px]">
                    <img 
                        src="/favicon.svg" 
                        alt="Lumie Logo" 
                        className="h-10 w-10 rounded-full object-cover shadow-md" 
                    />
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-xl font-bold text-primary">Lumie</span>
                        <span className="text-[10px] font-normal text-muted-foreground tracking-widest">FINANCE CONTROL</span>
                    </div>
                </div>
                <div className="mb-4 px-2">
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium text-muted-foreground">Seu Plano:</span>
                        {profile?.subscription_tier === 'PRO' ? (
                            <span className="px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-sm">
                                PRO 🚀
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 text-xs font-bold text-muted-foreground bg-muted rounded-full border border-border/50">
                                FREE
                            </span>
                        )}
                    </div>
                </div>

                <div className="mb-6 px-2">
                    <ContextSwitcher />
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link key={item.href} to={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-2 transition-all duration-200 rounded-lg", 
                                        isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>



                <div className="mt-auto flex items-center justify-between gap-2">
                    <Button variant="ghost" className="flex-1 justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={signOut}>
                        <LogOut className="h-4 w-4" />
                        Sair
                    </Button>
                    <ModeToggle />
                </div>
            </aside >

            <MobileHeader />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8 pb-24 md:pb-8 pt-24 md:pt-8 bg-background/50">
                <Outlet />
            </main>
            <FeedbackWidget />
            <BetaDisclaimerModal />
            <PWAInstallPrompt />
            
            <MobileBottomNav 
                onOpenNewTransaction={() => setIsMobileTransactionModalOpen(true)} 
            />
            <NewTransactionModal 
                open={isMobileTransactionModalOpen} 
                onOpenChange={setIsMobileTransactionModalOpen}
                onSuccess={handleTransactionSuccess}
            />
        </div>
    )
}
