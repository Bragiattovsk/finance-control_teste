import { createContext } from "react"

interface DateContextType {
    currentDate: Date
    setCurrentDate: (date: Date) => void
}

export const DateContext = createContext<DateContextType>({
    currentDate: new Date(),
    setCurrentDate: () => {},
})
