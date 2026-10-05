import { Service } from '../types';

/**
 * Returns a high quality image URL for a medical service/specialty.
 * If service.image is provided and is a valid URL, it handles both relative and absolute URLs.
 * Otherwise, it maps the specialty name/slug/category to a curated high-res medical photo.
 */
export const getServiceImageUrl = (service?: Partial<Service> | null): string => {
  if (service?.image && typeof service.image === 'string' && service.image.trim().length > 0) {
    const trimmed = service.image.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return `https://clinicbychoice.com${trimmed}`;
    }
    return trimmed;
  }

  const name = (service?.name || '').toLowerCase();
  const slug = (service?.slug || '').toLowerCase();
  const category = (service?.category || '').toLowerCase();
  const combined = `${name} ${slug} ${category}`;

  // 1. Orthopaedics & Joint
  if (combined.includes('ortho') || combined.includes('joint') || combined.includes('knee') || combined.includes('bone') || combined.includes('spine')) {
    return 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80';
  }

  // 2. Cardiology & Heart Care
  if (combined.includes('cardio') || combined.includes('heart') || combined.includes('vascular') || combined.includes('angioplasty')) {
    return 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800&auto=format&fit=crop&q=80';
  }

  // 3. IVF, Fertility, Maternity, Gynecology & Obstetrics
  if (combined.includes('ivf') || combined.includes('fertil') || combined.includes('gyn') || combined.includes('matern') || combined.includes('obstet') || combined.includes('reproduct')) {
    return 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80';
  }

  // 4. Oncology & Cancer Care
  if (combined.includes('oncol') || combined.includes('cancer') || combined.includes('chemo') || combined.includes('tumor') || combined.includes('radiation')) {
    return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80';
  }

  // 5. Neurology & Neurosurgery
  if (combined.includes('neuro') || combined.includes('brain') || combined.includes('stroke') || combined.includes('epilepsy')) {
    return 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop&q=80';
  }

  // 6. Dental & Maxillofacial
  if (combined.includes('dent') || combined.includes('teeth') || combined.includes('implant') || combined.includes('oral') || combined.includes('maxillo')) {
    return 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop&q=80';
  }

  // 7. Dermatology & Aesthetics
  if (combined.includes('dermat') || combined.includes('skin') || combined.includes('laser') || combined.includes('hair') || combined.includes('cosmetic')) {
    return 'https://images.unsplash.com/photo-1512290900673-05c088ef56b9?w=800&auto=format&fit=crop&q=80';
  }

  // 8. Ophthalmology & Eye Care
  if (combined.includes('ophthalm') || combined.includes('eye') || combined.includes('lasik') || combined.includes('cataract') || combined.includes('retina')) {
    return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80';
  }

  // 9. Gastroenterology & GI Surgery / Liver
  if (combined.includes('gastro') || combined.includes('gi surgery') || combined.includes('liver') || combined.includes('endoscop') || combined.includes('digestive')) {
    return 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&auto=format&fit=crop&q=80';
  }

  // 10. Urology, Nephrology & Kidney
  if (combined.includes('uro') || combined.includes('nephro') || combined.includes('kidney') || combined.includes('dialysis') || combined.includes('bladder')) {
    return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80';
  }

  // 11. Plastic & Reconstructive Surgery
  if (combined.includes('plastic') || combined.includes('reconstruct') || combined.includes('aesthetic')) {
    return 'https://images.unsplash.com/photo-1512290900673-05c088ef56b9?w=800&auto=format&fit=crop&q=80';
  }

  // 12. Ayurveda & Holistic Wellness
  if (combined.includes('ayur') || combined.includes('panchakarma') || combined.includes('holistic') || combined.includes('wellness') || combined.includes('herbal')) {
    return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80';
  }

  // 13. Pediatrics & Child Care
  if (combined.includes('pediat') || combined.includes('child') || combined.includes('baby') || combined.includes('neonat')) {
    return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80';
  }

  // 14. Pulmonology & Respiratory
  if (combined.includes('pulmon') || combined.includes('chest') || combined.includes('lung') || combined.includes('respirat')) {
    return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80';
  }

  // Default Medical Care Hero
  return 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80';
};
