export const INVALID_EMAIL_MESSAGE = "Please enter a valid email address.";
export const EMAIL_FORMAT_HINT = "Email must match x@x.x.";

const EMAIL_WITH_TLD_REGEX = /^[^\s@]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z0-9-]+$/;

export function normalizeEmail(email: string): string {
  return email.trim();
}

export function isValidEmailAddress(email: string): boolean {
  return EMAIL_WITH_TLD_REGEX.test(email);
}
