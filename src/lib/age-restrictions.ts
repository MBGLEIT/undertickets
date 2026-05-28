import type { EventRecord } from "@/types/domain";

export function getMinimumAgeFromRestriction(
  restriction: EventRecord["age_restriction"] | null,
) {
  if (!restriction) {
    return null;
  }

  return Number(restriction.replace("+", ""));
}

export function isAgeAllowedForRestriction(
  age: number,
  restriction: EventRecord["age_restriction"] | null,
) {
  const minimumAge = getMinimumAgeFromRestriction(restriction);

  if (minimumAge === null) {
    return true;
  }

  return age >= minimumAge;
}
