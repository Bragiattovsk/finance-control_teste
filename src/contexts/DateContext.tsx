import { useState, ReactNode } from "react"
import { DateContext } from "./date-context"

export function DateProvider({ children }: { children: ReactNode }) {
    const [currentDate, setCurrentDate] = useState(new Date())

    return (
        <DateContext.Provider value={{ currentDate, setCurrentDate }}>
            {children}
        </DateContext.Provider>
    )
}
