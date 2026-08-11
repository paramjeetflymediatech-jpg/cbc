import { connectDB } from './db';
import { User, Hospital, Service, HospitalService, LeadPackage, State, City } from '@/models';
import { hashPassword } from './auth';

export async function seedDatabase() {
  await connectDB();

  // Force sync State & City tables first
  await State.sync({ alter: true });
  await City.sync({ alter: true });

  console.log('Seeding Clinic By Choice database with Union Super Speciality Hospital...');

  const initialStatesAndCities = [
    {
      name: 'Punjab',
      code: 'PB',
      cities: [
        'Ludhiana',
        'Amritsar',
        'Jalandhar',
        'Patiala',
        'Bathinda',
        'Mohali',
        'Pathankot',
        'Hoshiarpur',
        'Batala',
        'Moga',
        'Abohar',
        'Malerkotla',
        'Khanna',
        'Phagwara',
        'Muktsar',
        'Barnala',
        'Rajpura',
        'Firozpur',
        'Kapurthala',
        'Sangrur',
        'Fazilka',
        'Mansa',
        'Gurdaspur',
        'Rupnagar',
        'Fatehgarh Sahib',
        'Nawanshahr',
        'Zirakpur',
        'Derabassi',
        'Nakodar',
        'Jagraon',
        'Tarn Taran',
        'Sunam',
        'Samana',
        'Kotkapura',
        'Faridkot',
        'Chandigarh',
      ],
    },
    {
      name: 'Maharashtra',
      code: 'MH',
      cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Navi Mumbai', 'Nashik', 'Aurangabad', 'Kolhapur', 'Solapur', 'Amravati'],
    },
    {
      name: 'Delhi NCR',
      code: 'DL',
      cities: ['New Delhi', 'Gurgaon', 'Noida', 'Greater Noida', 'Ghaziabad', 'Faridabad'],
    },
  ];

  for (const stateData of initialStatesAndCities) {
    let stateObj = await State.findOne({ where: { name: stateData.name } });
    if (!stateObj) {
      stateObj = await State.create({
        name: stateData.name,
        code: stateData.code,
        status: 'ACTIVE',
      });
    }

    for (const cityName of stateData.cities) {
      const existingCity = await City.findOne({
        where: { stateId: stateObj.id, name: cityName },
      });
      if (!existingCity) {
        await City.create({
          stateId: stateObj.id,
          name: cityName,
          isPopular: true,
          status: 'ACTIVE',
        });
      }
    }
  }

  // 1. Seed Lead Packages
  const defaultPackages = [
    {
      name: 'Starter Lead Package',
      leadCount: 25,
      price: 4999.0,
      currency: 'INR',
      validityDays: 30,
      description: 'Ideal for newly registered clinics starting out on Clinic By Choice.',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Standard Lead Package',
      leadCount: 50,
      price: 8999.0,
      currency: 'INR',
      validityDays: 60,
      description: 'Most popular plan for growing hospitals with steady enquiries.',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Premium Lead Package',
      leadCount: 100,
      price: 15999.0,
      currency: 'INR',
      validityDays: 90,
      description: 'Best value package for large healthcare centers looking for high volume.',
      status: 'ACTIVE' as const,
    },
  ];

  for (const pkg of defaultPackages) {
    const existing = await LeadPackage.findOne({ where: { name: pkg.name } });
    if (!existing) {
      await LeadPackage.create(pkg);
    }
  }

  // 2. Seed Medical Services
  const servicesList = [
    {
      name: 'Plastic & Reconstructive Surgery',
      slug: 'plastic-surgery',
      category: 'Plastic & Reconstructive',
      shortDescription: 'Trauma reconstruction, burn care, scar correction, and cosmetic procedures.',
      description: 'Comprehensive plastic and reconstructive surgery unit providing specialized trauma repair, skin grafting, and aesthetic care.',
      seoTitle: 'Plastic & Reconstructive Surgery - Union Super Speciality Hospital',
      seoDescription: 'Leading plastic and reconstructive surgeons in Ludhiana, Punjab.',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Oncology & Cancer Care',
      slug: 'cancer-hospital',
      category: 'Super Specialty',
      shortDescription: 'Chemotherapy, surgical oncology, radiation therapy, and tumor management.',
      description: 'Advanced oncology center equipped with multi-disciplinary tumor boards and surgical care.',
      seoTitle: 'Cancer Care & Oncology - Union Super Speciality Hospital',
      seoDescription: 'Top cancer hospital and oncologists in Ludhiana, Punjab.',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Laparoscopic & GI Surgery',
      slug: 'gastroenterology',
      category: 'Surgical Specialty',
      shortDescription: 'Keyhole abdominal surgery, hernia repair, and digestive system treatments.',
      description: 'State-of-the-art minimally invasive laparoscopic surgery unit.',
      seoTitle: 'Laparoscopic Surgery - Union Super Speciality Hospital',
      seoDescription: 'Minimally invasive GI and laparoscopic surgical center in Ludhiana.',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Urology & Kidney Care',
      slug: 'urology',
      category: 'Specialized Medicine',
      shortDescription: 'Laser kidney stone removal, prostate surgery, and urinary tract care.',
      description: 'Laser urology center providing advanced kidney stone and prostate treatment.',
      seoTitle: 'Urology & Kidney Care - Union Super Speciality Hospital',
      seoDescription: 'Expert urologists and kidney stone specialists in Ludhiana.',
      status: 'ACTIVE' as const,
    },
    {
      name: 'ENT & Head Neck Surgery',
      slug: 'ent-surgery',
      category: 'Surgical Specialty',
      shortDescription: 'Sinus surgery, ear surgery, throat treatments, and voice care.',
      description: 'Microscopic and endoscopic ENT surgical center.',
      seoTitle: 'ENT & Head Neck Surgery - Union Super Speciality Hospital',
      seoDescription: 'Leading ENT hospital in Ludhiana, Punjab.',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Pediatrics & Child Care',
      slug: 'pediatrics',
      category: 'Pediatric Care',
      shortDescription: 'Pediatric surgery, NICU care, child development, and vaccinations.',
      description: 'Dedicated mother and child super specialty care unit.',
      seoTitle: 'Pediatrics & Child Care - Union Super Speciality Hospital',
      seoDescription: 'Specialized child care and pediatric doctors in Ludhiana.',
      status: 'ACTIVE' as const,
    },
  ];

  for (const s of servicesList) {
    const existing = await Service.findOne({ where: { slug: s.slug } });
    if (!existing) {
      await Service.create(s);
    } else {
      await existing.update(s);
    }
  }

  // 3. Seed Super Admin User
  const adminEmail = 'admin@clinicbychoice.com';
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passHash = await hashPassword('Admin123!');
    await User.create({
      name: 'Clinic By Choice Admin',
      email: adminEmail,
      passwordHash: passHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    });
  }

  // 4. Seed Union Super Speciality Hospital
  const unionHospitalData = {
    slug: 'unionsuperspecialityhospital',
    name: 'Union Super Speciality Hospital',
    email: 'info@unionsuperspecialityhospital.com',
    phone: '+91 9876543210',
    website: 'https://unionsuperspecialityhospital.com',
    address: 'Basant Avenue, Duggri, Urban Estate, near BCM School',
    city: 'Ludhiana',
    state: 'Punjab',
    country: 'India',
    description: 'Union Super Speciality Hospital is a premier multi-specialty healthcare institute located in Ludhiana, Punjab. Equipped with state-of-the-art operation theaters, 24/7 ICU & trauma emergency, advanced diagnostic imaging, and highly experienced consultants across Plastic Surgery, Cancer Care, Laparoscopy, Urology, ENT, and Pediatrics.',
    logo: 'https://spcdn.shortpixel.ai/spio/ret_img,q_cdnize,to_auto,s_webp:avif/clinicbychoice.com/wp-content/uploads/2025/02/logocbc.png',
    coverImage: 'https://spcdn.shortpixel.ai/spio/ret_img,q_cdnize,to_auto,s_webp:avif/clinicbychoice.com/wp-content/uploads/2025/02/2902-1024x683.jpg',
    servicesToLink: ['plastic-surgery', 'cancer-hospital', 'gastroenterology', 'urology', 'ent-surgery', 'pediatrics'],
  };

  let unionHospital = await Hospital.findOne({ where: { slug: unionHospitalData.slug } });
  if (!unionHospital) {
    unionHospital = await Hospital.create({
      name: unionHospitalData.name,
      slug: unionHospitalData.slug,
      email: unionHospitalData.email,
      phone: unionHospitalData.phone,
      website: unionHospitalData.website,
      address: unionHospitalData.address,
      city: unionHospitalData.city,
      state: unionHospitalData.state,
      country: unionHospitalData.country,
      description: unionHospitalData.description,
      logo: unionHospitalData.logo,
      coverImage: unionHospitalData.coverImage,
      contactPersonName: 'Medical Director',
      contactPersonEmail: unionHospitalData.email,
      contactPersonPhone: unionHospitalData.phone,
      status: 'APPROVED',
      accountStatus: 'ACTIVE',
      leadsRemaining: 50,
      totalLeadsPurchased: 50,
      totalLeadsUsed: 0,
      doctors: [
        {
          name: 'Dr. S. S. Gill',
          qualification: 'MS, MCh (Plastic Surgery)',
          specialty: 'Chief Consultant Plastic & Reconstructive Surgeon',
          experience: '20+ Years',
        },
        {
          name: 'Dr. Harpreet Singh',
          qualification: 'MS, DNB (Surgical Oncology)',
          specialty: 'Senior Consultant Surgical Oncologist',
          experience: '16 Years',
        },
        {
          name: 'Dr. Amanpreet Kaur',
          qualification: 'MD, DNB (Pediatrics)',
          specialty: 'Consultant Pediatrician & Neonatologist',
          experience: '14 Years',
        },
      ],
      facilities: ['24/7 Trauma ICU & Emergency', 'Modular OTs & Cath Lab', 'Laser Urology & Laparoscopy Suite', 'In-house Pharmacy & 1.5T MRI Diagnostics', 'Dedicated Patient Coordinator Desk'],
      faqs: [
        {
          question: 'Where is Union Super Speciality Hospital located?',
          answer: 'The hospital is conveniently located at Basant Avenue, Duggri, Urban Estate, near BCM School, Ludhiana, Punjab.',
        },
        {
          question: 'How do I book a consultation with a specialist doctor?',
          answer: 'You can submit your enquiry directly via the Instant Patient Enquiry form on this page or call our help desk.',
        },
        {
          question: 'Does the hospital provide emergency care?',
          answer: 'Yes, Union Super Speciality Hospital operates a 24/7 Trauma ICU, Emergency Department, and Ambulance service.',
        },
      ],
      rating: 4.9,
      isFeatured: true,
    });

    const userPassHash = await hashPassword('Union123!');
    await User.create({
      name: 'Union Super Speciality Hospital Admin',
      email: unionHospitalData.email,
      passwordHash: userPassHash,
      role: 'HOSPITAL',
      hospitalId: unionHospital.id,
      phone: unionHospitalData.phone,
      status: 'ACTIVE',
    });
  }

  // Link services
  for (const serviceSlug of unionHospitalData.servicesToLink) {
    const svcObj = await Service.findOne({ where: { slug: serviceSlug } });
    if (svcObj) {
      const existingHs = await HospitalService.findOne({
        where: { hospitalId: unionHospital.id, serviceId: svcObj.id },
      });
      if (!existingHs) {
        await HospitalService.create({
          hospitalId: unionHospital.id,
          serviceId: svcObj.id,
          startingPrice: 35000.0,
          description: `Specialized clinical care & procedure for ${svcObj.name}.`,
          treatmentDetails: 'Comprehensive pre-operative evaluation, expert surgical procedure, and post-operative rehabilitation.',
          status: 'ACTIVE',
        });
      }
    }
  }

  console.log('Database seeding complete with Union Super Speciality Hospital!');
}
