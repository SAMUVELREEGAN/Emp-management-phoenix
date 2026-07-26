export const normalizePhone = (phone: string): string =>
  phone.replace(/\D/g, '');

/** Last 10 digits for lookup (handles +91 vs local 10-digit entry). */
export const phoneLookupKey = (phone: string): string => {
  const digits = normalizePhone(phone);
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export const isEmailIdentifier = (identifier: string): boolean =>
  identifier.includes('@');

export const isValidLoginIdentifier = (identifier: string): boolean => {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return false;
  }

  if (isEmailIdentifier(trimmed)) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }

  return normalizePhone(trimmed).length >= 10;
};

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return email;
  }
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  const digits = normalizePhone(phone);
  if (digits.length <= 4) {
    return digits;
  }
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
};

/** Format phone for SMS providers (E.164). Defaults to India (+91) for 10-digit numbers. */
export const toE164Phone = (
  phone: string,
  defaultCountryCode = '91',
): string => {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return `+${normalizePhone(trimmed)}`;
  }

  const digits = normalizePhone(trimmed);
  if (digits.length === 10) {
    return `+${defaultCountryCode}${digits}`;
  }

  return `+${digits}`;
};
