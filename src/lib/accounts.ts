export type AccountRole = "administrator" | "profesor" | "elev";
export type Account = { id: string; name: string; role: AccountRole };

export const roleLabels = {
  administrator: { ro: "Administrator", ru: "Администратор" },
  profesor: { ro: "Profesor", ru: "Учитель" },
  elev: { ro: "Elev", ru: "Ученик" },
} as const;

export function accountRole(value: unknown): AccountRole | null {
  return value === "administrator" || value === "profesor" || value === "elev"
    ? value
    : null;
}

export function loginEmail(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 254) return null;
  const login = value.trim().toLowerCase();
  const aliases: Record<string, string> = {
    admin: "administrator",
    administrator: "administrator",
    profesor: "profesor",
    elev: "elev",
  };
  if (Object.hasOwn(aliases, login))
    return `${aliases[login]}@edumentor.example`;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login) ? login : null;
}

export function canUseMentor(role: AccountRole): boolean {
  return role === "administrator" || role === "profesor";
}
