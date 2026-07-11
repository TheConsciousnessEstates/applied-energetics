import React, { createContext, useContext, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AuthContextType {
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signupMutation = trpc.auth.signup.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const signup = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await signupMutation.mutateAsync({ email, password });
    } catch (err: any) {
      const message = err.message || "Signup failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await loginMutation.mutateAsync({ email, password });
    } catch (err: any) {
      const message = err.message || "Login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    setLoading(true);
    try {
      await logoutMutation.mutateAsync();
    } catch (err: any) {
      const message = err.message || "Logout failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        error,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useEmailAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useEmailAuth must be used within AuthProvider");
  }
  return context;
}
