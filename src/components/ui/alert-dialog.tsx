"use client"

import * as React from "react"
import {
  Dialog as AlertDialog,
  DialogTrigger as AlertDialogTrigger,
  DialogContent as AlertDialogContent,
  DialogHeader as AlertDialogHeader,
  DialogFooter as AlertDialogFooter,
  DialogTitle as AlertDialogTitle,
  DialogDescription as AlertDialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type ButtonProps = React.ComponentProps<typeof Button>

export const AlertDialogCancel = (props: ButtonProps) => (
  <Button variant="outline" {...props} />
)

export const AlertDialogAction = (props: ButtonProps) => (
  <Button {...props} />
)

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
}

