import { useContext } from "react"
import { DateContext } from "./date-context"

export const useDate = () => useContext(DateContext)
