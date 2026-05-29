import type { EventRecord } from "@/types/domain";

export function getMinimumAgeFromRestriction(
  restriction: EventRecord["age_restriction"] | null,
) {
  if (!restriction) {
    return null;
  }

  return Number(restriction.replace("+", ""));
}

export function getAgeFromBirthDate(birthDate: string) {
  const date = new Date(`${birthDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const hasNotHadBirthdayYet =
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());

  if (hasNotHadBirthdayYet) {
    age -= 1;
  }

  return age;
}

export function isBirthDateAllowedForRestriction(
  birthDate: string,
  restriction: EventRecord["age_restriction"] | null,
) {
  const minimumAge = getMinimumAgeFromRestriction(restriction);

  if (minimumAge === null) {
    return true;
  }

  const age = getAgeFromBirthDate(birthDate);

  if (age === null) {
    return false;
  }

  return age >= minimumAge;
}
