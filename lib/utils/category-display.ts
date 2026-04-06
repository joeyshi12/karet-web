/**
 * Human-readable labels for UI only. URLs, filters, and stored data
 * keep raw keys (e.g. FOOD, PAYMENT, STARBUCKS).
 */
const DISPLAY_OVERRIDES: Record<string, string> = {
  PAYMENT: 'Payments',
  T_AND_T: 'T&T',
  A_AND_W: 'A&W',
};

/** Convert a SNAKE_CASE or raw key into a human-readable title, applying display overrides. */
export function formatDisplayName(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return trimmed;
  const normalizedKey = trimmed.toUpperCase().replace(/\s+/g, '_');
  if (DISPLAY_OVERRIDES[normalizedKey]) {
    return DISPLAY_OVERRIDES[normalizedKey];
  }
  const parts = normalizedKey.split('_');
  return parts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** Matches the same notion of "no category" as transactionMatchesCategoryFilter (Uncategorized). */
export function isUncategorizedCategory(category: string | null): boolean {
  if (category == null || category.trim() === '') return true;
  return category.trim().toLowerCase() === 'uncategorized';
}

export function formatCategoryDisplayName(category: string | null): string {
  if (category == null || isUncategorizedCategory(category)) {
    return 'Uncategorized';
  }
  return formatDisplayName(category);
}
