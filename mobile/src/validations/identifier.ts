const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{10,}$/;

export function validateLoginIdentifier(value: string | undefined): string | true {
  if (!value || !value.trim()) {
    return 'Email or mobile number is required';
  }

  const trimmed = value.trim();

  if (EMAIL_REGEX.test(trimmed)) {
    return true;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 10 && PHONE_REGEX.test(trimmed)) {
    return true;
  }

  return 'Enter a valid email or mobile number';
}

export function isEmailIdentifier(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

/** Pick a keyboard that allows email letters until the user is clearly entering a phone number. */
export function getIdentifierKeyboardType(value: string): 'default' | 'email-address' | 'phone-pad' {
  const trimmed = value.trim();

  if (!trimmed || /[a-zA-Z@]/.test(trimmed)) {
    return trimmed.includes('@') ? 'email-address' : 'default';
  }

  if (/^[0-9+\-\s()]+$/.test(trimmed)) {
    return 'phone-pad';
  }

  return 'default';
}
