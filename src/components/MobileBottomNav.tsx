import { NavLink } from "react-router-dom"
import { Home, List, Plus, TrendingUp, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileBottomNavProps {
    onOpenNewTransaction: () => void
}

export function MobileBottomNav({ onOpenNewTransaction }: MobileBottomNavProps) {
    const navItems = [
        {
            label: "Início",
            path: "/",
            icon: Home,
        },
        {
            label: "Extrato",
            path: "/transactions",
            icon: List,
        },
        {
            // Center button placeholder - handled separately
            label: "Novo",
            isAction: true,
        },
        {
            label: "Investir",
            path: "/investments",
            icon: TrendingUp,
        },
        {
            label: "Menu",
            path: "/settings",
            icon: Menu,
        },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border/50 bg-background/80 px-4 backdrop-blur-lg md:hidden">
            {navItems.map((item, index) => {
                if (item.isAction) {
                    return (
                        <button
                            key={index}
                            onClick={onOpenNewTransaction}
                            className="group relative -top-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-105 active:scale-95"
                            aria-label="Nova Transação"
                        >
                            <Plus className="h-7 w-7 text-primary-foreground" />
                        </button>
                    )
                }

                const Icon = item.icon!
                return (
                    <NavLink
                        key={item.path}
                        to={item.path!}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center gap-1 transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )
                        }
                    >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </NavLink>
                )
            })}
        </nav>
    )
}
