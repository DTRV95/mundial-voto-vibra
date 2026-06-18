import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with loading=true. We resolve immediately via onAuthStateChange INITIAL_SESSION.
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION synchronously on mount with the
    // current session from localStorage — no extra getSession() call needed.
    // This single subscription lives for the entire app lifetime, so navigating
    // between pages never causes auth state to flicker or reset.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED happens silently in the background — ignore it to prevent
      // unnecessary re-renders that cause the loading flash users were seeing.
      if (event === "TOKEN_REFRESHED") return;

      setState({ session, user: session?.user ?? null, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
