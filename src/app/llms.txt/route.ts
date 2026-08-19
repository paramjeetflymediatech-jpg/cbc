import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Service, Hospital, BlogPost, SeoMetadata } from '@/models';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always serve fresh dynamic content from database

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://clinicbychoice.com').replace(/\/$/, '');

  let services: Array<{ name: string; slug: string; description?: string }> = [];
  let hospitals: Array<{ name: string; slug: string; city?: string; state?: string; description?: string }> = [];
  let blogs: Array<{ title: string; slug: string; excerpt?: string; category?: string; publishedAt?: Date }> = [];
  let seoPages: Array<{ pageName?: string; path: string; title: string; description?: string }> = [];

  try {
    await connectDB();

    // 1. Fetch all medical services/treatments
    services = (await Service.findAll({
      attributes: ['name', 'slug', 'description'],
      order: [['name', 'ASC']],
      raw: true,
    })) as any[];

    // 2. Fetch all active partner hospitals
    hospitals = (await Hospital.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['name', 'slug', 'city', 'state', 'description'],
      order: [['name', 'ASC']],
      raw: true,
    })) as any[];

    // 3. Fetch all published blog posts
    blogs = (await BlogPost.findAll({
      where: { status: 'PUBLISHED' },
      attributes: ['title', 'slug', 'excerpt', 'category', 'publishedAt'],
      order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
      raw: true,
    })) as any[];

    // 4. Fetch all custom on-page SEO records
    seoPages = (await SeoMetadata.findAll({
      attributes: ['pageName', 'path', 'title', 'description'],
      order: [['path', 'ASC']],
      raw: true,
    })) as any[];
  } catch (err) {
    console.error('Error fetching live data for llms.txt:', err);
  }

  // Filter clinical SEO pages excluding admin/api
  const clinicalSeoPages = seoPages.filter(
    (p) =>
      p.path &&
      !p.path.startsWith('/admin') &&
      !p.path.startsWith('/api') &&
      !p.path.startsWith('/login') &&
      !p.path.startsWith('/blog')
  );

  const lines: string[] = [];

  // Header & Title
  lines.push('# Clinic By Choice');
  lines.push('');
  lines.push('> Clinic By Choice (CBC) is India\'s premier healthcare platform and medical tourism network connecting patients with accredited hospitals, NABH/JCI multi-specialty clinics, and surgical specialists across India for high-quality treatments, second opinions, and affordable surgeries.');
  lines.push('');

  // Key Capabilities
  lines.push('## Core Services & Patient Offerings');
  lines.push('- **Free Second Opinion**: Medical evaluations and treatment recommendations from leading surgeons.');
  lines.push('- **Accredited Hospitals**: Direct admission to top healthcare institutions across Delhi NCR, Mumbai, Bangalore, Chennai, Hyderabad, and Kolkata.');
  lines.push('- **Transparent Treatment Costs**: Upfront cost estimates for complex cardiology, oncology, orthopedics, neurology, organ transplants, and IVF.');
  lines.push('- **Medical Concierge**: Assistance with medical visas, airport transfers, hotel accommodations, and dedicated patient coordinators.');
  lines.push('');

  // Medical Specialties
  lines.push('## Medical Specialties & Treatments');
  if (services.length > 0) {
    services.forEach((s) => {
      const cleanDesc = s.description ? `: ${s.description.replace(/<[^>]*>/g, '').slice(0, 140).trim()}...` : '';
      lines.push(`- [${s.name}](${baseUrl}/hospitals/${s.slug}/india)${cleanDesc}`);
    });
  } else {
    // Default specialties
    lines.push(`- [Cardiology & Cardiac Surgery](${baseUrl}/hospitals/cardiology/india): Comprehensive heart care, bypass surgery, angioplasty, and pediatric cardiology.`);
    lines.push(`- [Orthopedics & Joint Replacement](${baseUrl}/hospitals/orthopedics/india): Knee replacement, hip replacement, robotic spine surgery, and sports medicine.`);
    lines.push(`- [Oncology & Cancer Care](${baseUrl}/hospitals/oncology/india): Surgical oncology, medical chemotherapy, radiation therapy, and immunotherapy.`);
    lines.push(`- [Neurology & Neurosurgery](${baseUrl}/hospitals/neurology/india): Brain tumor surgeries, spine instrumentation, stroke management, and epilepsy care.`);
    lines.push(`- [Gastroenterology & Hepatology](${baseUrl}/hospitals/gastroenterology/india): Liver transplant, GI surgeries, bariatric procedures, and endoscopy.`);
    lines.push(`- [IVF & Fertility Treatment](${baseUrl}/hospitals/ivf/india): Advanced ART, ICSI, egg donation, and fertility preservation treatments.`);
    lines.push(`- [Urology & Kidney Transplant](${baseUrl}/hospitals/urology/india): Renal transplants, dialysis, laparoscopic urology, and robotic surgeries.`);
    lines.push(`- [Cosmetic & Plastic Surgery](${baseUrl}/hospitals/cosmetic-surgery/india): Aesthetic procedures, reconstructive surgeries, and hair restoration.`);
  }
  lines.push('');

  // Partner Hospitals
  lines.push('## Accredited Partner Hospitals');
  if (hospitals.length > 0) {
    hospitals.forEach((h) => {
      const location = [h.city, h.state].filter(Boolean).join(', ');
      lines.push(`- [${h.name}](${baseUrl}/hospital/${h.slug})${location ? ` (${location})` : ''}`);
    });
  } else {
    lines.push(`- [Fortis Healthcare](${baseUrl}/hospitals/india): JCI & NABH accredited multi-super-specialty hospital network across India.`);
    lines.push(`- [Max Healthcare](${baseUrl}/hospitals/india): Leading quaternary care centers in Delhi NCR, Mumbai, and North India.`);
    lines.push(`- [Apollo Hospitals](${baseUrl}/hospitals/india): Asia's largest integrated healthcare network.`);
    lines.push(`- [Medanta - The Medicity](${baseUrl}/hospitals/india): World-class multi-super-specialty institute in Gurugram, India.`);
    lines.push(`- [Manipal Hospitals](${baseUrl}/hospitals/india): Multi-specialty healthcare network with cutting-edge robotic facilities.`);
    lines.push(`- [Artemis Hospital](${baseUrl}/hospitals/india): First JCI accredited hospital in Gurugram, Delhi NCR.`);
  }
  lines.push('');

  // Dynamic Blog & Health Articles
  lines.push(`## Published Medical Articles & Guides (${blogs.length} Articles)`);
  if (blogs.length > 0) {
    blogs.forEach((b) => {
      const cat = b.category ? ` [${b.category}]` : '';
      const date = b.publishedAt ? ` (${new Date(b.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})` : '';
      const cleanExcerpt = b.excerpt ? `: ${b.excerpt.replace(/<[^>]*>/g, '').slice(0, 130).trim()}...` : '';
      lines.push(`- [${b.title}](${baseUrl}/blog/${b.slug})${cat}${date}${cleanExcerpt}`);
    });
  } else {
    lines.push(`- [Comprehensive Health Blog Directory](${baseUrl}/blog): Search over 100+ health articles, doctor advice, and surgical guides.`);
  }
  lines.push('');

  // Dynamic Clinical Landing Pages from SEO
  if (clinicalSeoPages.length > 0) {
    lines.push('## Key Clinical Search & Procedure Directories');
    clinicalSeoPages.forEach((p) => {
      const name = p.pageName || p.title;
      const desc = p.description ? `: ${p.description.slice(0, 120).trim()}...` : '';
      lines.push(`- [${name}](${baseUrl}${p.path.startsWith('/') ? '' : '/'}${p.path})${desc}`);
    });
    lines.push('');
  }

  // Primary Action Links
  lines.push('## Primary Access Portals');
  lines.push(`- **Homepage**: [Clinic By Choice](${baseUrl})`);
  lines.push(`- **Medical Blog Directory**: [Health & Medical Articles](${baseUrl}/blog)`);
  lines.push(`- **About the Platform**: [About Clinic By Choice](${baseUrl}/about-us)`);
  lines.push(`- **Hospital Partnership Application**: [Get Listed as Hospital/Clinic](${baseUrl}/get-listed)`);
  lines.push(`- **Patient Contact & Free Consultation**: [Contact Us](${baseUrl}/contact-us)`);
  lines.push(`- **XML Sitemap**: [Dynamic Sitemap](${baseUrl}/sitemap.xml)`);
  lines.push(`- **Robots Policy**: [Robots File](${baseUrl}/robots.txt)`);
  lines.push('');

  const body = lines.join('\n');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, no-cache, no-store, must-revalidate',
    },
  });
}
