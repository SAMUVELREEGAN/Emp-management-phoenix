const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string | undefined): string | true {
  if (!value || !value.trim()) {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(value.trim())) {
    return 'Enter a valid email address';
  }
  return true;
}
