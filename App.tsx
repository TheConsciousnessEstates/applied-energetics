import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import Protocols from "./pages/Protocols";
import ProtocolDetail from "./pages/ProtocolDetail";
import SessionPlayer from "./pages/SessionPlayer";
import SessionLog from "./pages/SessionLog";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import MedicalDisclaimer from "./pages/MedicalDisclaimer";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ProtocolsGuest from "./pages/ProtocolsGuest";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/cancel" component={CheckoutCancel} />
      <Route path="/disclaimer" component={MedicalDisclaimer} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/protocols" component={isAuthenticated ? Protocols : ProtocolsGuest} />

      {/* Protected routes */}
      <Route
        path="/onboarding"
        component={() => (
          <ProtectedRoute requireDisclaimer={false} requireAssessment={false}>
            <Onboarding />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/assessment"
        component={() => (
          <ProtectedRoute requireDisclaimer={true} requireAssessment={false}>
            <Assessment />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard"
        component={() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/protocols/:slug"
        component={(props: any) => (
          <ProtectedRoute>
            <ProtocolDetail {...props} />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/session/:protocolId"
        component={(props: any) => (
          <ProtectedRoute>
            <SessionPlayer {...props} />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/log"
        component={() => (
          <ProtectedRoute>
            <SessionLog />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/analytics"
        component={() => (
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/profile"
        component={() => (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )}
      />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "#1A1A1A",
                border: "1px solid #333",
                color: "#E5E5E5",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "12px",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
