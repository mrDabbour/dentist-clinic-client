export function safePatientReturnUrl(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return '/book';
  const path = value.split(/[?#]/)[0];
  return /^\/(book|my-appointments|patient-notifications|invoice\/[1-9]\d*)$/.test(path) ? value : '/book';
}
