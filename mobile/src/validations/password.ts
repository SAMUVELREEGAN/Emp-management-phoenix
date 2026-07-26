export function validatePassword(value: string | undefined, minLength = 8): string | true {
  if (!value || !value.trim()) {
    return 'Password is required';
  }
  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  return true;
}

export function validateNewPassword(value: string | undefined): string | true {
  const base = validatePassword(value);
  if (base !== true) {
    return base;
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(value!)) {
    return 'Password must contain letters and numbers';
  }
  return true;
}
