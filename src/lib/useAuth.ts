import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange dispara INITIAL_SESSION imediatamente com a sessão atual,
    // evitando double-setState causado por chamar getSession() separadamente.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      // Ignore token refresh events that don't change the user — prevents
      // spurious re-renders / loading flashes on mobile where Supabase fires
      // TOKEN_REFRESHED repeatedly.
      if (event === "TOKEN_REFRESHED") {
        setLoading(false);
        return;
      }
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

export function useIsAdmin(userId?: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!userId) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [userId]);
  return isAdmin;
}
