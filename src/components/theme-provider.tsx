import { useEffect, useState } from "react"
import { ThemeProviderContext } from "./theme-context"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )

    useEffect(() => {
        const root = window.document.documentElement
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

        // Mobile Logic (< 768px): Force System Sync
        if (window.innerWidth < 768) {
            root.classList.remove("light", "dark")
            root.classList.add(mediaQuery.matches ? "dark" : "light")

            const listener = (e: MediaQueryListEvent) => {
                if (window.innerWidth < 768) {
                    root.classList.remove("light", "dark")
                    root.classList.add(e.matches ? "dark" : "light")
                }
            }

            mediaQuery.addEventListener("change", listener)
            return () => mediaQuery.removeEventListener("change", listener)
        }

        // Desktop Logic (>= 768px): Respect localStorage/Toggle
        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = mediaQuery.matches ? "dark" : "light"
            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}
