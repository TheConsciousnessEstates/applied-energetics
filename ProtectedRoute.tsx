import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireDisclaimer?: boolean;
  requireAssessment?: boolean;
}

export default function ProtectedRoute({
  children,
  requireDisclaimer = true,
  requireAssessment = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();
  const navigationRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    // Prevent infinite redirect loops
    if (navigationRef.current === location) return;

    // Not authenticated → redirect to login
    if (!isAuthenticated) {
      navigationRef.current = "/login";
      navigate("/login");
      return;
    }

    // Check disclaimer acceptance (but don't redirect FROM disclaimer page)
    if (requireDisclaimer && location !== "/disclaimer") {
      const disclaimerAccepted = localStorage.getItem("disclaimerAccepted") === "true";
      if (!disclaimerAccepted) {
        navigationRef.current = "/disclaimer";
        navigate("/disclaimer");
        return;
      }
    }

    // Check assessment completion (but don't redirect FROM assessment page)
    if (requireAssessment && location !== "/assessment") {
      const assessmentCompleted = localStorage.getItem("assessmentCompleted") === "true";
      if (!assessmentCompleted) {
        navigationRef.current = "/assessment";
        navigate("/assessment");
        return;
      }
    }

    // Clear navigation ref if we're on a valid page
    navigationRef.current = null;
  }, [isAuthenticated, loading, location, navigate, requireDisclaimer, requireAssessment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
