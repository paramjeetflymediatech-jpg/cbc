export const normalizeImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `https://clinicbychoice.com${trimmed}`;
  }
  return `https://clinicbychoice.com/${trimmed}`;
};
