import { Hospital, Service } from '../types';

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
  const district = ((hospital as any).district || '').toLowerCase().trim();
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
        district === term ||
        district.includes(term) ||
        area === term ||
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
    const ncrTerms = ['delhi', 'ncr', 'gurugram', 'gurgaon', 'noida', 'faridabad', 'ghaziabad', 'new delhi'];
    return ncrTerms.some(
      (term) =>
        city === term ||
        city.includes(term) ||
        district === term ||
        district.includes(term) ||
        area === term ||
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
        district === term ||
        district.includes(term) ||
        area === term ||
        area.includes(term)
    );
  }

  // 4. Extract individual clean tokens from targetLocation (removing state names like 'punjab', 'haryana', 'india')
  const rawParts = loc.split(',').map((p) => p.trim()).filter(Boolean);
  const ignoredTokens = ['punjab', 'haryana', 'india', 'state', 'district', 'city'];
  const specificParts = rawParts.filter((p) => !ignoredTokens.includes(p));

  // If user searched a specific city (e.g. Amritsar, Ludhiana, Moga, Jalandhar, etc.)
  const targetCityTokens = specificParts.length > 0 ? specificParts : rawParts;

  // When hospital has explicit city / district / area defined:
  if (city || district || area) {
    return targetCityTokens.some((token) => {
      // 1. Exact or word-boundary match on city (e.g. "Moga City" contains "moga", "Ludhiana" === "ludhiana")
      if (city) {
        if (city === token || city.split(/[\s,]+/).includes(token)) return true;
        if (new RegExp(`\\b${token}\\b`, 'i').test(city)) return true;
      }
      // 2. District match
      if (district) {
        if (district === token || district.split(/[\s,]+/).includes(token)) return true;
        if (new RegExp(`\\b${token}\\b`, 'i').test(district)) return true;
      }
      // 3. Locality / area match
      if (area) {
        if (area === token || area.split(/[\s,]+/).includes(token)) return true;
        if (new RegExp(`\\b${token}\\b`, 'i').test(area)) return true;
      }
      return false;
    });
  }

  // Fallback ONLY when city, district, and area are all completely empty/missing:
  if (address) {
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

/**
 * Checks if a service is offered by any hospital in the target location.
 */
export const isServiceInLocation = (
  service: Service,
  hospitalsInLocation: Hospital[],
  targetLocation?: string
): boolean => {
  if (!targetLocation) return true;
  const loc = targetLocation.toLowerCase().trim();
  if (!loc || loc === 'all' || loc === 'all locations' || loc === 'india' || loc === 'all india') {
    return true;
  }

  if (!hospitalsInLocation || hospitalsInLocation.length === 0) {
    return false;
  }

  const sName = (service.name || '').toLowerCase().trim();
  const sSlug = (service.slug || '').toLowerCase().trim();
  const sCategory = (service.category || '').toLowerCase().trim();
  const sTreatments = (service.popularTreatments || []).map((t) => t.toLowerCase().trim());
  const sSubServices = (service.subServices || []).map((ss) => ss.toLowerCase().trim());

  return hospitalsInLocation.some((h) => {
    // 1. Check hospital specialties
    const hasSpecialty = (h.specialties || []).some((spec) => {
      const sp = spec.toLowerCase().trim();
      return (
        sp === sName ||
        sp.includes(sName) ||
        sName.includes(sp) ||
        (sCategory && (sp.includes(sCategory) || sCategory.includes(sp)))
      );
    });
    if (hasSpecialty) return true;

    // 2. Check hospitalServices items
    const hasHospitalService = (h.hospitalServices || []).some((hs) => {
      const hsName = (hs.service?.name || '').toLowerCase().trim();
      const hsSlug = (hs.service?.slug || '').toLowerCase().trim();
      const hsDetails = (hs.treatmentDetails || '').toLowerCase().trim();
      const hsSub = (hs.subServices || '').toLowerCase().trim();

      if (hsName && (hsName === sName || hsName.includes(sName) || sName.includes(hsName))) return true;
      if (sSlug && hsSlug && (sSlug === hsSlug || hsSlug.includes(sSlug))) return true;
      if (hsDetails && (hsDetails.includes(sName) || sTreatments.some((t) => hsDetails.includes(t)))) return true;
      if (hsSub && (hsSub.includes(sName) || sSubServices.some((sub) => hsSub.includes(sub)))) return true;
      return false;
    });
    if (hasHospitalService) return true;

    // 3. Check treatments
    const hasTreatment = (h.treatments || []).some((t) => {
      const tName = (t.name || '').toLowerCase().trim();
      const tCat = (t.serviceCategory || '').toLowerCase().trim();
      if (tName && (tName.includes(sName) || sTreatments.some((st) => tName.includes(st)))) return true;
      if (tCat && (tCat === sName || tCat.includes(sName) || sName.includes(tCat))) return true;
      return false;
    });
    if (hasTreatment) return true;

    // 4. Check doctors' specialties / departments
    const hasDoctor = (h.doctors || []).some((d) => {
      const spec = (d.specialty || '').toLowerCase().trim();
      const dept = (d.department || '').toLowerCase().trim();
      if (spec && (spec === sName || spec.includes(sName) || sName.includes(spec))) return true;
      if (dept && (dept === sName || dept.includes(sName) || sName.includes(dept))) return true;
      return false;
    });
    if (hasDoctor) return true;

    return false;
  });
};

/**
 * Checks if a hospital matches the search keyword across all its fields.
 */
export const doesHospitalMatchKeyword = (hospital: Hospital, query: string): boolean => {
  if (!query || !query.trim()) return true;
  const q = query.toLowerCase().trim();

  // Name
  if (hospital.name && hospital.name.toLowerCase().includes(q)) return true;
  // Location / City / Address
  if (hospital.location && hospital.location.toLowerCase().includes(q)) return true;
  if (hospital.city && hospital.city.toLowerCase().includes(q)) return true;
  if (hospital.address && hospital.address.toLowerCase().includes(q)) return true;
  // Specialties
  if (Array.isArray(hospital.specialties) && hospital.specialties.some((s) => s.toLowerCase().includes(q))) return true;
  // Hospital Services
  if (
    Array.isArray(hospital.hospitalServices) &&
    hospital.hospitalServices.some(
      (hs) =>
        (hs.service?.name && hs.service.name.toLowerCase().includes(q)) ||
        (hs.treatmentDetails && hs.treatmentDetails.toLowerCase().includes(q)) ||
        (hs.subServices && hs.subServices.toLowerCase().includes(q)) ||
        (hs.description && hs.description.toLowerCase().includes(q))
    )
  ) {
    return true;
  }
  // Treatments
  if (
    Array.isArray(hospital.treatments) &&
    hospital.treatments.some(
      (t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.serviceCategory && t.serviceCategory.toLowerCase().includes(q))
    )
  ) {
    return true;
  }
  // Doctors
  if (
    Array.isArray(hospital.doctors) &&
    hospital.doctors.some(
      (d) =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.specialty && d.specialty.toLowerCase().includes(q)) ||
        (d.department && d.department.toLowerCase().includes(q)) ||
        (Array.isArray(d.procedures) && d.procedures.some((p) => p.toLowerCase().includes(q)))
    )
  ) {
    return true;
  }
  // Description
  if (hospital.description && hospital.description.toLowerCase().includes(q)) return true;

  return false;
};

/**
 * Checks if a service matches the search keyword across its fields.
 */
export const doesServiceMatchKeyword = (service: Service, query: string): boolean => {
  if (!query || !query.trim()) return true;
  const q = query.toLowerCase().trim();

  if (service.name && service.name.toLowerCase().includes(q)) return true;
  if (service.category && service.category.toLowerCase().includes(q)) return true;
  if (service.description && service.description.toLowerCase().includes(q)) return true;
  if (Array.isArray(service.popularTreatments) && service.popularTreatments.some((t) => t.toLowerCase().includes(q))) return true;
  if (Array.isArray(service.subServices) && service.subServices.some((s) => s.toLowerCase().includes(q))) return true;

  return false;
};
