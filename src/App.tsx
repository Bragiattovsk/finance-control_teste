import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, PrivateRoute, ActiveAccountRoute } from "@/contexts/AuthContext"
import { useAuth } from "@/contexts/auth-hooks"
import { Layout } from "@/components/Layout"
import { ShadcnDemo } from "@/components/ShadcnDemo"
import { Login } from "@/pages/Login"
import { Loader2 } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { Suspense, lazy, useEffect, useState } from "react"
import { Loading } from "@/components/Loading"
import { ProjectProvider } from "@/contexts/ProjectContext"
import { PWAProvider } from "@/contexts/PWAContext"
import { DateProvider } from "@/contexts/DateContext"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { AccountRecovery } from "@/pages/AccountRecovery"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { UpdatePasswordPage } from "@/pages/auth/UpdatePasswordPage"
import { ErrorBoundary } from "@/components/ErrorBoundary"

import { AutoLogout } from "@/components/AutoLogout"
import { SplashScreen } from "@/components/SplashScreen"

// Lazy load pages
const Dashboard = lazy(() => import("@/pages/Dashboard").then(module => ({ default: module.Dashboard })))
const Transactions = lazy(() => import("@/pages/Transactions").then(module => ({ default: module.Transactions })))
const Recurrences = lazy(() => import("@/pages/Recurrences").then(module => ({ default: module.Recurrences })))
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage"))
const InvestmentsPage = lazy(() => import("@/pages/InvestmentsPage").then(module => ({ default: module.InvestmentsPage })))
const Settings = lazy(() => import("@/pages/Settings").then(module => ({ default: module.Settings })))
const LandingPage = lazy(() => import("@/pages/LandingPage").then(module => ({ default: module.default })))
const RegisterPage = lazy(() => import("@/pages/Register").then(module => ({ default: module.Register })))
const TermsPage = lazy(() => import("@/pages/Terms").then(module => ({ default: module.TermsPage })))
const PrivacyPage = lazy(() => import("@/pages/Privacy").then(module => ({ default: module.PrivacyPage })))
const AboutPage = lazy(() => import("@/pages/About").then(module => ({ default: module.AboutPage })))
const ContactPage = lazy(() => import("@/pages/Contact").then(module => ({ default: module.ContactPage })))
const MenuPage = lazy(() => import("@/pages/MenuPage"))

function AppRoutes() {
  const { loading, user } = useAuth()

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
      <ErrorBoundary>
        <Routes>
          {/* Public root: if logado, vai para dashboard; senão, mostra Landing */}
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
          />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* Login/Auth: se logado, redireciona para dashboard */}
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/auth"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />
          <Route
            path="/auth"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
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
          {/* Protected app layout and routes */}
          <Route
            path="/"
            element={
              <ActiveAccountRoute>
                <Layout />
              </ActiveAccountRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="recurrences" element={<Recurrences />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="investments" element={<InvestmentsPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="demo" element={<ShadcnDemo />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Suspense>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const seen = sessionStorage.getItem('hasSeenSplash')
    if (seen === 'true') {
      setShowSplash(false)
    }
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          {showSplash && (
            <SplashScreen
              onFinish={() => {
                setShowSplash(false)
                sessionStorage.setItem('hasSeenSplash', 'true')
              }}
            />
          )}
          <AutoLogout />
          <PWAProvider>
            <DateProvider>
              <AppRoutes />
            </DateProvider>
          </PWAProvider>
          <Toaster />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
