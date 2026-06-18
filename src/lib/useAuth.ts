import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// useAuth is now powered by AuthContext — a single global subscription.
// Import from AuthContext directly; this file re-exports for backwards compatibility.
export { useAuth } from "./AuthContext";

export function useIsAdmin(userId?: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!userId) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [userId]);
  return isAdmin;
}
