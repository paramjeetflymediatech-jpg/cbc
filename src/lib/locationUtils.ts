/**
 * Clean common administrative suffixes (Tehsil, District, Taluk, Sub-District, etc.)
 */
export function cleanLocationName(name?: string | null): string {
  if (!name) return '';
  let clean = name.trim();
  clean = clean.replace(
    /\s+(Tehsil|Taluk|Taluka|District|Sub-District|Subdistrict|Subdivision|Block|Division|District Council|Municipal Corporation|M\.Corp|MC)\b/gi,
    ''
  );
  return clean.trim();
}

const NON_INDIA_COUNTRIES = [
  'pakistan',
  'nepal',
  'bangladesh',
  'sri lanka',
  'china',
  'afghanistan',
  'united states',
  'usa',
  'united kingdom',
  'uk',
  'canada',
  'australia',
  'united arab emirates',
  'uae',
  'dubai',
  'qatar',
  'saudi arabia',
  'singapore',
  'germany',
  'france',
  'japan',
  'russia',
];

/**
 * Validates if a given location/address is strictly within India
 */
export function validateIndiaLocation({
  country,
  countryCode,
  address,
}: {
  country?: string | null;
  countryCode?: string | null;
  address?: string | null;
}): { isValid: boolean; detectedCountry: string } {
  const normCountry = (country || '').toLowerCase().trim();
  const normCode = (countryCode || '').toLowerCase().trim();
  const normAddress = (address || '').toLowerCase().trim();

  // If country_code is present and not 'in', invalid
  if (normCode && normCode !== 'in') {
    const name = country || normCode.toUpperCase();
    return { isValid: false, detectedCountry: name };
  }

  // Check if address or country contains non-India country names
  for (const c of NON_INDIA_COUNTRIES) {
    if (normCountry.includes(c) || normAddress.includes(c)) {
      const capitalized = c.charAt(0).toUpperCase() + c.slice(1);
      return { isValid: false, detectedCountry: capitalized };
    }
  }

  // Valid India check
  if (
    normCountry === 'india' ||
    normCountry === 'in' ||
    normCode === 'in' ||
    normAddress.includes('india') ||
    !normCountry
  ) {
    return { isValid: true, detectedCountry: 'India' };
  }

  return { isValid: true, detectedCountry: 'India' };
}

/**
 * Checks if a country string corresponds to India
 */
export function isIndiaLocation(country?: string | null, address?: string | null): boolean {
  const res = validateIndiaLocation({ country, address });
  return res.isValid;
}
