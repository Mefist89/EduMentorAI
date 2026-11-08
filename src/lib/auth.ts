import "server-only";
import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { accountRole, roleLabels, type Account } from "./accounts";

// Fetch from Supabase Auth, rather than trusting a cookie or editable user_metadata.
export const getAccount = cache(async (): Promise<Account | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    const role = accountRole(user.app_metadata?.edumentor_role);
    if (!role) return null;
    return { id: user.id, role, name: roleLabels[role].ro };
  } catch {
    return null;
  }
});
