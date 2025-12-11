import { ContextSwitcher } from "@/components/ContextSwitcher"
import { Bell, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-hooks"
import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function MobileHeader() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    const userInitials = user?.email?.substring(0, 2).toUpperCase() || "US"
    const userEmail = user?.email || "Usuário"

    const handleSignOut = async () => {
        await signOut()
        navigate("/login")
    }

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 z-40 flex items-center justify-between px-4 md:hidden">
            <div className="flex items-center gap-3 flex-1 max-w-[70%]">
                <img 
                    src="/favicon.png" 
                    alt="Lumie Logo" 
                    className="h-8 w-8 rounded-full object-cover shadow-sm" 
                />
                <div className="flex-1">
                    <ContextSwitcher className="border-transparent bg-transparent shadow-none hover:bg-accent/50 pl-0 h-9 text-base font-semibold p-0" />
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 relative">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border border-background" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4" align="end">
                        <div className="flex flex-col items-center justify-center text-center gap-2 text-muted-foreground py-4">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p className="text-sm">Sem novas notificações.</p>
                        </div>
                    </PopoverContent>
                 </Popover>

                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity border border-border/50">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Minha Conta</p>
                                <p className="text-xs leading-none text-muted-foreground truncate">
                                    {userEmail}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-500 focus:text-red-500">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
            </div>
        </header>
    )
}
