import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, PrivateRoute, ActiveAccountRoute } from "@/contexts/AuthContext"
import { useAuth } from "@/contexts/auth-hooks"
import { Layout } from "@/components/Layout"
import { ShadcnDemo } from "@/components/ShadcnDemo"
import { Login } from "@/pages/Login"
import { Loader2 } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { Suspense, lazy } from "react"
import { Loading } from "@/components/Loading"
import { ProjectProvider } from "@/contexts/ProjectContext"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { AccountRecovery } from "@/pages/AccountRecovery"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { UpdatePasswordPage } from "@/pages/auth/UpdatePasswordPage"

import { AutoLogout } from "@/components/AutoLogout"

// Lazy load pages
const Dashboard = lazy(() => import("@/pages/Dashboard").then(module => ({ default: module.Dashboard })))
const Transactions = lazy(() => import("@/pages/Transactions").then(module => ({ default: module.Transactions })))
const Recurrences = lazy(() => import("@/pages/Recurrences").then(module => ({ default: module.Recurrences })))
const Categories = lazy(() => import("@/pages/Categories").then(module => ({ default: module.Categories })))
const InvestmentsPage = lazy(() => import("@/pages/InvestmentsPage").then(module => ({ default: module.InvestmentsPage })))
const Settings = lazy(() => import("@/pages/Settings").then(module => ({ default: module.Settings })))

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium text-muted-foreground">Carregando...</span>
      </div>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route
          path="/recovery"
          element={
            <PrivateRoute>
              <AccountRecovery />
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={
            <ActiveAccountRoute>
              <Layout />
            </ActiveAccountRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="recurrences" element={<Recurrences />} />
          <Route path="categories" element={<Categories />} />
          <Route path="investments" element={<InvestmentsPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="demo" element={<ShadcnDemo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <AutoLogout />
          <AppRoutes />
          <Toaster />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
