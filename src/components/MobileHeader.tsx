import { ContextSwitcher } from "@/components/ContextSwitcher"
import { User, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileHeader() {

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 z-40 flex items-center justify-between px-4 md:hidden">
            <div className="flex items-center gap-3 flex-1 max-w-[70%]">
                <img 
                    src="/favicon.svg" 
                    alt="Nexo Logo" 
                    className="h-8 w-8 rounded-full object-cover shadow-sm" 
                />
                <div className="flex-1">
                    <ContextSwitcher className="border-transparent bg-transparent shadow-none hover:bg-accent/50 pl-0 h-9 text-base font-semibold p-0" />
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                </Button>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-border/50">
                    <User className="h-4 w-4 text-primary" />
                </div>
            </div>
        </header>
    )
}
