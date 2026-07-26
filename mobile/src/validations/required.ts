export function validateRequired(value: string | undefined, label = 'This field'): string | true {
  if (!value || !value.trim()) {
    return `${label} is required`;
  }
  return true;
}
