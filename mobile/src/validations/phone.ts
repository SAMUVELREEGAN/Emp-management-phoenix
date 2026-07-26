const PHONE_REGEX = /^[0-9+\-\s()]+$/;

export function validatePhone(value: string | undefined): string | true {
  if (!value || !value.trim()) {
    return 'Phone number is required';
  }
  const trimmed = value.trim();
  if (trimmed.length < 10) {
    return 'Phone number must be at least 10 digits';
  }
  if (!PHONE_REGEX.test(trimmed)) {
    return 'Invalid phone number';
  }
  return true;
}
