/** Culoarea fiecărei „linii” (grup de competențe), aceeași în hartă, carduri și matrice. */
const KEYS: Record<string, string> = {
  'Pedagogie': 'ped',
  'Digital și STEAM': 'dig',
  'Didactica disciplinelor': 'dis',
  'Conducere și carieră': 'con',
};
export const lineKey = (group: string) => KEYS[group] ?? 'ped';
export const lineVar = (group: string) => `var(--l-${lineKey(group)})`;
