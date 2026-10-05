import { Hospital } from '../types';

/**
 * Checks if a hospital matches the target location filter string.
 * Handles composite regions like Tricity (Chandigarh, Mohali, Panchkula)
 * and Delhi NCR (Delhi, Gurgaon, Noida, Faridabad, Ghaziabad).
 */
export const isHospitalInLocation = (hospital: Hospital, targetLocation?: string): boolean => {
  if (!targetLocation) return true;
  const loc = targetLocation.toLowerCase().trim();
  if (!loc || loc === 'all' || loc === 'all locations' || loc === 'india' || loc === 'all india') {
    return true;
  }

  const city = (hospital.city || '').toLowerCase().trim();
  const area = (hospital.location || '').toLowerCase().trim();
  const address = (hospital.address || '').toLowerCase().trim();
  const state = (hospital.state || '').toLowerCase().trim();

  // 1. Tricity Area (Chandigarh, Mohali, Panchkula, Zirakpur, Kharar)
  if (
    loc.includes('chandigarh') ||
    loc.includes('tricity') ||
    loc.includes('mohali') ||
    loc.includes('panchkula') ||
    loc.includes('zirakpur')
  ) {
    const tricityTerms = ['chandigarh', 'mohali', 'panchkula', 'zirakpur', 'kharar', 'sas nagar'];
    return tricityTerms.some(
      (term) =>
        city === term ||
        city.includes(term) ||
        area.includes(term)
    );
  }

  // 2. Delhi NCR Area (Delhi, New Delhi, Gurgaon/Gurugram, Noida, Faridabad, Ghaziabad)
  if (
    loc.includes('delhi') ||
    loc.includes('ncr') ||
    loc.includes('gurugram') ||
    loc.includes('gurgaon') ||
    loc.includes('noida') ||
    loc.includes('faridabad') ||
    loc.includes('ghaziabad')
  ) {
    const ncrTerms = ['delhi', 'ncr', 'gurugram', 'gurgaon', 'noida', 'faridabad', 'ghaziabad'];
    return ncrTerms.some(
      (term) =>
        city === term ||
        city.includes(term) ||
        area.includes(term)
    );
  }

  // 3. Mumbai MMR
  if (loc.includes('mumbai') || loc.includes('thane') || loc.includes('navi mumbai')) {
    const mumbaiTerms = ['mumbai', 'thane', 'navi mumbai'];
    return mumbaiTerms.some(
      (term) =>
        city === term ||
        city.includes(term) ||
        area.includes(term)
    );
  }

  // 4. Extract individual clean tokens from targetLocation (removing state names like 'punjab', 'haryana', 'india')
  const rawParts = loc.split(',').map((p) => p.trim()).filter(Boolean);
  const ignoredTokens = ['punjab', 'haryana', 'india', 'state', 'district', 'city'];
  const specificParts = rawParts.filter((p) => !ignoredTokens.includes(p));

  // If user searched a specific city (e.g. Amritsar, Ludhiana, Moga, Jalandhar, etc.)
  const targetCityTokens = specificParts.length > 0 ? specificParts : rawParts;

  for (const token of targetCityTokens) {
    // If the hospital city matches the target token
    if (city && (city === token || city.includes(token) || token.includes(city))) {
      return true;
    }
    // If the hospital specific area/suburb matches the target token
    if (area && (area === token || area.includes(token) || token.includes(area))) {
      return true;
    }
  }

  // If hospital has no city or area specified, fall back to checking address with strict word boundaries
  if (!city && !area && address) {
    return targetCityTokens.some((token) => {
      const regex = new RegExp(`\\b${token}\\b`, 'i');
      return regex.test(address);
    });
  }

  // If the targetLocation is strictly a state query (e.g. 'Punjab') and no specific city was targeted
  if (specificParts.length === 0 && state && (state === loc || state.includes(loc))) {
    return true;
  }

  return false;
};
