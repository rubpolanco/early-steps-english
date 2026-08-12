export interface MealEntry { meal: string; amount: string }
export interface NapEntry { start: string; end: string }
export interface PottyEntry { note?: string; time?: string; result?: string }

export function parseMeals(json: string | null): MealEntry[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export function parseNaps(json: string | null): NapEntry[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export function parsePotty(json: string | null): PottyEntry[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatTime(iso: string | null) {
  if (!iso) return "—";
  return iso.slice(11, 16);
}
