import { createContext } from "react"

export interface DateContextType {
  currentDate: Date
  setCurrentDate: (date: Date) => void
}

export const DateContext = createContext<DateContextType>({
  currentDate: new Date(),
  setCurrentDate: () => {},
})

