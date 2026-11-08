"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { accountRole, loginEmail } from "@/lib/accounts";

export type AuthState = { error: string };

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = loginEmail(form.get("login"));
  const password = form.get("password");
  if (
    !email ||
    typeof password !== "string" ||
    !password ||
    password.length > 256
  )
    return { error: "Introdu un login și o parolă valide." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      return {
        error:
          error?.status === 429
            ? "Prea multe încercări. Așteaptă puțin și încearcă din nou."
            : "Login sau parolă incorectă. Contul trebuie să fie activ.",
      };
    }
    if (!accountRole(data.user.app_metadata?.edumentor_role)) {
      await supabase.auth.signOut({ scope: "local" });
      return {
        error:
          "Contul nu are încă un rol EduMentor. Contactează administratorul.",
      };
    }
  } catch {
    return {
      error:
        "Autentificarea nu este disponibilă momentan. Verifică setările Supabase.",
    };
  }
  redirect("/");
}

export async function signOut(
  _: AuthState,
  _form: FormData,
): Promise<AuthState> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { error: "Deconectarea nu a reușit. Încearcă din nou." };
  } catch {
    return { error: "Deconectarea nu este disponibilă momentan." };
  }
  redirect("/login");
}
