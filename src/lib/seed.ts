import { connectDB } from './db';
import { User, Hospital, Service, HospitalService, LeadPackage, State, City } from '@/models';
import { hashPassword } from './auth';

export async function seedDatabase() {
  await connectDB();

  // Force sync State & City tables first
  await State.sync({ alter: true });
  await City.sync({ alter: true });

  console.log('Seeding Clinic By Choice database with Union Super Speciality Hospital...');

  // Seed all 36 Indian States/UTs with Cities and 27 Medical Services
  const { seedIndiaStatesCitiesAndServices } = await import('../scripts/seed-india-data');
  await seedIndiaStatesCitiesAndServices();

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
